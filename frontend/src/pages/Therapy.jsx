import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function Therapy() {
const [language, setLanguage] = useState("English");
const [loadingLanguage, setLoadingLanguage] = useState(true);

const [session, setSession] = useState(null);
const [games, setGames] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);

const [selectedAnswer, setSelectedAnswer] = useState("");
const [answerResult, setAnswerResult] = useState(null);

const [loadingSession, setLoadingSession] = useState(false);
const [checkingAnswer, setCheckingAnswer] = useState(false);
const [completingGame, setCompletingGame] = useState(false);

const [message, setMessage] = useState("");

const [speaking, setSpeaking] = useState(false);
const [speakingOption, setSpeakingOption] = useState("");

const [wrongAttempts, setWrongAttempts] = useState(0);
const [comfortMemory, setComfortMemory] = useState(null);
const [showComfortMode, setShowComfortMode] = useState(false);
const [correctAnswers, setCorrectAnswers] = useState(0);

const getAuthHeaders = () => {
const token = localStorage.getItem("smriti_token");

    if (!token) {
        throw new Error("Please log in again.");
    }

    return {
        Authorization: `Bearer ${token}`,
    };
};

  useEffect(() => {
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
      } finally {
        setLoadingLanguage(false);
      }
    };

    loadPatientLanguage();
  }, []);

    useEffect(() => {
    const loadComfortMemory = async () => {
      try {
        const response = await fetch(
          `${API_URL}/memories/comfort/${PATIENT_ID}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setComfortMemory(data);
        }
      } catch (error) {
        console.error("Could not load comfort memory:", error);
      }
    };

    loadComfortMemory();
  }, []);

  const startTherapySession = async () => {
    setLoadingSession(true);
    setMessage("");
    setSession(null);
    setGames([]);
    setCurrentIndex(0);
    setSelectedAnswer("");
    setAnswerResult(null);
    setCorrectAnswers(0);

    try {
      const response = await fetch(
        `${API_URL}/therapy-sessions/daily/${PATIENT_ID}`,
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
          data.detail || "Could not start the therapy session."
        );
      }

      if (!data.games || data.games.length !== 5) {
        throw new Error(
          "The therapy session did not contain all 5 questions."
        );
      }

      setSession(data);
      setGames(data.games);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingSession(false);
    }
  };

  const completeCurrentGame = async (gameId) => {
    if (!session?.session_id || !gameId) {
      return;
    }

    setCompletingGame(true);

    try {
      const response = await fetch(
        `${API_URL}/therapy-sessions/${session.session_id}/games/${gameId}/complete`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not complete the therapy question."
        );
      }

      setSession((current) => ({
        ...(current || {}),
        completed_games: data.completed_games,
        total_games: data.total_games,
        status: data.status,
      }));

      return data;
    } finally {
      setCompletingGame(false);
    }
  };

  const checkAnswer = async (answer) => {
    const currentGame = games[currentIndex];

    if (!currentGame || checkingAnswer || answerResult) {
      return;
    }

    setSelectedAnswer(answer);
    setCheckingAnswer(true);
    setMessage("");

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
            game_id: currentGame.game_id,
            answer,
            session_id: session?.session_id,
          }),
        }
      );

      const result = await response.json();

      console.log("API Result:", result);
      console.log("Correct?", result.correct);
      
      

      if (!response.ok) {
        throw new Error(
          result.detail || "Could not check the answer."
        );
      }

      setAnswerResult(result);

      console.log("Wrong attempts:", wrongAttempts + 1);
      console.log("Comfort memory:", comfortMemory);

if (result.correct) {
  setCorrectAnswers((prev) => prev + 1);

  setWrongAttempts(0);
  setShowComfortMode(false);

  setMessage("✓ Correct! Great job.");
}

else {
  setWrongAttempts((prev) => {
    const attempts = prev + 1;

    if (attempts >= 2 && comfortMemory) {
      setShowComfortMode(true);
    }

    return attempts;
  });

  setMessage(
    "Take another look at the memory. You can continue when ready."
  );
}
    } catch (error) {
      setMessage(error.message);
      setSelectedAnswer("");
    } finally {
      setCheckingAnswer(false);
    }
  };

    const moveToNextQuestion = async () => {
  const currentGame = games[currentIndex];

  if (!currentGame || completingGame) {
    return;
  }

  try {
    await completeCurrentGame(currentGame.game_id);

    const nextIndex = currentIndex + 1;

    if (nextIndex >= games.length) {
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedAnswer("");
    setAnswerResult(null);
    setMessage("");

    setWrongAttempts(0);
    setShowComfortMode(false);
  } catch (error) {
    setMessage(error.message);
  }
};

  const speakText = async (text, option = "") => {
    if (!text || speaking) {
      return;
    }

    setSpeaking(true);
    setSpeakingOption(option);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/tts/speak?text=${encodeURIComponent(
          text
        )}&language=${encodeURIComponent(language)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail || "Could not generate audio."
        );
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
        setSpeakingOption("");
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
        setSpeakingOption("");
        setMessage("Could not play the audio.");
      };

      await audio.play();
    } catch (error) {
      setSpeaking(false);
      setSpeakingOption("");
      setMessage(error.message);
    }
  };

  const currentGame = games[currentIndex] || null;

  const getCognitiveTitle = (gameType) => {
    const titles = {
      multiple_choice: "Memory Recall",
      true_false: "Memory Check",
      fill_blank: "Recall Challenge",
      attention: "Attention Challenge",
      routine_recall: "Routine Recall",
      pattern_recognition: "Pattern Recognition",
      object_recognition: "Object Recognition",
      emotional_engagement: "Personal Memory",
    };

    return titles[gameType] || "Cognitive Activity";
  };

  const getCognitiveIcon = (gameType) => {
    const icons = {
      multiple_choice: "🧠",
      true_false: "🔎",
      fill_blank: "✍️",
      attention: "🎯",
      routine_recall: "🕰️",
      pattern_recognition: "🧩",
      object_recognition: "👀",
      emotional_engagement: "❤️",
    };

    return icons[gameType] || "🧠";
  };

  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return "Adaptive";

    return (
      difficulty.charAt(0).toUpperCase() +
      difficulty.slice(1)
    );
  };

  const isSessionComplete =
    games.length === 5 &&
    currentIndex >= games.length - 1 &&
    Boolean(answerResult);

  const sessionCompletedGames =
    session?.completed_games || 0;

  const sessionProgress =
    session?.total_games > 0
      ? Math.round(
          (sessionCompletedGames / session.total_games) * 100
        )
      : 0;

  return (
    <>
      <style>
        {`
          .therapy-page {
            min-height: 100vh;
            background: #f8f5ef;
            padding: 60px 7%;
            color: #28352f;
            font-family: Arial, Helvetica, sans-serif;
          }

          .therapy-container {
            max-width: 900px;
            margin: 0 auto;
          }

          .therapy-label {
            color: #57765f;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 1px;
            margin: 0 0 12px;
          }

          .therapy-title {
            color: #28352f;
            font-size: 46px;
            line-height: 1.1;
            margin: 0 0 16px;
          }

          .therapy-description {
            color: #66736b;
            font-size: 18px;
            line-height: 1.7;
            max-width: 650px;
            margin: 0;
          }

          .therapy-language {
            margin-top: 18px;
            color: #57765f;
            font-size: 15px;
            font-weight: 700;
          }

          .therapy-start-button {
            margin-top: 35px;
            padding: 15px 24px;
            border: none;
            border-radius: 12px;
            background: #57765f;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }

          .therapy-session-card {
            margin-top: 40px;
            background: #fffdf9;
            border: 1px solid #e8e1d5;
            border-radius: 24px;
            padding: 35px;
            box-shadow: 0 18px 50px rgba(48, 59, 52, 0.08);
          }

          .therapy-session-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 24px;
          }

          .therapy-progress-text {
            color: #57765f;
            font-weight: 700;
            white-space: nowrap;
          }

          .therapy-progress-bar {
            width: 100%;
            height: 10px;
            margin: 0 0 28px;
            border-radius: 999px;
            background: #e4e9e3;
            overflow: hidden;
          }

          .therapy-progress-fill {
            height: 100%;
            border-radius: 999px;
            background: #57765f;
          }

          .therapy-game-label {
            color: #8a968e;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 10px;
          }

          .therapy-cognitive-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: #edf3ed;
            color: #46634f;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 14px;
          }

          .therapy-cognitive-badge-icon {
            font-size: 17px;
          }

          .therapy-session-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }

          .therapy-meta-pill {
            display: inline-flex;
            align-items: center;
            padding: 7px 10px;
            border-radius: 999px;
            background: #f4f6f1;
            color: #66736b;
            font-size: 12px;
            font-weight: 700;
          }

          .therapy-memory-title {
            color: #57765f;
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 18px;
          }

          .therapy-question {
            color: #28352f;
            font-size: 30px;
            line-height: 1.45;
            margin: 0 0 18px;
            overflow-wrap: anywhere;
          }

          .therapy-listen-button {
            margin-bottom: 24px;
            padding: 12px 18px;
            border: 1px solid #57765f;
            border-radius: 10px;
            background: #fffdf9;
            color: #57765f;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }

          .therapy-options {
            display: grid;
            gap: 12px;
          }

          .therapy-option-row {
            display: flex;
            gap: 10px;
            align-items: stretch;
          }

          .therapy-option-button {
            flex: 1;
            min-width: 0;
            padding: 16px;
            border-radius: 12px;
            font-size: 17px;
            text-align: left;
            overflow-wrap: anywhere;
          }

          .therapy-audio-button {
            width: 58px;
            border-radius: 12px;
            border: 1px solid #57765f;
            background: #fffdf9;
            color: #57765f;
            font-size: 20px;
            cursor: pointer;
          }

          .therapy-feedback {
            margin-top: 22px;
            padding: 15px;
            border-radius: 12px;
            background: #f4f6f1;
            font-weight: 700;
            line-height: 1.5;
          }

          .therapy-next-button {
            margin-top: 18px;
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 12px;
            background: #57765f;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }

          .therapy-complete {
            text-align: center;
            padding: 20px 5px;
          }

          .therapy-complete-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }

          .therapy-complete h2 {
            margin: 0 0 12px;
            color: #28352f;
            font-size: 32px;
          }

          .therapy-complete p {
            margin: 0;
            color: #66736b;
            line-height: 1.6;
          }

          .therapy-message {
            margin-top: 22px;
            color: #a05a45;
            font-weight: 700;
            font-size: 16px;
            line-height: 1.5;
          }

          @media (max-width: 600px) {
            .therapy-page {
              padding: 70px 16px 35px;
            }

            .therapy-title {
              font-size: 34px;
            }

            .therapy-description {
              font-size: 16px;
            }

            .therapy-session-card {
              padding: 20px;
              border-radius: 18px;
            }

            .therapy-session-header {
              flex-direction: column;
              gap: 8px;
            }

            .therapy-question {
              font-size: 24px;
            }

            .therapy-session-meta {
              align-items: flex-start;
            }

            .therapy-cognitive-badge {
              font-size: 13px;
            }

            .therapy-option-button {
              font-size: 16px;
              padding: 14px;
            }
          }

          @media (max-width: 390px) {
            .therapy-page {
              padding-left: 12px;
              padding-right: 12px;
            }

            .therapy-title {
              font-size: 32px;
            }

            .therapy-question {
              font-size: 22px;
            }

            .therapy-audio-button {
              width: 52px;
            }
          }
        `}
      </style>

      <div className="therapy-page">
        <div className="therapy-container">
          <p className="therapy-label">
            SMRITI AI
          </p>

          <h1 className="therapy-title">
            Today&apos;s Therapy Session
          </h1>

          <p className="therapy-description">
            A gentle cognitive activity created from familiar
            memories. Take your time and enjoy the memory.
          </p>

          <p className="therapy-language">
            {loadingLanguage
              ? "Loading patient language..."
              : `Patient language: ${language}`}
          </p>

          {!session && (
            <button
              className="therapy-start-button"
              onClick={startTherapySession}
              disabled={
                loadingSession || loadingLanguage
              }
              style={{
                cursor:
                  loadingSession || loadingLanguage
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loadingSession || loadingLanguage
                    ? 0.7
                    : 1,
              }}
            >
              {loadingSession
                ? "Creating 5-question session..."
                : loadingLanguage
                ? "Loading language..."
                : "Start 5-Question Session →"}
            </button>
          )}

          {session && !isSessionComplete && currentGame && (
            <div className="therapy-session-card">
              <div className="therapy-session-header">
                <div>
                  <p className="therapy-game-label">
                    Question {currentIndex + 1} of{" "}
                    {games.length}
                  </p>

                  <p className="therapy-memory-title">
                    Memory: {currentGame.memory_title}
                  </p>
                </div>

                <div className="therapy-progress-text">
                  {sessionCompletedGames} /{" "}
                  {session.total_games} completed
                </div>
              </div>

              <div className="therapy-progress-bar">
                <div
                  className="therapy-progress-fill"
                  style={{
                    width: `${sessionProgress}%`,
                  }}
                />
              </div>

              <div className="therapy-cognitive-badge">
                <span className="therapy-cognitive-badge-icon">
                  {getCognitiveIcon(currentGame.game_type)}
                </span>

                <span>
                  {getCognitiveTitle(currentGame.game_type)}
                </span>
              </div>

              <div className="therapy-session-meta">
                <span className="therapy-meta-pill">
                  🌐 {language}
                </span>

                <span className="therapy-meta-pill">
                  ⚡ {getDifficultyLabel(currentGame.difficulty)}
                </span>
              </div>

              <h2 className="therapy-question">
                {currentGame.question}
              </h2>

              <button
                className="therapy-listen-button"
                onClick={() =>
                  speakText(currentGame.question)
                }
                disabled={speaking}
                style={{
                  cursor: speaking
                    ? "not-allowed"
                    : "pointer",
                  opacity: speaking ? 0.7 : 1,
                }}
              >
                {speaking && !speakingOption
                  ? "🔊 Speaking..."
                  : "🔊 Listen to Question"}
              </button>

              {showComfortMode && comfortMemory && (
  <div
    style={{
      marginBottom: "24px",
      padding: "20px",
      borderRadius: "16px",
      background: "#fff7ed",
      border: "2px solid #f59e0b",
    }}
  >
    <h3>❤️ Memory Comfort Mode</h3>

    <p>
      That's okay. Let's take a little memory break.
    </p>

    <h4>{comfortMemory.title}</h4>

    <p>{comfortMemory.content}</p>

    <button
      className="therapy-listen-button"
      onClick={() => speakText(comfortMemory.content)}
      disabled={speaking}
    >
      {speaking
        ? "🔊 Speaking..."
        : "🔊 Read Comfort Memory"}
    </button>
  </div>
)}

              <div className="therapy-options">
                {currentGame.options?.map(
                  (option, index) => (
                    <div
                      className="therapy-option-row"
                      key={index}
                    >
                      <button
                        className="therapy-option-button"
                        onClick={() =>
                          checkAnswer(option)
                        }
                        disabled={
                          checkingAnswer ||
                          Boolean(answerResult)
                        }
                        style={{
                          border:
                            selectedAnswer === option
                              ? answerResult?.correct
                                ? "2px solid #57765f"
                                : answerResult
                                ? "2px solid #a05a45"
                                : "2px solid #57765f"
                              : "1px solid #e8e1d5",
                          background:
                            selectedAnswer === option
                              ? "#edf3ed"
                              : "#fffdf9",
                          color: "#28352f",
                          cursor:
                            checkingAnswer ||
                            answerResult
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {option}
                      </button>

                      <button
                        className="therapy-audio-button"
                        onClick={() =>
                          speakText(option, option)
                        }
                        disabled={
                          speaking &&
                          speakingOption !== option
                        }
                        aria-label={`Listen to ${option}`}
                        style={{
                          cursor:
                            speaking &&
                            speakingOption !== option
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {speakingOption === option
                          ? "🔊"
                          : "🔈"}
                      </button>
                    </div>
                  )
                )}
              </div>

              {answerResult && (
                <div
                  className="therapy-feedback"
                  style={{
                    color: answerResult.correct
                      ? "#57765f"
                      : "#9a6a45",
                  }}
                >
                  {answerResult.correct
                    ? "✓ Correct! Great job."
                    : "Take another look at the memory. You can continue when ready."}
                </div>
              )}

              {message && !answerResult && (
                <p className="therapy-message">
                  {message}
                </p>
              )}

              {answerResult && (
                <button
                  className="therapy-next-button"
                  onClick={moveToNextQuestion}
                  disabled={completingGame}
                  style={{
                    cursor: completingGame
                      ? "not-allowed"
                      : "pointer",
                    opacity: completingGame
                      ? 0.7
                      : 1,
                  }}
                >
                  {completingGame
                    ? "Saving progress..."
                    : currentIndex === games.length - 1
                    ? "Finish Session →"
                    : "Next Question →"}
                </button>
              )}
            </div>
          )}

          {session && isSessionComplete && (
            <div className="therapy-session-card">
              <div className="therapy-complete">
                <div className="therapy-complete-icon">
                  🎉
                </div>

                <h2>
                  Therapy Session Complete
                </h2>

                <p>
                  You answered <strong>{correctAnswers}</strong> out of{" "}  
                  <strong>{session.total_games}</strong> questions correctly.
                </p>

                <p
                  style={{
                    marginTop: "15px",
                    color: "#57765f",
                    fontWeight: "700",
                  }}
                >
                  {session.total_games} of {session.total_games} questions completed
                </p>

                <button
                  className="therapy-start-button"
                  onClick={startTherapySession}
                  disabled={loadingSession}
                  style={{
                    marginTop: "25px",
                  }}
                >
                  {loadingSession
                    ? "Starting..."
                    : "Start Another Session →"}
                </button>
              </div>
            </div>
          )}

          {message && !answerResult && !session && (
            <p className="therapy-message">
              {message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Therapy;