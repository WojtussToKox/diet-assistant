# DietAsystent - Webowy system zarządzania dietą
Projekt semestralny z przedmiotu Języki skryptowe (Python).

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
