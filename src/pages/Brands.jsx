import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Trash2, Globe, Tag } from 'lucide-react';

const GRAD = [
  'from-orange-500 to-amber-500', 'from-blue-500 to-cyan-500',
  'from-purple-500 to-violet-500', 'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',    'from-indigo-500 to-blue-600',
  'from-yellow-500 to-orange-500','from-teal-500 to-green-500',
  'from-fuchsia-500 to-purple-500',
];

export default function Brands() {
  const brands = useLiveQuery(() => db.brands.toArray(), []) ?? [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState({ name: '', country: '' });
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await db.brands.add({ ...form });
    setForm({ name: '', country: '' }); setShowForm(false);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Brands</h1>
          <p className="text-gray-500 text-sm mt-0.5">{brands.length} brands registered</p>
        </div>
        <button onClick={() => setShowForm(s=>!s)} className="btn-primary">
          <Plus className="w-4 h-4" />Add Brand
        </button>
      </div>

      {showForm && (
        <div className="card p-5 animate-fade-up" style={{ borderColor: 'rgba(234,88,12,0.2)' }}>
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>New Brand</h3>
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[160px]">
              <label className="field-label">Brand Name *</label>
              <input className="field" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Apple" required />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="field-label">Country</label>
              <input className="field" value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))} placeholder="e.g. USA" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Add</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {brands.map((brand, i) => (
          <div key={brand.id}
            className="card p-5 hover:border-white/15 transition-all group relative overflow-hidden">
            <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${GRAD[i % GRAD.length]}`} />
            <div className="relative">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${GRAD[i % GRAD.length]} flex items-center justify-center mb-4`}>
                <Tag className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-bold text-lg mb-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>{brand.name}</p>
              {brand.country && (
                <p className="text-gray-600 text-xs flex items-center gap-1">
                  <Globe className="w-3 h-3" />{brand.country}
                </p>
              )}
              <button onClick={() => setDeleting(brand.id)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleting && (
        <ConfirmDialog message="This brand will be removed from the list."
          onConfirm={async () => { await db.brands.delete(deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
