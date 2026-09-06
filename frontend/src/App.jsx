import React, { useEffect, useState } from "react";
import "./App.css";
import Therapy from "./pages/Therapy";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemoryVault from "./pages/MemoryVault";
import VoiceMemory from "./pages/VoiceMemory";

function App() {
  const [page, setPage] = useState("home");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    let mounted = true;

    const checkInternetConnection = async () => {
      if (!navigator.onLine) {
        if (mounted) {
          setIsOnline(false);
        }
        return;
      }

      try {
        await fetch(
          `https://www.google.com/favicon.ico?smriti=${Date.now()}`,
          {
            method: "GET",
            mode: "no-cors",
            cache: "no-store",
          }
        );

        if (mounted) {
          setIsOnline(true);
        }
      } catch {
        if (mounted) {
          setIsOnline(false);
        }
      }
    };

    checkInternetConnection();

    const intervalId = window.setInterval(
      checkInternetConnection,
      5000
    );

    window.addEventListener(
      "online",
      checkInternetConnection
    );

    window.addEventListener(
      "offline",
      checkInternetConnection
    );

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener(
        "online",
        checkInternetConnection
      );
      window.removeEventListener(
        "offline",
        checkInternetConnection
      );
    };
  }, []);

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

  const renderOfflineBanner = () => {
    if (isOnline) {
      return null;
    }

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5000,
          padding: "10px 16px",
          background: "#fff1d8",
          borderBottom: "1px solid #e4c98c",
          color: "#6d5420",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "700",
          boxShadow: "0 4px 12px rgba(48, 59, 52, 0.08)",
        }}
      >
        📴 You are offline. Cached app content is available, but
        some caregiver features need an internet connection.
      </div>
    );
  };

  const renderPageWithBackButton = (
    component,
    backPage = "home",
    backLabel = "Back"
  ) => {
    return (
      <div style={{ minHeight: "100vh", position: "relative" }}>
        {renderOfflineBanner()}

        <button
          onClick={() => goToPage(backPage)}
          style={{
            position: "fixed",
            top: isOnline ? "20px" : "58px",
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

  const protectedPages = [
    "therapy",
    "dashboard",
    "memory-vault",
    "voice-memory",
  ];

  if (protectedPages.includes(page) && !isAuthenticated()) {
    return (
      <>
        {renderOfflineBanner()}
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
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
      <>
        {renderOfflineBanner()}
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
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
      {renderOfflineBanner()}

      <header
        className="navbar"
        style={{
          paddingTop: isOnline ? undefined : "48px",
        }}
      >
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