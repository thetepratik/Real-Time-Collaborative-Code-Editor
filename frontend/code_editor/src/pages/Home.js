import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../socket"; // ✅ IMPORTANT
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  const [meetingId, setMeetingId] = useState("");

  // 🔐 AUTH GUARD
  useEffect(() => {
    if (!token || !username) {
      navigate("/login");
    }
  }, [token, username, navigate]);

  // ✅ ENSURE SOCKET CONNECTED THEN NAVIGATE
  const ensureSocketAndNavigate = (path) => {
    const socket = getSocket();

    if (!socket.connected) {
      connectSocket();

      socket.once("connect", () => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  // JOIN SESSION
  const handleJoin = () => {
    if (!meetingId.trim()) {
      alert("Please enter a meeting ID!");
      return;
    }

    ensureSocketAndNavigate(`/editor/${meetingId}`);
  };

  // CREATE SESSION
  const handleCreate = () => {
    const id = Math.random().toString(36).substring(2, 8);
    ensureSocketAndNavigate(`/editor/${id}`);
  };

  return (
    <div className="home-container">
      {/* Animated floating bubbles */}
      <ul className="bubbles">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i}></li>
        ))}
      </ul>

      {/* LEFT PANEL */}
      <div className="left-panel slide-in-left">
        <div className="welcome-section">
          <h1>
            Welcome, <span className="brand">{username}</span>
          </h1>
          <p>
            Collaborate, learn, and build amazing things in real time.
            <br />
            Your code journey starts here
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel slide-in-right">
        <div className="form-card glass-effect">
          <h2>Create or Join Session</h2>

          {/* MEETING ID INPUT */}
          <div className="input-group">
            <label>Meeting ID</label>
            <div className="input-icon">
              <img
                src="https://cdn-icons-png.flaticon.com/512/565/565547.png"
                alt="rocket"
              />
              <input
                type="text"
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="button-group">
            <button className="btn join" onClick={handleJoin}>
              Join
            </button>
            <button className="btn create" onClick={handleCreate}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
