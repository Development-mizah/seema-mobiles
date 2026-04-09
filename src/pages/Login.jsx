import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "Admin" && password === "Admin@123") {
      localStorage.setItem("auth", "true");
      onLogin();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080810",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: 320,
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            color: "white",
            marginBottom: 20,
            fontFamily: "Syne, sans-serif",
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Seema Mobiles
        </h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}

        <button type="submit" style={buttonStyle}>
          Login
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginBottom: 12,
  padding: "10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  outline: "none",
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #ea580c, #f97316)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};
