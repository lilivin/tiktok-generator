# Dokument wymagań produktu (PRD) - Zautomatyzowany Generator Wideo-Quizów na Social Media

## 1. Przegląd produktu

Celem projektu jest stworzenie innowacyjnej platformy webowej do automatycznego generowania krótkich wideo-quizów, zoptymalizowanych dla platform społecznościowych takich jak TikTok i Instagram. Produkt ma na celu zrewolucjonizowanie procesu tworzenia treści wideo poprzez zastąpienie czasochłonnej, manualnej edycji (30-60 minut na wideo) w pełni zautomatyzowanym procesem, który zajmuje mniej niż 60 sekund. Użytkownik, podając jedynie temat quizu i zestaw pytań z odpowiedziami, otrzymuje gotowy do publikacji plik wideo. System autonomicznie generuje tła przy użyciu AI, syntezuje głos lektora, animuje tekst i dodaje elementy angażujące, takie jak timery i muzykę, zachowując estetykę popularną w mediach społecznościowych. Wersja MVP (Minimum Viable Product) skupia się na weryfikacji technicznej możliwości stworzenia wysokiej jakości wideo przy użyciu zdefiniowanego stosu technologicznego.

## 2. Problem użytkownika

Twórcy treści, agencje marketingowe i menedżerowie mediów społecznościowych stoją przed wyzwaniem regularnego tworzenia angażujących treści wideo, które są kluczowe dla wzrostu organicznego na platformach takich jak TikTok. Format wideo-quizów jest wysoce skuteczny, ale jego produkcja jest procesem powolnym, kosztownym i wymagającym umiejętności technicznych w zakresie edycji wideo. Manualne tworzenie pojedynczego quizu może zająć od 30 do 60 minut, co uniemożliwia efektywne skalowanie produkcji do poziomu kilku lub kilkunastu filmów dziennie. Brak prostego, szybkiego i zautomatyzowanego narzędzia stanowi barierę dla twórców, którzy chcą konsekwentnie publikować wysokiej jakości treści bez inwestowania w drogie oprogramowanie i czasochłonną naukę jego obsługi.

## 3. Wymagania funkcjonalne

### 3.1. Interfejs użytkownika (UI)
- Aplikacja musi być jednostronicowa i dostępna przez przeglądarkę internetową.
- Interfejs musi zawierać prosty formularz do wprowadzania danych.
- Pola formularza:
    - Pole tekstowe na "Temat quizu".
    - Dynamiczna sekcja na pytania, umożliwiająca dodanie od 2 do 5 pytań.
    - Każde pytanie musi zawierać pole tekstowe na "Treść pytania" i pole tekstowe na "Poprawną odpowiedź".
- Interfejs musi informować użytkownika o statusie generowania wideo po przesłaniu formularza (np. "Krok 1: Generowanie tła", "Krok 2: Synteza głosu", "Krok 3: Kompozycja wideo").
- Po pomyślnym wygenerowaniu wideo, interfejs musi wyświetlić wyraźny link lub przycisk do pobrania pliku.
- W przypadku błędu podczas generowania, interfejs musi wyświetlić zrozumiały komunikat o błędzie.
- Interfejs musi zawierać wyraźne ostrzeżenie, że zamknięcie lub odświeżenie strony przed pobraniem pliku spowoduje jego utratę.

### 3.2. Automatyczny Pipeline Renderujący
- Proces musi być w 100% zautomatyzowany po przesłaniu danych przez użytkownika.
- System musi generować unikalne, pełnoekranowe obrazy tła przy użyciu API Fal.ai (model gpt-image-1). Jedno tło dla sceny intro na podstawie ogólnego tematu quizu, oraz po jednym unikalnym tle dla każdej sceny z pytaniem.
- System musi syntezować głos lektora (Text-to-Speech) przy użyciu API ElevenLabs do odczytywania pytań i odpowiedzi.
- System musi dynamicznie animować tekst (pytania, odpowiedzi) w stylu estetycznym przypominającym CapCut, ale o wyższej jakości niż w dostarczonym filmie referencyjnym.
- System musi zaimplementować stałe, predefiniowane teksty i narrację dla sceny intro ("Nie zgadniesz, odpadasz - [Temat Quizu]") i outro ("I jak Ci poszło? Podziel się swoim wynikiem w komentarzu").
- Dla każdego pytania system musi dodać 3-sekundowy animowany timer z odliczaniem i towarzyszącym efektem dźwiękowym.
- Wszystkie wygenerowane elementy (obrazy tła, narracja, animowany tekst, timery, muzyka w tle) muszą zostać skomponowane w jeden plik wideo za pomocą biblioteki Remotion.

### 3.3. Specyfikacja Techniczna Wideo
- Format pliku wyjściowego: .MP4
- Rozdzielczość: 1080x1920 pikseli (format 9:16)
- Klatkaż (FPS): 30
- Jakość animacji i kompozycji musi być priorytetem, nawet kosztem dłuższego czasu renderowania.

### 3.4. Styl wizualny, animacje i przejścia
Celem jest osiągnięcie dynamicznego, przyciągającego uwagę stylu, który jest natywny dla platformy TikTok i przewyższa jakością dostarczone wideo referencyjne. Każdy element wizualny musi przyczyniać się do wysokiej retencji widza i wrażenia profesjonalnej edycji.

#### 3.4.1. Animacje Tekstu (Napisy w stylu "Caption")
- Synchronizacja z lektorem: Tekst (pytania i odpowiedzi) musi pojawiać się na ekranie synchronicznie z narracją lektora, idealnie z efektem "karaoke" (podświetlanie aktualnie wymawianego słowa) lub pojawiania się słowo po słowie.
- Wejście/Wyjście: Tekst nie może po prostu się pojawiać. Każda linijka lub fraza powinna mieć dynamiczną animację wejścia, np. szybkie "pop-in" (skalowanie od 0% do 100% z lekkim efektem sprężystości), krótki "slide-in" z dołu lub efekt "fade-in" połączony ze skalowaniem.
- Wygląd: Należy użyć dużej, czytelnej, bezszeryfowej czcionki (np. Poppins Bold, Montserrat ExtraBold). Każdy napis musi posiadać subtelny czarny obrys (stroke) i/lub cień (drop shadow), aby zapewnić maksymalną czytelność na zróżnicowanych tłach AI. Kluczowe słowa w pytaniu mogą być dynamicznie wyróżnione innym kolorem (np. żółtym).
- Mikroruch: Tekst, gdy jest widoczny na ekranie, nie powinien być całkowicie statyczny. Może posiadać bardzo subtelną animację ciągłą, np. delikatne pulsowanie lub zmianę skali w rytm muzyki.

#### 3.4.2. Przejścia między scenami
- Dynamika: Przejścia między sceną intro, kolejnymi pytaniami i sceną outro muszą być szybkie i energiczne. Należy unikać standardowych, powolnych przejść typu "crossfade".
- Typy przejść: Preferowane są efekty takie jak:
    - Szybkie przesunięcie w bok lub w górę ("Whip Pan").
    - Nagłe przybliżenie do środka ekranu, które odsłania kolejną scenę ("Zoom Transition").
    - Efekt "Glitch" lub cyfrowego zakłócenia.
- Czas trwania: Każde przejście powinno być bardzo krótkie, trwające nie dłużej niż 10-15 klatek (ok. 0.3-0.5 sekundy), aby utrzymać tempo wideo.

#### 3.4.3. Dynamika tła i elementów
- Efekt Kena Burnsa: Wygenerowane przez AI obrazy tła nie mogą być statyczne. Muszą posiadać subtelny, powolny ruch (lekkie przybliżanie, oddalanie lub przesuwanie), aby nadać scenie głębi i uniknąć wrażenia "nieruchomego slajdu".
- Timer: Animacja timera musi być wizualnie atrakcyjna. Zamiast zwykłej cyfry, można zastosować np. okrągły pasek postępu, który znika w ciągu 3 sekund, lub cyfry, które dynamicznie zmniejszają swoją skalę przy każdym "tyknięciu".

## 4. Granice produktu

Następujące funkcjonalności są świadomie wykluczone z zakresu wersji MVP (Minimum Viable Product):
- Konta użytkowników: Aplikacja nie będzie posiadała systemu rejestracji, logowania ani profili użytkowników. Dostęp jest w pełni anonimowy.
- Personalizacja szablonu: Użytkownicy nie będą mieli możliwości modyfikacji szablonu wideo, kolorów, czcionek, animacji ani struktury. Dostępny będzie tylko jeden, predefiniowany szablon.
- Wybór odpowiedzi: Wideo-quiz nie będzie prezentował wielu opcji odpowiedzi (A/B/C/D). Po timerze wyświetlana będzie wyłącznie jedna, poprawna odpowiedź.
- Przechowywanie wideo: Wygenerowane pliki wideo nie będą przechowywane na serwerze. Będą dostępne do pobrania wyłącznie w ramach aktywnej sesji przeglądarki.
- Moderacja treści: Brak jakichkolwiek mechanizmów filtrowania, moderacji czy cenzury treści wprowadzanych przez użytkowników.
- Weryfikacja prawna: Kwestie licencji API i praw autorskich do generowanych treści nie będą weryfikowane na tym etapie.
- Mechanizm zbierania opinii: Aplikacja nie będzie zawierała wbudowanych narzędzi do zbierania feedbacku od użytkowników (np. ankiet, ocen).
- Dodawanie logo: Brak możliwości dodawania logo klienta lub własnego brandingu do wideo.

## 5. Historyjki użytkowników

### US-001
- Tytuł: Pomyślne wygenerowanie wideo-quizu
- Opis: Jako pracownik agencji marketingowej, chcę wejść na stronę, wypełnić formularz tematem quizu oraz 3 pytaniami z odpowiedziami, aby po krótkim czasie oczekiwania pobrać gotowy plik wideo w formacie MP4, gotowy do publikacji na TikToku.
- Kryteria akceptacji:
    - Po otwarciu strony widzę formularz z polami "Temat quizu" oraz sekcją na minimum 2 pytania.
    - Mogę wypełnić wszystkie pola tekstowe.
    - Mogę dodać trzecie pytanie.
    - Po kliknięciu przycisku "Generuj wideo", formularz znika, a na jego miejscu pojawia się wskaźnik postępu informujący o kolejnych etapach generowania.
    - Widzę komunikat ostrzegający, aby nie zamykać okna przeglądarki.
    - Po zakończeniu procesu (w czasie poniżej kilku minut) widzę wyraźny przycisk "Pobierz wideo".
    - Kliknięcie przycisku rozpoczyna pobieranie pliku .MP4 o rozdzielczości 1080x1920.
    - Pobrany plik wideo jest zgodny z predefiniowaną strukturą (intro, 3 pytania z timerami i odpowiedziami, outro) oraz specyfikacją stylu z sekcji 3.4.

### US-002
- Tytuł: Próba przesłania niekompletnego formularza
- Opis: Jako użytkownik, próbuję wygenerować wideo, ale nie wypełniłem wszystkich wymaganych pól. Chcę zobaczyć jasny komunikat o błędzie, abym wiedział, co muszę poprawić.
- Kryteria akceptacji:
    - Gdy pole "Temat quizu" jest puste i klikam "Generuj wideo", widzę komunikat o błędzie przy tym polu, a proces generowania nie rozpoczyna się.
    - Gdy dodałem mniej niż 2 pytania i klikam "Generuj wideo", widzę komunikat o błędzie informujący o minimalnej liczbie pytań, a proces generowania nie rozpoczyna się.
    - Gdy którekolwiek z pól "Pytanie" lub "Odpowiedź" jest puste i klikam "Generuj wideo", widzę komunikat o błędzie przy odpowiednim polu, a proces generowania nie rozpoczyna się.

### US-003
- Tytuł: Próba dodania więcej niż maksymalna liczba pytań
- Opis: Jako użytkownik, chcę dodać 6 pytań do mojego quizu. System nie powinien mi na to pozwolić, aby zachować spójność formatu.
- Kryteria akceptacji:
    - Gdy w formularzu znajduje się 5 pytań, przycisk do dodawania kolejnego pytania jest nieaktywny lub ukryty.
    - Nie ma możliwości ręcznego dodania szóstego pytania do formularza.

### US-004
- Tytuł: Obsługa błędu po stronie usług zewnętrznych (API)
- Opis: Jako użytkownik, przesłałem poprawnie wypełniony formularz, ale podczas generowania wystąpił błąd komunikacji z zewnętrznym API (np. do generowania tła lub głosu). Chcę otrzymać zrozumiały komunikat o błędzie, abym mógł spróbować ponownie później.
- Kryteria akceptacji:
    - W trakcie wyświetlania wskaźnika postępu, jeśli API ElevenLabs lub Fal.ai zwróci błąd, proces zostaje przerwany.
    - Na ekranie pojawia się komunikat, np. "Wystąpił błąd podczas generowania. Spróbuj ponownie za chwilę lub zmień treść quizu."
    - Użytkownik ma możliwość powrotu do formularza w celu ponownej próby.

### US-005
- Tytuł: Obsługa błędu renderowania wideo
- Opis: Jako użytkownik, przesłałem poprawnie wypełniony formularz, ale wewnętrzny proces składania wideo (Remotion) nie powiódł się. Chcę zostać o tym poinformowany, abym nie czekał w nieskończoność.
- Kryteria akceptacji:
    - Jeśli proces kompozycji wideo w Remotion zakończy się niepowodzeniem, proces zostaje przerwany.
    - Na ekranie pojawia się komunikat o błędzie, np. "Wystąpił wewnętrzny błąd serwera podczas tworzenia wideo. Prosimy, spróbuj ponownie."
    - Użytkownik ma możliwość powrotu do formularza.

### US-006
- Tytuł: Informowanie użytkownika o utracie dostępu do pliku
- Opis: Jako użytkownik, chcę być świadomy, że jeśli zamknę kartę przeglądarki w trakcie lub po zakończeniu generowania wideo, utracę do niego dostęp.
- Kryteria akceptacji:
    - Po kliknięciu "Generuj wideo", na ekranie, obok wskaźnika postępu, widoczny jest stały komunikat tekstowy: "Ważne: Nie zamykaj i nie odświeżaj tej strony. Wygenerowany plik będzie dostępny do pobrania tylko w tej sesji."
    - Próba zamknięcia lub odświeżenia strony w trakcie renderowania może (opcjonalnie) wywołać natywne okno dialogowe przeglądarki z pytaniem "Czy na pewno chcesz opuścić tę stronę? Wprowadzone zmiany mogą nie zostać zapisane.".

### US-007
- Tytuł: Automatyczne przetworzenie zlecenia i wyrenderowanie wideo
- Opis: Jako system backendowy, po otrzymaniu poprawnych danych z frontendu, muszę zainicjować kompletny potok (pipeline) generowania wideo, który obejmuje komunikację z zewnętrznymi usługami AI, syntezę zasobów i kompozycję finalnego pliku wideo przy użyciu Remotion.
- Kryteria akceptacji:
    1. Proces jest uruchamiany po otrzymaniu przez backend zwalidowanego żądania HTTP zawierającego temat quizu oraz od 2 do 5 par pytań i odpowiedzi.
    2. System wysyła żądania do API Fal.ai w celu wygenerowania obrazów tła: jednego dla intro (na podstawie tematu) i po jednym unikalnym dla każdego pytania (na podstawie treści pytania). Musi poprawnie obsłużyć i zapisać otrzymane pliki graficzne.
    3. System wysyła żądania do API ElevenLabs w celu syntezy głosu lektora dla każdego pytania i każdej odpowiedzi. Teksty dla intro i outro mogą być wykorzystane z predefiniowanych, statycznych plików audio. System musi poprawnie obsłużyć i zapisać otrzymane pliki audio.
    4. Wszystkie wygenerowane zasoby (obrazy, pliki audio) oraz teksty od użytkownika są przekazywane jako właściwości (props) do odpowiedniej kompozycji Remotion.
    5. Proces renderowania wideo jest inicjowany na serwerze za pomocą odpowiedniej funkcji biblioteki Remotion.
    6. Remotion poprawnie układa wszystkie elementy w sekwencje zgodnie ze "Specyfikacją Złotego Szablonu": Scena Intro -> Sceny z Pytaniami (Pytanie -> 3-sekundowy timer z efektem dźwiękowym -> Odpowiedź) -> Scena Outro.
    7. Wszystkie animacje i przejścia muszą być zaimplementowane ściśle według wytycznych zawartych w sekcji "3.4. Styl wizualny, animacje i przejścia".
    8. Cały proces renderowania kończy się pomyślnym utworzeniem jednego pliku wideo w formacie `.MP4`.
    9. Wyjściowy plik wideo ma specyfikację 1080x1920 pikseli i 30 klatek na sekundę.
    10. Po pomyślnym zakończeniu renderowania, system udostępnia plik do pobrania dla frontendu i zwraca status sukcesu.

## 6. Metryki sukcesu

Sukces projektu MVP będzie mierzony za pomocą następujących kryteriów:

- Główne Kryterium Jakościowe:
    - Metryka: Subiektywna ocena jakości wygenerowanych filmów.
    - Cel: Filmy muszą być postrzegane przez pierwszych testowych użytkowników (np. pracowników agencji marketingowych) jako "nieodróżnialne od pracy manualnego edytora" i lepsze jakościowo od dostarczonego wideo referencyjnego.
    - Pomiar: Bezpośrednia weryfikacja i zebranie opinii od co najmniej 5 użytkowników testowych.

- Główne Kryterium Techniczne:
    - Metryka: Współczynnik pomyślnego generowania wideo.
    - Cel: Zdolność systemu do pomyślnego wygenerowania wideo zgodnie ze specyfikacją w 100% przypadków, w których dane wejściowe i usługi zewnętrzne działają poprawnie.
    - Pomiar: Logi systemowe i testy wewnętrzne polegające na wygenerowaniu 20 filmów z różnymi, poprawnymi danymi wejściowymi.

- Kryterium Wydajności:
    - Metryka: Średni czas generowania pojedynczego wideo.
    - Cel: Czas generowania powinien być radykalnie krótszy niż proces manualny, z celem poniżej 60 sekund. Należy jednak pamiętać, że priorytetem jest jakość.
    - Pomiar: Mierzenie czasu od przesłania formularza do udostępnienia linku do pobrania dla każdego testowego wywołania.

- Główny Cel Biznesowy MVP:
    - Metryka: Potwierdzenie wykonalności technicznej.
    - Cel: Potwierdzenie, że stos technologiczny (Remotion, Fal.ai, ElevenLabs) pozwala na niezawodne i zautomatyzowane tworzenie filmów o pożądanej, wysokiej jakości estetycznej.
    - Pomiar: Pomyślne dostarczenie działającego prototypu (Deliverable) oraz 5 przykładowych filmów spełniających kryterium jakościowe.