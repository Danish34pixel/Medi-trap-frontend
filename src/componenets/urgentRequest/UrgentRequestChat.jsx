import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, Loader2, AlertTriangle, Check, CheckCheck, MessageCircle } from "lucide-react";
import { fetchJson } from "../config/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../ui/PageHeader";

// Shared chat screen for both the medical owner and the accepting purchaser
// on one urgent request. Routed by :id. Only usable once the request is
// accepted — the backend 403s with "Chat only available after acceptance"
// otherwise, which we render as a plain state, not a crash.
export default function UrgentRequestChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const myId = String(user?._id || user?.id || "");

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // sticky first error / access error
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const pausedRef = useRef(document.hidden);
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchJson(`/urgent-request/${id}/messages?markRead=1`);
      setMessages(res?.data || []);
      setError(null);
    } catch (e) {
      // 403 "Chat only available after acceptance" (or access denied) is a
      // real, expected state here — show it plainly instead of a generic banner.
      setError((prev) => prev || e.body?.message || e.message || "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!pausedRef.current) load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await fetchJson(`/urgent-request/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: trimmed }),
      });
      setText("");
      await load();
    } catch (e) {
      setError(e.body?.message || e.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const bubbleSide = (msg) => {
    if (msg.senderRole === "system") return "center";
    return String(msg.senderId) === myId ? "right" : "left";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <PageHeader title="Chat" subtitle="Urgent request conversation" role="slate" />

      <div className="flex-1 container mx-auto max-w-2xl px-4 py-6 flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <AlertTriangle className="text-orange-400 mb-3" size={40} />
            <p className="text-slate-600 font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-slate-400">
                  <MessageCircle className="mb-3 opacity-40" size={40} />
                  <p>No messages yet — say hello</p>
                </div>
              ) : (
                messages.map((m) => {
                  const side = bubbleSide(m);
                  if (side === "center") {
                    return (
                      <div key={m._id} className="text-center">
                        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">
                          {m.text}
                        </span>
                      </div>
                    );
                  }
                  const mine = side === "right";
                  return (
                    <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          mine ? "bg-sky-500 text-white" : "bg-white border border-slate-200 text-slate-800"
                        }`}
                      >
                        {!mine && (
                          <div className="text-xs font-semibold mb-0.5 text-slate-500">{m.senderName}</div>
                        )}
                        <div className="text-sm">{m.text}</div>
                        <div
                          className={`flex items-center gap-1 mt-1 text-[10px] ${
                            mine ? "text-sky-100" : "text-slate-400"
                          }`}
                        >
                          <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}</span>
                          {mine &&
                            (m.readBy?.length > 0 ? (
                              <CheckCheck size={12} />
                            ) : m.deliveredAt ? (
                              <Check size={12} />
                            ) : null)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="p-3 rounded-xl bg-sky-500 text-white disabled:opacity-50 hover:bg-sky-600 transition-colors"
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
