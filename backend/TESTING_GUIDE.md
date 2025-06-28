# Testing Guide - User Story 007

## Status: ✅ READY FOR TESTING

Implementacja User Story 007 jest kompletna i gotowa do testowania z prawdziwymi API keys.

## Pre-requisites

### 1. API Keys Setup

Musisz mieć aktywne klucze API dla:
- **Fal.ai**: Zarejestruj się na https://fal.ai i uzyskaj API key
- **ElevenLabs**: Zarejestruj się na https://elevenlabs.io i uzyskaj API key

### 2. Environment Configuration

Utwórz/aktualizuj plik `.env` w root directory:

```bash
# External APIs
FAL_API_KEY=your_fal_ai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Server Configuration
BACKEND_PORT=3000
FRONTEND_PORT=4321
```

### 3. Dependencies Installation

```bash
# Backend
cd backend && npm install

# Frontend (jeśli nie zainstalowane)
cd frontend && npm install
```

## Quick Test (Recommended)

### 1. Start Services

```bash
# Z root directory
npm run dev
```

Lub osobno:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 2. Access Application

Otwórz http://localhost:4321 (lub port wyświetlony w terminalu)

### 3. Create Minimal Test Quiz

**Używaj krótkich, prostych tekstów dla szybszego testowania:**

- **Temat**: "Test Quiz"
- **Pytanie 1**: "Co to jest AI?"
- **Odpowiedź 1**: "Sztuczna inteligencja"
- **Pytanie 2**: "Ile to 2+2?"
- **Odpowiedź 2**: "Cztery"

### 4. Monitor Progress

Obserwuj:
1. **Browser**: Progress indicator z krokami
2. **Backend Terminal**: Szczegółowe logi z każdego API call
3. **Generated Files**: `backend/generated-videos/job-{uuid}/`

### 5. Expected Timeline

- **Total**: ~60-90 sekund dla 2 pytań
- **Fal.ai Images**: ~30-45s (intro + 2 questions = 3 images)
- **ElevenLabs Audio**: ~20-30s (intro + 2Q + 2A + outro = 5 audio files)
- **Remotion Render**: ~10-20s (mockowany, ale z real asset validation)

## Detailed Testing Scenarios

### Scenario 1: Successful Generation

1. Wypełnij formularz z 2 pytaniami
2. Kliknij "Generuj wideo"
3. **Expected Behavior**:
   - Status zmienia się na "Generowanie obrazów tła z AI..."
   - Po ~30-45s: "Synteza głosu lektora..."
   - Po ~20-30s: "Kompozycja elementów wideo..."
   - Po ~5s: "Renderowanie finalnego wideo..."
   - Po ~10-20s: "Wideo gotowe do pobrania!"
4. Kliknij "Pobierz wideo"
5. Sprawdź wygenerowane pliki w `backend/generated-videos/job-{uuid}/`

### Scenario 2: API Error Handling

**Test Fal.ai Error:**
1. Użyj nieprawidłowego FAL_API_KEY
2. Spróbuj wygenerować wideo
3. **Expected**: Error message "Błąd generowania obrazów tła: Fal.ai API error (401): ..."

**Test ElevenLabs Error:**
1. Użyj nieprawidłowego ELEVENLABS_API_KEY
2. **Expected**: Error message "Błąd generowania głosu: ElevenLabs API error (401): ..."

### Scenario 3: Large Quiz Test

1. Utwórz quiz z 5 pytaniami (maksimum)
2. Użyj dłuższych tekstów
3. **Expected Timeline**: ~2-3 minuty total
4. Monitor memory usage w terminalu

## File Structure Verification

Po pomyślnym generowaniu sprawdź:

```
backend/generated-videos/job-{uuid}/
├── intro-bg.jpg              # 1080x1920 JPG z Fal.ai
├── question-1-bg.jpg          # 1080x1920 JPG z Fal.ai
├── question-2-bg.jpg          # 1080x1920 JPG z Fal.ai
├── intro.mp3                  # MP3 z ElevenLabs
├── question-1.mp3             # MP3 z ElevenLabs
├── question-2.mp3             # MP3 z ElevenLabs
├── answer-1.mp3               # MP3 z ElevenLabs
├── answer-2.mp3               # MP3 z ElevenLabs
├── outro.mp3                  # MP3 z ElevenLabs
└── quiz-{uuid}.mp4            # Final video (currently mock)
```

## API Testing (Alternative)

### Direct Backend Testing

```bash
# Test video generation
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test API",
    "questions": [
      {"question": "Test pytanie?", "answer": "Test odpowiedź"}
    ]
  }'

# Response: {"success": true, "videoId": "uuid"}

# Monitor status
curl http://localhost:3000/api/video-status/{videoId}

# Download when ready
curl -O http://localhost:3000/api/download-video/{videoId}
```

## Troubleshooting

### Common Issues

**1. "FAL_API_KEY environment variable is required"**
- Solution: Sprawdź czy .env file jest w root directory i zawiera prawidłowy klucz

**2. "ElevenLabs API error (402): Insufficient credits"**
- Solution: Sprawdź billing w ElevenLabs dashboard

**3. "Fal.ai API error (429): Rate limit exceeded"**
- Solution: Zaczekaj kilka minut przed następną próbą

**4. Frontend nie łączy się z backend**
- Solution: Sprawdź czy backend działa na http://localhost:3000

### Debug Mode

Włącz verbose logging w backend:

```bash
cd backend
DEBUG=* npm run dev
```

### Clear Generated Files

```bash
# Usuń wszystkie wygenerowane pliki
rm -rf backend/generated-videos/*
```

## Performance Monitoring

### Expected Resource Usage

- **Memory**: ~200-500MB podczas generowania
- **Disk Space**: ~5-10MB per quiz (images + audio + video)
- **Network**: ~10-20 API calls per quiz

### Timeouts

- **Fal.ai Image**: 30s timeout per image
- **ElevenLabs Audio**: 30s timeout per audio
- **Total Job**: 5 minut timeout

## Next Steps After Testing

1. **Real Remotion Implementation**: Replace mock rendering with actual Remotion
2. **Background Music**: Add royalty-free background tracks
3. **Performance Optimization**: Parallel API calls, caching
4. **Production Deployment**: Environment setup, error monitoring

## Success Criteria

✅ **Functional**: All steps complete successfully  
✅ **Quality**: Generated assets meet specifications  
✅ **Performance**: Generation under 2 minutes for 2-3 questions  
✅ **Error Handling**: Graceful failure with user-friendly messages  
✅ **Recovery**: System returns to working state after errors  

---

**Ready for Production**: Po pomyślnym testowaniu system będzie gotowy do wdrożenia produkcyjnego z prawdziwym renderowaniem Remotion. 