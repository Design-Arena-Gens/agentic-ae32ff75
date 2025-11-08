"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";

type Message = { role: "user" | "assistant"; content: string };

type CallState = "idle" | "connecting" | "active" | "ended";

const MODEL_NAME = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

async function initEngine(onProgress?: (p: number, t: string) => void): Promise<MLCEngine> {
  const engine = await CreateMLCEngine(
    MODEL_NAME,
    {
      initProgressCallback: (report) => {
        if (onProgress) onProgress(report.progress || 0, report.text || "");
      },
    }
  );
  return engine;
}

function useSpeech(): {
  canRecognize: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
  lastText: string;
} {
  const [listening, setListening] = useState(false);
  const [lastText, setLastText] = useState("");
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR: typeof window & { webkitSpeechRecognition?: any } = window as any;
    const SpeechRecognition = SR.SpeechRecognition || SR.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec: SpeechRecognition = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0]?.transcript || "")
        .join(" ");
      setLastText(transcript.trim());
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, []);

  const start = useCallback(() => {
    try {
      recRef.current?.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  return {
    canRecognize: !!recRef.current,
    listening,
    start,
    stop,
    lastText,
  };
}

function speak(text: string) {
  if (typeof window === "undefined") return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function CallAgent() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [dial, setDial] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [progress, setProgress] = useState<{ p: number; t: string }>({ p: 0, t: "" });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const { canRecognize, listening, start, stop, lastText } = useSpeech();

  useEffect(() => {
    if (listening && lastText) {
      setInput(lastText);
    }
  }, [listening, lastText]);

  const systemPrompt = useMemo(() => (
    "You are a friendly, concise calling assistant. Answer briefly like a phone call agent."
  ), []);

  const ensureEngine = useCallback(async () => {
    if (engine) return engine;
    const e = await initEngine((p, t) => setProgress({ p, t }));
    setEngine(e);
    return e;
  }, [engine]);

  const handleDigit = (d: string) => setDial((prev) => (prev + d).slice(0, 18));
  const clearDial = () => setDial("");

  const startCall = useCallback(async () => {
    setCallState("connecting");
    try {
      const e = await ensureEngine();
      // Warmup minimal prompt
      await e.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Hello" },
        ],
        stream: false,
      });
      setMessages([{ role: "assistant", content: "Hi, this is your AI assistant. How can I help today?" }]);
      speak("Hi, this is your A I assistant. How can I help today?");
      setCallState("active");
    } catch (err) {
      console.error(err);
      setCallState("idle");
    }
  }, [ensureEngine, systemPrompt]);

  const endCall = () => {
    setCallState("ended");
    window.speechSynthesis.cancel();
  };

  const send = useCallback(async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const e = await ensureEngine();
      const result = await e.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: text },
        ],
        stream: true,
      });
      let reply = "";
      for await (const chunk of result) {
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          reply += delta;
        }
      }
      const clean = reply.trim() || "Okay.";
      setMessages((m) => [...m, { role: "assistant", content: clean }]);
      speak(clean);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setBusy(false);
    }
  }, [input, messages, ensureEngine, systemPrompt, busy]);

  return (
    <div>
      <div className="inputRow">
        <input
          className="input"
          inputMode="tel"
          placeholder="Enter number (optional)"
          value={dial}
          onChange={(e) => setDial(e.target.value.replace(/[^0-9+#*]/g, ""))}
        />
        {callState === "idle" && (
          <button className="button primary" onClick={startCall}>
            Call AI
          </button>
        )}
        {callState === "active" && (
          <button className="button danger" onClick={endCall}>
            Hang up
          </button>
        )}
        {callState === "connecting" && (
          <span className="badge">Loading model {Math.round(progress.p * 100)}%</span>
        )}
        {callState === "ended" && (
          <button className="button secondary" onClick={() => { setMessages([]); setCallState("idle"); }}>
            Reset
          </button>
        )}
      </div>

      {callState === "idle" && (
        <div>
          <div className="grid" style={{ marginBottom: 12 }}>
            {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
              <button key={k} className="key" onClick={() => handleDigit(k)}>{k}</button>
            ))}
          </div>
          <div className="row small"><span className="status">Tip:</span> Enter any number; the call connects to the AI.</div>
        </div>
      )}

      {callState !== "idle" && (
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <span className="badge">{callState === "active" ? "On call" : callState === "connecting" ? "Connecting" : "Call ended"}</span>
            {callState === "active" && (
              <div className="row small">
                <span>{busy ? "Thinking?" : "Ready"}</span>
              </div>
            )}
          </div>

          <div className="transcript">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role === "user" ? "you" : "ai"}`}>
                <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.content}
              </div>
            ))}
            {!messages.length && callState === "connecting" && (
              <div className="small">Downloading model and preparing the call? {Math.round(progress.p * 100)}%</div>
            )}
          </div>

          {callState === "active" && (
            <div className="footer">
              <input
                className="input"
                placeholder={canRecognize ? (listening ? "Listening?" : "Type or press mic and speak") : "Type your message"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              />
              {canRecognize && (
                <button className="button secondary" onClick={() => (listening ? stop() : start())}>
                  {listening ? "Stop" : "Mic"}
                </button>
              )}
              <button className="button primary" onClick={send} disabled={busy}>Send</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
