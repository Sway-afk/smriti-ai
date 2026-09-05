import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function Therapy() {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [language, setLanguage] = useState("English");
  const [loadingLanguage, setLoadingLanguage] = useState(true);

  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
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

    loadPatientLanguage();
  }, []);

  const loadGame = async () => {
    setLoading(true);
    setMessage("");
    setSelectedAnswer("");

    try {
      const response = await fetch(
        `${API_URL}/games/generate/${PATIENT_ID === 1 ? 1 : PATIENT_ID}?difficulty=easy&language=${encodeURIComponent(
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
          data.detail || "Could not generate the game."
        );
      }

      setGame(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setMessage("");

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
            answer: answer,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Could not check the answer."
        );
      }

      if (result.correct) {
        setMessage("✓ Correct! Great job.");
      } else {
        setMessage(
          "Take another look at the memory and try again."
        );
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const speakText = async (text) => {
    if (!text) {
      return;
    }

    setSpeaking(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/tts/speak?text=${encodeURIComponent(
          text
        )}&language=${encodeURIComponent(language)}`
      );

      if (!response.ok) {
        throw new Error("Could not generate audio.");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
        setMessage("Could not play the audio.");
      };

      await audio.play();
    } catch (error) {
      setSpeaking(false);
      setMessage(error.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f5ef",
        padding: "60px 7%",
        color: "#28352f",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            color: "#57765f",
            fontWeight: "700",
            fontSize: "14px",
            letterSpacing: "1px",
            marginBottom: "12px",
          }}
        >
          SMRITI AI
        </p>

        <h1
          style={{
            color: "#28352f",
            fontSize: "46px",
            lineHeight: "1.1",
            margin: "0 0 16px",
          }}
        >
          Today&apos;s Therapy Session
        </h1>

        <p
          style={{
            color: "#66736b",
            fontSize: "18px",
            lineHeight: "1.7",
            maxWidth: "650px",
            margin: 0,
          }}
        >
          A gentle cognitive activity created from familiar memories.
          Take your time and enjoy the memory.
        </p>

        <p
          style={{
            marginTop: "18px",
            color: "#57765f",
            fontSize: "15px",
            fontWeight: "700",
          }}
        >
          {loadingLanguage
            ? "Loading patient language..."
            : `Patient language: ${language}`}
        </p>

        {!game && (
          <button
            onClick={loadGame}
            disabled={loading || loadingLanguage}
            style={{
              marginTop: "35px",
              padding: "15px 24px",
              border: "none",
              borderRadius: "12px",
              background: "#57765f",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "700",
              cursor:
                loading || loadingLanguage
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Creating your game..."
              : loadingLanguage
              ? "Loading language..."
              : "Create My Memory Game"}
          </button>
        )}

        {game && (
          <div
            style={{
              marginTop: "45px",
              background: "#fffdf9",
              border: "1px solid #e8e1d5",
              borderRadius: "24px",
              padding: "35px",
              boxShadow:
                "0 18px 50px rgba(48, 59, 52, 0.08)",
            }}
          >
            <p
              style={{
                color: "#8a968e",
                fontSize: "13px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginTop: 0,
              }}
            >
              {game.game_type || "Memory Game"} · {language}
            </p>

            <h2
              style={{
                color: "#28352f",
                fontSize: "30px",
                lineHeight: "1.5",
                margin: "10px 0 18px",
              }}
            >
              {game.question}
            </h2>

            <button
              onClick={() => speakText(game.question)}
              disabled={speaking}
              style={{
                marginBottom: "24px",
                padding: "12px 18px",
                border: "1px solid #57765f",
                borderRadius: "10px",
                background: "#fffdf9",
                color: "#57765f",
                fontSize: "15px",
                fontWeight: "700",
                cursor: speaking ? "not-allowed" : "pointer",
              }}
            >
              {speaking
                ? "🔊 Speaking..."
                : "🔊 Listen to Question"}
            </button>

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {game.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => checkAnswer(option)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border:
                      selectedAnswer === option
                        ? "2px solid #57765f"
                        : "1px solid #e8e1d5",
                    background:
                      selectedAnswer === option
                        ? "#edf3ed"
                        : "#fffdf9",
                    color: "#28352f",
                    fontSize: "17px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {message && (
          <p
            style={{
              marginTop: "22px",
              color: message.startsWith("✓")
                ? "#57765f"
                : "#a05a45",
              fontWeight: "700",
              fontSize: "16px",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Therapy;