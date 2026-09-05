import { useEffect, useRef, useState } from "react";

const API_URL = "http://127.0.0.1:8000";
const PATIENT_ID = 1;

function VoiceMemory() {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("English");
  const [loadingLanguage, setLoadingLanguage] = useState(true);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

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
        setMessage("Using English for voice transcription.");
      } finally {
        setLoadingLanguage(false);
      }
    };

    loadPatientLanguage();
  }, []);

  const startRecording = async () => {
    setMessage("");
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        await saveVoiceMemory(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setRecording(true);
      setMessage(
        `🎙️ Recording in ${language}... Speak about a memory.`
      );
    } catch (error) {
      setMessage(
        "Microphone access was denied or is not available."
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    setRecording(false);
    setSaving(true);
    setMessage("Processing your memory...");

    mediaRecorderRef.current.stop();
  };

  const saveVoiceMemory = async (audioBlob) => {
    try {
      const formData = new FormData();

      formData.append(
        "file",
        audioBlob,
        "memory.webm"
      );

      const response = await fetch(
        `${API_URL}/voice/transcribe-and-save/${PATIENT_ID}?language=${encodeURIComponent(
          language
        )}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not save the voice memory."
        );
      }

      setTranscript(data.transcript || "");
      setMessage(
        `✓ Voice memory saved successfully in ${language}.`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f5ef",
        padding: "55px 7%",
        color: "#28352f",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "750px",
          margin: "0 auto",
          textAlign: "center",
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
            margin: "0 0 12px",
          }}
        >
          Voice Memory
        </h1>

        <p
          style={{
            color: "#66736b",
            fontSize: "18px",
            lineHeight: "1.7",
            maxWidth: "620px",
            margin: "0 auto 35px",
          }}
        >
          Speak naturally about a meaningful memory. Smriti AI
          will turn your voice into a saved memory.
        </p>

        <div
          style={{
            marginBottom: "20px",
            color: "#57765f",
            fontSize: "15px",
            fontWeight: "700",
          }}
        >
          {loadingLanguage
            ? "Loading patient language..."
            : `Patient language: ${language}`}
        </div>

        <div
          style={{
            background: "#fffdf9",
            border: "1px solid #e8e1d5",
            borderRadius: "24px",
            padding: "45px 30px",
            boxShadow:
              "0 18px 50px rgba(48, 59, 52, 0.08)",
          }}
        >
          <div
            style={{
              fontSize: "70px",
              marginBottom: "20px",
            }}
          >
            🎙️
          </div>

          <h2
            style={{
              color: "#28352f",
              marginBottom: "12px",
            }}
          >
            Record a memory
          </h2>

          <p
            style={{
              color: "#66736b",
              lineHeight: "1.6",
              maxWidth: "520px",
              margin: "0 auto 28px",
            }}
          >
            Try saying something like:
            <br />
            <strong>
              “My daughter&apos;s wedding was in Jaipur.”
            </strong>
          </p>

          {!recording ? (
            <button
              onClick={startRecording}
              disabled={saving || loadingLanguage}
              style={{
                padding: "16px 28px",
                border: "none",
                borderRadius: "12px",
                background: "#57765f",
                color: "#ffffff",
                fontSize: "17px",
                fontWeight: "700",
                cursor:
                  saving || loadingLanguage
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {saving
                ? "Processing..."
                : loadingLanguage
                ? "Loading..."
                : "Start Recording"}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              style={{
                padding: "16px 28px",
                border: "none",
                borderRadius: "12px",
                background: "#a05a45",
                color: "#ffffff",
                fontSize: "17px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Stop Recording
            </button>
          )}

          {message && (
            <p
              style={{
                marginTop: "24px",
                color: message.startsWith("✓")
                  ? "#57765f"
                  : "#66736b",
                fontWeight: "700",
              }}
            >
              {message}
            </p>
          )}

          {transcript && (
            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                borderRadius: "14px",
                background: "#f4f6f1",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  color: "#8a968e",
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Transcribed memory
              </p>

              <p
                style={{
                  margin: 0,
                  color: "#28352f",
                  lineHeight: "1.6",
                  fontSize: "17px",
                }}
              >
                {transcript}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceMemory;