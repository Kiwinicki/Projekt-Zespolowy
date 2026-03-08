# Projekt-Zespolowy

To jest moduł służący do wizualnego projektowania szablonów raportów, który integruje się z naszą bazą danych.  
Umożliwia tworzenie układów PDF (tekst, obrazy, kody QR) i zapisywanie ich struktury w formacie JSON.

---

# Co zostało zrobione?

## Frontend (React)

- Integracja z biblioteką **pdfme** (wizualny Designer).
- Mechanizm przesyłania gotowego schematu JSON do API.
- Obsługa dynamicznej nazwy raportu.

## Backend (.NET 8)

- Konfiguracja połączenia z bazą **PostgreSQL** przez **EF Core**.
- Stworzenie modelu `ReportTemplate` z obsługą typu **JSONB** (dla elastyczności szablonów).
- Endpointy API do pobierania i zapisywania szablonów.
- Skonfigurowana polityka **CORS** dla lokalnego środowiska deweloperskiego.

## Baza Danych (PostgreSQL)

Tabela `ReportTemplates` przechowująca nazwy i pełne schematy projektów.

---

# Instrukcja uruchomienia 

## 1. Wymagania systemowe

- **Node.js** (wersja 18+)
- **.NET 8 SDK**
- **PostgreSQL**

---

## 2. Konfiguracja Bazy Danych

1. Otwórz **pgAdmin 4** (lub inne narzędzie SQL).
2. Stwórz nową bazę danych o nazwie:

```
PdfReportsDb
```

3. Przejdź do pliku:

```
RaportApp/RaportApp/appsettings.json
```

4. W sekcji `ConnectionStrings` wpisz swoje hasło do PostgreSQL:

```json
"DefaultConnection": "Host=localhost;Port=5432;Database=PdfReportsDb;Username=postgres;Password=TWOJE_HASLO"
```

---

## 3. Uruchomienie Backend-u (.NET)

1. Otwórz rozwiązanie w **Visual Studio** (`.slnx` lub `.sln` w folderze `RaportApp`).

2. Otwórz **Package Manager Console** i wpisz:

```powershell
Update-Database
```

(To stworzy niezbędne tabele w Twojej bazie danych).

3. Uruchom projekt (`F5`).

API powinno wystartować na porcie:

```
http://localhost:5000
```

---

## 4. Uruchomienie Frontendu (React)

1. Otwórz terminal w folderze:

```
raport-frontend
```

2. Zainstaluj biblioteki:

```bash
npm install
```

3. Uruchom aplikację:

```bash
npm run dev
```

4. Otwórz adres wskazany w terminalu (prawdopodobnie):

```
http://localhost:5173
```

lub

```
http://localhost:5174
```

---

# Uwagi do rozwoju

- Szablony są zapisywane jako obiekty **JSON** w kolumnie `SchemaContent`.
- Obecnie edytor startuje z **pustą stroną A4**.
- Porty są ustawione na:
  - Backend → `5000`
  - Frontend → `5174`

Jeśli React uruchomi się na innym porcie, pamiętaj o sprawdzeniu ustawień **CORS w `Program.cs`**.

---


### Aktualizacja Projektu: Wprowadzenie Realnych Danych i Generatora

Ostatnie zmiany skupiły się na pełnej integracji przepływu danych:  
**od bazy PostgreSQL → przez API → aż po gotowy plik PDF.**

---

### 1. Rozbudowa Bazy Danych (Backend)

- **Nowy Model `Client`**  
  Dodano tabelę klientów w PostgreSQL:
  - `Id`
  - `Name`
  - `City`
  - `Email`

- **Seed Data**  
  Skonfigurowano automatyczne dodawanie startowych danych przy inicjalizacji bazy (np. `Orlen`, `Budimex`).

- **`DataController`**  
  Zastąpiono sztuczne dane w kodzie realnym połączeniem z bazą danych przy użyciu **Entity Framework Core**.

---

### 2. Nowy Moduł: Generator PDF (Frontend)

- **Data Binding (Wiązanie danych)**  
  Zaimplementowano mechanizm automatycznego wstrzykiwania danych z bazy do szablonu PDF na podstawie kluczy
- **Obsługa `@pdfme/generator`**  
Dodano bibliotekę umożliwiającą generowanie finalnych plików **PDF bezpośrednio w przeglądarce użytkownika**.

- **Ręczne Uwagi (`extraNotes`)**  
Dodano pole `textarea`, które pozwala użytkownikowi dopisać własne notatki.  
Treść jest również automatycznie dodawana do generowanego raportu PDF.

---

### 3. Ulepszony Interfejs (UX)

- **System Zakładek (Tabs)**  
Aplikacja została podzielona na dwie główne sekcje:

- **PROJEKTOWANIE**  
  Panel dla administratora do tworzenia i edycji szablonów PDF.

- **GENEROWANIE**  
  Panel dla użytkownika do:
  - wybierania szablonu
  - wypełniania danych
  - generowania i pobierania pliku PDF.

- **Automatyczne Odświeżanie**  
Po zapisaniu nowego szablonu lista w generatorze aktualizuje się automatycznie **bez przeładowywania strony**.

---

### 4. Poprawki Techniczne

- **Synchronizacja Typów**  
Naprawiono różnice w konwencjach nazewnictwa między `.NET` a `React`:
- `camelCase`
- `PascalCase`

- **Stabilizacja `pdfme`**  
Wyeliminowano błąd `Invalid argument` poprzez:
- zastosowanie bazowego pliku **Blank PDF**
- usunięcie `StrictMode`, który powodował podwójne renderowanie edytora.

- **Optymalizacja API**
- dodano obsługę błędów JSON
- wprowadzono zabezpieczenia na wypadek pustej bazy danych