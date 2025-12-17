import React, { useState, useEffect, useRef } from "react";
import { getSocket } from "../socket";
import "../styles/Chat.css";

export default function ChatPanel({ meetingId, username }) {
  const socket = getSocket();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // ✅ RECEIVE CHAT MESSAGES (ONLY ONCE)
  useEffect(() => {
    const handleChatMessage = (msgData) => {
      setMessages((prev) => [...prev, msgData]);
    };

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("chat-message", handleChatMessage);
    };
  }, [socket]);

  // ✅ SEND MESSAGE (DO NOT ADD LOCALLY)
  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      text: message,
      username,
      meetingId,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // 🔥 Only emit — server will broadcast back
    socket.emit("send-chat", { meetingId, msgData });

    setMessage("");
  };

  return (
    <div className="chat-panel">
      <h3 className="chat-header">Chat Room</h3>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${
              msg.username === username ? "self" : "other"
            }`}
          >
            <div className="msg-user">{msg.username}</div>
            <div className="msg-text">{msg.text}</div>
            <div className="msg-time">{msg.time}</div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Type message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}
