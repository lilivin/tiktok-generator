# User Story 005 - Implementation Summary

## Status: 🟡 PARTIALLY COMPLETED (infrastructure ready, needs Remotion integration)

**Tytuł:** Obsługa błędu renderowania wideo  
**Data analizy:** 27 czerwca 2025  
**Status:** Infrastruktura obsługi błędów gotowa, wymaga integracji z Remotion

## Podsumowanie

User Story 005 ma zaimplementowaną solidną infrastrukturę obsługi błędów renderowania, ale nie może być w pełni przetestowana ze względu na obecne mockowanie procesu renderowania Remotion. Wszystkie mechanizmy potrzebne do obsługi błędów renderowania są już w miejscu.

## Kryteria akceptacji - Status realizacji

### 🟡 Kryterium 1: Przerywanie procesu przy błędzie Remotion
**Wymaganie:** Jeśli proces kompozycji wideo w Remotion zakończy się niepowodzeniem, proces zostaje przerwany.

**Implementacja (infrastruktura gotowa):**
```typescript
// backend/src/services/videoService.ts
private async processVideoJob(jobId: string): Promise<void> {
  try {
    // Step 3: Compose video (mock)
    await this.updateJobStatus(jobId, 'processing', undefined, 60, 'Kompozycja elementów wideo...');
    await this.mockComposeVideo(job); // ← Tutaj będzie Remotion composition

    // Step 4: Render final video (mock)
    await this.updateJobStatus(jobId, 'processing', undefined, 80, 'Renderowanie finalnego wideo...');
    const outputPath = await this.mockRenderVideo(job); // ← Tutaj będzie Remotion render

  } catch (error) {
    console.error(`Error in video processing pipeline for job ${jobId}:`, error);
    await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');
  }
}
```

**Status:** ✅ **Infrastruktura ready** - błędy renderowania są prawidłowo przechwytywane

### ✅ Kryterium 2: Komunikat o błędzie renderowania
**Wymaganie:** Na ekranie pojawia się komunikat o błędzie, np. "Wystąpił wewnętrzny błąd serwera podczas tworzenia wideo. Prosimy, spróbuj ponownie."

**Implementacja:**
```tsx
// frontend/src/components/VideoQuizGenerator.tsx - obsługa błędów renderowania
const pollVideoStatus = async (id: string) => {
  const response = await apiClient.getVideoStatus(id);
  
  if (!response.success) {
    setGenerationStatus({
      status: 'error',
      error: response.error || 'Błąd podczas generowania wideo',
    });
  }
};

// Backend response dla błędów renderowania
case 'failed':
  return {
    success: false,
    message: 'Błąd podczas generowania wideo',
    error: job.error || 'Unknown error'
  };
```

**Status:** ✅ **Implemented** - komunikaty błędów renderowania są wyświetlane

### ✅ Kryterium 3: Możliwość powrotu do formularza
**Wymaganie:** Użytkownik ma możliwość powrotu do formularza.

**Implementacja:**
```tsx
// frontend/src/components/VideoQuizGenerator.tsx
const resetForm = () => {
  setGenerationStatus({ status: 'idle' });
  setVideoId(null);
};

// Error screen z przyciskiem powrotu
if (generationStatus.status === 'error') {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardTitle className="text-red-700">Wystąpił błąd</CardTitle>
        <Alert variant="destructive">
          <AlertDescription>
            {generationStatus.error}
          </AlertDescription>
        </Alert>
        <Button className="w-full" onClick={resetForm}>
          Spróbuj ponownie
        </Button>
      </Card>
    </div>
  );
}
```

**Status:** ✅ **Fully implemented** - użytkownik może wrócić do formularza po błędzie renderowania

## Co jest zaimplementowane (infrastructure)

### 1. **Video processing pipeline z error handling**
```typescript
// backend/src/services/videoService.ts
private async processVideoJob(jobId: string): Promise<void> {
  const job = videoJobs.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Multi-step pipeline with status updates
    await this.updateJobStatus(jobId, 'processing', undefined, 10, 'Rozpoczynanie generowania...');
    
    // Each step can throw errors that are caught and handled
    await this.mockGenerateBackgrounds(job);
    await this.mockGenerateVoice(job);
    await this.mockComposeVideo(job);     // ← Composition errors
    await this.mockRenderVideo(job);      // ← Rendering errors

    await this.updateJobStatus(jobId, 'completed', undefined, 100, 'Wideo gotowe do pobrania!');

  } catch (error) {
    // Comprehensive error handling for all pipeline steps
    console.error(`Error in video processing pipeline for job ${jobId}:`, error);
    await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');
  }
}
```

### 2. **Job status tracking z błędami**
```typescript
// Video job może mieć status 'failed' z szczegółowym błędem
export interface VideoJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;  // ← Szczegóły błędu renderowania
  currentStep?: string;
  progress?: number;
  // ...
}

// API endpoint zwraca błędy renderowania
case 'failed':
  return {
    success: false,
    message: 'Błąd podczas generowania wideo',
    error: job.error || 'Unknown error'
  } as VideoGenerationResponse;
```

### 3. **Frontend error handling z polling**
```tsx
// Polling mechanism wykrywa błędy renderowania i przerywa oczekiwanie
const pollVideoStatus = async (id: string) => {
  try {
    const response = await apiClient.getVideoStatus(id);
    
    if (response.success) {
      if (response.videoId) {
        // Video ready - success path
        setGenerationStatus({
          status: 'completed',
          videoUrl: apiClient.getVideoDownloadUrl(id),
        });
      } else {
        // Still processing - continue polling
        setTimeout(() => pollVideoStatus(id), 2000);
        
        // Update progress
        setGenerationStatus(prev => ({
          ...prev,
          step: response.message || prev.step,
          progress: Math.min((prev.progress || 10) + 10, 90),
        }));
      }
    } else {
      // Error detected (including rendering errors) - stop polling
      setGenerationStatus({
        status: 'error',
        error: response.error || 'Błąd podczas generowania wideo',
      });
    }
  } catch (error) {
    // Network/API errors
    setGenerationStatus({
      status: 'error',
      error: 'Błąd podczas sprawdzania statusu generowania',
    });
  }
};
```

## Co wymaga uzupełnienia (Remotion integration)

### 1. **Rzeczywista integracja z Remotion** zamiast mocków:

```typescript
// Obecne mocki (do zastąpienia):
private async mockComposeVideo(job: VideoJob): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`Mock: Composed video elements for job ${job.id}`);
}

private async mockRenderVideo(job: VideoJob): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const filePath = path.join(this.outputDir, `quiz-${job.id}.mp4`);
  await fs.writeFile(filePath, 'mock video content');
  return filePath;
}

// Docelowa implementacja (TODO):
private async composeVideo(job: VideoJob): Promise<void> {
  try {
    const composition = await createComposition({
      id: 'VideoQuiz',
      component: VideoQuizComposition,
      durationInFrames: calculateDuration(job.questions.length),
      fps: 30,
      width: 1080,
      height: 1920,
      props: {
        topic: job.topic,
        questions: job.questions,
        backgroundImages: job.backgroundImages,
        audioFiles: job.audioFiles,
      }
    });
    
    if (!composition) {
      throw new Error('Nie udało się utworzyć kompozycji wideo');
    }
    
  } catch (error) {
    throw new Error(`Błąd kompozycji wideo: ${error.message}`);
  }
}

private async renderVideo(job: VideoJob): Promise<string> {
  try {
    const outputPath = path.join(this.outputDir, `quiz-${job.id}.mp4`);
    
    await renderMedia({
      composition: 'VideoQuiz',
      serveUrl: getServeUrl(),
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        topic: job.topic,
        questions: job.questions,
        // ... all props
      },
      onProgress: (progress) => {
        const percentage = Math.round(progress * 100);
        this.updateJobStatus(job.id, 'processing', undefined, 80 + (percentage * 0.2), 
          `Renderowanie wideo: ${percentage}%`);
      }
    });
    
    return outputPath;
    
  } catch (error) {
    throw new Error(`Błąd renderowania wideo: ${error.message}`);
  }
}
```

### 2. **Specyficzne komunikaty błędów** renderowania:

```typescript
// TODO: Kategoryzacja błędów renderowania
private getVideoErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('composition')) {
    return 'Wystąpił błąd podczas składania elementów wideo. Spróbuj ponownie.';
  } else if (message.includes('codec') || message.includes('encoding')) {
    return 'Błąd podczas kodowania wideo. Sprawdź czy wszystkie elementy są prawidłowe.';
  } else if (message.includes('memory') || message.includes('timeout')) {
    return 'Renderowanie wideo zajęło zbyt dużo czasu. Spróbuj skrócić quiz lub zmienić treść.';
  } else if (message.includes('file') || message.includes('permission')) {
    return 'Błąd podczas zapisywania pliku wideo. Spróbuj ponownie za chwilę.';
  } else {
    return 'Wystąpił wewnętrzny błąd serwera podczas tworzenia wideo. Prosimy, spróbuj ponownie.';
  }
}
```

### 3. **Remotion error recovery strategies**:

```typescript
// TODO: Strategie odzyskiwania po błędach
private async renderVideoWithRecovery(job: VideoJob): Promise<string> {
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.renderVideo(job);
    } catch (error) {
      console.warn(`Rendering attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Renderowanie nieudane po ${maxRetries} próbach: ${error.message}`);
      }
      
      // Cleanup przed retry
      await this.cleanupFailedRender(job.id);
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

private async cleanupFailedRender(jobId: string): Promise<void> {
  try {
    const tempFiles = await fs.readdir(this.outputDir);
    const jobFiles = tempFiles.filter(file => file.includes(jobId));
    
    for (const file of jobFiles) {
      await fs.unlink(path.join(this.outputDir, file));
    }
  } catch (error) {
    console.warn('Cleanup failed:', error);
  }
}
```

## Testy manualne (z mockowanym pipeline)

### Test 1: Symulacja błędu kompozycji
1. ✅ Dodaj `throw new Error('Composition failed')` w `mockComposeVideo`
2. ✅ Wypełnij formularz i wygeneruj wideo
3. ✅ Proces dochodzi do "Kompozycja elementów wideo..." i zostaje przerwany
4. ✅ Wyświetla się komunikat błędu "Composition failed"
5. ✅ Użytkownik może wrócić do formularza

### Test 2: Symulacja błędu renderowania
1. ✅ Dodaj `throw new Error('Rendering failed')` w `mockRenderVideo`
2. ✅ Proces dochodzi do "Renderowanie finalnego wideo..." i zostaje przerwany
3. ✅ Wyświetla się komunikat błędu "Rendering failed"
4. ✅ Status job zostaje ustawiony na 'failed'

### Test 3: Błąd podczas polling renderowania
1. ✅ Symuluj błąd w API podczas długiego renderowania
2. ✅ Polling wykrywa błąd i przerywa oczekiwanie
3. ✅ Komunikat błędu jest wyświetlany użytkownikowi

## Środowisko potrzebne do pełnej implementacji

### Dependencies (TODO):
```json
{
  "@remotion/renderer": "^4.0.0",
  "@remotion/cli": "^4.0.0",
  "@remotion/player": "^4.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

### Remotion config (TODO):
```typescript
// remotion.config.ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
Config.setCodec('h264');
```

### Memory/Performance considerations:
```typescript
// TODO: Monitoring zasobów podczas renderowania
private async monitorRenderingResources(jobId: string): Promise<void> {
  const memoryLimit = 2048; // MB
  const timeoutLimit = 300000; // 5 minutes
  
  const memoryCheck = setInterval(() => {
    const usage = process.memoryUsage();
    if (usage.heapUsed / 1024 / 1024 > memoryLimit) {
      clearInterval(memoryCheck);
      throw new Error('Renderowanie przekroczyło limit pamięci');
    }
  }, 5000);
  
  setTimeout(() => {
    clearInterval(memoryCheck);
    throw new Error('Renderowanie przekroczyło limit czasu');
  }, timeoutLimit);
}
```

## Podsumowanie zgodności

| Kryterium akceptacji | Status | Implementacja |
|---------------------|--------|---------------|
| Przerywanie procesu przy błędzie Remotion | 🟡 INFRASTRUCTURE | Try-catch w pipeline steps |
| Komunikat o błędzie renderowania | ✅ IMPLEMENTED | Error screen + specific messages |
| Możliwość powrotu do formularza | ✅ IMPLEMENTED | Reset button functionality |
| Specyficzne błędy renderowania | 🔴 TODO | Wymaga integracji z Remotion |
| Recovery strategies | 🔴 TODO | Retry logic + cleanup |

## Następne kroki do pełnej implementacji

1. **Remotion setup** - instalacja i konfiguracja Remotion
2. **Video composition** - implementacja kompozycji wideo z wszystkimi elementami
3. **Rendering pipeline** - proces renderowania z monitoringiem postępu
4. **Error categorization** - specyficzne komunikaty dla różnych typów błędów
5. **Resource monitoring** - kontrola zużycia pamięci i czasu renderowania
6. **Cleanup mechanisms** - usuwanie plików tymczasowych po błędach
7. **Performance optimization** - optymalizacja procesu renderowania

## Zalecenia

1. **Memory management**: Monitoring zużycia pamięci podczas renderowania
2. **Timeout handling**: Ustawianie limitów czasowych dla renderowania
3. **Progress tracking**: Detailed progress updates during rendering
4. **File cleanup**: Automatyczne usuwanie niepotrzebnych plików
5. **Error recovery**: Strategies for retrying failed renders

---

**Autor:** Claude (AI Assistant)  
**Review:** Infrastruktura obsługi błędów renderowania gotowa - wymaga integracji z Remotion do pełnej implementacji 