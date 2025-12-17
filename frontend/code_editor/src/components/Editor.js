import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { getSocket } from "../socket"; // ✅ FIXED IMPORT
import "../styles/Editor.css";

export default function EditorComponent({ meetingId, username }) {
  const socket = getSocket(); // ✅ FIXED SOCKET INSTANCE

  const [code, setCode] = useState("<h1>Hello World</h1>");
  const [srcDoc, setSrcDoc] = useState("");

  // LOAD OLD CODE ON JOIN
  useEffect(() => {
    const handleLoad = (savedCode) => {
      setCode(savedCode);
      localStorage.setItem("currentCode", savedCode);
    };

    socket.on("load-old-code", handleLoad);
    return () => socket.off("load-old-code", handleLoad);
  }, [socket]);

  // RECEIVE CODE FROM OTHER USERS
  useEffect(() => {
    const handleUpdate = (updatedCode) => {
      setCode(updatedCode);
      localStorage.setItem("currentCode", updatedCode);
    };

    socket.on("code-update", handleUpdate);
    return () => socket.off("code-update", handleUpdate);
  }, [socket]);

  // RUN CODE
  const runCode = () => {
    const htmlTemplate = `
      <html>
        <body>${code}</body>
      </html>
    `;
    setSrcDoc(htmlTemplate);
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={runCode} className="run-btn">▶ Run</button>
      </div>

      <div className="editor-area">
        <Editor
          height="80vh"
          width="50%"
          language="html"
          theme="vs-dark"
          value={code}
          onChange={(value) => {
            const newCode = value || "";
            setCode(newCode);
            localStorage.setItem("currentCode", newCode);

            socket.emit("code-change", {
              meetingId,
              code: newCode,
              username,
            });
          }}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            autoClosingBrackets: "always",
          }}
        />

        <iframe
          srcDoc={srcDoc}
          title="Output"
          sandbox="allow-scripts"
          frameBorder="0"
          className="output-frame"
        />
      </div>
    </div>
  );
}
