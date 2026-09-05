import React, { useState } from "react";
import "./App.css";
import Therapy from "./pages/Therapy";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemoryVault from "./pages/MemoryVault";
import VoiceMemory from "./pages/VoiceMemory";

function App() {
  const [page, setPage] = useState("home");

  if (page === "therapy") {
    return <Therapy />;
  }

  if (page === "login") {
    return (
      <Login
        onLoginSuccess={() => setPage("dashboard")}
      />
    );
  }

  if (page === "dashboard") {
    return (
      <Dashboard
        onOpenMemoryVault={() => setPage("memory-vault")}
        onOpenVoiceMemory={() => setPage("voice-memory")}
      />
    );
  }

  if (page === "memory-vault") {
    return <MemoryVault />;
  }

  if (page === "voice-memory") {
    return <VoiceMemory />;
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
          onClick={() => setPage("login")}
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
              onClick={() => setPage("therapy")}
            >
              Start a Therapy Session →
            </button>

            <button
              className="login-button"
              onClick={() => setPage("memory-vault")}
            >
              Open Memory Vault
            </button>

            <button
              className="login-button"
              onClick={() => setPage("voice-memory")}
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