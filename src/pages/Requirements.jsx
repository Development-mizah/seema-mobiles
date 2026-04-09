import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Trash2, Pencil, ClipboardList } from 'lucide-react';

const BRANDS = ['Apple','Samsung','OnePlus','Xiaomi','Realme','Vivo','Oppo','Motorola','Nokia','Any','Other'];

const emptyForm = {
  customerName: '', phone: '', brand: '', model: '', budget: '',
  color: '', storage: '', notes: '', status: 'Pending'
};

function ReqForm({ initial = emptyForm, onSave, onClose }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Customer Name *</label>
          <input className="field" value={form.customerName} onChange={e=>set('customerName',e.target.value)} placeholder="Full name" required />
        </div>
        <div>
          <label className="field-label">Phone *</label>
          <input className="field" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="9876543210" required />
        </div>
        <div>
          <label className="field-label">Brand</label>
          <select className="field" value={form.brand} onChange={e=>set('brand',e.target.value)}>
            <option value="">Any Brand</option>
            {BRANDS.map(b=><option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Model</label>
          <input className="field" value={form.model} onChange={e=>set('model',e.target.value)} placeholder="e.g. iPhone 14" />
        </div>
        <div>
          <label className="field-label">Budget (₹)</label>
          <input className="field" value={form.budget} onChange={e=>set('budget',e.target.value)} placeholder="e.g. 50000" />
        </div>
        <div>
          <label className="field-label">Preferred Color</label>
          <input className="field" value={form.color} onChange={e=>set('color',e.target.value)} placeholder="e.g. Black" />
        </div>
        <div>
          <label className="field-label">Storage</label>
          <input className="field" value={form.storage} onChange={e=>set('storage',e.target.value)} placeholder="e.g. 128GB" />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select className="field" value={form.status} onChange={e=>set('status',e.target.value)}>
            {['Pending','In Progress','Fulfilled','Cancelled'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="field-label">Notes</label>
          <input className="field" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any specific requirements..." />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center">Save</button>
      </div>
    </form>
  );
}

const statusBadge = { Pending: 'badge-amber', 'In Progress': 'badge-blue', Fulfilled: 'badge-green', Cancelled: 'badge-red' };

export default function Requirements() {
  const items = useLiveQuery(() => db.requirements.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = items.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.customerName?.toLowerCase().includes(q) || r.phone?.includes(q) || r.brand?.toLowerCase().includes(q) || r.model?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async (form) => {
    const data = { ...form, createdAt: form.createdAt || new Date().toISOString() };
    if (editing?.id) { await db.requirements.update(editing.id, data); }
    else             { await db.requirements.add(data); }
    setShowModal(false); setEditing(null);
  };

  const counts = {
    Pending:     items.filter(r=>r.status==='Pending').length,
    'In Progress': items.filter(r=>r.status==='In Progress').length,
    Fulfilled:   items.filter(r=>r.status==='Fulfilled').length,
    Cancelled:   items.filter(r=>r.status==='Cancelled').length,
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Requirements</h1>
          <p className="text-gray-500 text-sm mt-0.5">Customer mobile requests & wishlist</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />Add Requirement
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(counts).map(([label, val]) => (
          <div key={label} className="card p-4 text-center cursor-pointer hover:border-white/15 transition-all"
            onClick={() => setFilterStatus(label === filterStatus ? 'All' : label)}>
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{val}</p>
            <span className={`badge mt-1 ${statusBadge[label]}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, brand, model..."
            className="field pl-9 py-2" />
        </div>
        <div className="flex gap-2">
          {['All','Pending','In Progress','Fulfilled','Cancelled'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
              {s}
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
                <th>Date</th><th>Customer</th><th>Phone</th><th>Brand</th>
                <th>Model</th><th>Budget</th><th>Color</th><th>Notes</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-gray-600 py-16 text-sm">No requirements found</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="tbl-row">
                  <td className="text-gray-500 text-xs whitespace-nowrap">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="text-white font-medium">{r.customerName}</td>
                  <td className="text-gray-400 text-xs">{r.phone}</td>
                  <td className="text-gray-300">{r.brand || 'Any'}</td>
                  <td className="text-gray-300">{r.model || '—'}</td>
                  <td className="text-orange-400 font-medium">{r.budget ? `₹${Number(r.budget).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="text-gray-400">{r.color || '—'}</td>
                  <td className="text-gray-600 text-xs max-w-[120px] truncate">{r.notes || '—'}</td>
                  <td><span className={`badge ${statusBadge[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditing(r); setShowModal(true); }} className="btn-edit py-1.5 px-2.5"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleting(r.id)} className="btn-danger py-1.5 px-2.5"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing?.id ? 'Edit Requirement' : 'Add Requirement'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <ReqForm initial={editing || emptyForm} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message="This requirement will be permanently deleted."
          onConfirm={async () => { await db.requirements.delete(deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
