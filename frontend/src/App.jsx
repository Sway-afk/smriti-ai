import React, { useState } from "react";
import "./App.css";
import Therapy from "./pages/Therapy";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemoryVault from "./pages/MemoryVault";
import VoiceMemory from "./pages/VoiceMemory";

function App() {
  const [page, setPage] = useState("home");

  const isAuthenticated = () => {
    return Boolean(localStorage.getItem("smriti_token"));
  };

  const goToPage = (nextPage) => {
    const protectedPages = [
      "therapy",
      "dashboard",
      "memory-vault",
      "voice-memory",
    ];

    if (protectedPages.includes(nextPage) && !isAuthenticated()) {
      setPage("login");
      return;
    }

    setPage(nextPage);
  };

  const handleLogout = () => {
    localStorage.removeItem("smriti_token");
    setPage("login");
  };

  const handleLoginSuccess = () => {
    setPage("dashboard");
  };

  const renderPageWithBackButton = (
    component,
    backPage = "home",
    backLabel = "Back"
  ) => {
    return (
      <div style={{ minHeight: "100vh", position: "relative" }}>
        <button
          onClick={() => goToPage(backPage)}
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            zIndex: 1000,
            padding: "11px 16px",
            border: "1px solid #57765f",
            borderRadius: "10px",
            background: "#fffdf9",
            color: "#57765f",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(48, 59, 52, 0.08)",
          }}
        >
          ← {backLabel}
        </button>

        {component}
      </div>
    );
  };

  /*
   * Extra protection:
   * Even if a protected page somehow gets selected while logged out,
   * send the user to Login instead.
   */
  const protectedPages = [
    "therapy",
    "dashboard",
    "memory-vault",
    "voice-memory",
  ];

  if (protectedPages.includes(page) && !isAuthenticated()) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (page === "therapy") {
    return renderPageWithBackButton(
      <Therapy />,
      "home",
      "Home"
    );
  }

  if (page === "login") {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (page === "dashboard") {
    return renderPageWithBackButton(
      <Dashboard
        onOpenMemoryVault={() => goToPage("memory-vault")}
        onOpenVoiceMemory={() => goToPage("voice-memory")}
        onLogout={handleLogout}
      />,
      "home",
      "Home"
    );
  }

  if (page === "memory-vault") {
    return renderPageWithBackButton(
      <MemoryVault />,
      "dashboard",
      "Dashboard"
    );
  }

  if (page === "voice-memory") {
    return renderPageWithBackButton(
      <VoiceMemory />,
      "dashboard",
      "Dashboard"
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">स्मृति</div>

          <div>
            <h1>Smriti AI</h1>
            <span>Memory-powered dementia care</span>
          </div>
        </div>

        <button
          className="login-button"
          onClick={() => goToPage("login")}
        >
          Caregiver Login
        </button>
      </header>

      <main className="hero-section">
        <div className="hero-content">
          <div className="badge">
            🧠 Personalized cognitive care
          </div>

          <h2>
            Memories that matter.
            <br />
            <span>Care that remembers.</span>
          </h2>

          <p>
            Smriti AI transforms a person's own memories into
            personalized cognitive activities, helping caregivers
            support meaningful, familiar therapy.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="primary-button"
              onClick={() => goToPage("therapy")}
            >
              Start a Therapy Session →
            </button>

            <button
              className="login-button"
              onClick={() => goToPage("memory-vault")}
            >
              Open Memory Vault
            </button>

            <button
              className="login-button"
              onClick={() => goToPage("voice-memory")}
            >
              Record a Voice Memory
            </button>
          </div>
        </div>

        <div className="memory-card">
          <div className="memory-icon">🌸</div>

          <p className="memory-label">
            A precious memory
          </p>

          <h3>Family Wedding</h3>

          <p className="memory-text">
            “A beautiful day with the whole family in Jaipur.”
          </p>

          <div className="memory-tags">
            <span>Family</span>
            <span>Jaipur</span>
            <span>Wedding</span>
          </div>
        </div>
      </main>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">📖</div>

          <h3>Memory Vault</h3>

          <p>
            Store meaningful stories, people, places, and moments.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">🎯</div>

          <h3>Personalized Games</h3>

          <p>
            Turn familiar memories into gentle cognitive exercises.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">👨‍👩‍👧</div>

          <h3>Caregiver Support</h3>

          <p>
            Track progress and understand each therapy session.
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;