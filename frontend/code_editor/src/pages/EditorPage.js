import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket, connectSocket, disconnectSocket } from "../socket";

import EditorComponent from "../components/Editor";
import ChatPanel from "../components/ChatPanel";
import AIPromptModal from "../components/AIPromptModal";
import "../styles/EditorPage.css";

export default function EditorPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  const socketRef = useRef(null);

  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentCode, setCurrentCode] = useState(
    localStorage.getItem("currentCode") || ""
  );

  // 🤖 AI STATES
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState("");

  // 🔐 AUTH GUARD
  useEffect(() => {
    if (!token || !username) {
      navigate("/login");
    }
  }, [token, username, navigate]);

  // ✅ CONNECT SOCKET ONCE
  useEffect(() => {
    connectSocket();
    socketRef.current = getSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  // ✅ JOIN MEETING (AFTER SOCKET CONNECTED)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !meetingId || !username) return;

    const joinMeeting = () => {
      socket.emit("join-meeting", { meetingId });
    };

    if (socket.connected) {
      joinMeeting();
    } else {
      socket.once("connect", joinMeeting);
    }

    const handleUserList = (list) => setUsers(list);
    const handleChat = () => {
      if (!chatOpen) setUnreadCount((prev) => prev + 1);
    };

    socket.on("user-list", handleUserList);
    socket.on("chat-message", handleChat);

    return () => {
      socket.emit("leave-meeting", { meetingId });
      socket.off("user-list", handleUserList);
      socket.off("chat-message", handleChat);
    };
  }, [meetingId, username, chatOpen]);

  // 🤖 AI RESULT
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("ai-result", ({ code }) => setAiResult(code));
    socket.on("ai-error", ({ message }) =>
      alert(message || "AI failed")
    );

    return () => {
      socket.off("ai-result");
      socket.off("ai-error");
    };
  }, []);

  // 🚪 LEAVE MEETING
  const leaveMeeting = () => {
    socketRef.current.emit("leave-meeting", { meetingId });
    navigate("/home");
  };

  // 🆕 NEW FILE
  const handleNewFile = () => {
    setCurrentCode("");
    localStorage.setItem("currentCode", "");
    socketRef.current.emit("code-change", { meetingId, code: "" });
  };

  // 📂 OPEN FILE
  const handleOpenFile = () => {
  // ✅ Modern API supported
  if (window.showOpenFilePicker) {
    openWithFilePicker();
  } else {
    openWithInputFallback();
  }
};

// -------- Modern Chrome API --------
const openWithFilePicker = async () => {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Code Files",
          accept: {
            "text/html": [".html"],
            "text/css": [".css"],
            "application/javascript": [".js"],
            "text/plain": [".txt"],
          },
        },
      ],
    });

    const file = await fileHandle.getFile();
    const text = await file.text();

    applyOpenedFile(text);
  } catch (err) {
    console.log("File picker cancelled");
  }
};

// -------- Fallback (ALL browsers) --------
const openWithInputFallback = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".html,.css,.js,.txt";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    applyOpenedFile(text);
  };

  input.click();
};

// -------- Apply file content --------
const applyOpenedFile = (text) => {
  setCurrentCode(text);
  localStorage.setItem("currentCode", text);

  socketRef.current.emit("code-change", {
    meetingId,
    code: text,
  });
};


  // 💾 SAVE AS
  const handleSaveAs = async () => {
    try {
      const code = localStorage.getItem("currentCode") || currentCode;

      const handle = await window.showSaveFilePicker({
        suggestedName: "index.html",
        types: [
          {
            description: "Code Files",
            accept: {
              "text/html": [".html"],
              "text/css": [".css"],
              "application/javascript": [".js"],
              "text/plain": [".txt"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(code);
      await writable.close();

      alert("File saved!");
    } catch (err) {
      console.error("Save cancelled", err);
    }
  };

  // 🤖 AI GENERATE
  const handleAIGenerate = (prompt) => {
    setAiResult("");
    socketRef.current.emit("ai-generate", { meetingId, prompt });
  };

  // ⬇ INSERT AI CODE
  const insertAICode = () => {
    setCurrentCode(aiResult);
    localStorage.setItem("currentCode", aiResult);

    socketRef.current.emit("code-change", {
      meetingId,
      code: aiResult,
    });

    setAiResult("");
    setAiOpen(false);
  };

  // 💬 TOGGLE CHAT
  const toggleChat = () => {
    setChatOpen((prev) => !prev);
    setUnreadCount(0);
  };

  return (
    <div className="editor-page">
      <nav className="navbar">
        <div className="nav-left">
          <h3>Meeting ID: {meetingId}</h3>
          <p>Active Users: {users.length}</p>

          <div className="user-list">
            {users.map((u) => (
              <span key={u.id} className="user-name">
                {u.username}
              </span>
            ))}
          </div>
        </div>

        <div className="nav-right">
          <button onClick={() => navigator.clipboard.writeText(meetingId)}>
            Copy ID
          </button>

          <button onClick={handleNewFile}>New</button>
          <button onClick={handleOpenFile}>Open</button>
          <button onClick={handleSaveAs}>Save</button>

          <button onClick={() => setAiOpen(true)}>AI</button>

          <button onClick={toggleChat}>
            Chat {unreadCount > 0 && `(${unreadCount})`}
          </button>

          <button onClick={leaveMeeting}>Leave</button>
        </div>
      </nav>

      <EditorComponent
        meetingId={meetingId}
        username={username}
        externalCode={currentCode}
      />

      {chatOpen && <ChatPanel meetingId={meetingId} username={username} />}

      {aiOpen && (
        <AIPromptModal
          onClose={() => {
            setAiOpen(false);
            setAiResult("");
          }}
          onSubmit={handleAIGenerate}
          aiResult={aiResult}
          onInsert={insertAICode}
        />
      )}
    </div>
  );
}
