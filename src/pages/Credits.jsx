import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Trash2, Pencil, CreditCard, AlertCircle } from 'lucide-react';

const emptyForm = {
  customerName: '', phone: '', itemDescription: '',
  totalAmount: '', paidAmount: '0', dueDate: '', notes: '', status: 'Pending'
};

function CreditForm({ initial = emptyForm, onSave, onClose }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const total  = Number(form.totalAmount)  || 0;
    const paid   = Number(form.paidAmount)   || 0;
    const status = paid >= total ? 'Cleared' : form.status;
    onSave({ ...form, totalAmount: total, paidAmount: paid, status });
  };

  const total   = Number(form.totalAmount)  || 0;
  const paid    = Number(form.paidAmount)   || 0;
  const balance = total - paid;

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
          <label className="field-label">Item / Description *</label>
          <input className="field" value={form.itemDescription} onChange={e=>set('itemDescription',e.target.value)} placeholder="e.g. iPhone 15 Pro Max" required />
        </div>
        <div>
          <label className="field-label">Total Amount (₹) *</label>
          <input type="number" className="field" value={form.totalAmount} onChange={e=>set('totalAmount',e.target.value)} placeholder="0" required />
        </div>
        <div>
          <label className="field-label">Paid Amount (₹)</label>
          <input type="number" className="field" value={form.paidAmount} onChange={e=>set('paidAmount',e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="field-label">Due Date</label>
          <input type="date" className="field" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)} />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select className="field" value={form.status} onChange={e=>set('status',e.target.value)}>
            {['Pending','Partial','Cleared','Overdue'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="field-label">Notes</label>
          <input className="field" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any notes..." />
        </div>
      </div>
      {total > 0 && (
        <div className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: balance > 0 ? 'rgba(245,158,11,0.05)' : 'rgba(16,185,129,0.05)', borderColor: balance > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' }}>
          <span className="text-sm text-gray-400">Balance Due</span>
          <span className={`text-xl font-bold ${balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}
            style={{ fontFamily: 'Syne, sans-serif' }}>
            ₹{balance.toLocaleString('en-IN')}
          </span>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center">Save</button>
      </div>
    </form>
  );
}

const statusBadge = { Pending: 'badge-amber', Partial: 'badge-blue', Cleared: 'badge-green', Overdue: 'badge-red' };

export default function Credits() {
  const items = useLiveQuery(() => db.credits.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = items.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.customerName?.toLowerCase().includes(q) || c.phone?.includes(q) || c.itemDescription?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalDue       = items.filter(c=>c.status!=='Cleared').reduce((s,c)=>s+((c.totalAmount-c.paidAmount)||0),0);
  const totalCollected = items.reduce((s,c)=>s+(c.paidAmount||0),0);
  const overdueItems   = items.filter(c=>c.status==='Overdue'||
    (c.status!=='Cleared'&&c.dueDate&&new Date(c.dueDate)<new Date())).length;

  const handleSave = async (form) => {
    const data = { ...form, createdAt: form.createdAt || new Date().toISOString() };
    if (editing?.id) { await db.credits.update(editing.id, data); }
    else             { await db.credits.add(data); }
    setShowModal(false); setEditing(null);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Credits</h1>
          <p className="text-gray-500 text-sm mt-0.5">Customer due payments & credit tracking</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />Add Credit
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Due',       value: `₹${totalDue.toLocaleString('en-IN')}`,       color: '#f59e0b' },
          { label: 'Collected',       value: `₹${totalCollected.toLocaleString('en-IN')}`,  color: '#10b981' },
          { label: 'Overdue Accounts',value: overdueItems,                                   color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color }}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {overdueItems > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{overdueItems} customer{overdueItems>1?'s':''} with overdue payments. Follow up needed.</p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone..."
            className="field pl-9 py-2" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All','Pending','Partial','Cleared','Overdue'].map(s => (
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
                <th>Date</th><th>Customer</th><th>Phone</th><th>Item</th>
                <th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-gray-600 py-16 text-sm">No credit records found</td></tr>
              )}
              {filtered.map(c => {
                const balance = (c.totalAmount||0) - (c.paidAmount||0);
                const isOverdue = c.status !== 'Cleared' && c.dueDate && new Date(c.dueDate) < new Date();
                return (
                  <tr key={c.id} className="tbl-row">
                    <td className="text-gray-500 text-xs whitespace-nowrap">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="text-white font-medium">{c.customerName}</td>
                    <td className="text-gray-400 text-xs">{c.phone}</td>
                    <td className="text-gray-300 max-w-[160px] truncate">{c.itemDescription}</td>
                    <td className="text-white font-medium">₹{(c.totalAmount||0).toLocaleString('en-IN')}</td>
                    <td className="text-emerald-400">₹{(c.paidAmount||0).toLocaleString('en-IN')}</td>
                    <td className={`font-bold ${balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₹{balance.toLocaleString('en-IN')}
                    </td>
                    <td className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
                      {c.dueDate || '—'} {isOverdue && '⚠'}
                    </td>
                    <td><span className={`badge ${statusBadge[c.status] || 'badge-gray'}`}>{c.status}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditing(c); setShowModal(true); }} className="btn-edit py-1.5 px-2.5"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleting(c.id)} className="btn-danger py-1.5 px-2.5"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <Modal title={editing?.id ? 'Edit Credit' : 'Add Credit Record'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <CreditForm initial={editing || emptyForm} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message="This credit record will be permanently deleted."
          onConfirm={async () => { await db.credits.delete(deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
