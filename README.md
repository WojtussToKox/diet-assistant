# DietAsystent - Webowy system zarządzania dietą
Projekt semestralny z przedmiotu Języki skryptowe (Python).
###  Zarządzanie Użytkownikami i Relacjami
* **Trzy dedykowane role:** Dietetyk (`DIETITIAN`), Pacjent (`PATIENT`) oraz Użytkownik Standardowy (`STANDARD`). Nowo zarejestrowany użytkownik zaczyna z rolą standardową.
* **System Zaproszeń:** Użytkownicy mogą wyszukiwać dietetyków i wysyłać do nich prośby o nawiązanie współpracy (wspierane statusy: *Oczekujące*, *Zaakceptowane*, *Odrzucone*).
* **Dane Fizyczne:** System przechowuje i waliduje parametry niezbędne do ułożenia diety.

###  Baza Produktów i Przepisów (Dla Dietetyków)
* **Zarządzanie produktami:** Precyzyjne śledzenie wartości odżywczych (kalorie, białko, tłuszcze, węglowodany) standaryzowane na 100g produktu.
* **Produkty autorskie:** Dietetycy mogą dodawać własne pozycje do bazy, ułatwiając układanie wyspecjalizowanych diet.
* **Kreator Przepisów:** Budowanie pełnych potraw poprzez łączenie wielu produktów z konkretną gramaturą, wraz z instrukcją przygotowania.

###  Plany Dietetyczne i Harmonogramy
* **Szablony i Plany Spersonalizowane:** Tworzenie planów z określonym dziennym celem kalorycznym (np. "Redukcja 2200 kcal"). Plan może zostać bezpośrednio przypisany do pacjenta jako jego dieta aktywna.
* **Jadłospis Dzienny (Daily Menu):** Szczegółowe planowanie posiłków (Śniadanie, II Śniadanie, Obiad, Podwieczorek, Kolacja) na 7 dni tygodnia.
* **Elastyczność Pozycji:** Backend dba o spójność danych, pozwalając zaplanować na dany posiłek albo gotowy wieloskładnikowy *Przepis*, albo bezpośrednio wrzucić pojedynczy *Produkt* z określoną wagą (idealne dla szybkich przekąsek).

###  Dziennik Spożycia (Meal Log) dla Pacjentów
* **Monitorowanie Spożycia:** Każdy pacjent ma dostęp do własnego dziennika, w którym odznacza zjedzone posiłki dla konkretnych dni.
* **Luźne Logowanie:** Możliwość samodzielnego dodawania zjedzonych produktów spoza diety ułożonej przez dietetyka, co pozwala zachować stuprocentową uczciwość w liczeniu kalorii.

---

##  Tech Stack

**Backend:**
* [Python 3](https://www.python.org/) + [Django](https://www.djangoproject.com/)
* [Django REST Framework (DRF)](https://www.django-rest-framework.org/) dla API
* Zarządzanie zależnościami: `uv` / `pyproject.toml`
* Baza danych: SQLite (gotowa do łatwej migracji na PostgreSQL)

**Frontend:**
* [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
* [Tailwind CSS](https://tailwindcss.com/) dla responsywnego stylowania
* Niestandardowe komponenty UI (Dashboardy dla dietetyków i pacjentów)
## Wymagania wstępne

1. Zainstaluj `uv` (jeśli jeszcze go nie masz):
   - **macOS/Linux:** `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - **Windows (PowerShell):** `irm https://astral.sh/uv/install.ps1 | iex`

## Uruchomienie projektu lokalnie

Wykonaj poniższe kroki w terminalu, aby sklonować i uruchomić projekt:

### 1. Klonowanie repozytorium
```bash
git clone https://github.com/WojtussToKox/diet-assistant.git
cd diet-assistant
```
### 2. Pobieranie zależności
```bash
uv sync
```

### 3. Dokonaj migracji bazy danych SQLite (przy pierwszym uruchomieniu oraz jeśli były zmiany w strukturze bazy danych)
```bash
uv run manage.py migrate 
```

### 4. Utwórz konto administratora (opcjonalnie)
```bash
uv run manage.py createsuperuser
```

### 5. Uruchom projekt
```bash
uv run manage.py runserver
```

### 6. Konfiguracja Frontendu (react)
```bash
cd frontend
```
### 7. Pobieranie zależności
```bash
npm install
```

### 8. Uruchom serwer Vite
```bash
npm run dev
```
### Aplikacja kliencka otworzy się domyślnie pod adresem: http://localhost:5173/.

## Praca z projektem (dla deweloperów)
Jeśli wprowadzasz zmiany w kodzie i strukturze bazy danych, używaj poniższych komend:

### Tworzenie nowych migracji (po zmianie modeli w models.py):
```bash
uv run manage.py makemigrations
```

### Aplikowanie nowych migracji do bazy:
```bash
uv run manage.py migrate
```

### Dodawanie nowej biblioteki do projektu:
```bash
uv add nazwa_biblioteki
```

### Dokumentacja tekstowa API

```bash
http://[IP aplikacji]:[Port aplikacji]/api/schema
```
Dla localhost
```bash
http://127.0.0.1:8000/api/schema/
```

### Dokumentacja graficza API
```bash
http://[IP aplikacji]:[Port aplikacji]/api/schema/swagger-ui/
```
Dla localhost
```bash
http://127.0.0.1:8000/api/schema/swagger-ui/
```
