# Video Generator

Aplikacja do generowania wideo z quizami oparta na następujących technologiach:

## Tech Stack

### Frontend
- **Astro 5** - Ultra-szybkie strony z architekturą "Islands"
- **React 19** - Interaktywne komponenty
- **TypeScript** - Bezpieczeństwo typów
- **Tailwind CSS** - Stylowanie
- **Shadcn/ui** - Biblioteka komponentów
- **React Hook Form + Zod** - Zarządzanie formularzami i walidacja

### Backend
- **Node.js** - Środowisko uruchomieniowe
- **Fastify** - Wydajny framework webowy
- **TypeScript** - Bezpieczeństwo typów

### Generowanie Wideo
- **Remotion** - Programistyczne tworzenie wideo z React

### Usługi AI
- **Fal.ai** - Generowanie obrazów AI
- **ElevenLabs** - Text-to-Speech

## Instalacja

1. Sklonuj repozytorium
2. Zainstaluj zależności:
   ```bash
   npm run install:all
   ```
3. Skopiuj i skonfiguruj plik środowiskowy:
   ```bash
   cp .env.example .env
   ```
4. Edytuj plik `.env` dodając wymagane klucze API

## Uruchomienie

### Tryb deweloperski
```bash
npm run dev
```

### Tryb produkcyjny
```bash
npm run build
npm start
```

## Struktura projektu

```
video-generator/
├── frontend/          # Astro + React frontend
├── backend/           # Fastify backend
├── .env              # Zmienne środowiskowe (do utworzenia)
├── package.json      # Główny plik konfiguracyjny
└── README.md         # Ten plik
```

## Porty

- Frontend: http://localhost:4321
- Backend: http://localhost:3000 