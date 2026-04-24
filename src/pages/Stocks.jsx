import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { Plus, Search, Pencil, Trash2, Filter } from "lucide-react";

// 🔥 REMOVE THIS
// const BRANDS = [...]

// 🔥 ADD THIS
const compressImage = (file, quality = 0.7, maxWidth = 800) => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;

        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
    };

    reader.readAsDataURL(file);
  });
};

const STORAGE = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];
const RAM = ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"];
const WARRANTY = [
  "No Warranty",
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
];
const COND = ["Excellent", "Good", "Fair", "Poor"];

const emptyForm = {
  name: "",
  type: "New",
  variant: "",
  imei1: "",
  imei2: "",
  purchasePrice: "",
  sellingPrice: "",
  stock: "1",
  warranty: "1 Year",
  condition: "",
  notes: "",
  status: "Available",
  sellerName: "",
  sellerPhone: "",
  sellerType: "Dealer",
  images: [],
};

function StockForm({ initial = emptyForm, onSave, onClose }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const [step, setStep] = useState(1);
  const [sellerQuery, setSellerQuery] = useState("");
  const [sellerResults, setSellerResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const num = (k, v) =>
    setForm((p) => ({ ...p, [k]: v === "" ? "" : Number(v) }));

  const searchSellers = async (value) => {
    setSellerQuery(value);
    set("sellerName", value);

    if (!value) {
      setSellerResults([]);
      return;
    }

    // 🔥 Fetch matching sellers
    const data = await db.stocks
      .where("sellerName")
      .startsWithIgnoreCase(value)
      .toArray();

    // 🔥 Remove duplicates (important)
    const unique = Object.values(
      data.reduce((acc, item) => {
        if (!item.sellerName) return acc;

        acc[item.sellerName] = {
          sellerName: item.sellerName,
          sellerPhone: item.sellerPhone,
          sellerType: item.sellerType,
        };
        return acc;
      }, {}),
    );

    setSellerResults(unique);
    setShowDropdown(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      ...form,
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      stock: Number(form.stock) || 0,
    });
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (sellerQuery) searchSellers(sellerQuery);
    }, 250);

    return () => clearTimeout(delay);
  }, [sellerQuery]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 🔥 FORM GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <>
            {/* NAME */}
            <div className="col-span-2">
              <label className="field-label">Mobile Name *</label>
              <input
                className="field"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>

            {/* TYPE */}
            <div>
              <label className="field-label">Type</label>
              <select
                className="field"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="New">New</option>
                <option value="Used">Second Hand</option>
              </select>
            </div>

            {/* VARIANT */}
            <div>
              <label className="field-label">Variant *</label>
              <input
                className="field"
                placeholder="Ex: 8GB / 128GB"
                value={form.variant}
                onChange={(e) => set("variant", e.target.value)}
                required
              />
            </div>

            {/* IMEI 1 */}
            <div>
              <label className="field-label">IMEI 1 *</label>
              <input
                className="field"
                value={form.imei1}
                onChange={(e) => set("imei1", e.target.value)}
                required
              />
            </div>

            {/* IMEI 2 */}
            <div>
              <label className="field-label">IMEI 2 (Optional)</label>
              <input
                className="field"
                value={form.imei2}
                onChange={(e) => set("imei2", e.target.value)}
              />
            </div>

            {/* IMAGES */}
            <div className="col-span-2">
              <label className="field-label">Images</label>
              <input
                type="file"
                multiple
                className="field"
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  const compressed = await Promise.all(
                    files.map((file) => compressImage(file)),
                  );
                  set("images", [...(form.images || []), ...compressed]);
                }}
              />

              <div className="flex gap-2 mt-2 flex-wrap">
                {form.images?.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} className="w-16 h-16 rounded" />
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "images",
                          form.images.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <>
            {/* ================= SELLER ================= */}

            <div className="col-span-2 relative">
              <label className="field-label">Seller Name</label>

              <input
                className="field"
                placeholder="Search seller..."
                value={sellerQuery}
                onChange={(e) => searchSellers(e.target.value)}
                onFocus={() => setShowDropdown(true)}
              />

              {/* 🔽 DROPDOWN */}
              {showDropdown && sellerResults.length > 0 && (
                <div className="absolute z-10 w-full bg-[#0f172a] border border-gray-700 rounded-lg mt-1 max-h-48 overflow-auto shadow-lg">
                  {sellerResults.map((s, i) => (
                    <div
                      key={i}
                      className="p-3 hover:bg-gray-800 cursor-pointer transition"
                      onClick={() => {
                        set("sellerName", s.sellerName);
                        set("sellerPhone", s.sellerPhone || "");
                        set("sellerType", s.sellerType || "Dealer");

                        setSellerQuery(s.sellerName);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="font-medium text-white">
                        {s.sellerName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {s.sellerPhone || "No Phone"} •{" "}
                        {s.sellerType || "Dealer"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SELLER PHONE */}
            <div>
              <label className="field-label">Seller Phone</label>
              <input
                className="field"
                placeholder="Auto-filled"
                value={form.sellerPhone}
                onChange={(e) => set("sellerPhone", e.target.value)}
              />
            </div>

            {/* SELLER TYPE */}
            <div>
              <label className="field-label">Seller Type</label>
              <select
                className="field"
                value={form.sellerType || "Dealer"}
                onChange={(e) => set("sellerType", e.target.value)}
              >
                <option>Dealer</option>
                <option>Customer</option>
                <option>Supplier</option>
              </select>
            </div>

            {/* PRICES */}
            <div>
              <label className="field-label">Purchase Price</label>
              <input
                type="number"
                className="field"
                value={form.purchasePrice}
                onChange={(e) => num("purchasePrice", e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Selling Price</label>
              <input
                type="number"
                className="field"
                value={form.sellingPrice}
                onChange={(e) => num("sellingPrice", e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Stock</label>
              <input
                type="number"
                className="field"
                value={form.stock}
                onChange={(e) => num("stock", e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Warranty</label>
              <select
                className="field"
                value={form.warranty}
                onChange={(e) => set("warranty", e.target.value)}
              >
                {WARRANTY.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </div>

            {form.type === "Used" && (
              <div>
                <label className="field-label">Condition</label>
                <select
                  className="field"
                  value={form.condition}
                  onChange={(e) => set("condition", e.target.value)}
                >
                  {COND.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="field-label">Status</label>
              <select
                className="field"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["Available", "Low Stock", "Out of Stock"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* NOTES */}
            {/* <div className="col-span-2">
              <label className="field-label">Notes</label>
              <input
                className="field"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div> */}
          </>
        )}
      </div>

      {/* 🔥 BUTTONS */}
      <div className="flex gap-3 pt-2">
        {step === 1 && (
          <>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary flex-1"
            >
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-ghost flex-1"
            >
              ← Back
            </button>

            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
          </>
        )}
      </div>
    </form>
  );
}

const statusBadge = {
  Available: "badge-green",
  "Low Stock": "badge-amber",
  "Out of Stock": "badge-red",
};
const condBadge = {
  Excellent: "badge-blue",
  Good: "badge-green",
  Fair: "badge-amber",
  Poor: "badge-red",
};

export default function Stocks() {
  const stocks =
    useLiveQuery(
      () => db.stocks.orderBy("createdAt").reverse().toArray(),
      [],
    ) ?? [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = stocks.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.brand?.toLowerCase().includes(q) ||
      s.imei?.includes(q) ||
      s.sellerName?.toLowerCase().includes(q) ||
      s.sellerPhone?.includes(q);
    const matchFilter =
      filter === "All" || s.type === filter || s.status === filter;
    return matchSearch && matchFilter;
  });

  const handleSave = async (form) => {
    const data = {
      ...form,
      createdAt: form.createdAt || new Date().toISOString(),
    };
    if (editing?.id) {
      await db.stocks.update(editing.id, data);
    } else {
      await db.stocks.add(data);
    }
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    await db.stocks.delete(deleting);
    setDeleting(null);
  };

  const openEdit = (s) => {
    setEditing(s);
    setShowModal(true);
  };
  const openAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const totalUnits = filtered.reduce((s, m) => s + m.stock, 0);
  const totalVal = filtered.reduce((s, m) => s + m.sellingPrice * m.stock, 0);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Stocks
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} models · {totalUnits} units · ₹
            {totalVal.toLocaleString("en-IN")} value
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Mobile
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 transition-opacity duration-200 ${
              search ? "opacity-0" : "opacity-100"
            }`}
          />{" "}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, brand, IMEI, seller..."
            className="field pl-12 py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          {["All", "New", "Used", "Low Stock", "Out of Stock"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-orange-600 text-white" : "bg-white/5 text-gray-500 hover:text-gray-300"}`}
            >
              {f === "Used" ? "Second" : f}
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
                <th>Image</th>
                <th>Name / Model</th>
                <th>Type</th>
                <th>Storage / RAM</th>
                <th>IMEI</th>
                <th>IMEI 2</th>
                <th>Seller</th>
                <th>Purchase ₹</th>
                <th>Selling ₹</th>
                <th>Stock</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center text-gray-600 py-16 text-sm"
                  >
                    No stocks found
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="tbl-row">
                  <td>
                    <div className="flex items-center gap-3">
                      {s.images?.[0] && (
                        <img
                          src={s.images[0]}
                          alt={s.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </td>

                  <td>
                    <div>
                      <p className="text-white font-medium">{s.name}</p>
                      {s.model && (
                        <p className="text-gray-600 text-xs">
                          {s.model} {s.color && `· ${s.color}`}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${s.type === "New" ? "badge-blue" : "badge-purple"}`}
                    >
                      {s.type === "New" ? "New" : "Second"}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">
                    {s.ram}
                    {s.storage && ` / ${s.storage}`}
                    {s.variant && ` ${s.variant}`}
                  </td>
                  <td className="text-gray-600 text-xs font-mono">
                    {s.imei || s.imei1 || "—"}
                  </td>
                  <td className="text-gray-600 text-xs font-mono">
                    {s.imei2 || "—"}
                  </td>
                  <td>
                    {s.sellerName ? (
                      <div>
                        <p className="text-white text-xs">{s.sellerName}</p>
                        <p className="text-gray-600 text-xs">{s.sellerPhone}</p>
                      </div>
                    ) : (
                      <span className="text-gray-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="text-gray-400">
                    ₹{s.purchasePrice?.toLocaleString("en-IN")}
                  </td>
                  <td className="text-orange-400 font-semibold">
                    ₹{s.sellingPrice?.toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span
                      className={`font-bold ${s.stock <= 2 ? "text-amber-400" : "text-white"}`}
                    >
                      {s.stock}
                    </span>
                  </td>
                  <td>
                    {s.condition ? (
                      <span
                        className={`badge ${condBadge[s.condition] || "badge-gray"}`}
                      >
                        {s.condition}
                      </span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${statusBadge[s.status] || "badge-gray"}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="btn-edit py-1.5 px-2.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(s.id)}
                        className="btn-danger py-1.5 px-2.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal
          title={editing?.id ? "Edit Stock" : "Add New Mobile"}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          wide
        >
          <StockForm
            initial={editing || emptyForm}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message="This mobile will be permanently deleted from inventory."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
