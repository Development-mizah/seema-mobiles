import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Trash2, Pencil, Filter } from 'lucide-react';

const CATS = ['Case','Charger','Earphones','Screen Guard','Cable','Power Bank','Stand','Battery','Speaker','Other'];

const emptyForm = {
  name: '', brand: '', category: '', compatibility: '',
  purchasePrice: '', sellingPrice: '', stock: '1', status: 'Available', notes: ''
};

function AccForm({ initial = emptyForm, onSave, onClose }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, purchasePrice: Number(form.purchasePrice)||0, sellingPrice: Number(form.sellingPrice)||0, stock: Number(form.stock)||0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="field-label">Name *</label>
          <input className="field" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. iPhone 15 Clear Case" required />
        </div>
        <div>
          <label className="field-label">Brand</label>
          <input className="field" value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="e.g. Apple" />
        </div>
        <div>
          <label className="field-label">Category</label>
          <select className="field" value={form.category} onChange={e=>set('category',e.target.value)}>
            <option value="">Select Category</option>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Compatibility</label>
          <input className="field" value={form.compatibility} onChange={e=>set('compatibility',e.target.value)} placeholder="e.g. Universal / iPhone 15" />
        </div>
        <div>
          <label className="field-label">Stock *</label>
          <input type="number" className="field" value={form.stock} onChange={e=>set('stock',e.target.value)} min="0" required />
        </div>
        <div>
          <label className="field-label">Purchase Price (₹)</label>
          <input type="number" className="field" value={form.purchasePrice} onChange={e=>set('purchasePrice',e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="field-label">Selling Price (₹) *</label>
          <input type="number" className="field" value={form.sellingPrice} onChange={e=>set('sellingPrice',e.target.value)} placeholder="0" required />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select className="field" value={form.status} onChange={e=>set('status',e.target.value)}>
            {['Available','Low Stock','Out of Stock'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="field-label">Notes</label>
          <input className="field" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any extra info..." />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center">Save</button>
      </div>
    </form>
  );
}

const catColor = {
  Case: 'badge-purple', Charger: 'badge-amber', Earphones: 'badge-blue',
  'Screen Guard': 'badge-green', Cable: 'badge-red', 'Power Bank': 'badge-amber',
  Stand: 'badge-gray', Battery: 'badge-blue', Speaker: 'badge-purple', Other: 'badge-gray'
};

export default function Accessories() {
  const items = useLiveQuery(() => db.accessories.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = items.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name?.toLowerCase().includes(q) || a.brand?.toLowerCase().includes(q);
    const matchCat    = filterCat === 'All' || a.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalVal = filtered.reduce((s,a)=>s+(a.sellingPrice*a.stock),0);

  const handleSave = async (form) => {
    const data = { ...form, createdAt: form.createdAt || new Date().toISOString() };
    if (editing?.id) { await db.accessories.update(editing.id, data); }
    else             { await db.accessories.add(data); }
    setShowModal(false); setEditing(null);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Accessories</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} items · {filtered.reduce((s,a)=>s+a.stock,0)} units · ₹{totalVal.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />Add Accessory
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, brand..."
            className="field pl-9 py-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All',...CATS].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat===c ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="tbl-head">
              <tr>
                <th>Name</th><th>Brand</th><th>Category</th><th>Compatibility</th>
                <th>Purchase ₹</th><th>Selling ₹</th><th>Stock</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-600 py-16 text-sm">No accessories found</td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className="tbl-row">
                  <td className="text-white font-medium">{a.name}</td>
                  <td className="text-gray-400">{a.brand || '—'}</td>
                  <td><span className={`badge ${catColor[a.category] || 'badge-gray'}`}>{a.category || '—'}</span></td>
                  <td className="text-gray-500 text-xs">{a.compatibility || '—'}</td>
                  <td className="text-gray-400">₹{(a.purchasePrice||0).toLocaleString('en-IN')}</td>
                  <td className="text-orange-400 font-semibold">₹{(a.sellingPrice||0).toLocaleString('en-IN')}</td>
                  <td><span className={`font-bold ${a.stock<=3?'text-amber-400':'text-white'}`}>{a.stock}</span></td>
                  <td><span className={`badge ${a.status==='Available'?'badge-green':a.status==='Low Stock'?'badge-amber':'badge-red'}`}>{a.status}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditing(a); setShowModal(true); }} className="btn-edit py-1.5 px-2.5"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleting(a.id)} className="btn-danger py-1.5 px-2.5"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing?.id ? 'Edit Accessory' : 'Add Accessory'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <AccForm initial={editing || emptyForm} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message="This accessory will be permanently deleted."
          onConfirm={async () => { await db.accessories.delete(deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
