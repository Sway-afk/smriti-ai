import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function Dashboard({
  onOpenMemoryVault,
  onOpenVoiceMemory,
  onLogout,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [memoryGraph, setMemoryGraph] = useState(null);

  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [error, setError] = useState("");
  const [graphError, setGraphError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("smriti_token");

    if (!token) {
      throw new Error("Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/caregiver/dashboard/${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load dashboard."
        );
      }

      setDashboard(data);
    } catch (error) {
      setError(error.message);

      if (
        error.message === "Please log in again." ||
        error.message.toLowerCase().includes("not authenticated") ||
        error.message.toLowerCase().includes("unauthorized")
      ) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMemoryGraph = async () => {
    try {
      setGraphLoading(true);
      setGraphError("");

      const response = await fetch(
        `${API_URL}/memories/graph/${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load memory graph."
        );
      }

      setMemoryGraph(data);
    } catch (error) {
      setGraphError(error.message);

      if (
        error.message === "Please log in again." ||
        error.message.toLowerCase().includes("not authenticated") ||
        error.message.toLowerCase().includes("unauthorized")
      ) {
        onLogout();
      }
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadMemoryGraph();
  }, []);

  const patient = dashboard?.patient || {};
  const overallProgress = dashboard?.overall_progress || {};
  const recentActivity = dashboard?.recent_activity || [];
  const session = dashboard?.latest_session || null;

  const totalAttempts = Number(
    overallProgress.total_attempts || 0
  );

  const correctAttempts = Number(
    overallProgress.correct_attempts || 0
  );

  const accuracy = Number(
    overallProgress.accuracy_percent || 0
  );

  const totalGamesCompleted = Number(
    overallProgress.total_games_completed || 0
  );

  const sessionId =
    session?.session_id ??
    session?.id ??
    null;

  const sessionProgress = Number(
    session?.progress_percent || 0
  );

  const graphNodes = memoryGraph?.nodes || [];
  const graphRelationships =
    memoryGraph?.relationships || [];

  const graphStats = memoryGraph?.stats || {};

  const nodeMap = graphNodes.reduce((map, node) => {
    map[node.id] = node;
    return map;
  }, {});

  const graphConnections = graphRelationships
    .filter(
      (relationship) =>
        relationship.type !== "shares_fact"
    )
    .map((relationship) => {
      const source = nodeMap[relationship.source];
      const target = nodeMap[relationship.target];

      if (!source || !target) {
        return null;
      }

      return {
        source,
        target,
        type: relationship.type,
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  const formatRelationship = (type) => {
    const labels = {
      mentions_person: "mentions",
      has_family_role: "has family role",
      happened_at: "happened at",
      describes_event: "describes",
      includes_activity: "includes",
      shares_fact: "shares a fact with",
    };

    return labels[type] || type.replaceAll("_", " ");
  };

  const getNodeIcon = (type) => {
    const icons = {
      memory: "🧠",
      person: "👤",
      family_role: "👨‍👩‍👧",
      place: "📍",
      event: "🎉",
      activity: "☕",
    };

    return icons[type] || "•";
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f5ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#57765f",
          fontSize: "18px",
          fontWeight: "700",
        }}
      >
        Loading caregiver dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f5ef",
          padding: "40px 7%",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "100px auto",
            background: "#fffdf9",
            border: "1px solid #e8e1d5",
            borderRadius: "20px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#28352f",
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              color: "#a05a45",
              lineHeight: "1.6",
            }}
          >
            {error}
          </p>

          <button
            onClick={loadDashboard}
            style={{
              border: "none",
              borderRadius: "10px",
              background: "#57765f",
              color: "#ffffff",
              padding: "12px 18px",
              fontWeight: "700",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Try Again
          </button>

          <button
            onClick={onLogout}
            style={{
              border: "1px solid #bfccbf",
              borderRadius: "10px",
              background: "transparent",
              color: "#46634f",
              padding: "12px 18px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .dashboard-page {
            min-height: 100vh;
            background: #f8f5ef;
            padding: 45px 7%;
            color: #28352f;
            font-family: Arial, Helvetica, sans-serif;
          }

          .dashboard-container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 32px;
          }

          .dashboard-header-content {
            min-width: 0;
          }

          .dashboard-label {
            margin: 0 0 8px;
            color: #57765f;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .dashboard-title {
            margin: 0 0 10px;
            color: #28352f;
            font-size: 44px;
            line-height: 1.1;
          }

          .dashboard-subtitle {
            margin: 0;
            max-width: 650px;
            color: #66736b;
            font-size: 18px;
            line-height: 1.6;
          }

          .dashboard-logout {
            border: 1px solid #bfccbf;
            background: transparent;
            color: #46634f;
            padding: 11px 18px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 700;
            white-space: nowrap;
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 25px;
          }

          .dashboard-stat {
            background: #fffdf9;
            border: 1px solid #e8e1d5;
            border-radius: 18px;
            padding: 22px;
            min-width: 0;
          }

          .dashboard-stat-label {
            margin: 0 0 8px;
            color: #8a968e;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }

          .dashboard-stat-value {
            margin: 0;
            color: #28352f;
            font-size: 26px;
            font-weight: 700;
            overflow-wrap: anywhere;
          }

          .dashboard-main-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
            gap: 25px;
            align-items: start;
          }

          .dashboard-panel {
            background: #fffdf9;
            border: 1px solid #e8e1d5;
            border-radius: 20px;
            padding: 28px;
            min-width: 0;
          }

          .dashboard-panel-title {
            margin: 0 0 20px;
            color: #28352f;
            font-size: 22px;
          }

          .dashboard-patient-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .dashboard-info-box {
            background: #f4f6f1;
            border-radius: 14px;
            padding: 16px;
            min-width: 0;
          }

          .dashboard-info-label {
            margin: 0 0 5px;
            color: #8a968e;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .dashboard-info-value {
            margin: 0;
            color: #28352f;
            font-size: 17px;
            font-weight: 700;
            overflow-wrap: anywhere;
          }

          .dashboard-actions {
            display: grid;
            gap: 12px;
          }

          .dashboard-action-button {
            width: 100%;
            min-height: 52px;
            border-radius: 12px;
            padding: 14px 18px;
            cursor: pointer;
            font-weight: 700;
            text-align: left;
          }

          .dashboard-primary-action {
            border: none;
            background: #57765f;
            color: #ffffff;
          }

          .dashboard-secondary-action {
            border: 1px solid #bfccbf;
            background: transparent;
            color: #46634f;
          }

          .dashboard-session {
            background: #f4f6f1;
            border-radius: 14px;
            padding: 18px;
          }

          .dashboard-session-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .dashboard-session-label {
            margin: 0 0 5px;
            color: #8a968e;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .dashboard-session-value {
            margin: 0;
            color: #28352f;
            font-size: 18px;
            font-weight: 700;
          }

          .dashboard-progress-bar {
            width: 100%;
            height: 10px;
            margin-top: 15px;
            border-radius: 999px;
            background: #e4e9e3;
            overflow: hidden;
          }

          .dashboard-progress-fill {
            height: 100%;
            border-radius: 999px;
            background: #57765f;
          }

          .dashboard-activity {
            margin-top: 25px;
          }

          .dashboard-activity-list {
            display: grid;
            gap: 11px;
          }

          .dashboard-activity-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #f8f6f1;
            border-radius: 12px;
            padding: 14px;
          }

          .dashboard-activity-icon {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            border-radius: 10px;
            background: #edf3ed;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dashboard-activity-content {
            min-width: 0;
          }

          .dashboard-activity-title {
            margin: 0 0 4px;
            color: #28352f;
            font-weight: 700;
            overflow-wrap: anywhere;
          }

          .dashboard-activity-text {
            margin: 0;
            color: #738078;
            font-size: 14px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .dashboard-empty {
            margin: 0;
            color: #738078;
            line-height: 1.6;
          }

          .memory-graph-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 20px;
          }

          .memory-graph-stat {
            padding: 14px;
            background: #f4f6f1;
            border-radius: 12px;
            min-width: 0;
          }

          .memory-graph-stat-label {
            margin: 0 0 5px;
            color: #8a968e;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .memory-graph-stat-value {
            margin: 0;
            color: #28352f;
            font-size: 20px;
            font-weight: 700;
          }

          .memory-graph-connections {
            display: grid;
            gap: 10px;
          }

          .memory-graph-connection {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            padding: 12px;
            border-radius: 12px;
            background: #f8f6f1;
          }

          .memory-graph-node {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 10px;
            border-radius: 999px;
            background: #edf3ed;
            color: #46634f;
            font-size: 13px;
            font-weight: 700;
            max-width: 100%;
          }

          .memory-graph-node span:last-child {
            overflow-wrap: anywhere;
          }

          .memory-graph-arrow {
            color: #8a968e;
            font-size: 13px;
            font-weight: 700;
          }

          .memory-graph-loading {
            color: #57765f;
            font-weight: 700;
          }

          .memory-graph-error {
            margin: 0;
            color: #a05a45;
            font-weight: 700;
            line-height: 1.5;
          }

          @media (max-width: 900px) {
            .dashboard-page {
              padding: 40px 5%;
            }

            .dashboard-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .dashboard-main-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .dashboard-page {
              padding: 70px 16px 35px;
            }

            .dashboard-header {
              flex-direction: column;
              gap: 18px;
              margin-bottom: 25px;
            }

            .dashboard-title {
              font-size: 34px;
            }

            .dashboard-subtitle {
              font-size: 16px;
            }

            .dashboard-logout {
              width: 100%;
            }

            .dashboard-grid {
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .dashboard-stat {
              padding: 18px;
            }

            .dashboard-stat-value {
              font-size: 22px;
            }

            .dashboard-patient-row {
              grid-template-columns: 1fr;
            }

            .dashboard-panel {
              padding: 20px;
              border-radius: 18px;
            }

            .dashboard-session-row {
              align-items: flex-start;
              flex-direction: column;
            }

            .memory-graph-stats {
              grid-template-columns: 1fr 1fr;
            }

            .memory-graph-connection {
              align-items: flex-start;
            }
          }

          @media (max-width: 390px) {
            .dashboard-page {
              padding-left: 12px;
              padding-right: 12px;
            }

            .dashboard-grid {
              grid-template-columns: 1fr;
            }

            .dashboard-stat {
              padding: 17px;
            }

            .dashboard-title {
              font-size: 32px;
            }

            .memory-graph-stats {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <p className="dashboard-label">
                SMRITI AI · CAREGIVER DASHBOARD
              </p>

              <h1 className="dashboard-title">
                Care that remembers.
              </h1>

              <p className="dashboard-subtitle">
                Monitor personalized cognitive care, review
                progress, and manage meaningful memories for
                your loved one.
              </p>
            </div>

            <button
              className="dashboard-logout"
              onClick={onLogout}
            >
              Log Out
            </button>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Patient
              </p>

              <p className="dashboard-stat-value">
                {patient.full_name || "Test Patient"}
              </p>
            </div>

            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Language
              </p>

              <p className="dashboard-stat-value">
                {patient.language || "English"}
              </p>
            </div>

            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Accuracy
              </p>

              <p className="dashboard-stat-value">
                {accuracy.toFixed(
                  accuracy % 1 ? 1 : 0
                )}
                %
              </p>
            </div>

            <div className="dashboard-stat">
              <p className="dashboard-stat-label">
                Attempts
              </p>

              <p className="dashboard-stat-value">
                {totalAttempts}
              </p>
            </div>
          </div>

          <div className="dashboard-main-grid">
            <div>
              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Patient Overview
                </h2>

                <div className="dashboard-patient-row">
                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Patient Name
                    </p>

                    <p className="dashboard-info-value">
                      {patient.full_name || "Test Patient"}
                    </p>
                  </div>

                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Age
                    </p>

                    <p className="dashboard-info-value">
                      {patient.age
                        ? `${patient.age} years`
                        : "Not available"}
                    </p>
                  </div>

                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Language
                    </p>

                    <p className="dashboard-info-value">
                      {patient.language || "English"}
                    </p>
                  </div>

                  <div className="dashboard-info-box">
                    <p className="dashboard-info-label">
                      Caregiver
                    </p>

                    <p className="dashboard-info-value">
                      {patient.caregiver_name ||
                        "Test Caregiver"}
                    </p>
                  </div>
                </div>

                <div className="dashboard-activity">
                  <h3
                    style={{
                      margin: "0 0 14px",
                      color: "#28352f",
                      fontSize: "18px",
                    }}
                  >
                    Recent Activity
                  </h3>

                  {recentActivity.length === 0 ? (
                    <p className="dashboard-empty">
                      No recent activity yet.
                    </p>
                  ) : (
                    <div className="dashboard-activity-list">
                      {recentActivity
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div
                            className="dashboard-activity-item"
                            key={
                              activity.id ??
                              activity.attempt_id ??
                              index
                            }
                          >
                            <div className="dashboard-activity-icon">
                              {activity.correct ? "✓" : "🧠"}
                            </div>

                            <div className="dashboard-activity-content">
                              <p className="dashboard-activity-title">
                                {activity.game_type ||
                                  activity.type ||
                                  "Therapy activity"}
                              </p>

                              <p className="dashboard-activity-text">
                                {activity.correct
                                  ? "Correct answer"
                                  : activity.score !== undefined
                                  ? `Score: ${activity.score}`
                                  : "Activity completed"}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="dashboard-panel"
                style={{ marginTop: "25px" }}
              >
                <h2 className="dashboard-panel-title">
                  Memory Connections
                </h2>

                <p
                  style={{
                    margin: "-8px 0 20px",
                    color: "#66736b",
                    lineHeight: "1.6",
                  }}
                >
                  Smriti AI connects memories with the people,
                  places, events, family roles, and activities
                  that make them meaningful.
                </p>

                {graphLoading ? (
                  <p className="memory-graph-loading">
                    Building memory connections...
                  </p>
                ) : graphError ? (
                  <p className="memory-graph-error">
                    {graphError}
                  </p>
                ) : (
                  <>
                    <div className="memory-graph-stats">
                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Memories
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.memory_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Places
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.place_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Events
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.event_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Activities
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.activity_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Family Roles
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.family_role_count ??
                            graphStats.relationship_count ??
                            0}
                        </p>
                      </div>

                      <div className="memory-graph-stat">
                        <p className="memory-graph-stat-label">
                          Connections
                        </p>

                        <p className="memory-graph-stat-value">
                          {graphStats.connection_count ??
                            0}
                        </p>
                      </div>
                    </div>

                    {graphConnections.length === 0 ? (
                      <p className="dashboard-empty">
                        Add more detailed memories to build
                        stronger connections.
                      </p>
                    ) : (
                      <div className="memory-graph-connections">
                        {graphConnections.map(
                          (connection, index) => (
                            <div
                              className="memory-graph-connection"
                              key={`${connection.source.id}-${connection.target.id}-${index}`}
                            >
                              <div className="memory-graph-node">
                                <span>
                                  {getNodeIcon(
                                    connection.source.type
                                  )}
                                </span>

                                <span>
                                  {connection.source.value}
                                </span>
                              </div>

                              <span className="memory-graph-arrow">
                                {formatRelationship(
                                  connection.type
                                )} →
                              </span>

                              <div className="memory-graph-node">
                                <span>
                                  {getNodeIcon(
                                    connection.target.type
                                  )}
                                </span>

                                <span>
                                  {connection.target.value}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "25px",
              }}
            >
              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Progress
                </h2>

                <div className="dashboard-session">
                  <div className="dashboard-session-row">
                    <div>
                      <p className="dashboard-session-label">
                        Correct Attempts
                      </p>

                      <p className="dashboard-session-value">
                        {correctAttempts} / {totalAttempts}
                      </p>
                    </div>

                    <div
                      style={{
                        color: "#57765f",
                        fontSize: "24px",
                        fontWeight: "700",
                      }}
                    >
                      {accuracy.toFixed(
                        accuracy % 1 ? 1 : 0
                      )}
                      %
                    </div>
                  </div>

                  <div className="dashboard-progress-bar">
                    <div
                      className="dashboard-progress-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(accuracy, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p
                    style={{
                      margin: "12px 0 0",
                      color: "#738078",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    {totalGamesCompleted} therapy games
                    completed overall.
                  </p>
                </div>
              </div>

              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Latest Therapy Session
                </h2>

                {session ? (
                  <div className="dashboard-session">
                    <p className="dashboard-session-label">
                      Session
                    </p>

                    <p className="dashboard-session-value">
                      {sessionId
                        ? `Therapy Session #${sessionId}`
                        : "Recent Therapy Session"}
                    </p>

                    <p
                      style={{
                        margin: "10px 0 0",
                        color: "#738078",
                        lineHeight: "1.5",
                      }}
                    >
                      {session.completed_games ?? 0} of{" "}
                      {session.total_games ?? 0} games
                      completed
                    </p>

                    <div className="dashboard-progress-bar">
                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${Math.min(
                            Math.max(sessionProgress, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <p
                      style={{
                        margin: "10px 0 0",
                        color: "#57765f",
                        fontWeight: "700",
                        textTransform: "capitalize",
                      }}
                    >
                      {session.status || "active"}
                    </p>
                  </div>
                ) : (
                  <p className="dashboard-empty">
                    No therapy session recorded yet.
                  </p>
                )}
              </div>

              <div className="dashboard-panel">
                <h2 className="dashboard-panel-title">
                  Quick Actions
                </h2>

                <div className="dashboard-actions">
                  <button
                    className="dashboard-action-button dashboard-primary-action"
                    onClick={onOpenMemoryVault}
                  >
                    📖 Open Memory Vault
                  </button>

                  <button
                    className="dashboard-action-button dashboard-secondary-action"
                    onClick={onOpenVoiceMemory}
                  >
                    🎙 Record a Voice Memory
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;