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

  const loadMemories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/memories/?patient_id=${PATIENT_ID}`
      );

      if (!response.ok) {
        throw new Error("Could not load memories.");
      }

      const data = await response.json();
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
        `${API_URL}/caregiver/dashboard/${PATIENT_ID}`
      );

      if (!response.ok) {
        throw new Error("Could not load patient language.");
      }

      const data = await response.json();
      const patientLanguage = data?.patient?.language;

      if (patientLanguage) {
        setLanguage(patientLanguage);
      }
    } catch (error) {
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
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
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
          Memory Vault
        </h1>

        <p
          style={{
            color: "#66736b",
            fontSize: "18px",
            lineHeight: "1.6",
            marginBottom: "15px",
          }}
        >
          Add meaningful memories that can later become
          personalized cognitive activities.
        </p>

        <p
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "25px",
            alignItems: "start",
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
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Family Wedding"
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #d9dfd8",
                  borderRadius: "10px",
                  fontSize: "16px",
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
                Memory
              </label>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Tell us about this memory..."
                required
                rows="6"
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #d9dfd8",
                  borderRadius: "10px",
                  fontSize: "16px",
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
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #d9dfd8",
                  borderRadius: "10px",
                  fontSize: "16px",
                  marginBottom: "24px",
                  background: "#fffdf9",
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
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#57765f",
                  color: "#ffffff",
                  fontSize: "17px",
                  fontWeight: "700",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
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
                style={{
                  background: "#fffdf9",
                  border: "1px solid #e8e1d5",
                  borderRadius: "20px",
                  padding: "28px",
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
                      key={memory.id}
                      style={{
                        background: "#fffdf9",
                        border: "1px solid #e8e1d5",
                        borderRadius: "18px",
                        padding: "22px",
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
                        }}
                      >
                        {memory.title}
                      </h3>

                      <p
                        style={{
                          margin: "0 0 16px",
                          color: "#66736b",
                          lineHeight: "1.6",
                        }}
                      >
                        {memory.content}
                      </p>

                      {!game && (
                        <button
                          onClick={() =>
                            generateGame(memory.id)
                          }
                          disabled={
                            gameLoading === memory.id ||
                            loadingLanguage
                          }
                          style={{
                            padding: "12px 16px",
                            border: "none",
                            borderRadius: "10px",
                            background: "#57765f",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: "700",
                            cursor:
                              gameLoading === memory.id ||
                              loadingLanguage
                                ? "not-allowed"
                                : "pointer",
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
                          }}
                        >
                          {gameMessage}
                        </p>
                      )}

                      {game && (
                        <div
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
                                  key={index}
                                  onClick={() =>
                                    checkAnswer(
                                      memory.id,
                                      option
                                    )
                                  }
                                  style={{
                                    padding: "13px",
                                    borderRadius: "10px",
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
                                    color: "#28352f",
                                    fontSize: "15px",
                                    cursor: "pointer",
                                    textAlign: "left",
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
  );
}

export default MemoryVault;