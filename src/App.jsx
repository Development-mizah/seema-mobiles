import { useState, useEffect } from "react";
import { db } from "./db/db";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Stocks from "./pages/Stocks";
import Sales from "./pages/Sales";
import Requirements from "./pages/Requirements";
import Services from "./pages/Services";
import Credits from "./pages/Credits";
import Brands from "./pages/Brands";
import Accessories from "./pages/Accessories";
import Login from "./pages/Login";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  stocks: "Stocks",
  sales: "Sales",
  requirements: "Requirements",
  services: "Services",
  credits: "Credits",
  brands: "Brands",
  accessories: "Accessories",
};

function renderPage(page, onNav) {
  switch (page) {
    case "dashboard":
      return <Dashboard onNav={onNav} />;
    case "stocks":
      return <Stocks />;
    case "sales":
      return <Sales />;
    case "requirements":
      return <Requirements />;
    case "services":
      return <Services />;
    case "credits":
      return <Credits />;
    case "brands":
      return <Brands />;
    case "accessories":
      return <Accessories />;
    default:
      return <Dashboard onNav={onNav} />;
  }
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [isAuth, setIsAuth] = useState(localStorage.getItem("auth") === "true");

  useEffect(() => {
    const runBackup = async () => {
      const data = {
        stocks: await db.stocks.toArray(),
        accessories: await db.accessories.toArray(),
        sales: await db.sales.toArray(),
        requirements: await db.requirements.toArray(),
        services: await db.services.toArray(),
        credits: await db.credits.toArray(),
      };

      window.electron?.invoke("backup-data", data);
    };

    runBackup();
  }, []);

  if (!isAuth) {
    return <Login onLogin={() => setIsAuth(true)} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080810" }}>
      <Sidebar active={page} onNav={setPage} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "rgba(8,8,16,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              color: "white",
              fontSize: 15,
              margin: 0,
            }}
          >
            {PAGE_TITLES[page]}
          </h2>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Logout */}
            <button
              onClick={() => {
                localStorage.removeItem("auth");
                setIsAuth(false);
              }}
              style={{
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f87171",
                cursor: "pointer",
              }}
            >
              Logout
            </button>

            {/* Status */}
            <div
              style={{
                fontSize: 11,
                color: "#4b5563",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              Local DB · Offline
            </div>

            {/* Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "white",
                fontFamily: "Syne, sans-serif",
              }}
            >
              SM
            </div>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {renderPage(page, setPage)}
        </main>
      </div>
    </div>
  );
}
