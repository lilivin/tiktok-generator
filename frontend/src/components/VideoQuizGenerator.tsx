import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, Download, AlertTriangle, CheckCircle, Upload, X, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { quizFormSchema, type QuizFormData } from '@/lib/validation';
import { apiClient, APIError } from '@/lib/api';
import type { VideoGenerationStatus } from '@/types';

export default function VideoQuizGenerator() {
  const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus>({
    status: 'idle'
  });
  const [videoId, setVideoId] = useState<string | null>(null);

  // State for image previews and size tracking
  const [imagePreviews, setImagePreviews] = useState<{ [key: number]: string }>({});
  const [dragStates, setDragStates] = useState<{ [key: number]: boolean }>({});
  const [imageSizes, setImageSizes] = useState<{ [key: number]: number }>({});

  // Image size limits
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image
  const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total for all images

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Calculate total size of all images
  const getTotalImageSize = (): number => {
    return Object.values(imageSizes).reduce((total, size) => total + size, 0);
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      topic: '',
      questions: [
        { question: '', answer: '', image: undefined },
        { question: '', answer: '', image: undefined },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const questionsCount = watch('questions')?.length || 2;

  // Effect to prevent page unload during generation
  useEffect(() => {
    if (generationStatus.status === 'generating') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Wideo jest generowane. Czy na pewno chcesz opuścić stronę?';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [generationStatus.status]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = async (data: QuizFormData) => {
    try {
      // Validate total image size before processing
      const totalImageSize = getTotalImageSize();
      if (totalImageSize > MAX_TOTAL_SIZE) {
        setGenerationStatus({
          status: 'error',
          error: `Łączny rozmiar obrazków (${formatFileSize(totalImageSize)}) przekracza limit ${formatFileSize(MAX_TOTAL_SIZE)}. Zmniejsz rozmiar lub usuń niektóre obrazki.`,
        });
        return;
      }

      setGenerationStatus({
        status: 'generating',
        step: 'Przygotowywanie danych...',
        progress: 5,
      });

      // Convert image files to base64 strings
      const questionsWithBase64Images = await Promise.all(
        data.questions.map(async (question) => {
          if (question.image && question.image instanceof File) {
            const base64Image = await fileToBase64(question.image);
            return {
              ...question,
              image: base64Image,
            };
          }
          return {
            ...question,
            image: undefined,
          };
        })
      );

      setGenerationStatus({
        status: 'generating',
        step: 'Inicjalizacja procesu generowania...',
        progress: 10,
      });

      const response = await apiClient.generateVideo({
        topic: data.topic,
        questions: questionsWithBase64Images,
      });

      if (response.success && response.videoId) {
        setVideoId(response.videoId);
        
        // Start polling for status
        pollVideoStatus(response.videoId);
      } else {
        setGenerationStatus({
          status: 'error',
          error: response.error || 'Nieznany błąd podczas inicjalizacji generowania wideo',
        });
      }
    } catch (error) {
      console.error('Error generating video:', error);
      
      let errorMessage = 'Wystąpił błąd podczas generowania wideo. Spróbuj ponownie.';
      
      if (error instanceof APIError) {
        if (error.status === 0) {
          errorMessage = 'Brak połączenia z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.';
        } else if (error.status >= 500) {
          errorMessage = 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie za chwilę.';
        } else if (error.status === 400) {
          errorMessage = 'Dane formularza są nieprawidłowe. Sprawdź wprowadzone informacje.';
        }
      }

      setGenerationStatus({
        status: 'error',
        error: errorMessage,
      });
    }
  };

  const pollVideoStatus = async (id: string) => {
    try {
      const response = await apiClient.getVideoStatus(id);
      
      if (response.success) {
        if (response.videoId) {
          // Video is ready
          setGenerationStatus({
            status: 'completed',
            videoUrl: apiClient.getVideoDownloadUrl(id),
            videoStreamUrl: apiClient.getVideoStreamUrl(id),
          });
        } else {
          // Still processing - continue polling
          setTimeout(() => pollVideoStatus(id), 2000);
          
          // Update progress based on response
          setGenerationStatus(prev => ({
            ...prev,
            status: 'generating',
            step: response.message || prev.step,
            progress: Math.min((prev.progress || 10) + 10, 90),
          }));
        }
      } else {
        setGenerationStatus({
          status: 'error',
          error: response.error || 'Błąd podczas generowania wideo',
        });
      }
    } catch (error) {
      console.error('Error polling video status:', error);
      setGenerationStatus({
        status: 'error',
        error: 'Błąd podczas sprawdzania statusu generowania',
      });
    }
  };

  const resetForm = () => {
    setGenerationStatus({ status: 'idle' });
    setVideoId(null);
  };

  const addQuestion = () => {
    if (questionsCount < 5) {
      append({ question: '', answer: '', image: undefined });
    }
  };

  const removeQuestion = (index: number) => {
    if (questionsCount > 2) {
      // Clean up image preview when removing question
      if (imagePreviews[index]) {
        URL.revokeObjectURL(imagePreviews[index]);
        const newPreviews = { ...imagePreviews };
        delete newPreviews[index];
        setImagePreviews(newPreviews);
      }
      
      // Clean up image size tracking
      const newSizes = { ...imageSizes };
      delete newSizes[index];
      setImageSizes(newSizes);
      
      // Clear any validation errors for this question
      clearErrors(`questions.${index}` as any);
      
      remove(index);
    }
  };

  // Handle image upload with better file handling
  const handleImageUpload = (index: number, file: File | null) => {
    if (file) {
      // Validate file size
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`questions.${index}.image` as any, {
          type: 'manual',
          message: `Obrazek jest za duży. Maksymalny rozmiar to ${formatFileSize(MAX_IMAGE_SIZE)}.`
        });
        return;
      }

      // Check if adding this file would exceed total limit
      const currentTotalSize = getTotalImageSize();
      const previousFileSize = imageSizes[index] || 0;
      const newTotalSize = currentTotalSize - previousFileSize + file.size;

      if (newTotalSize > MAX_TOTAL_SIZE) {
        const remainingSpace = MAX_TOTAL_SIZE - (currentTotalSize - previousFileSize);
        setError(`questions.${index}.image` as any, {
          type: 'manual',
          message: `Przekroczono limit wszystkich obrazków (${formatFileSize(MAX_TOTAL_SIZE)}). Dostępne miejsce: ${formatFileSize(remainingSpace)}.`
        });
        return;
      }

      // Clear any previous errors for this field
      clearErrors(`questions.${index}.image` as any);

      // Create preview URL and update size tracking
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => ({ ...prev, [index]: previewUrl }));
      setImageSizes(prev => ({ ...prev, [index]: file.size }));
    } else {
      // Remove preview and size tracking
      if (imagePreviews[index]) {
        URL.revokeObjectURL(imagePreviews[index]);
        const newPreviews = { ...imagePreviews };
        delete newPreviews[index];
        setImagePreviews(newPreviews);
      }
      
      const newSizes = { ...imageSizes };
      delete newSizes[index];
      setImageSizes(newSizes);
      
      // Clear errors for this field
      clearErrors(`questions.${index}.image` as any);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [index]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [index]: false }));
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [index]: false }));
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(`questions.${index}.image` as any, {
          type: 'manual',
          message: 'Nieprawidłowy format pliku. Dozwolone: JPEG, PNG, WebP.'
        });
        return;
      }
      
      // Set the file in react-hook-form
      const input = document.getElementById(`questions.${index}.image`) as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        // Trigger onChange event
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
      
      handleImageUpload(index, file);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const input = document.getElementById(`questions.${index}.image`) as HTMLInputElement;
    if (input) {
      input.value = '';
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
    handleImageUpload(index, null);
  };

  // Show generation progress
  if (generationStatus.status === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle>Generowanie wideo...</CardTitle>
            <CardDescription>
              Proces może potrwać kilka minut. Nie zamykaj tej strony.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Postęp:</span>
                <span>{generationStatus.progress || 0}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationStatus.progress || 0}%` }}
                />
              </div>
            </div>
            {generationStatus.step && (
              <p className="text-sm text-muted-foreground text-center">
                {generationStatus.step}
              </p>
            )}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ważne:</strong> Nie zamykaj i nie odświeżaj tej strony. 
                Wygenerowany plik będzie dostępny do pobrania tylko w tej sesji.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completion screen with download
  if (generationStatus.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-green-700">Wideo jest gotowe!</CardTitle>
            <CardDescription>
              Twój quiz wideo został pomyślnie wygenerowany
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Player */}
            {generationStatus.videoStreamUrl && (
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Podgląd wideo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Możesz obejrzeć wideo przed pobraniem
                  </p>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    controls
                    className="w-full h-auto max-h-96 mx-auto"
                    preload="metadata"
                    style={{ aspectRatio: '9/16', maxWidth: '360px' }}
                  >
                    <source src={generationStatus.videoStreamUrl} type="video/mp4" />
                    Twoja przeglądarka nie obsługuje odtwarzania wideo.
                  </video>
                </div>
              </div>
            )}
            
            {/* Download Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href={generationStatus.videoUrl} 
                download="quiz-video.mp4"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4"
              >
                <Download className="h-4 w-4" />
                Pobierz wideo
              </a>
              <Button 
                variant="outline" 
                className="h-10" 
                onClick={resetForm}
              >
                Utwórz kolejny quiz
              </Button>
            </div>
            
            {/* Share Actions */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Gotowe do publikacji na social media
              </p>
              <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  1080x1920 (9:16)
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  30fps MP4
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  TikTok/Instagram Ready
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Porady:</strong> Plik jest zoptymalizowany pod TikTok i Instagram Stories. 
                Pamiętaj o dodaniu hashtagów przy publikacji!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error screen
  if (generationStatus.status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-red-700">Wystąpił błąd</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {generationStatus.error}
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              onClick={resetForm}
            >
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generator Wideo-Quizów
          </h1>
          <p className="text-lg text-gray-600">
            Stwórz angażujący quiz wideo dla TikTok i Instagram w mniej niż minutę
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utwórz swój quiz</CardTitle>
            <CardDescription>
              Wypełnij formularz, aby wygenerować profesjonalne wideo-quiz gotowe do publikacji
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Topic Field */}
              <div className="space-y-2">
                <Label htmlFor="topic">Temat quizu *</Label>
                <Input
                  id="topic"
                  placeholder="np. Geografia świata, Historia Polski, Filmy z lat 90."
                  {...register('topic')}
                  className={errors.topic ? 'border-destructive' : ''}
                />
                {errors.topic && (
                  <p className="text-sm text-destructive">{errors.topic.message}</p>
                )}
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Pytania ({questionsCount}/5) *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    disabled={questionsCount >= 5}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Dodaj pytanie
                  </Button>
                </div>

                {/* Image Usage Panel */}
                {Object.keys(imagePreviews).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-blue-900">
                        Wykorzystanie obrazków
                      </h4>
                      <span className="text-sm text-blue-700">
                        {formatFileSize(getTotalImageSize())} / {formatFileSize(MAX_TOTAL_SIZE)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            getTotalImageSize() > MAX_TOTAL_SIZE * 0.8 
                              ? 'bg-red-500' 
                              : getTotalImageSize() > MAX_TOTAL_SIZE * 0.6 
                                ? 'bg-yellow-500' 
                                : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${Math.min((getTotalImageSize() / MAX_TOTAL_SIZE) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-blue-700">
                        <span>
                          {Object.keys(imagePreviews).length} obrazek(ów)
                        </span>
                        <span>
                          {getTotalImageSize() > MAX_TOTAL_SIZE * 0.8 && (
                            <span className="text-red-600 font-medium">
                              Zbliżasz się do limitu!
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-blue-600">
                      <p>• Maksymalnie {formatFileSize(MAX_IMAGE_SIZE)} na obrazek</p>
                      <p>• Łącznie maksymalnie {formatFileSize(MAX_TOTAL_SIZE)} na wszystkie obrazki</p>
                    </div>
                  </div>
                )}

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Pytanie {index + 1}</h4>
                      {questionsCount > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`questions.${index}.question`}>
                          Treść pytania *
                        </Label>
                        <Textarea
                          id={`questions.${index}.question`}
                          placeholder="np. Jakie jest największe miasto w Polsce?"
                          rows={2}
                          {...register(`questions.${index}.question`)}
                          className={errors.questions?.[index]?.question ? 'border-destructive' : ''}
                        />
                        {errors.questions?.[index]?.question && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.questions[index]?.question?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`questions.${index}.answer`}>
                          Poprawna odpowiedź *
                        </Label>
                        <Input
                          id={`questions.${index}.answer`}
                          placeholder="np. Warszawa"
                          {...register(`questions.${index}.answer`)}
                          className={errors.questions?.[index]?.answer ? 'border-destructive' : ''}
                        />
                        {errors.questions?.[index]?.answer && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.questions[index]?.answer?.message}
                          </p>
                        )}
                      </div>

                      {/* Image upload section */}
                      <div>
                        <Label htmlFor={`questions.${index}.image`}>
                          Obrazek do pytania (opcjonalnie)
                        </Label>
                        
                        {!imagePreviews[index] ? (
                          // Upload area when no image
                          <div
                            className={`
                              mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
                              ${dragStates[index] 
                                ? 'border-primary bg-primary/5 scale-[1.02]' 
                                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                              }
                              ${errors.questions?.[index]?.image ? 'border-destructive' : ''}
                            `}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={(e) => handleDragLeave(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onClick={() => {
                              const input = document.getElementById(`questions.${index}.image`) as HTMLInputElement;
                              if (input) input.click();
                            }}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className={`
                                p-3 rounded-full transition-colors
                                ${dragStates[index] ? 'bg-primary/10' : 'bg-gray-100'}
                              `}>
                                <ImageIcon className={`
                                  h-8 w-8 transition-colors
                                  ${dragStates[index] ? 'text-primary' : 'text-gray-400'}
                                `} />
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {dragStates[index] ? 'Upuść obrazek tutaj' : 'Dodaj obrazek do pytania'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Przeciągnij i upuść lub kliknij aby wybrać
                                </p>
                                <p className="text-xs text-gray-400">
                                  JPEG, PNG, WebP • Max 5MB
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 shadow-sm">
                                <Upload className="h-3 w-3" />
                                Wybierz plik
                              </div>
                            </div>
                            
                            <input
                              id={`questions.${index}.image`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              {...register(`questions.${index}.image`, {
                                onChange: (e) => {
                                  const file = e.target.files?.[0] || null;
                                  if (file) {
                                    // Validate file type
                                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                                      setError(`questions.${index}.image` as any, {
                                        type: 'manual',
                                        message: 'Nieprawidłowy format pliku. Dozwolone: JPEG, PNG, WebP.'
                                      });
                                      e.target.value = ''; // Clear invalid file
                                      return;
                                    }
                                  }
                                  handleImageUpload(index, file);
                                }
                              })}
                            />
                          </div>
                        ) : (
                          // Preview area when image is selected
                          <div className="mt-2 space-y-3">
                            <div 
                              className={`
                                relative inline-block rounded-lg transition-all duration-200
                                ${dragStates[index] ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' : ''}
                              `}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragLeave={(e) => handleDragLeave(e, index)}
                              onDrop={(e) => handleDrop(e, index)}
                            >
                              <img
                                src={imagePreviews[index]}
                                alt={`Podgląd obrazka dla pytania ${index + 1}`}
                                className="w-full max-w-sm h-auto rounded-lg border border-gray-200 shadow-sm"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                              />
                              
                              {/* Drag overlay */}
                              {dragStates[index] && (
                                <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                                    <Upload className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">
                                      Upuść nowy obrazek
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Change image button */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`questions.${index}.image`) as HTMLInputElement;
                                  if (input) input.click();
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                <Upload className="h-4 w-4" />
                                Zmień obrazek
                              </button>
                              
                              <span className="text-xs text-gray-500">
                                Lub przeciągnij nowy obrazek na podgląd
                              </span>
                            </div>
                            
                            <input
                              id={`questions.${index}.image`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              {...register(`questions.${index}.image`, {
                                onChange: (e) => {
                                  const file = e.target.files?.[0] || null;
                                  if (file) {
                                    // Validate file type
                                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                                      setError(`questions.${index}.image` as any, {
                                        type: 'manual',
                                        message: 'Nieprawidłowy format pliku. Dozwolone: JPEG, PNG, WebP.'
                                      });
                                      e.target.value = ''; // Clear invalid file
                                      return;
                                    }
                                  }
                                  handleImageUpload(index, file);
                                }
                              })}
                            />
                          </div>
                        )}
                        
                        {errors.questions?.[index]?.image && (
                          <p className="text-sm text-destructive mt-2">
                            {typeof errors.questions[index]?.image?.message === 'string' 
                              ? errors.questions[index]?.image?.message 
                              : 'Błąd walidacji obrazka'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {errors.questions?.message && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.questions.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  'Generuj wideo'
                )}
              </Button>

              {/* Help Text */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Quiz może zawierać od 2 do 5 pytań</p>
                <p>• Każde pytanie powinno być jasne i konkretne</p>
                <p>• Odpowiedzi powinny być krótkie i jednoznaczne</p>
                <p>• Możesz dodać obrazek do pytania - będzie wyświetlony razem z pytaniem</p>
                <p>• Obrazki będą wyświetlane nad tekstem pytania jako wizualny dodatek</p>
                <p>• <strong>Limity obrazków:</strong> {formatFileSize(MAX_IMAGE_SIZE)} na obrazek, łącznie {formatFileSize(MAX_TOTAL_SIZE)}</p>
                <p>• <strong>Dozwolone formaty obrazków:</strong> JPEG, PNG, WebP</p>
                <p>• Wygenerowane wideo będzie miało format 9:16 (1080x1920px)</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 