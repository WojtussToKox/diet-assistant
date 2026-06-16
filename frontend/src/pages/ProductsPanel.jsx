import { useState } from "react";
import { useList } from "../hooks/useList";
import { apiFetch } from "../services/api";
import { Button as Btn } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { MacroBar } from "../components/ui/MacroBar";
import { EmptyState } from "../components/ui/EmptyState";

const fmt = (n) => Number(n).toFixed(1);

export default function ProductsPanel({ toast }) {
  const { data: products, loading, reload } = useList("/products/");
  const [modal, setModal] = useState(null); 
  const [form, setForm] = useState({ name: "", calories_per_100g: "", protein_per_100g: "", fat_per_100g: "", carbs_per_100g: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const openAdd = () => {
    setForm({ name: "", calories_per_100g: "", protein_per_100g: "", fat_per_100g: "", carbs_per_100g: "" });
    setModal("add");
  };

  const openEdit = (p) => {
    setForm({ name: p.name, calories_per_100g: p.calories_per_100g, protein_per_100g: p.protein_per_100g, fat_per_100g: p.fat_per_100g, carbs_per_100g: p.carbs_per_100g });
    setModal(p);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === "add") {
        await apiFetch("/products/", { method: "POST", body: JSON.stringify(form) });
        toast("Produkt dodany", "success");
      } else {
        await apiFetch(`/products/${modal.id}/`, { method: "PUT", body: JSON.stringify(form) });
        toast("Produkt zaktualizowany", "success");
      }
      setModal(null); reload();
    } catch (e) {
      toast("Błąd zapisu: " + e.message, "error");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Usunąć ten produkt?")) return;
    try {
      await apiFetch(`/products/${id}/`, { method: "DELETE" });
      toast("Produkt usunięty", "success"); reload();
    } catch { toast("Błąd usuwania", "error"); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="m-0 text-2xl font-bold text-text">Produkty</h2>
          <p className="m-0 mt-1 text-text-muted text-sm">{products.length} produktów w bazie</p>
        </div>
        <Btn onClick={openAdd}>＋ Dodaj produkt</Btn>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  Szukaj produktu…"
        className="w-full box-border mb-5 px-4 py-2.5 text-sm rounded-xl border-[1.5px] border-border bg-surface text-text font-inherit outline-none focus:border-accent transition-colors"
      />

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="🥗" title="Brak produktów" sub="Dodaj pierwszy produkt żywieniowy do bazy." action={<Btn onClick={openAdd}>Dodaj produkt</Btn>} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <Card key={p.id} hover>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-bold text-base text-text">{p.name}</div>
                  <div className="mt-1">
                    <Badge variant="macro">{fmt(p.calories_per_100g)} kcal/100g</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" size="sm" onClick={() => openEdit(p)}>✏️ Edytuj</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => remove(p.id)}>🗑️</Btn>
                </div>
              </div>
              <MacroBar protein={p.protein_per_100g} fat={p.fat_per_100g} carbs={p.carbs_per_100g} />
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? "Nowy produkt" : "Edytuj produkt"} onClose={() => setModal(null)}>
          <div className="grid gap-3.5">
            <Input label="Nazwa" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required placeholder="np. Kurczak pierś" />
            <Input label="Kalorie (kcal/100g)" type="number" value={form.calories_per_100g} onChange={v => setForm(f => ({ ...f, calories_per_100g: v }))} min="0" step="0.01" required />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Białko (g)" type="number" value={form.protein_per_100g} onChange={v => setForm(f => ({ ...f, protein_per_100g: v }))} min="0" step="0.01" />
              <Input label="Tłuszcz (g)" type="number" value={form.fat_per_100g} onChange={v => setForm(f => ({ ...f, fat_per_100g: v }))} min="0" step="0.01" />
              <Input label="Węglowodany (g)" type="number" value={form.carbs_per_100g} onChange={v => setForm(f => ({ ...f, carbs_per_100g: v }))} min="0" step="0.01" />
            </div>
            {form.protein_per_100g || form.fat_per_100g || form.carbs_per_100g ? (
              <div className="p-3 bg-background rounded-lg">
                <div className="text-xs text-text-muted mb-2">Podgląd makroskładników</div>
                <MacroBar protein={form.protein_per_100g || 0} fat={form.fat_per_100g || 0} carbs={form.carbs_per_100g || 0} calories={form.calories_per_100g || 0} />
              </div>
            ) : null}
            <div className="flex gap-2.5 justify-end mt-1">
              <Btn variant="secondary" onClick={() => setModal(null)}>Anuluj</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}