import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { Plus, Search, Trash2, Pencil, Receipt } from "lucide-react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Tooltip from "../components/Tooltip";

const emptyForm = {
  customerName: "",
  phone: "",
  itemType: "Stock",
  itemDescription: "",
  qty: "1",
  amount: "",
  paymentMode: "Cash",
  notes: "",
};

function SaleForm({ initial = emptyForm, onSave, onClose }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ✅ Fetch data from DB
  const mobiles = useLiveQuery(() => db.stocks.toArray(), []) || [];
  const accessories = useLiveQuery(() => db.accessories.toArray(), []) || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState("");

  // ✅ Check if dropdown needed
  const isDropdown = form.itemType === "Stock" || form.itemType === "Accessory";

  const currentList = form.itemType === "Stock" ? mobiles : accessories;

  const currentStock = selectedItem?.stock || 0;

  const filteredList = currentList.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      qty: Number(form.qty) || 1,
      amount: Number(form.amount) || 0,
      purchasePrice: Number(purchasePrice) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Customer */}
        <div>
          <label className="field-label">Customer Name *</label>
          <input
            className="field"
            value={form.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            placeholder="Full name"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="field-label">Phone</label>
          <input
            className="field"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="9876543210"
          />
        </div>

        {/* Item Type */}
        <div>
          <label className="field-label">Item Type</label>
          <select
            className="field"
            value={form.itemType}
            onChange={(e) => {
              set("itemType", e.target.value);
              set("itemDescription", "");
              set("amount", "");
              setPurchasePrice("");
              setSelectedItem(null);
            }}
          >
            <option value="Stock">Mobile</option>
            <option value="Accessory">Accessory</option>
            <option value="Service">Service</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Payment */}
        <div>
          <label className="field-label">Payment Mode</label>
          <select
            className="field"
            value={form.paymentMode}
            onChange={(e) => set("paymentMode", e.target.value)}
          >
            {["Cash", "UPI", "Card", "Bank Transfer", "Credit"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* 🔥 SMART SEARCH + SELECT */}
        <div className="col-span-2 relative">
          <label className="field-label">Item Description *</label>

          {isDropdown ? (
            <div className="relative">
              <input
                className="field"
                placeholder="Search item..."
                value={form.itemDescription}
                onChange={(e) => {
                  set("itemDescription", e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                required
              />

              {showDropdown && (
                <div className="absolute z-50 w-full mt-2 max-h-52 overflow-y-auto bg-[#111827] border border-white/10 rounded-lg shadow-lg">
                  {currentList
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(form.itemDescription.toLowerCase()),
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-2 cursor-pointer hover:bg-white/10 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          set("itemDescription", item.name);
                          set("amount", item.sellingPrice || "");
                          setPurchasePrice(item.purchasePrice || "");
                          setSelectedItem(item);
                          setShowDropdown(false);
                        }}
                      >
                        {item.name} ({item.storage} / {item.ram})
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <input
              className="field"
              value={form.itemDescription}
              onChange={(e) => set("itemDescription", e.target.value)}
              placeholder="Enter item description"
              required
            />
          )}
        </div>

        {/* Purchase Price */}
        {isDropdown && purchasePrice && (
          <div>
            <label className="field-label">Purchase Price</label>
            <input
              type="number"
              className="field bg-gray-800 text-gray-400"
              value={purchasePrice}
              readOnly
            />
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="field-label">Quantity</label>

          <input
            type="number"
            className="field"
            value={form.qty}
            onChange={(e) => {
              const qty = Number(e.target.value) || 1;
              set("qty", qty);

              if (selectedItem?.sellingPrice) {
                set("amount", selectedItem.sellingPrice * qty);
              }
            }}
            min="1"
            max={selectedItem?.stock || undefined}
          />

          {/* 🔥 LOW STOCK WARNING */}
          {isDropdown &&
            selectedItem &&
            currentStock > 1 &&
            currentStock < 5 && (
              <p className="text-yellow-400 text-xs mt-1">
                ⚠ Only {currentStock} item{currentStock === 1 ? "" : "s"} left
                in stock
              </p>
            )}

          {/* ❌ OUT OF STOCK */}
          {isDropdown && selectedItem && currentStock === 0 && (
            <p className="text-red-400 text-xs mt-1">❌ Out of stock</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="field-label">Amount (₹) *</label>
          <input
            type="number"
            className="field"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0"
            required
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="field-label">Notes</label>
          <input
            className="field"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any extra info..."
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost flex-1 justify-center"
        >
          Cancel
        </button>

        <button type="submit" className="btn-primary flex-1 justify-center">
          Save Sale
        </button>
      </div>
    </form>
  );
}

const modeColor = {
  Cash: "badge-green",
  UPI: "badge-blue",
  Card: "badge-purple",
  "Bank Transfer": "badge-amber",
  Credit: "badge-red",
};

export default function Sales() {
  const sales =
    useLiveQuery(() => db.sales.orderBy("createdAt").reverse().toArray(), []) ??
    [];
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [reportType, setReportType] = useState("daily");

  const now = new Date();

  const isSameDay = (date) =>
    new Date(date).toDateString() === now.toDateString();

  const isSameWeek = (date) => {
    const d = new Date(date);
    const firstDay = new Date();
    firstDay.setDate(now.getDate() - now.getDay());
    return d >= firstDay;
  };

  const isSameMonth = (date) => {
    const d = new Date(date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  };

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();

    const matchSearch =
      !q ||
      s.customerName?.toLowerCase().includes(q) ||
      s.itemDescription?.toLowerCase().includes(q) ||
      s.phone?.includes(q);

    const matchDate =
      reportType === "daily"
        ? isSameDay(s.createdAt)
        : reportType === "weekly"
          ? isSameWeek(s.createdAt)
          : isSameMonth(s.createdAt);

    return matchSearch && matchDate;
  });

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text(`Sales Report (${reportType.toUpperCase()})`, 14, 15);

    const tableData = filtered.map((s) => {
      const profit = (s.amount || 0) - (s.purchasePrice || 0) * (s.qty || 1);

      return [
        new Date(s.createdAt).toLocaleDateString("en-IN"),
        s.customerName,
        s.phone || "-",
        s.itemDescription,
        s.qty,
        `Rs ${s.purchasePrice || 0}`, // ✅ FIX SYMBOL
        `Rs ${s.amount || 0}`,
        `Rs ${profit}`,
      ];
    });

    autoTable(doc, {
      head: [
        [
          "Date",
          "Customer",
          "Phone",
          "Item",
          "Qty",
          "Purchase",
          "Amount",
          "Profit",
        ],
      ],
      body: tableData,
      startY: 20,
    });

    doc.save(`sales_${reportType}.pdf`);
  };

  const exportExcel = () => {
    const data = filtered.map((s) => {
      const profit = (s.amount || 0) - (s.purchasePrice || 0) * (s.qty || 1);

      return {
        Date: new Date(s.createdAt).toLocaleDateString("en-IN"),
        Customer: s.customerName,
        Phone: s.phone,
        Item: s.itemDescription,
        Quantity: s.qty,
        PurchasePrice: s.purchasePrice || 0,
        Amount: s.amount || 0,
        Profit: profit,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");

    XLSX.writeFile(wb, `sales_${reportType}.xlsx`);
  };

  const totalRevenue = filtered.reduce((s, sale) => s + (sale.amount || 0), 0);

  const totalProfit = filtered.reduce(
    (sum, sale) =>
      sum + ((sale.amount || 0) - (sale.purchasePrice || 0) * (sale.qty || 1)),
    0,
  );

  const handleSave = async (form) => {
    const data = {
      ...form,
      createdAt: form.createdAt || new Date().toISOString(),
    };

    // ✅ Save sale
    let saleId;
    if (editing?.id) {
      await db.sales.update(editing.id, data);
      saleId = editing.id;
    } else {
      saleId = await db.sales.add(data);
    }

    // ✅ Reduce stock ONLY for Stock / Accessory
    if (form.itemType === "Stock" || form.itemType === "Accessory") {
      const table = form.itemType === "Stock" ? db.stocks : db.accessories;

      // 🔍 find item
      const item = await table
        .where("name")
        .equals(form.itemDescription)
        .first();

      if (item) {
        const newStock = (item.stock || 0) - form.qty;

        await table.update(item.id, {
          stock: newStock >= 0 ? newStock : 0,
          status: newStock <= 1 ? "Low Stock" : "In Stock",
        });
      }
    }

    setShowModal(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Sales
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {sales.length} transactions · ₹
            {totalRevenue.toLocaleString("en-IN")} total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Report Filter */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {["daily", "weekly", "monthly"].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-2 py-1 text-xs rounded-md transition ${
                  reportType === type
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:bg-white/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <Tooltip text="Export as PDF">
            <button onClick={exportPDF} className="btn-ghost">
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip text="Export as Excel">
            <button onClick={exportExcel} className="btn-ghost">
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Add Sale */}
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Sale
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Sales",
            value: `₹${totalRevenue.toLocaleString("en-IN")}`,
            color: "#10b981",
          },
          {
            label: "Transactions",
            value: filtered.length,
            color: "#ea580c",
          },
          {
            label: "Avg Sale",
            value: filtered.length
              ? `₹${Math.round(totalRevenue / filtered.length).toLocaleString("en-IN")}`
              : "₹0",
            color: "#8b5cf6",
          },
          {
            label: "Total Profit",
            value: `₹${totalProfit.toLocaleString("en-IN")}`,
            color: "#22c55e",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "Syne, sans-serif", color }}
            >
              {value}
            </p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, item..."
          className="field pl-9 py-2"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="tbl-head">
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Item</th>
                <th>Type</th>
                <th>Purchased Price</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Profit</th>
                <th>Payment</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center text-gray-600 py-16 text-sm"
                  >
                    No sales recorded yet
                  </td>
                </tr>
              )}
              {filtered.map((sale) => (
                <tr key={sale.id} className="tbl-row">
                  <td className="text-gray-500 text-xs whitespace-nowrap">
                    {sale.createdAt
                      ? new Date(sale.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="text-white font-medium">
                    {sale.customerName}
                  </td>
                  <td className="text-gray-500 text-xs">{sale.phone || "—"}</td>
                  <td>
                    <p className="text-gray-200 max-w-[180px] truncate">
                      {sale.itemDescription}
                    </p>
                  </td>
                  <td>
                    <span className="badge badge-gray">{sale.itemType}</span>
                  </td>
                  <td className="text-yellow-400 font-medium">
                    ₹{sale.purchasePrice?.toLocaleString("en-IN") || 0}
                  </td>
                  <td className="text-gray-400">{sale.qty}</td>
                  <td className="text-emerald-400 font-bold">
                    ₹{sale.amount?.toLocaleString("en-IN")}
                  </td>
                  <td
                    className={
                      (sale.amount || 0) -
                        (sale.purchasePrice || 0) * (sale.qty || 1) <
                      0
                        ? "text-red-400"
                        : "text-green-400 font-bold"
                    }
                  >
                    ₹
                    {(
                      (sale.amount || 0) -
                      (sale.purchasePrice || 0) * (sale.qty || 1)
                    ).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span
                      className={`badge ${modeColor[sale.paymentMode] || "badge-gray"}`}
                    >
                      {sale.paymentMode}
                    </span>
                  </td>
                  <td className="text-gray-600 text-xs max-w-[120px] truncate">
                    {sale.notes || "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(sale);
                          setShowModal(true);
                        }}
                        className="btn-edit py-1.5 px-2.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(sale.id)}
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
          title={editing?.id ? "Edit Sale" : "Record New Sale"}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        >
          <SaleForm
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
          message="This sale record will be permanently deleted."
          onConfirm={async () => {
            await db.sales.delete(deleting);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
