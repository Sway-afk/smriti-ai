import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function Dashboard({
  onOpenMemoryVault,
  onOpenVoiceMemory,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(
          `${API_URL}/caregiver/dashboard/${PATIENT_ID}`
        );

        if (!response.ok) {
          throw new Error("Could not load the caregiver dashboard.");
        }

        const data = await response.json();
        setDashboard(data);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f5ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#57765f",
          fontSize: "20px",
          fontWeight: "700",
        }}
      >
        Loading caregiver dashboard...
      </div>
    );
  }

  if (message) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f5ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#a05a45",
          fontSize: "18px",
          fontWeight: "700",
        }}
      >
        {message}
      </div>
    );
  }

  const patient = dashboard?.patient || {};
  const progress = dashboard?.overall_progress || {};
  const session = dashboard?.latest_session || null;
  const activity = dashboard?.recent_activity || [];

  const totalAttempts = Number(progress.total_attempts || 0);
  const correctAttempts = Number(progress.correct_attempts || 0);

  const accuracy =
    totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 0;

  const sessionId =
    session?.id ??
    session?.session_id ??
    null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f5ef",
        padding: "45px 7%",
        color: "#28352f",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "35px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                color: "#57765f",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "1px",
                margin: "0 0 8px",
              }}
            >
              SMRITI AI
            </p>

            <h1
              style={{
                color: "#28352f",
                fontSize: "44px",
                margin: "0 0 10px",
              }}
            >
              Caregiver Dashboard
            </h1>

            <p
              style={{
                color: "#66736b",
                fontSize: "18px",
                margin: 0,
              }}
            >
              A simple view of your loved one&apos;s therapy progress.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={onOpenMemoryVault}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "13px 20px",
                background: "#57765f",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow:
                  "0 8px 20px rgba(87, 118, 95, 0.18)",
              }}
            >
              Open Memory Vault →
            </button>

            <button
              onClick={onOpenVoiceMemory}
              style={{
                border: "1px solid #57765f",
                borderRadius: "12px",
                padding: "13px 20px",
                background: "#fffdf9",
                color: "#57765f",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Record Voice Memory 🎙️
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              background: "#fffdf9",
              border: "1px solid #e8e1d5",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <p
              style={{
                color: "#8a968e",
                margin: "0 0 8px",
              }}
            >
              PATIENT
            </p>

            <h2
              style={{
                color: "#28352f",
                margin: "0 0 10px",
              }}
            >
              {patient.full_name || "Test Patient"}
            </h2>

            <p
              style={{
                margin: "6px 0",
                color: "#66736b",
              }}
            >
              Age: {patient.age ?? "—"}
            </p>

            <p
              style={{
                margin: "6px 0",
                color: "#66736b",
              }}
            >
              Language: {patient.language || "—"}
            </p>

            <p
              style={{
                margin: "6px 0",
                color: "#66736b",
              }}
            >
              Caregiver: {patient.caregiver_name || "—"}
            </p>
          </div>

          <div
            style={{
              background: "#fffdf9",
              border: "1px solid #e8e1d5",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <p
              style={{
                color: "#8a968e",
                margin: "0 0 8px",
              }}
            >
              OVERALL PROGRESS
            </p>

            <h2
              style={{
                color: "#57765f",
                margin: "0 0 10px",
                fontSize: "42px",
              }}
            >
              {accuracy}%
            </h2>

            <p
              style={{
                margin: "6px 0",
                color: "#66736b",
              }}
            >
              Correct answers: {correctAttempts}
            </p>

            <p
              style={{
                margin: "6px 0",
                color: "#66736b",
              }}
            >
              Total attempts: {totalAttempts}
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#fffdf9",
            border: "1px solid #e8e1d5",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "25px",
          }}
        >
          <p
            style={{
              color: "#8a968e",
              margin: "0 0 8px",
            }}
          >
            LATEST SESSION
          </p>

          {session ? (
            <>
              <h2
                style={{
                  color: "#28352f",
                  margin: "0 0 12px",
                }}
              >
                {sessionId
                  ? `Therapy Session #${sessionId}`
                  : "Latest Therapy Session"}
              </h2>

              <p
                style={{
                  color: "#66736b",
                  margin: "6px 0",
                }}
              >
                Status: {session.status}
              </p>

              <p
                style={{
                  color: "#66736b",
                  margin: "6px 0",
                }}
              >
                Completed games: {session.completed_games} /{" "}
                {session.total_games}
              </p>
            </>
          ) : (
            <p
              style={{
                color: "#66736b",
                margin: 0,
              }}
            >
              No therapy session yet.
            </p>
          )}
        </div>

        <div
          style={{
            background: "#fffdf9",
            border: "1px solid #e8e1d5",
            borderRadius: "20px",
            padding: "28px",
          }}
        >
          <p
            style={{
              color: "#8a968e",
              margin: "0 0 18px",
            }}
          >
            RECENT ACTIVITY
          </p>

          {activity.length === 0 ? (
            <p
              style={{
                color: "#66736b",
                margin: 0,
              }}
            >
              No recent activity.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {activity.slice(0, 5).map((item) => (
                <div
                  key={item.attempt_id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f4f6f1",
                  }}
                >
                  <strong>
                    {item.correct
                      ? "✓ Correct answer"
                      : "✗ Incorrect answer"}
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#66736b",
                    }}
                  >
                    {item.game_type} · {item.difficulty}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;