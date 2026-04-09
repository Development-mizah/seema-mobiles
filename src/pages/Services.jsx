import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Trash2, Pencil, Wrench } from 'lucide-react';

const emptyForm = {
  customerName: '', phone: '', deviceName: '', issue: '',
  advance: '', estimatedCost: '', deliveryDate: '', notes: '', status: 'Received'
};

function ServiceForm({ initial = emptyForm, onSave, onClose }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      advance: Number(form.advance) || 0,
      estimatedCost: Number(form.estimatedCost) || 0,
    });
  };

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
        <div className="col-span-2">
          <label className="field-label">Device Name *</label>
          <input className="field" value={form.deviceName} onChange={e=>set('deviceName',e.target.value)} placeholder="e.g. iPhone 12, Samsung A54" required />
        </div>
        <div className="col-span-2">
          <label className="field-label">Issue / Problem *</label>
          <input className="field" value={form.issue} onChange={e=>set('issue',e.target.value)} placeholder="e.g. Screen cracked, battery drain..." required />
        </div>
        <div>
          <label className="field-label">Advance Paid (₹)</label>
          <input type="number" className="field" value={form.advance} onChange={e=>set('advance',e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="field-label">Estimated Cost (₹)</label>
          <input type="number" className="field" value={form.estimatedCost} onChange={e=>set('estimatedCost',e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="field-label">Expected Delivery</label>
          <input type="date" className="field" value={form.deliveryDate} onChange={e=>set('deliveryDate',e.target.value)} />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select className="field" value={form.status} onChange={e=>set('status',e.target.value)}>
            {['Received','Diagnosed','In Progress','Waiting for Parts','Completed','Delivered','Cancelled'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="field-label">Notes</label>
          <input className="field" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Internal notes..." />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center">Save</button>
      </div>
    </form>
  );
}

const statusBadge = {
  Received: 'badge-gray', Diagnosed: 'badge-blue', 'In Progress': 'badge-amber',
  'Waiting for Parts': 'badge-purple', Completed: 'badge-green', Delivered: 'badge-green', Cancelled: 'badge-red'
};

export default function Services() {
  const items = useLiveQuery(() => db.services.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = items.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.customerName?.toLowerCase().includes(q) || s.phone?.includes(q) || s.deviceName?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async (form) => {
    const data = { ...form, createdAt: form.createdAt || new Date().toISOString() };
    if (editing?.id) { await db.services.update(editing.id, data); }
    else             { await db.services.add(data); }
    setShowModal(false); setEditing(null);
  };

  const totalRevenue   = items.filter(s=>s.status==='Completed'||s.status==='Delivered').reduce((s,i)=>s+(i.estimatedCost||0),0);
  const totalAdvance   = items.reduce((s,i) => s+(i.advance||0), 0);
  const pending        = items.filter(s => s.status !== 'Completed' && s.status !== 'Delivered' && s.status !== 'Cancelled').length;

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Services</h1>
          <p className="text-gray-500 text-sm mt-0.5">Repair & service job tracking</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />New Service Job
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Jobs',   value: pending,                                         color: '#f59e0b' },
          { label: 'Service Revenue',value: `₹${totalRevenue.toLocaleString('en-IN')}`,       color: '#10b981' },
          { label: 'Advance Collected', value: `₹${totalAdvance.toLocaleString('en-IN')}`,   color: '#ea580c' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color }}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, device..."
            className="field pl-9 py-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All','Received','In Progress','Waiting for Parts','Completed','Delivered','Cancelled'].map(s => (
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
                <th>Date</th><th>Customer</th><th>Phone</th><th>Device</th>
                <th>Issue</th><th>Advance</th><th>Est. Cost</th><th>Balance</th><th>Delivery</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="text-center text-gray-600 py-16 text-sm">No service jobs found</td></tr>
              )}
              {filtered.map(s => {
                const balance = (s.estimatedCost || 0) - (s.advance || 0);
                return (
                  <tr key={s.id} className="tbl-row">
                    <td className="text-gray-500 text-xs whitespace-nowrap">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="text-white font-medium">{s.customerName}</td>
                    <td className="text-gray-400 text-xs">{s.phone}</td>
                    <td className="text-gray-200">{s.deviceName}</td>
                    <td className="text-gray-400 text-xs max-w-[140px] truncate">{s.issue}</td>
                    <td className="text-blue-400">₹{(s.advance||0).toLocaleString('en-IN')}</td>
                    <td className="text-orange-400">₹{(s.estimatedCost||0).toLocaleString('en-IN')}</td>
                    <td className={balance > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                      ₹{balance.toLocaleString('en-IN')}
                    </td>
                    <td className="text-gray-500 text-xs">{s.deliveryDate || '—'}</td>
                    <td><span className={`badge ${statusBadge[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditing(s); setShowModal(true); }} className="btn-edit py-1.5 px-2.5"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleting(s.id)} className="btn-danger py-1.5 px-2.5"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing?.id ? 'Edit Service Job' : 'New Service Job'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <ServiceForm initial={editing || emptyForm} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message="This service job will be permanently deleted."
          onConfirm={async () => { await db.services.delete(deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
