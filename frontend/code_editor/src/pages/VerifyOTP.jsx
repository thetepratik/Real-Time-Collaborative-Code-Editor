  import React, { useState } from "react";
  import { useLocation, useNavigate } from "react-router-dom";
  import "../styles/Auth.css";

  export default function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email;

    const handleVerify = async (e) => {
      e.preventDefault();

      const res = await fetch("http://127.0.0.1:5000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Invalid OTP");
        return;
      }

      navigate("/reset-password", { state: { email } });
    };

    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verify OTP</h2>
          <p>Enter the 6-digit code sent to your email</p>

          <form onSubmit={handleVerify}>
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />

            <button type="submit">Verify</button>
          </form>
        </div>
      </div>
    );
  }
