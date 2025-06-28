import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, Download, AlertTriangle } from 'lucide-react';

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

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      topic: '',
      questions: [
        { question: '', answer: '' },
        { question: '', answer: '' },
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

  const onSubmit = async (data: QuizFormData) => {
    try {
      setGenerationStatus({
        status: 'generating',
        step: 'Inicjalizacja procesu generowania...',
        progress: 10,
      });

      const response = await apiClient.generateVideo({
        topic: data.topic,
        questions: data.questions,
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
      append({ question: '', answer: '' });
    }
  };

  const removeQuestion = (index: number) => {
    if (questionsCount > 2) {
      remove(index);
    }
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Download className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-green-700">Wideo jest gotowe!</CardTitle>
            <CardDescription>
              Twój quiz wideo został pomyślnie wygenerowany
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a 
              href={generationStatus.videoUrl} 
              download="quiz-video.mp4"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 rounded-md px-8 w-full"
            >
              <Download className="h-4 w-4" />
              Pobierz wideo (.MP4)
            </a>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={resetForm}
            >
              Utwórz kolejny quiz
            </Button>
            <Alert>
              <AlertDescription>
                Plik ma rozdzielczość 1080x1920 pikseli i jest gotowy do publikacji na TikToku i Instagram.
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
                <p>• Wygenerowane wideo będzie miało format 9:16 (1080x1920px)</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 