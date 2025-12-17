import React, { useState } from "react";
import "../styles/AIModal.css";

export default function AIPromptModal({
  onClose,
  onSubmit,
  aiResult,
  onInsert,
}) {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onSubmit(prompt);
  };

  return (
    <div className="ai-overlay">
      <div className="ai-mobile">

        {/* HEADER */}
        <div className="ai-header">
          🤖 AI Code Generator
          <span onClick={onClose}>✕</span>
        </div>

        {/* CHAT BODY */}
        <div className="ai-body">
          {/* USER PROMPT */}
          <div className="chat-bubble user">
            {prompt || "Ask AI to generate code..."}
          </div>

          {/* AI RESPONSE */}
          {aiResult && (
            <div className="chat-bubble ai">
              <pre>{aiResult}</pre>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="ai-input">
          <textarea
            placeholder="Ask me any code..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={!!aiResult}
          />

          {!aiResult ? (
            <button onClick={handleGenerate}>Generate</button>
          ) : (
            <div className="ai-actions">
              <button onClick={() => navigator.clipboard.writeText(aiResult)}>
                📋 Copy
              </button>
              <button onClick={onInsert}>⬇ Insert</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
