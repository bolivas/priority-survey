"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

// ============================================================
// CONFIGURE YOUR SURVEY OPTIONS HERE
// ============================================================
const SURVEY_OPTIONS = [
  { id: "lead-gen", label: "Lead Generation & Quality", description: "Agents waste time chasing unqualified leads from vendors that prioritize volume over quality, and the AI tools that do exist are built for American markets only, leaving international agents with nothing usable." },
  { id: "prospect-outreach", label: "Prospect Outreach & Contact", description: "Getting a prospect on the phone is a grind of unanswered calls, siloed communication channels, no intelligent call routing, and outreach that doesn\u2019t adapt to regional culture or tone." },
  { id: "follow-up-nurture", label: "Follow-Up, Nurture & Appointment Setting", description: "After first contact, most agents give up within 3\u20134 attempts because there\u2019s no automated system to persistently follow up across channels, book appointments, or trigger workflows based on prospect behavior." },
  { id: "client-onboarding", label: "Client Onboarding", description: "Once a sale is made, intake paperwork, form collection, and compliance-gated scheduling like Medicare\u2019s 48-hour Scope of Appointment rule bury salespeople in admin instead of letting them sell." },
  { id: "book-retention", label: "Book of Business & Client Retention", description: "Agents neglect existing clients because there\u2019s no automated system for annual reviews, pre-renewal outreach, quarterly touchpoints, or referral asks \u2014 and when automation does exist, it feels robotic at scale." },
  { id: "claims-engagement", label: "Claims Engagement", description: "Most agents go silent during claims and miss the single best relationship-building moment in insurance \u2014 no consistent touchpoints during or after claims, and no structured follow-up to convert loyalty into referrals." },
  { id: "agent-recruiting", label: "Agent Recruiting & Hiring", description: "The number one complaint in 23 years of the industry: agencies can\u2019t find good people, have no scalable recruiting funnel, and bias toward experienced hires while overlooking coachable talent." },
  { id: "licensing-exam", label: "Agent Licensing & Exam Prep", description: "Promising recruits wash out because they can\u2019t pass the licensing exam, and no AI-powered study tool exists to adapt to individual gaps and drill candidates to a passing score." },
  { id: "agent-onboarding", label: "Agent Onboarding & Contracting", description: "Getting a new agent contracted and credentialed with carriers is a full-time job that smaller agencies can\u2019t staff for, creating a bottleneck between hiring and producing." },
  { id: "agent-ramp-up", label: "New Agent Ramp-Up & Field Readiness", description: "After licensing, new agents are dropped into the field with no structured daily plan, no weekly milestones, and no 90-day roadmap \u2014 so they flounder, lose confidence, and quit." },
  { id: "sales-training", label: "Sales Training & Skill Development", description: "The training that actually makes agents successful \u2014 role plays, ride-alongs, presentation coaching \u2014 doesn\u2019t scale beyond one-on-one, and agency owners\u2019 plans break down when less-trained team members try to execute them." },
  { id: "accountability", label: "Agent Accountability & Performance Management", description: "Managers have no visibility into whether agents are making calls, booking appointments, or hitting daily behaviors, so they can\u2019t coach effectively or intervene early." },
  { id: "agent-retention", label: "Agent Retention & Culture", description: "Agents get poached by competitors because retention depends on culture, leadership, and feeling successful \u2014 all of which erode as agencies grow, go remote, or spread across regions." },
  { id: "underwriting", label: "Underwriting & Carrier Relations", description: "Underwriters are slow to respond, newer agents don\u2019t know how to push back on bad decisions, underwriters themselves sometimes don\u2019t know their own terms, and proprietary guidelines can\u2019t be loaded into AI tools without liability risk." },
  { id: "compliance", label: "Compliance & Regulatory", description: "Agents fail to document conversations, miss required disclosures, don\u2019t capture recording consent, and face serious legal exposure from Section A allegations \u2014 all while navigating rules that vary by state, country, and carrier with no automated tracking." },
  { id: "doc-generation", label: "Document Generation & Automation", description: "Creating client-facing documents, transcribing meetings, and generating compliant reports eats 14+ hours per week, and what does get produced is inconsistent in branding, tone, and structure across the agency." },
  { id: "marketing", label: "Marketing & Branding", description: "Agents are invisible in their markets with no differentiation, no content pipeline, no video strategy, and deep skepticism toward automation tools that overpromise \u2014 while the ones that do automate risk sounding generic and losing authenticity." },
  { id: "self-service", label: "Customer-Facing Self-Service", description: "Prospects and clients can\u2019t get insurance answers outside business hours, don\u2019t understand products well enough to buy, and agents are paying third parties for basic chatbot features that an in-house AI should own." },
  { id: "knowledge-base", label: "Agency Knowledge Base & Internal Efficiency", description: "There\u2019s no shared, multi-user knowledge base for agency teams, so managers and senior agents burn hours answering the same internal questions over and over instead of focusing on growth." },
  { id: "data-bi", label: "Data & Business Intelligence", description: "Most agents and owners don\u2019t track close ratios, dial-to-appointment rates, marketing ROI, or margins \u2014 they\u2019re flying blind and staying average because no simple dashboard ties activity to outcomes." },
  { id: "biz-ops-finance", label: "Business Operations & Finance", description: "Receipt tracking, commissions reconciliation, and bank account management are manual and error-prone, requiring dedicated headcount that smaller agencies can\u2019t afford and larger ones are still struggling to staff." },
];

const TEAM_SIZES = [
  { id: "1-2", label: "1\u20132 people" },
  { id: "3-20", label: "3\u201320 people" },
  { id: "20+", label: "20 or more" },
];

const MAX_SELECTIONS = 5;

type Step = "select" | "rank" | "info" | "submitted" | "already";

export default function Survey() {
  const [step, setStep] = useState<Step>("select");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rankedItems, setRankedItems] = useState<{ id: string; label: string; description: string }[]>([]);
  const [remainingItems, setRemainingItems] = useState<{ id: string; label: string; description: string }[]>([]);
  const [movedIds, setMovedIds] = useState<Set<string>>(new Set());
  const [movedRemainingIds, setMovedRemainingIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const savePartial = (partialStep: string, data: Record<string, unknown>) => {
    fetch("/api/partial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionIdRef.current, step: partialStep, ...data }),
    }).catch(() => {});
  };

  const deletePartial = () => {
    fetch("/api/partial", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionIdRef.current }),
    }).catch(() => {});
  };

  // Scroll to Next button when all 5 are selected
  useEffect(() => {
    if (selectedIds.size === MAX_SELECTIONS && nextBtnRef.current) {
      nextBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedIds.size]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- STEP 3: Info (final step) ---
  const handleInfoSubmit = () => {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please enter your first name, last name, and email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!teamSize) {
      setError("Please select your team size.");
      return;
    }
    setError("");
    handleSubmit();
  };

  // --- STEP 2: Select top 5 ---
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTIONS) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectNext = () => {
    if (selectedIds.size < MAX_SELECTIONS) {
      setError(`Please select exactly ${MAX_SELECTIONS} items.`);
      return;
    }
    const ranked = SURVEY_OPTIONS.filter((o) => selectedIds.has(o.id));
    const remaining = SURVEY_OPTIONS.filter((o) => !selectedIds.has(o.id));
    setRankedItems(ranked);
    setRemainingItems(remaining);
    setMovedIds(new Set());
    setMovedRemainingIds(new Set());
    setError("");
    savePartial("select", { selections: Array.from(selectedIds) });
    setStep("rank");
  };

  // --- STEP 3: Rank ---
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRankedItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setMovedIds((prev) => {
        const next = new Set(prev);
        next.add(active.id as string);
        next.add(over.id as string);
        return next;
      });
    }
  }, []);

  const handleRemainingDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRemainingItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setMovedRemainingIds((prev) => {
        const next = new Set(prev);
        next.add(active.id as string);
        next.add(over.id as string);
        return next;
      });
    }
  }, []);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          team_size: teamSize,
          rankings: rankedItems.map((item, index) => ({
            id: item.id,
            label: item.label,
            rank: index + 1,
          })),
          remaining_rankings: remainingItems.map((item, index) => ({
            id: item.id,
            label: item.label,
            rank: index + 1 + MAX_SELECTIONS,
          })),
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        deletePartial();
        setStep("already");
      } else if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        deletePartial();
        setStep("submitted");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== RENDER ==========

  if (step === "submitted") {
    return (
      <div className="container">
        <div className="card success-card">
          <div className="success-icon">✓</div>
          <h2>Thank You!</h2>
          <p>Your response has been recorded. We appreciate your time.</p>
        </div>
      </div>
    );
  }

  if (step === "already") {
    return (
      <div className="container">
        <div className="card already-card">
          <div className="success-icon" style={{ background: "#eff6ff" }}>📋</div>
          <h2>Already Submitted</h2>
          <p>It looks like you&apos;ve already completed this survey. Each person can only submit once. Thank you!</p>
        </div>
      </div>
    );
  }

  // --- STEP 1: Pick top 5 ---
  if (step === "select") {
    return (
      <div className="container">
        <div className="header">
          <h1>AI Employee Priority Survey</h1>
          <p>Help us understand which AI employees would be most valuable to you</p>
        </div>
        <div className="card">
          <div className="instructions">
            <strong>Select your top {MAX_SELECTIONS} priorities</strong>
            Tap or click the items that matter most to you. You must choose exactly {MAX_SELECTIONS}.
          </div>

          <div className="selection-count">
            {selectedIds.size}/{MAX_SELECTIONS} selected
            {selectedIds.size === MAX_SELECTIONS ? " — All picked! ✓" : ""}
          </div>

          <ul className="select-list">
            {SURVEY_OPTIONS.map((opt) => {
              const isSelected = selectedIds.has(opt.id);
              const isDisabled = !isSelected && selectedIds.size >= MAX_SELECTIONS;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    className={`select-item ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                    onClick={() => !isDisabled && toggleSelection(opt.id)}
                  >
                    <span className="select-check">{isSelected ? "✓" : ""}</span>
                    <span className="select-label">
                      {opt.label}
                      <span className="select-desc">{opt.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="submit-area">
            <button
              ref={nextBtnRef}
              className={`submit-btn ${selectedIds.size === MAX_SELECTIONS ? "pulse" : ""}`}
              onClick={handleSelectNext}
              disabled={selectedIds.size < MAX_SELECTIONS}
            >
              Next: Rank Them →
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    );
  }

  // --- STEP 3: Contact info + submit ---
  if (step === "info") {
    return (
      <div className="container">
        <div className="header">
          <h1>AI Employee Priority Survey</h1>
          <p>Almost done — just a few details</p>
        </div>
        <div className="card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>What is your team size?</label>
            <div className="team-size-options">
              {TEAM_SIZES.map((ts) => (
                <button
                  key={ts.id}
                  type="button"
                  className={`team-size-btn ${teamSize === ts.id ? "selected" : ""}`}
                  onClick={() => setTeamSize(ts.id)}
                >
                  {teamSize === ts.id && <span className="check-icon">✓ </span>}
                  {ts.label}
                </button>
              ))}
            </div>
          </div>

          <div className="submit-area" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="submit-btn"
              style={{ background: "var(--gray-300)", color: "var(--gray-700)" }}
              onClick={() => setStep("rank")}
            >
              ← Back
            </button>
            <button
              className="submit-btn"
              onClick={handleInfoSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit My Rankings"}
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    );
  }

  // --- STEP 2: Rank the 5 ---
  return (
    <div className="container">
      <div className="header">
        <h1>AI Employee Priority Survey</h1>
        <p>Step 2 of 3</p>
      </div>

      {/* Top 5 — required */}
      <div className="card">
        <div className="instructions">
          <strong>Rank your top {MAX_SELECTIONS} priorities</strong>
          Drag and drop to arrange them — place what matters <strong>most</strong> at the top
          and <strong>least</strong> at the bottom.
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-swatch unmoved"></div>
            <span>Needs arranging</span>
          </div>
          <div className="legend-item">
            <div className="legend-swatch moved"></div>
            <span>You&apos;ve positioned this</span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rankedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="sortable-list">
              {rankedItems.map((item, index) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  description={item.description}
                  rank={index + 1}
                  moved={movedIds.has(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <div className="progress-note" style={{ textAlign: "center", marginTop: 10 }}>
          {movedIds.size}/{rankedItems.length} items arranged
          {movedIds.size >= rankedItems.length ? " — All set! ✓" : ""}
        </div>
      </div>

      {/* Remaining — optional */}
      <div className="card remaining-card">
        <div className="instructions" style={{ background: "#f9fafb", borderColor: "var(--gray-200)", color: "var(--gray-600)" }}>
          <strong>Remaining options (optional)</strong>
          If you&apos;d like, you can also rank the remaining options below. This is optional — feel free to skip.
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRemainingDragEnd}
        >
          <SortableContext items={remainingItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="sortable-list">
              {remainingItems.map((item, index) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  description={item.description}
                  rank={index + 1 + MAX_SELECTIONS}
                  moved={movedRemainingIds.has(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 8 }}>
        <div className="submit-area" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            className="submit-btn"
            style={{ background: "var(--gray-300)", color: "var(--gray-700)" }}
            onClick={() => setStep("select")}
          >
            ← Back
          </button>
          <button
            className="submit-btn"
            onClick={() => {
              setError("");
              savePartial("rank", {
                selections: Array.from(selectedIds),
                rankings: rankedItems.map((item, index) => ({ id: item.id, label: item.label, rank: index + 1 })),
                remaining_rankings: remainingItems.map((item, index) => ({ id: item.id, label: item.label, rank: index + 1 + MAX_SELECTIONS })),
              });
              setStep("info");
            }}
          >
            Next →
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}
