"use client";

import { useState } from "react";
import "./admin.css";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to authenticate");
      } else {
        setAuthenticated(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirmText !== "RESET") return;
    setError("");
    setSuccess("");
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset results");
      } else {
        setSuccess("All survey results have been deleted.");
        setShowConfirm(false);
        setConfirmText("");
      }
    } catch {
      setError("Network error");
    } finally {
      setResetting(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="a-container">
        <div className="a-login-card">
          <h1>Admin</h1>
          <p>Enter admin credentials to continue.</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Checking..." : "Log In"}
          </button>
          {error && <div className="a-error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="a-container">
      <div className="a-header">
        <h1>Admin</h1>
      </div>

      <div className="a-card">
        <h2>Reset Survey Results</h2>
        <p>Permanently delete all survey responses. This action cannot be undone.</p>

        {!showConfirm ? (
          <button
            className="a-reset-btn"
            onClick={() => {
              setShowConfirm(true);
              setSuccess("");
            }}
          >
            Reset All Results
          </button>
        ) : (
          <div className="a-confirm">
            <p>
              Type <strong>RESET</strong> to confirm deletion of all survey results.
            </p>
            <input
              type="text"
              placeholder='Type "RESET" to confirm'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              autoFocus
            />
            <div className="a-confirm-actions">
              <button
                className="a-reset-btn"
                onClick={handleReset}
                disabled={confirmText !== "RESET" || resetting}
              >
                {resetting ? "Deleting..." : "Confirm Reset"}
              </button>
              <button
                className="a-cancel-btn"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {success && <div className="a-success">{success}</div>}
        {error && <div className="a-error">{error}</div>}
      </div>
    </div>
  );
}
