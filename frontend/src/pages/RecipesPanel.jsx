import { useState } from "react";
import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Button as Btn } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { MacroBar } from "../components/ui/MacroBar";
import { EmptyState } from "../components/ui/EmptyState";

export default function RecipesPanel({ toast }) {
  const { data: recipes, loading, reload } = useList("/recipes/");
  const { data: products } = useList("/products/");
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", ingredients: [] });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const openAdd = () => { setForm({ name: "", description: "", ingredients: [] }); setModal("add"); };

  const openEdit = async (r) => {
    try {
      const d = await apiFetch(`/recipes/${r.id}/`);
      setForm({ name: d.name, description: d.description, ingredients: d.ingredients.map(i => ({ product: String(i.product), weight_in_grams: String(i.weight_in_grams) })) });
      setModal(d);
    } catch { toast("Błąd ładowania", "error"); }
  };

  const openDetail = async (r) => {
    try { const d = await apiFetch(`/recipes/${r.id}/`); setDetail(d); }
    catch { toast("Błąd ładowania", "error"); }
  };

  const calcNutrition = (ingredients) => {
    let cal = 0, pro = 0, fat = 0, carb = 0;
    ingredients.forEach(ing => {
      const prod = products.find(p => String(p.id) === String(ing.product));
      if (!prod) return;
      const w = Number(ing.weight_in_grams) / 100;
      cal += Number(prod.calories_per_100g) * w; pro += Number(prod.protein_per_100g) * w;
      fat += Number(prod.fat_per_100g) * w; carb += Number(prod.carbs_per_100g) * w;
    });
    return { cal, pro, fat, carb };
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, ingredients: form.ingredients.map(i => ({ product: Number(i.product), weight_in_grams: Number(i.weight_in_grams) })) };
      if (modal === "add") {
        await apiFetch("/recipes/", { method: "POST", body: JSON.stringify(payload) });
        toast("Przepis dodany", "success");
      } else {
        await apiFetch(`/recipes/${modal.id}/`, { method: "PUT", body: JSON.stringify(payload) });
        toast("Przepis zaktualizowany", "success");
      }
      setModal(null); reload();
    } catch (e) { toast("Błąd: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Usunąć przepis?")) return;
    try { await apiFetch(`/recipes/${id}/`, { method: "DELETE" }); toast("Przepis usunięty", "success"); reload(); }
    catch { toast("Błąd usuwania", "error"); }
  };

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { product: "", weight_in_grams: "" }] }));
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  const updateIngredient = (i, field, val) => setForm(f => { const ing = [...f.ingredients]; ing[i] = { ...ing[i], [field]: val }; return { ...f, ingredients: ing }; });

  const filtered = recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-16 animate-fadeUp">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Przepisy</h2>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{recipes.length} przepisów</p>
        </div>
        <Btn onClick={openAdd}>＋ Nowy przepis</Btn>
      </div>

      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj przepisu…"
          className="w-full box-border pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
          style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
          onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="🍽️" title="Brak przepisów" sub="Stwórz pierwszy przepis z produktów." action={<Btn onClick={openAdd}>Dodaj przepis</Btn>} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <Card key={r.id} hover onClick={() => openDetail(r)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>{r.name}</div>
                  {r.description && <div className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{r.description.slice(0, 120)}{r.description.length > 120 ? "…" : ""}</div>}
                </div>
                <div className="flex gap-1.5 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
                  <Btn variant="ghost" size="sm" onClick={() => openEdit(r)}>✏️</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => remove(r.id)}>🗑️</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)} width="max-w-[600px]">
          {detail.description && <p className="text-sm mt-0 mb-4" style={{ color: 'var(--color-text-muted)' }}>{detail.description}</p>}
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Składniki</h4>
          <div className="grid gap-1.5 mb-5">
            {(detail.ingredients || []).map((ing, i) => (
              <div key={i} className="flex justify-between py-2.5 px-4 rounded-xl text-sm" style={{ background: 'var(--color-background)' }}>
                <span style={{ color: 'var(--color-text)' }}>{ing.product_name}</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--color-accent)' }}>{ing.weight_in_grams}g</span>
              </div>
            ))}
          </div>
          {(() => {
            const n = calcNutrition(detail.ingredients || []);
            return (
              <div className="p-4 rounded-xl" style={{ background: 'var(--color-background)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Wartości odżywcze (cały przepis)</div>
                <MacroBar protein={n.pro} fat={n.fat} carbs={n.carb} calories={n.cal} />
              </div>
            );
          })()}
          <div className="mt-4 flex justify-end">
            <Btn variant="secondary" onClick={() => { setDetail(null); openEdit(detail); }}>✏️ Edytuj przepis</Btn>
          </div>
        </Modal>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <Modal title={modal === "add" ? "Nowy przepis" : "Edytuj przepis"} onClose={() => setModal(null)} width="max-w-[640px]">
          <div className="grid gap-4">
            <Input label="Nazwa przepisu" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required placeholder="np. Owsianka z owocami" />
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Opis / sposób przygotowania</span>
              <textarea
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Opcjonalny opis przepisu…" rows={3}
                className="w-full box-border px-4 py-3 text-sm rounded-xl outline-none resize-y transition-all"
                style={{ background: 'var(--color-background)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </label>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Składniki</span>
                <Btn variant="secondary" size="sm" onClick={addIngredient}>＋ Dodaj</Btn>
              </div>
              {form.ingredients.length === 0 && (
                <div className="p-5 text-center text-sm rounded-xl" style={{ background: 'var(--color-background)', color: 'var(--color-text-muted)' }}>
                  Brak składników — dodaj pierwszy.
                </div>
              )}
              <div className="grid gap-2">
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="grid grid-cols-[1fr_120px_36px] gap-2 items-center">
                    <Select value={ing.product} onChange={v => updateIngredient(i, "product", v)} options={products.map(p => ({ value: String(p.id), label: p.name }))} placeholder="Wybierz produkt" />
                    <div className="relative">
                      <input type="number" value={ing.weight_in_grams} onChange={e => updateIngredient(i, "weight_in_grams", e.target.value)} placeholder="100" min="1"
                        className="w-full box-border py-2.5 pl-3 pr-8 text-sm rounded-xl outline-none transition-all"
                        style={{ background: 'var(--color-background)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>g</span>
                    </div>
                    <button onClick={() => removeIngredient(i)} className="w-9 h-9 rounded-xl border-0 cursor-pointer flex items-center justify-center text-base"
                      style={{ background: '#FEF2F2', color: '#EF4444' }}>✕</button>
                  </div>
                ))}
              </div>
              {form.ingredients.length > 0 && (() => {
                const n = calcNutrition(form.ingredients);
                return (
                  <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--color-background)' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Podgląd wartości odżywczych</div>
                    <MacroBar protein={n.pro} fat={n.fat} carbs={n.carb} calories={n.cal} />
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-2.5 justify-end mt-1">
              <Btn variant="secondary" onClick={() => setModal(null)}>Anuluj</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz przepis"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}