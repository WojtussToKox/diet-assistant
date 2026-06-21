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

  // Error handling (e.g. 400, 401, 500)
  if (!res.ok) {
    if (res.status === 401) {
      console.warn("No authorization or token expired.");
    }

    const errText = await res.text();
    let err = {};
    try {
      err = errText ? JSON.parse(errText) : {};
    } catch (e) {
      console.warn("Nie udało się sparsować błędu JSON:", errText);
    }

    throw Object.assign(new Error(res.statusText || `HTTP Error ${res.status}`), { status: res.status, data: err });
  }

  // 204 No Content 
  if (res.status === 204) return null;

  const text = await res.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn("The server returned success, but the response is not valid JSON:", text);
    return null;
  }
}

// Option to import products from a CSV file
export const importProductsCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_BASE}/products/import_csv/`, {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    let detailMessage = "A server error occurred during import.";
    try {
      const errData = JSON.parse(errText);
      detailMessage = errData.detail || detailMessage;
    } catch (e) {}

    throw { response: { data: { detail: detailMessage } } };
  }

  return res.json();
};

// Shopping list export option
export const exportShoppingListCsv = async (planId) => {
    const token = localStorage.getItem("access_token");
const res = await fetch(`${API_BASE}/diet-plans/${planId}/export-shopping-list/`, {        method: "GET",
        headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to export shopping list");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping_list_plan_${planId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};