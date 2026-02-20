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

const ITEM_DESCRIPTIONS: Record<string, string> = {
  "lead-gen": "Agents waste time chasing unqualified leads from vendors that prioritize volume over quality, and the AI tools that do exist are built for American markets only, leaving international agents with nothing usable.",
  "prospect-outreach": "Getting a prospect on the phone is a grind of unanswered calls, siloed communication channels, no intelligent call routing, and outreach that doesn\u2019t adapt to regional culture or tone.",
  "follow-up-nurture": "After first contact, most agents give up within 3\u20134 attempts because there\u2019s no automated system to persistently follow up across channels, book appointments, or trigger workflows based on prospect behavior.",
  "client-onboarding": "Pre-sale fact-finding, quoting, information gathering, and post-sale intake paperwork, form collection, and compliance-gated scheduling like Medicare\u2019s 48-hour Scope of Appointment rule bury salespeople in admin instead of letting them sell.",
  "book-retention": "Agents neglect existing clients because there\u2019s no automated system for annual reviews, pre-renewal outreach, quarterly touchpoints, or referral asks \u2014 and when automation does exist, it feels robotic at scale.",
  "claims-engagement": "Most agents go silent during claims and miss the single best relationship-building moment in insurance \u2014 no consistent touchpoints during or after claims, and no structured follow-up to convert loyalty into referrals.",
  "agent-recruiting": "The number one complaint in 23 years of the industry: agencies can\u2019t find good people, have no scalable recruiting funnel, and bias toward experienced hires while overlooking coachable talent.",
  "licensing-exam": "Promising recruits wash out because they can\u2019t pass the licensing exam, and no AI-powered study tool exists to adapt to individual gaps and drill candidates to a passing score.",
  "agent-onboarding": "Getting a new agent contracted and credentialed with carriers is a full-time job that smaller agencies can\u2019t staff for, creating a bottleneck between hiring and producing.",
  "agent-ramp-up": "After licensing, new agents are dropped into the field with no structured daily plan, no weekly milestones, and no 90-day roadmap \u2014 so they flounder, lose confidence, and quit.",
  "sales-training": "The training that actually makes agents successful \u2014 role plays, ride-alongs, presentation coaching \u2014 doesn\u2019t scale beyond one-on-one, and agency owners\u2019 plans break down when less-trained team members try to execute them.",
  "accountability": "Managers have no visibility into whether agents are making calls, booking appointments, or hitting daily behaviors, so they can\u2019t coach effectively or intervene early.",
  "agent-retention": "Agents get poached by competitors because retention depends on culture, leadership, and feeling successful \u2014 all of which erode as agencies grow, go remote, or spread across regions.",
  "underwriting": "Underwriters are slow to respond, newer agents don\u2019t know how to push back on bad decisions, underwriters themselves sometimes don\u2019t know their own terms, and proprietary guidelines can\u2019t be loaded into AI tools without liability risk.",
  "compliance": "Agents fail to document conversations, miss required disclosures, don\u2019t capture recording consent, and face serious legal exposure from Section A allegations \u2014 all while navigating rules that vary by state, country, and carrier with no automated tracking.",
  "doc-generation": "Creating client-facing documents, transcribing meetings, and generating compliant reports eats 14+ hours per week, and what does get produced is inconsistent in branding, tone, and structure across the agency.",
  "marketing": "Agents are invisible in their markets with no differentiation, no content pipeline, no video strategy, and deep skepticism toward automation tools that overpromise \u2014 while the ones that do automate risk sounding generic and losing authenticity.",
  "self-service": "Prospects and clients can\u2019t get insurance answers outside business hours, don\u2019t understand products well enough to buy, and agents are paying third parties for basic chatbot features that an in-house AI should own.",
  "knowledge-base": "There\u2019s no shared, multi-user knowledge base for agency teams, so managers and senior agents burn hours answering the same internal questions over and over instead of focusing on growth.",
  "data-bi": "Most agents and owners don\u2019t track close ratios, dial-to-appointment rates, marketing ROI, or margins \u2014 they\u2019re flying blind and staying average because no simple dashboard ties activity to outcomes.",
  "biz-ops-finance": "Receipt tracking, commissions reconciliation, and bank account management are manual and error-prone, requiring dedicated headcount that smaller agencies can\u2019t afford and larger ones are still struggling to staff.",
};

export default function ResultsPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [results, setResults] = useState<Response[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("summary");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<"all" | "1-2" | "3-20" | "20+">("all");

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

  // Filter results by team size
  const filteredResults = teamFilter === "all"
    ? results
    : results.filter((r) => r.team_size === teamFilter);
  const filteredCount = filteredResults.length;

  // Aggregate top-5 rankings with priority score
  // Points: rank 1 = 5 pts, rank 2 = 4 pts, ..., rank 5 = 1 pt
  const itemStats: Record<string, { count: number; totalRank: number; score: number; label: string }> = {};
  filteredResults.forEach((r) => {
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
    (a, b) => b.score - a.score || b.count - a.count
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
              Sorted by priority score (rank 1 = 5 pts, rank 2 = 4 pts, ... rank 5 = 1 pt). Most wanted at the top.
              {teamFilter !== "all" && ` Showing ${filteredCount} of ${totalResponses} responses.`}
            </p>

            <div className="r-sort-toggle">
              <span className="r-sort-label">Team size:</span>
              <button
                className={`r-sort-btn ${teamFilter === "all" ? "active" : ""}`}
                onClick={() => setTeamFilter("all")}
              >
                All
              </button>
              <button
                className={`r-sort-btn ${teamFilter === "1-2" ? "active" : ""}`}
                onClick={() => setTeamFilter("1-2")}
              >
                1–2 people
              </button>
              <button
                className={`r-sort-btn ${teamFilter === "3-20" ? "active" : ""}`}
                onClick={() => setTeamFilter("3-20")}
              >
                3–20 people
              </button>
              <button
                className={`r-sort-btn ${teamFilter === "20+" ? "active" : ""}`}
                onClick={() => setTeamFilter("20+")}
              >
                20+ people
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
                    {ITEM_DESCRIPTIONS[item.id] && (
                      <p className="r-rank-description">{ITEM_DESCRIPTIONS[item.id]}</p>
                    )}
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
