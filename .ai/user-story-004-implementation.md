# User Story 004 - Implementation Summary

## Status: 🟡 PARTIALLY COMPLETED (infrastructure ready, needs external API integration)

**Tytuł:** Obsługa błędu po stronie usług zewnętrznych (API)  
**Data analizy:** 27 czerwca 2025  
**Status:** Infrastruktura obsługi błędów gotowa, wymaga integracji z rzeczywistymi API

## Podsumowanie

User Story 004 ma zaimplementowaną solidną infrastrukturę obsługi błędów, ale nie może być w pełni przetestowana ze względu na obecne mockowanie zewnętrznych API (ElevenLabs, Fal.ai). Wszystkie mechanizmy potrzebne do obsługi błędów zewnętrznych są już w miejscu.

## Kryteria akceptacji - Status realizacji

### 🟡 Kryterium 1: Przerywanie procesu przy błędzie API
**Wymaganie:** W trakcie wyświetlania wskaźnika postępu, jeśli API ElevenLabs lub Fal.ai zwróci błąd, proces zostaje przerwany.

**Implementacja (infrastruktura gotowa):**
```typescript
// backend/src/services/videoService.ts
private async processVideoJob(jobId: string): Promise<void> {
  try {
    // Step 1: Generate background images 
    await this.updateJobStatus(jobId, 'processing', undefined, 20, 'Generowanie obrazów tła z AI...');
    await this.mockGenerateBackgrounds(job); // ← Tutaj będzie Fal.ai API

    // Step 2: Generate voice narration 
    await this.updateJobStatus(jobId, 'processing', undefined, 40, 'Synteza głosu lektora...');
    await this.mockGenerateVoice(job); // ← Tutaj będzie ElevenLabs API

  } catch (error) {
    console.error(`Error in video processing pipeline for job ${jobId}:`, error);
    await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');
  }
}
```

**Status:** ✅ **Infrastruktura ready** - błędy są prawidłowo przechwytywane i proces jest przerywany

### 🟡 Kryterium 2: Komunikat o błędzie na ekranie
**Wymaganie:** Na ekranie pojawia się komunikat, np. "Wystąpił błąd podczas generowania. Spróbuj ponownie za chwilę lub zmień treść quizu."

**Implementacja:**
```tsx
// frontend/src/components/VideoQuizGenerator.tsx
const pollVideoStatus = async (id: string) => {
  const response = await apiClient.getVideoStatus(id);
  
  if (!response.success) {
    setGenerationStatus({
      status: 'error',
      error: response.error || 'Błąd podczas generowania wideo',
    });
  }
};

// Error screen
if (generationStatus.status === 'error') {
  return (
    <Card className="w-full max-w-md">
      <CardTitle className="text-red-700">Wystąpił błąd</CardTitle>
      <Alert variant="destructive">
        <AlertDescription>
          {generationStatus.error} {/* ← Komunikat błędu wyświetlany */}
        </AlertDescription>
      </Alert>
    </Card>
  );
}
```

**Status:** ✅ **Implemented** - komunikaty błędów są wyświetlane użytkownikowi

### ✅ Kryterium 3: Możliwość powrotu do formularza
**Wymaganie:** Użytkownik ma możliwość powrotu do formularza w celu ponownej próby.

**Implementacja:**
```tsx
// frontend/src/components/VideoQuizGenerator.tsx
const resetForm = () => {
  setGenerationStatus({ status: 'idle' });
  setVideoId(null);
};

// Error screen - przycisk powrotu
<Button className="w-full" onClick={resetForm}>
  Spróbuj ponownie
</Button>
```

**Status:** ✅ **Fully implemented** - użytkownik może wrócić do formularza

## Co jest zaimplementowane (infrastructure)

### 1. **Error propagation pipeline**
```typescript
// Backend error handling
catch (error) {
  await this.updateJobStatus(jobId, 'failed', error.message);
}

// API response with error
case 'failed':
  return {
    success: false,
    message: 'Błąd podczas generowania wideo',
    error: job.error || 'Unknown error'
  };

// Frontend error handling
if (!response.success) {
  setGenerationStatus({
    status: 'error',
    error: response.error || 'Błąd podczas generowania wideo',
  });
}
```

### 2. **Polling mechanism z obsługą błędów**
```tsx
// Polling continues until completion or error
const pollVideoStatus = async (id: string) => {
  try {
    const response = await apiClient.getVideoStatus(id);
    if (response.success) {
      if (response.videoId) {
        // Success case
      } else {
        setTimeout(() => pollVideoStatus(id), 2000); // Continue polling
      }
    } else {
      // Error case - stop polling and show error
      setGenerationStatus({ status: 'error', error: response.error });
    }
  } catch (error) {
    // Network error handling
    setGenerationStatus({ status: 'error', error: 'Błąd podczas sprawdzania statusu' });
  }
};
```

### 3. **API Error classification**
```tsx
// Different error messages for different scenarios
if (error instanceof APIError) {
  if (error.status === 0) {
    errorMessage = 'Brak połączenia z serwerem. Sprawdź połączenie internetowe.';
  } else if (error.status >= 500) {
    errorMessage = 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie za chwilę.';
  } else if (error.status === 400) {
    errorMessage = 'Dane formularza są nieprawidłowe. Sprawdź wprowadzone informacje.';
  }
}
```

## Co wymaga uzupełnienia (external API integration)

### 1. **Rzeczywiste API calls** zamiast mocków:

```typescript
// Obecne mocki (do zastąpienia):
private async mockGenerateBackgrounds(job: VideoJob): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`Mock: Generated backgrounds`);
}

// Docelowa implementacja (TODO):
private async generateBackgrounds(job: VideoJob): Promise<void> {
  try {
    for (const question of job.questions) {
      const response = await fetch('https://fal.ai/api/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.FAL_AI_API_KEY}` },
        body: JSON.stringify({ prompt: question.question })
      });
      
      if (!response.ok) {
        throw new Error(`Fal.ai API error: ${response.status}`);
      }
      
      // Save generated image...
    }
  } catch (error) {
    throw new Error(`Błąd generowania tła: ${error.message}`);
  }
}
```

### 2. **Specyficzne komunikaty błędów** dla różnych API:

```typescript
// TODO: Implementacja specyficznych błędów
private getAPIErrorMessage(apiName: string, error: Error): string {
  switch (apiName) {
    case 'fal.ai':
      return 'Błąd podczas generowania obrazów tła. Spróbuj zmienić temat quizu.';
    case 'elevenlabs':
      return 'Błąd podczas generowania głosu lektora. Spróbuj skrócić treść pytań.';
    default:
      return 'Wystąpił błąd podczas generowania. Spróbuj ponownie za chwilę.';
  }
}
```

### 3. **Retry logic** dla niestabilnych API:

```typescript
// TODO: Implementacja retry logic
private async callAPIWithRetry<T>(
  apiCall: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Testy manualne (z mockowanym pipeline)

### Test 1: Symulacja błędu w pipeline
1. ✅ Dodaj `throw new Error('Test error')` w `mockGenerateVoice`
2. ✅ Wypełnij formularz i kliknij "Generuj wideo"
3. ✅ Proces rozpoczyna się i pokazuje postęp
4. ✅ Na etapie "Synteza głosu..." proces zostaje przerwany
5. ✅ Wyświetla się ekran błędu z komunikatem "Test error"
6. ✅ Przycisk "Spróbuj ponownie" wraca do formularza

### Test 2: Błąd połączenia z API
1. ✅ Wyłącz backend server
2. ✅ Spróbuj wygenerować wideo
3. ✅ Wyświetla się komunikat o braku połączenia z serwerem
4. ✅ Użytkownik może wrócić do formularza

### Test 3: Błąd polling podczas generowania
1. ✅ Podczas generowania wyłącz backend
2. ✅ Polling wykrywa błąd i przerywa oczekiwanie
3. ✅ Wyświetla się komunikat o błędzie sprawdzania statusu

## Środowisko potrzebne do pełnej implementacji

### Environment variables (TODO):
```bash
# .env
FAL_AI_API_KEY=your_fal_ai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Dependencies (TODO):
```json
{
  "fal-ai": "^1.0.0",
  "elevenlabs-js": "^1.0.0"
}
```

## Podsumowanie zgodności

| Kryterium akceptacji | Status | Implementacja |
|---------------------|--------|---------------|
| Przerywanie procesu przy błędzie API | 🟡 INFRASTRUCTURE | Try-catch + job status update |
| Komunikat błędu na ekranie | ✅ IMPLEMENTED | Error screen + alert message |
| Powrót do formularza | ✅ IMPLEMENTED | Reset button with form reload |
| Specyficzne błędy API | 🔴 TODO | Wymaga integracji zewnętrznych API |
| Retry logic | 🔴 TODO | Wymaga implementacji retry mechanism |

## Następne kroki do pełnej implementacji

1. **Integracja Fal.ai API** - implementacja `generateBackgrounds()`
2. **Integracja ElevenLabs API** - implementacja `generateVoice()`
3. **Environment setup** - konfiguracja API keys
4. **Error categorization** - specyficzne komunikaty dla różnych API
5. **Retry logic** - mechanizm ponawiania nieudanych wywołań
6. **Rate limiting** - obsługa limitów API
7. **Testing** - testy z rzeczywistymi błędami API

## Zalecenia

1. **Priority**: Najpierw zaimplementować integracje API, potem dopracować error handling
2. **Testing**: Stworzyć test suite do symulacji błędów API
3. **Monitoring**: Dodać logging błędów zewnętrznych API
4. **Fallbacks**: Rozważyć alternatywne API jako backup

---

**Autor:** Claude (AI Assistant)  
**Review:** Infrastruktura obsługi błędów gotowa - wymaga integracji zewnętrznych API do pełnej implementacji 