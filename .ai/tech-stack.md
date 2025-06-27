### Frontend - Astro z Reactem dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie ultra-szybkich stron z architekturą "Islands", dostarczając minimalną ilość JavaScriptu po stronie klienta.
- React 19 będzie użyty do budowy w pełni interaktywnych komponentów, takich jak dynamiczny formularz do tworzenia quizu.
- TypeScript zapewni bezpieczeństwo typów w całym projekcie, redukując błędy i ułatwiając pracę w zespole.
- Tailwind CSS posłuży do szybkiego i spójnego stylowania aplikacji przy użyciu klas użytkowych.
- Shadcn/ui dostarczy gotową, dostępną bibliotekę komponentów React, która przyspieszy budowę interfejsu użytkownika.
- React Hook Form i Zod zostaną użyte do wydajnego zarządzania stanem formularza i jego walidacji po stronie klienta i serwera.

### Backend - Node.js z frameworkiem Fastify:
- Node.js jako środowisko uruchomieniowe, które idealnie integruje się z ekosystemem JavaScript/TypeScript użytym na frontendzie oraz w narzędziach do generowania wideo.
- Fastify to minimalistyczny i ekstremalnie wydajny framework webowy, idealny do stworzenia punktu końcowego API, który będzie przyjmował zlecenia generowania wideo i zarządzał całym procesem.

### Generowanie Wideo - Remotion jako silnik renderujący:
- Remotion pozwala na programistyczne tworzenie wideo przy użyciu kodu React, co umożliwia deweloperom definiowanie dynamicznych scen, animacji i przejść z wykorzystaniem znanych im narzędzi.
- Umożliwia renderowanie wideo po stronie serwera (server-side rendering), co jest fundamentem całego zautomatyzowanego potoku (pipeline) generującego.

### Usługi AI - Wyspecjalizowane modele do konkretnych zadań:
- Fal.ai (model gpt-image-1) jako dedykowana usługa do generowania unikalnych, kontekstowych obrazów AI, które posłużą za dynamiczne tła dla każdej sceny w quizie.
- ElevenLabs jako wiodące rozwiązanie Text-to-Speech (TTS), wybrane ze względu na wysoką jakość i naturalność generowanego głosu lektora w języku polskim, co jest kluczowe dla profesjonalnego efektu końcowego.