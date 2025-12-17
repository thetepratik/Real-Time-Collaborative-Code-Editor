import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../socket"; // ✅ IMPORTANT
// import { connectSocket } from "../socket";
import "../styles/Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://127.0.0.1:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);

    connectSocket(); // ✅ THIS IS THE FIX

    navigate("/home");
  } catch {
    alert("Backend not reachable");
  }
};


  return (
    <div className="login-container">
      <div className="login-card">
        {/* LEFT – FORM */}
        <div className="login-form">
          <h2>Sign in</h2>

          <form onSubmit={handleLogin}>
            {/* USERNAME */}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            {/* PASSWORD */}
            <div className="input-box">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
            </div>

            {/* FORGOT PASSWORD */}
            <p
              className="forgot-password"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </p>

            {/* SUBMIT */}
            <button type="submit">SIGN IN</button>
          </form>
        </div>

        {/* RIGHT – INFO PANEL */}
        <div className="login-panel">
          <h2>Hello, Friend!</h2>
          <p>Enter your personal details and start journey with us</p>
          <button onClick={() => navigate("/register")}>SIGN UP</button>
        </div>
      </div>
    </div>
  );
}
