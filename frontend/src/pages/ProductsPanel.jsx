import { useState } from "react";
import { useList } from "../hooks/useList";
import { apiFetch, importProductsCsv } from "../services/api";
import { Button as Btn } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { MacroBar } from "../components/ui/MacroBar";
import { EmptyState } from "../components/ui/EmptyState";
import { FiEdit2, FiTrash2, FiPlus, FiUpload } from "react-icons/fi";

const fmt = (n) => Number(n).toFixed(1);

export default function ProductsPanel({ toast, user }) {
  const { data: products, loading, reload } = useList("/products/");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", calories_per_100g: "", protein_per_100g: "", fat_per_100g: "", carbs_per_100g: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importMessage, setImportMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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
        toast("Product added", "success");
      } else {
        await apiFetch(`/products/${modal.id}/`, { method: "PUT", body: JSON.stringify(form) });
        toast("Product updated", "success");
      }
      setModal(null); reload();
    } catch (e) { toast("Error: " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try {
      await apiFetch(`/products/${id}/`, { method: "DELETE" });
      toast("Product deleted", "success"); reload();
    } catch { toast("Error when trying to delete", "error"); }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setIsImporting(true);
    try {
        const result = await importProductsCsv(importFile);
        setImportMessage(`Success! Added: ${result.created}, Skipper: ${result.skipped}, Errors: ${result.errors.length}`);
        setImportFile(null);
        toast("Import completed successfully!", "success");
        reload();
    } catch (err) {
        setImportMessage(err.response?.data?.detail || "An error occurred during import.");
        toast("Import failed", "error");
    } finally {
        setIsImporting(false);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-16 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Products</h2>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{products.length} product registered</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'DIETITIAN' && (
            <Btn variant="secondary" onClick={() => setIsImportModalOpen(true)}>
              <FiUpload /> Import CSV
            </Btn>
          )}
          <Btn onClick={openAdd}><FiPlus /> Add product</Btn>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Find product…"
          className="w-full box-border pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
          style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }}
          onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />
      </div>

      {/* Product List */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="🥗" title="No products yet" sub="Add the first product now." action={<Btn onClick={openAdd}>Add new</Btn>} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <Card key={p.id} hover>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>{p.name}</div>
                  <div className="mt-1.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg font-mono" style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                      {fmt(p.calories_per_100g)} kcal / 100g
                    </span>
                  </div>
                </div>
                {p.author === user?.id && (
                  <div className="flex gap-1.5 shrink-0">
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(p)}><FiEdit2 /></Btn>
                    <Btn variant="ghost" size="sm" onClick={() => remove(p.id)}><FiTrash2 /></Btn>
                  </div>
                )}
                
              </div>
              <MacroBar protein={p.protein_per_100g} fat={p.fat_per_100g} carbs={p.carbs_per_100g} />
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {modal && (
        <Modal title={modal === "add" ? "New produkct" : "Edit product"} onClose={() => setModal(null)}>
          <div className="grid gap-4">
            <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
            <Input label="Calories (kcal / 100g)" type="number" value={form.calories_per_100g} onChange={v => setForm(f => ({ ...f, calories_per_100g: v }))} min="0" step="0.01" required />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Protein (g)" type="number" value={form.protein_per_100g} onChange={v => setForm(f => ({ ...f, protein_per_100g: v }))} min="0" step="0.01" />
              <Input label="Fat (g)" type="number" value={form.fat_per_100g} onChange={v => setForm(f => ({ ...f, fat_per_100g: v }))} min="0" step="0.01" />
              <Input label="Carbs (g)" type="number" value={form.carbs_per_100g} onChange={v => setForm(f => ({ ...f, carbs_per_100g: v }))} min="0" step="0.01" />
            </div>
            {(form.protein_per_100g || form.fat_per_100g || form.carbs_per_100g) ? (
              <div className="p-4 rounded-xl" style={{ background: 'var(--color-background)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Macros</div>
                <MacroBar protein={form.protein_per_100g || 0} fat={form.fat_per_100g || 0} carbs={form.carbs_per_100g || 0} calories={form.calories_per_100g || 0} />
              </div>
            ) : null}
            <div className="flex gap-2.5 justify-end mt-1">
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Saving" : "Save"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <Modal
            isOpen={isImportModalOpen}
            onClose={() => {
                setIsImportModalOpen(false);
                setImportMessage('');
                setImportFile(null);
            }}
            title="Import products from CSV"
        >
            <form onSubmit={handleImportSubmit} className="space-y-4">
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                        Choose CSV file
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setImportFile(e.target.files[0])}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        style={{ color: 'var(--color-text-muted)' }}
                    />
                </div>

                {importMessage && (
                    <div className="p-3 rounded-lg text-sm mt-3" style={{ background: 'var(--color-accent-xlight)', color: 'var(--color-accent)' }}>
                        {importMessage}
                    </div>
                )}

                <div className="flex gap-2.5 justify-end mt-6">
                    <Btn type="button" variant="secondary" onClick={() => {
                        setIsImportModalOpen(false);
                        setImportMessage('');
                        setImportFile(null);
                    }}>
                        Cancel
                    </Btn>
                    <Btn type="submit" disabled={!importFile || isImporting}>
                        {isImporting ? "Importing..." : "Start import"}
                    </Btn>
                </div>
            </form>
        </Modal>
      )}
    </div>
  );
}