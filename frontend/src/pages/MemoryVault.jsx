import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function MemoryVault() {
  const [memories, setMemories] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("family");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [games, setGames] = useState({});
  const [gameLoading, setGameLoading] = useState(null);
  const [gameMessages, setGameMessages] = useState({});

  const [language, setLanguage] = useState("English");
  const [loadingLanguage, setLoadingLanguage] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("smriti_token");

    if (!token) {
      throw new Error("Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const loadMemories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/memories/?patient_id=${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load memories."
        );
      }

      setMemories(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientLanguage = async () => {
    try {
      const response = await fetch(
        `${API_URL}/caregiver/dashboard/${PATIENT_ID}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load patient language."
        );
      }

      const patientLanguage = data?.patient?.language;

      if (patientLanguage) {
        setLanguage(patientLanguage);
      }
    } catch (error) {
      setMessage(error.message);
      setLanguage("English");
    } finally {
      setLoadingLanguage(false);
    }
  };

  useEffect(() => {
    loadMemories();
    loadPatientLanguage();
  }, []);

  const saveMemory = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/memories/`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: PATIENT_ID,
          title,
          content,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not save memory."
        );
      }

      setMemories((current) => [data, ...current]);
      setTitle("");
      setContent("");
      setCategory("family");
      setMessage("✓ Memory saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const generateGame = async (memoryId) => {
    setGameLoading(memoryId);

    setGameMessages((current) => ({
      ...current,
      [memoryId]: "",
    }));

    try {
      const response = await fetch(
        `${API_URL}/games/generate/${memoryId}?difficulty=easy&language=${encodeURIComponent(
          language
        )}`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not create the therapy game."
        );
      }

      setGames((current) => ({
        ...current,
        [memoryId]: {
          ...data,
          selectedAnswer: "",
        },
      }));
    } catch (error) {
      setGameMessages((current) => ({
        ...current,
        [memoryId]: error.message,
      }));
    } finally {
      setGameLoading(null);
    }
  };

  const checkAnswer = async (memoryId, answer) => {
    const game = games[memoryId];

    if (!game) {
      return;
    }

    setGames((current) => ({
      ...current,
      [memoryId]: {
        ...current[memoryId],
        selectedAnswer: answer,
      },
    }));

    try {
      const response = await fetch(
        `${API_URL}/games/check-answer`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            game_id: game.game_id,
            answer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not check the answer."
        );
      }

      setGameMessages((current) => ({
        ...current,
        [memoryId]: data.correct
          ? "✓ Correct! Great job."
          : "Take another look at the memory and try again.",
      }));
    } catch (error) {
      setGameMessages((current) => ({
        ...current,
        [memoryId]: error.message,
      }));
    }
  };

  return (
    <>
      <style>
        {`
          .memory-vault-page {
            min-height: 100vh;
            background: #f8f5ef;
            padding: 45px 7%;
            color: #28352f;
            font-family: Arial, Helvetica, sans-serif;
          }

          .memory-vault-container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .memory-vault-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 25px;
            align-items: start;
          }

          .memory-vault-panel {
            background: #fffdf9;
            border: 1px solid #e8e1d5;
            border-radius: 20px;
            padding: 28px;
            min-width: 0;
          }

          .memory-vault-input {
            width: 100%;
            padding: 14px;
            border: 1px solid #d9dfd8;
            border-radius: 10px;
            font-size: 16px;
            background: #fffdf9;
            color: #28352f;
          }

          .memory-vault-input:focus {
            outline: none;
            border-color: #57765f;
            box-shadow: 0 0 0 3px rgba(87, 118, 95, 0.1);
          }

          .memory-vault-save-button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 12px;
            background: #57765f;
            color: #ffffff;
            font-size: 17px;
            font-weight: 700;
          }

          .memory-vault-game-button {
            padding: 12px 16px;
            border: none;
            border-radius: 10px;
            background: #57765f;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
          }

          .memory-vault-option {
            width: 100%;
            padding: 13px;
            border-radius: 10px;
            color: #28352f;
            font-size: 15px;
            cursor: pointer;
            text-align: left;
          }

          @media (max-width: 900px) {
            .memory-vault-page {
              padding: 40px 5%;
            }

            .memory-vault-layout {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .memory-vault-page {
              padding: 70px 16px 35px;
            }

            .memory-vault-container {
              width: 100%;
            }

            .memory-vault-layout {
              display: flex;
              flex-direction: column;
              gap: 18px;
            }

            .memory-vault-panel {
              width: 100%;
              padding: 20px;
              border-radius: 18px;
            }

            .memory-vault-title {
              font-size: 34px !important;
            }

            .memory-vault-description {
              font-size: 16px !important;
            }

            .memory-vault-language {
              margin-bottom: 25px !important;
            }

            .memory-vault-memory-card {
              padding: 18px !important;
            }

            .memory-vault-game {
              padding: 16px !important;
            }

            .memory-vault-option {
              min-height: 48px;
              font-size: 15px;
            }
          }

          @media (max-width: 390px) {
            .memory-vault-page {
              padding-left: 12px;
              padding-right: 12px;
            }

            .memory-vault-panel {
              padding: 18px;
            }

            .memory-vault-title {
              font-size: 32px !important;
            }
          }
        `}
      </style>

      <div className="memory-vault-page">
        <div className="memory-vault-container">
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
            className="memory-vault-title"
            style={{
              color: "#28352f",
              fontSize: "44px",
              margin: "0 0 10px",
            }}
          >
            Memory Vault
          </h1>

          <p
            className="memory-vault-description"
            style={{
              color: "#66736b",
              fontSize: "18px",
              lineHeight: "1.6",
              marginBottom: "15px",
              maxWidth: "700px",
            }}
          >
            Add meaningful memories that can later become
            personalized cognitive activities.
          </p>

          <p
            className="memory-vault-language"
            style={{
              color: "#57765f",
              fontSize: "15px",
              fontWeight: "700",
              marginBottom: "35px",
            }}
          >
            {loadingLanguage
              ? "Loading patient language..."
              : `Patient language: ${language}`}
          </p>

          <div className="memory-vault-layout">
            <div className="memory-vault-panel">
              <h2
                style={{
                  color: "#28352f",
                  marginTop: 0,
                  marginBottom: "22px",
                }}
              >
                Add a Memory
              </h2>

              <form onSubmit={saveMemory}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#46634f",
                    marginBottom: "8px",
                  }}
                >
                  Memory title
                </label>

                <input
                  className="memory-vault-input"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Family Wedding"
                  required
                  style={{ marginBottom: "20px" }}
                />

                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#46634f",
                    marginBottom: "8px",
                  }}
                >
                  Memory
                </label>

                <textarea
                  className="memory-vault-input"
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder="Tell us about this memory..."
                  required
                  rows="6"
                  style={{
                    resize: "vertical",
                    marginBottom: "20px",
                  }}
                />

                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#46634f",
                    marginBottom: "8px",
                  }}
                >
                  Category
                </label>

                <select
                  className="memory-vault-input"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  style={{
                    marginBottom: "24px",
                  }}
                >
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                  <option value="places">Places</option>
                  <option value="events">Events</option>
                  <option value="food">Food</option>
                  <option value="travel">Travel</option>
                  <option value="other">Other</option>
                </select>

                <button
                  type="submit"
                  className="memory-vault-save-button"
                  disabled={saving}
                  style={{
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Memory"}
                </button>
              </form>

              {message && (
                <p
                  style={{
                    marginTop: "18px",
                    color: message.startsWith("✓")
                      ? "#57765f"
                      : "#a05a45",
                    fontWeight: "700",
                  }}
                >
                  {message}
                </p>
              )}
            </div>

            <div>
              <h2
                style={{
                  color: "#28352f",
                  marginTop: 0,
                  marginBottom: "20px",
                }}
              >
                Saved Memories
              </h2>

              {loading ? (
                <p style={{ color: "#66736b" }}>
                  Loading memories...
                </p>
              ) : memories.length === 0 ? (
                <div
                  className="memory-vault-panel"
                  style={{
                    color: "#66736b",
                  }}
                >
                  No memories added yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "15px",
                  }}
                >
                  {memories.map((memory) => {
                    const game = games[memory.id];
                    const gameMessage =
                      gameMessages[memory.id];

                    return (
                      <div
                        className="memory-vault-memory-card"
                        key={memory.id}
                        style={{
                          background: "#fffdf9",
                          border: "1px solid #e8e1d5",
                          borderRadius: "18px",
                          padding: "22px",
                          minWidth: 0,
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 7px",
                            color: "#8a968e",
                            fontSize: "12px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          {memory.category || "Memory"}
                        </p>

                        <h3
                          style={{
                            margin: "0 0 10px",
                            color: "#28352f",
                            fontSize: "22px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {memory.title}
                        </h3>

                        <p
                          style={{
                            margin: "0 0 16px",
                            color: "#66736b",
                            lineHeight: "1.6",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {memory.content}
                        </p>

                        {!game && (
                          <button
                            className="memory-vault-game-button"
                            onClick={() =>
                              generateGame(memory.id)
                            }
                            disabled={
                              gameLoading === memory.id ||
                              loadingLanguage
                            }
                            style={{
                              cursor:
                                gameLoading === memory.id ||
                                loadingLanguage
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                gameLoading === memory.id ||
                                loadingLanguage
                                  ? 0.7
                                  : 1,
                            }}
                          >
                            {gameLoading === memory.id
                              ? "Creating game..."
                              : loadingLanguage
                              ? "Loading language..."
                              : "Create Therapy Game →"}
                          </button>
                        )}

                        {!game && gameMessage && (
                          <p
                            style={{
                              margin: "14px 0 0",
                              color: "#a05a45",
                              fontWeight: "700",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {gameMessage}
                          </p>
                        )}

                        {game && (
                          <div
                            className="memory-vault-game"
                            style={{
                              marginTop: "18px",
                              padding: "18px",
                              borderRadius: "14px",
                              background: "#f4f6f1",
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 8px",
                                color: "#8a968e",
                                fontSize: "12px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                              }}
                            >
                              Personalized Game · {language}
                            </p>

                            <h4
                              style={{
                                margin: "0 0 15px",
                                color: "#28352f",
                                fontSize: "19px",
                                lineHeight: "1.4",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {game.question}
                            </h4>

                            <div
                              style={{
                                display: "grid",
                                gap: "9px",
                              }}
                            >
                              {game.options?.map(
                                (option, index) => (
                                  <button
                                    className="memory-vault-option"
                                    key={index}
                                    onClick={() =>
                                      checkAnswer(
                                        memory.id,
                                        option
                                      )
                                    }
                                    style={{
                                      border:
                                        game.selectedAnswer ===
                                        option
                                          ? "2px solid #57765f"
                                          : "1px solid #d9dfd8",
                                      background:
                                        game.selectedAnswer ===
                                        option
                                          ? "#edf3ed"
                                          : "#fffdf9",
                                    }}
                                  >
                                    {option}
                                  </button>
                                )
                              )}
                            </div>

                            {gameMessage && (
                              <p
                                style={{
                                  margin: "14px 0 0",
                                  color:
                                    gameMessage.startsWith("✓")
                                      ? "#57765f"
                                      : "#9a6a45",
                                  fontWeight: "700",
                                  lineHeight: "1.5",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {gameMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MemoryVault;