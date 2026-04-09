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
  brand: "",
  type: "New",
  model: "",
  color: "",
  storage: "",
  ram: "",
  imei: "",
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

  // brand states
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandCountry, setBrandCountry] = useState("");

  // searchable dropdown
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const brandRef = useRef();

  const brands = useLiveQuery(() => db.brands.toArray(), []) ?? [];

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const num = (k, v) =>
    setForm((p) => ({ ...p, [k]: v === "" ? "" : Number(v) }));

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (brandRef.current && !brandRef.current.contains(e.target)) {
        setShowBrandDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      stock: Number(form.stock) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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

        {/* BRAND */}
        <div ref={brandRef}>
          <label className="field-label">Brand *</label>

          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="Search brand..."
              value={brandSearch || form.brand}
              onChange={(e) => {
                setBrandSearch(e.target.value);
                setShowBrandDropdown(true);
              }}
              onFocus={() => setShowBrandDropdown(true)}
            />

            <button
              type="button"
              className="btn-primary px-3"
              onClick={() => setShowBrandInput((p) => !p)}
            >
              +
            </button>
          </div>

          {/* DROPDOWN */}
          {showBrandDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-black border border-white/10 rounded-lg shadow-lg">
              <div className="max-h-[200px] overflow-y-auto">
                {filteredBrands.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      set("brand", b.name);
                      setBrandSearch("");
                      setShowBrandDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-white/10 cursor-pointer"
                  >
                    {b.name} {b.country && `(${b.country})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INLINE ADD */}
          {showBrandInput && (
            <div className="mt-2 space-y-2">
              <input
                className="field"
                placeholder="Brand Name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
              <input
                className="field"
                placeholder="Country"
                value={brandCountry}
                onChange={(e) => setBrandCountry(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={async () => {
                    if (!brandName.trim()) return;

                    await db.brands.add({
                      name: brandName,
                      country: brandCountry || "",
                    });

                    set("brand", brandName);
                    setBrandName("");
                    setBrandCountry("");
                    setShowBrandInput(false);
                  }}
                >
                  Save
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowBrandInput(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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

        {/* MODEL */}
        <div>
          <label className="field-label">Model</label>
          <input
            className="field"
            value={form.model}
            onChange={(e) => set("model", e.target.value)}
          />
        </div>

        {/* COLOR */}
        <div>
          <label className="field-label">Color</label>
          <input
            className="field"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
          />
        </div>

        {/* STORAGE */}
        <div>
          <label className="field-label">Storage</label>
          <select
            className="field"
            value={form.storage}
            onChange={(e) => set("storage", e.target.value)}
          >
            <option value="">Select</option>
            {STORAGE.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* RAM */}
        <div>
          <label className="field-label">RAM</label>
          <select
            className="field"
            value={form.ram}
            onChange={(e) => set("ram", e.target.value)}
          >
            <option value="">Select</option>
            {RAM.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
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
                  onClick={() =>
                    set(
                      "images",
                      form.images.filter((_, idx) => idx !== i),
                    )
                  }
                  className="absolute top-0 right-0 bg-red-500 text-white text-xs"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SELLER */}
        <div className="col-span-2">
          <label className="field-label">Seller Name</label>
          <input
            className="field"
            value={form.sellerName}
            onChange={(e) => set("sellerName", e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Seller Phone</label>
          <input
            className="field"
            value={form.sellerPhone}
            onChange={(e) => set("sellerPhone", e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Seller Type</label>
          <select
            className="field"
            value={form.sellerType}
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

        {/* STOCK */}
        <div>
          <label className="field-label">Stock</label>
          <input
            type="number"
            className="field"
            value={form.stock}
            onChange={(e) => num("stock", e.target.value)}
          />
        </div>

        {/* WARRANTY */}
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

        {/* CONDITION */}
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

        {/* STATUS */}
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
        <div className="col-span-2">
          <label className="field-label">Notes</label>
          <input
            className="field"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          Save
        </button>
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
                <th>Brand</th>
                <th>Type</th>
                <th>Storage / RAM</th>
                <th>IMEI</th>
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
                  <td className="text-gray-400">{s.brand}</td>
                  <td>
                    <span
                      className={`badge ${s.type === "New" ? "badge-blue" : "badge-purple"}`}
                    >
                      {s.type === "New" ? "New" : "Second"}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">
                    {s.storage}
                    {s.ram && ` / ${s.ram}`}
                  </td>
                  <td className="text-gray-600 text-xs font-mono">
                    {s.imei || "—"}
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
