"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [seedCount, setSeedCount] = useState(10);
  const [seeding, setSeeding] = useState(false);
  const [partials, setPartials] = useState<Array<{
    id: string;
    session_id: string;
    step: string;
    selections: string[] | null;
    rankings: Array<{ id: string; label: string; rank: number }> | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    updated_at: string;
  }>>([]);
  const [partialsExpanded, setPartialsExpanded] = useState(false);

  const fetchPartials = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/partials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        setPartials(data.partials || []);
      }
    } catch { /* ignore */ }
  }, [password]);

  useEffect(() => {
    if (authenticated) {
      fetchPartials();
    }
  }, [authenticated, fetchPartials]);

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

  const handleSeed = async () => {
    setError("");
    setSuccess("");
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, count: seedCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to seed responses");
      } else {
        setSuccess(`Successfully seeded ${data.count} survey responses.`);
      }
    } catch {
      setError("Network error");
    } finally {
      setSeeding(false);
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
        setPartials([]);
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

      <div className="a-card">
        <h2>Seed Survey Responses</h2>
        <p>Generate fake survey responses to preview the results dashboard.</p>
        <div className="a-input-row">
          <input
            type="number"
            min={1}
            max={100}
            value={seedCount}
            onChange={(e) => setSeedCount(Math.max(1, Math.min(100, Number(e.target.value))))}
          />
          <button
            className="a-seed-btn"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? "Seeding..." : "Seed Responses"}
          </button>
        </div>
      </div>

      <div className="a-card">
        <h2>Partial Responses</h2>
        <p>
          In-progress survey sessions saved at each step transition.
          {partials.length > 0 && <strong> {partials.length} partial{partials.length !== 1 ? "s" : ""} found.</strong>}
          {partials.length === 0 && " None currently."}
        </p>

        {partials.length > 0 && (
          <>
            <button
              className="a-seed-btn"
              style={{ marginBottom: 16 }}
              onClick={() => setPartialsExpanded(!partialsExpanded)}
            >
              {partialsExpanded ? "Hide Details" : "Show Details"}
            </button>

            {partialsExpanded && (
              <ul className="a-partials-list">
                {partials.map((p) => (
                  <li key={p.id} className="a-partial-item">
                    <div className="a-partial-header">
                      <span className="a-partial-step">Step: {p.step}</span>
                      <span className="a-partial-time">
                        {new Date(p.updated_at).toLocaleString()}
                      </span>
                    </div>
                    {p.selections && (
                      <div className="a-partial-detail">
                        Selections: {Array.isArray(p.selections) ? p.selections.join(", ") : String(p.selections)}
                      </div>
                    )}
                    {p.first_name && (
                      <div className="a-partial-detail">
                        Name: {p.first_name} {p.last_name || ""}
                      </div>
                    )}
                    {p.email && (
                      <div className="a-partial-detail">Email: {p.email}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
