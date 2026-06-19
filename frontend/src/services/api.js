export const API_BASE = "http://localhost:8000/api";

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...opts.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  // Obsługa błędów (np. 400, 401, 500)
  if (!res.ok) {
    if (res.status === 401) {
      console.warn("Brak autoryzacji lub token wygasł.");
    }

    // Pobieramy błąd jako tekst (bezpieczniejsze przy błędach z serwera np. stronach HTML)
    const errText = await res.text();
    let err = {};
    try {
      err = errText ? JSON.parse(errText) : {};
    } catch (e) {
      console.warn("Nie udało się sparsować błędu JSON:", errText);
    }

    throw Object.assign(new Error(res.statusText || `HTTP Error ${res.status}`), { status: res.status, data: err });
  }

  // 204 No Content (zazwyczaj przy DELETE)
  if (res.status === 204) return null;

  // --- KRYTYCZNA POPRAWKA PONIŻEJ ---
  // Odczytujemy odpowiedź jako czysty tekst. 
  // Zapobiega to błędowi "Unexpected end of JSON input" w przypadku pustej odpowiedzi (np. przy POST)
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn("Serwer zwrócił sukces, ale odpowiedź nie jest poprawnym JSON-em:", text);
    return null;
  }
}