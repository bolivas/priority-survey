"use client";

import { useState } from "react";
import "./results.css";

interface Ranking {
  id: string;
  label: string;
  rank: number;
}

interface Response {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  team_size: string;
  rankings: Ranking[];
  remaining_rankings?: Ranking[];
  submitted_at: string;
}

type Tab = "summary" | "responses";

export default function ResultsPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [results, setResults] = useState<Response[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("summary");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "avgRank">("score");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to authenticate");
      } else {
        setResults(data.results);
        setAuthenticated(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="r-container">
        <div className="r-login-card">
          <h1>Survey Results</h1>
          <p>Enter the password to view results.</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoFocus
          />
          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Checking..." : "View Results"}
          </button>
          {error && <div className="r-error">{error}</div>}
        </div>
      </div>
    );
  }

  // --- Compute summary stats ---
  const totalResponses = results.length;

  // Team size breakdown
  const teamSizeCounts: Record<string, number> = {};
  results.forEach((r) => {
    teamSizeCounts[r.team_size] = (teamSizeCounts[r.team_size] || 0) + 1;
  });
  const teamSizeLabels: Record<string, string> = {
    "1-2": "1\u20132 people",
    "3-20": "3\u201320 people",
    "20+": "20+ people",
  };

  // Aggregate top-5 rankings with priority score
  // Points: rank 1 = 5 pts, rank 2 = 4 pts, ..., rank 5 = 1 pt
  const itemStats: Record<string, { count: number; totalRank: number; score: number; label: string }> = {};
  results.forEach((r) => {
    r.rankings.forEach((ranking) => {
      if (!itemStats[ranking.id]) {
        itemStats[ranking.id] = { count: 0, totalRank: 0, score: 0, label: ranking.label };
      }
      itemStats[ranking.id].count += 1;
      itemStats[ranking.id].totalRank += ranking.rank;
      itemStats[ranking.id].score += (6 - ranking.rank);
    });
  });

  const allItems = Object.entries(itemStats)
    .map(([id, s]) => ({
      id,
      label: s.label,
      count: s.count,
      avgRank: s.totalRank / s.count,
      score: s.score,
    }));

  const sortedItems = [...allItems].sort(
    sortBy === "score"
      ? (a, b) => b.score - a.score || b.count - a.count
      : (a, b) => a.avgRank - b.avgRank || b.count - a.count
  );

  const maxScore = allItems.length > 0 ? Math.max(...allItems.map((i) => i.score)) : 1;
  const maxCount = allItems.length > 0 ? Math.max(...allItems.map((i) => i.count)) : 1;

  // Heat color: interpolate from blue (cold, low count) to red (hot, high count)
  const heatColor = (count: number) => {
    const t = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
    // blue (210°) → orange (25°) → red (0°)
    const hue = 210 - t * 210;
    return `hsl(${hue}, 80%, 50%)`;
  };

  return (
    <div className="r-container">
      <div className="r-header">
        <h1>Survey Results</h1>
        <span className="r-badge">{totalResponses} response{totalResponses !== 1 ? "s" : ""}</span>
      </div>

      <div className="r-tabs">
        <button
          className={`r-tab ${tab === "summary" ? "active" : ""}`}
          onClick={() => setTab("summary")}
        >
          Summary
        </button>
        <button
          className={`r-tab ${tab === "responses" ? "active" : ""}`}
          onClick={() => setTab("responses")}
        >
          Individual Responses
        </button>
      </div>

      {tab === "summary" && (
        <>
          {/* Team size breakdown */}
          <div className="r-card">
            <h2>Team Size Breakdown</h2>
            <div className="r-team-grid">
              {Object.entries(teamSizeCounts).map(([key, count]) => (
                <div key={key} className="r-team-item">
                  <div className="r-team-count">{count}</div>
                  <div className="r-team-label">{teamSizeLabels[key] || key}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority rankings */}
          <div className="r-card">
            <h2>Priority Rankings</h2>
            <p className="r-subtitle">
              {sortBy === "score"
                ? "Sorted by priority score (rank 1 = 5 pts, rank 2 = 4 pts, ... rank 5 = 1 pt). Most wanted at the top."
                : "Sorted by average rank (lowest = most wanted by those who selected it). Most wanted at the top."}
            </p>

            <div className="r-sort-toggle">
              <span className="r-sort-label">Sort by:</span>
              <button
                className={`r-sort-btn ${sortBy === "score" ? "active" : ""}`}
                onClick={() => setSortBy("score")}
              >
                Priority Score
              </button>
              <button
                className={`r-sort-btn ${sortBy === "avgRank" ? "active" : ""}`}
                onClick={() => setSortBy("avgRank")}
              >
                Avg Rank
              </button>
            </div>

            <div className="r-heat-legend">
              <span className="r-heat-legend-label">Selection frequency:</span>
              <div className="r-heat-gradient" />
              <div className="r-heat-labels">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="r-rankings">
              {sortedItems.map((item, i) => (
                <div key={item.id} className="r-rank-row">
                  <div className="r-rank-pos">{i + 1}</div>
                  <div className="r-rank-info">
                    <div className="r-rank-label-row">
                      <span className="r-rank-label">{item.label}</span>
                      <span
                        className="r-heat-badge"
                        style={{ background: heatColor(item.count) }}
                        title={`Selected ${item.count} time${item.count !== 1 ? "s" : ""}`}
                      >
                        {item.count}
                      </span>
                    </div>
                    <div className="r-rank-bar-wrap">
                      <div
                        className="r-rank-bar"
                        style={{ width: `${(item.score / maxScore) * 100}%` }}
                      />
                    </div>
                    <div className="r-rank-stats">
                      <span className="r-stat">
                        <span className="r-stat-value">{item.score}</span> pts
                      </span>
                      <span className="r-stat-sep">&middot;</span>
                      <span className="r-stat">
                        Selected <span className="r-stat-value">{item.count}</span> time{item.count !== 1 ? "s" : ""}
                      </span>
                      <span className="r-stat-sep">&middot;</span>
                      <span className="r-stat">
                        Avg rank <span className="r-stat-value">{item.avgRank.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "responses" && (
        <div className="r-card">
          <h2>All Responses</h2>
          {results.length === 0 && <p className="r-empty">No responses yet.</p>}
          <div className="r-responses">
            {results.map((r) => (
              <div key={r.id} className="r-response">
                <button
                  className="r-response-header"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div>
                    <strong>{r.first_name} {r.last_name}</strong>
                    <span className="r-response-email">{r.email}</span>
                  </div>
                  <div className="r-response-right">
                    <span className="r-team-tag">{teamSizeLabels[r.team_size] || r.team_size}</span>
                    <span className="r-chevron">{expandedId === r.id ? "\u25B2" : "\u25BC"}</span>
                  </div>
                </button>
                {expandedId === r.id && (
                  <div className="r-response-body">
                    <div className="r-response-date">
                      Submitted {new Date(r.submitted_at).toLocaleDateString()} at{" "}
                      {new Date(r.submitted_at).toLocaleTimeString()}
                    </div>
                    <h4>Top 5 Rankings</h4>
                    <ol className="r-response-list">
                      {r.rankings
                        .sort((a, b) => a.rank - b.rank)
                        .map((item) => (
                          <li key={item.id}>{item.label}</li>
                        ))}
                    </ol>
                    {r.remaining_rankings && r.remaining_rankings.length > 0 && (
                      <>
                        <h4>Remaining Rankings</h4>
                        <ol className="r-response-list remaining" start={6}>
                          {r.remaining_rankings
                            .sort((a, b) => a.rank - b.rank)
                            .map((item) => (
                              <li key={item.id}>{item.label}</li>
                            ))}
                        </ol>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
