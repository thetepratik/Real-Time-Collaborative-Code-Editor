import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");          // ✅ NEW
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,      // ✅ SEND EMAIL
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Registration failed");

      alert("Registered successfully!");
      navigate("/login");
    } catch {
      alert("Backend not reachable");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* LEFT – BLUE PANEL */}
        <div className="register-panel">
          <h2>Welcome Back!</h2>
          <p>To keep connected with us please login</p>
          <button onClick={() => navigate("/login")}>SIGN IN</button>
        </div>

        {/* RIGHT – FORM */}
        <div className="register-form">
          <h2>Create Account</h2>

          <form onSubmit={handleRegister}>
            {/* USERNAME */}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

            <button type="submit">SIGN UP</button>
          </form>
        </div>
      </div>
    </div>
  );
}
