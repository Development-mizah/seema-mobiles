import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import {
  Package,
  ShoppingCart,
  ClipboardList,
  Wrench,
  CreditCard,
  TrendingUp,
  IndianRupee,
  Puzzle,
  Search,
} from "lucide-react";

export default function Dashboard({ onNav }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [notifications, setNotifications] = useState([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Data
  const stocks = useLiveQuery(() => db.stocks.toArray(), []) ?? [];
  const sales = useLiveQuery(() => db.sales.toArray(), []) ?? [];
  const requirements = useLiveQuery(() => db.requirements.toArray(), []) ?? [];
  const services = useLiveQuery(() => db.services.toArray(), []) ?? [];
  const credits = useLiveQuery(() => db.credits.toArray(), []) ?? [];
  const accessories = useLiveQuery(() => db.accessories.toArray(), []) ?? [];

  // Global Search
  const query = debouncedSearch.toLowerCase();

  const results = debouncedSearch
    ? [
        ...stocks
          .filter(
            (i) =>
              i.name?.toLowerCase().includes(query) ||
              i.brand?.toLowerCase().includes(query) ||
              i.imei?.toLowerCase().includes(query),
          )
          .map((i) => ({ ...i, type: "stocks" })),

        ...sales
          .filter(
            (s) =>
              s.customerName?.toLowerCase().includes(query) ||
              s.itemDescription?.toLowerCase().includes(query) ||
              s.phone?.toLowerCase().includes(query),
          )
          .map((s) => ({ ...s, type: "sales" })),

        ...services
          .filter(
            (s) =>
              s.customerName?.toLowerCase().includes(query) ||
              s.phone?.toLowerCase().includes(query),
          )
          .map((s) => ({ ...s, type: "services" })),

        ...requirements
          .filter(
            (r) =>
              r.customerName?.toLowerCase().includes(query) ||
              r.phone?.toLowerCase().includes(query),
          )
          .map((r) => ({ ...r, type: "requirements" })),

        ...credits
          .filter(
            (c) =>
              c.customerName?.toLowerCase().includes(query) ||
              c.phone?.toLowerCase().includes(query),
          )
          .map((c) => ({ ...c, type: "credits" })),

        ...accessories
          .filter((a) => a.name?.toLowerCase().includes(query))
          .map((a) => ({ ...a, type: "accessories" })),
      ]
    : [];

  // Stats
  const totalStockValue =
    stocks.reduce((s, m) => s + m.sellingPrice * m.stock, 0) +
    accessories.reduce((s, a) => s + a.sellingPrice * a.stock, 0);

  const totalSalesValue = sales.reduce((s, sale) => s + (sale.amount || 0), 0);

  const pendingCredits = credits
    .filter((c) => c.status === "Pending")
    .reduce((s, c) => s + (c.totalAmount - c.paidAmount || 0), 0);

  const pendingServices = services.filter(
    (s) => s.status !== "Completed",
  ).length;

  const pendingReqList = requirements.filter((r) => r.status === "Pending");

  const pendingReqs = pendingReqList.length;

  const lowStock = [...stocks, ...accessories].filter((i) => i.stock <= 2);

  // 🔔 Notification system
  const addNotification = (data) => {
    const id = Date.now();

    setNotifications((prev) => [
      ...prev,
      {
        id,
        title: "Pending Requirements",
        message: `${data.length} requests pending`,
        items: data.slice(0, 3),
      },
    ]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (!pendingReqList.length) return;

    const lastShown = localStorage.getItem("reqReminderTime");
    const now = Date.now();

    if (!lastShown || now - lastShown > 60 * 60 * 1000) {
      addNotification(pendingReqList);
      localStorage.setItem("reqReminderTime", now);
    }
  }, [pendingReqList]);

  return (
    <div className="space-y-7 animate-fade-up">
      {/* 🔔 Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 w-80">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="card p-4 border border-orange-500/20 bg-[#111] shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                ⚠️
              </div>

              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{n.title}</p>

                <p className="text-gray-400 text-xs mt-1">{n.message}</p>

                <div className="mt-2 space-y-1">
                  {n.items.map((item, i) => (
                    <p key={i} className="text-xs text-gray-500 truncate">
                      • {item.customerName || item.name}
                    </p>
                  ))}
                </div>

                <button
                  onClick={() => onNav("requirements")}
                  className="mt-2 text-xs text-orange-400 hover:underline"
                >
                  View All →
                </button>
              </div>

              <button
                onClick={() =>
                  setNotifications((prev) => prev.filter((x) => x.id !== n.id))
                }
                className="text-gray-500 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Seema Mobiles — Inventory Overview
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 ${
              search ? "opacity-0" : "opacity-100"
            }`}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, brand, IMEI..."
            className={`field w-full py-2 ${search ? "pl-3" : "pl-10"}`}
          />

          {search && (
            <div className="absolute top-full mt-2 w-full bg-[#111] border border-white/10 rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
              {results.length === 0 ? (
                <p className="p-3 text-gray-500 text-sm">No results found</p>
              ) : (
                results.slice(0, 8).map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSearch("");
                      onNav(item.type);
                    }}
                    className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5"
                  >
                    <p className="text-white text-sm font-medium">
                      {item.name || item.customerName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.type.toUpperCase()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-orange-700 to-orange-500">
        <p className="text-orange-100 text-xs">Total Inventory Value</p>
        <p className="text-3xl font-bold text-white mt-1">
          ₹{totalStockValue.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Stocks",
            value: stocks.length,
            icon: Package,
            nav: "stocks",
          },
          {
            label: "Sales",
            value: sales.length,
            icon: ShoppingCart,
            nav: "sales",
          },
          {
            label: "Requirements",
            value: pendingReqs,
            icon: ClipboardList,
            nav: "requirements",
          },
          {
            label: "Services",
            value: pendingServices,
            icon: Wrench,
            nav: "services",
          },
          {
            label: "Credits",
            value: `₹${pendingCredits}`,
            icon: CreditCard,
            nav: "credits",
          },
          {
            label: "Accessories",
            value: accessories.length,
            icon: Puzzle,
            nav: "accessories",
          },
        ].map(({ label, value, icon: Icon, nav }) => (
          <button
            key={label}
            onClick={() => onNav(nav)}
            className="card p-5 text-left hover:border-white/15"
          >
            <Icon className="w-5 h-5 mb-2 text-gray-400" />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-gray-500 text-xs">{label}</p>
          </button>
        ))}
      </div>

      {/* Low Stock */}
      <div className="card p-5">
        <h2 className="text-white mb-3">Low Stock</h2>
        {lowStock.length === 0 ? (
          <p className="text-gray-500">All good 👍</p>
        ) : (
          lowStock.slice(0, 5).map((item, i) => (
            <div key={i} className="flex justify-between p-2">
              <span>{item.name}</span>
              <span className="text-amber-400">{item.stock}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
