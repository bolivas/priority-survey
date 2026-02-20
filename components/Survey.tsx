"use client";

import { useState, useCallback } from "react";
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
  { id: "lead-gen", label: "Lead Generation & Quality" },
  { id: "prospect-outreach", label: "Prospect Outreach & Contact" },
  { id: "follow-up-nurture", label: "Follow-Up, Nurture & Appointment Setting" },
  { id: "client-onboarding", label: "Client Onboarding" },
  { id: "book-retention", label: "Book of Business & Client Retention" },
  { id: "claims-engagement", label: "Claims Engagement" },
  { id: "agent-recruiting", label: "Agent Recruiting & Hiring" },
  { id: "licensing-exam", label: "Agent Licensing & Exam Prep" },
  { id: "agent-onboarding", label: "Agent Onboarding & Contracting" },
  { id: "agent-ramp-up", label: "New Agent Ramp-Up & Field Readiness" },
  { id: "sales-training", label: "Sales Training & Skill Development" },
  { id: "accountability", label: "Agent Accountability & Performance Management" },
  { id: "agent-retention", label: "Agent Retention & Culture" },
  { id: "underwriting", label: "Underwriting & Carrier Relations" },
  { id: "compliance", label: "Compliance & Regulatory" },
  { id: "doc-generation", label: "Document Generation & Automation" },
  { id: "marketing", label: "Marketing & Branding" },
  { id: "self-service", label: "Customer-Facing Self-Service" },
  { id: "knowledge-base", label: "Agency Knowledge Base & Internal Efficiency" },
  { id: "data-bi", label: "Data & Business Intelligence" },
  { id: "biz-ops-finance", label: "Business Operations & Finance" },
];

const TEAM_SIZES = [
  { id: "1-2", label: "1\u20132 people" },
  { id: "3-20", label: "3\u201320 people" },
  { id: "20+", label: "20 or more" },
];

const MAX_SELECTIONS = 5;

type Step = "info" | "select" | "rank" | "submitted" | "already";

export default function Survey() {
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rankedItems, setRankedItems] = useState<{ id: string; label: string }[]>([]);
  const [movedIds, setMovedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- STEP 1: Info ---
  const handleInfoNext = () => {
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
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
    setStep("select");
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
    setRankedItems(ranked);
    setMovedIds(new Set());
    setError("");
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

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          team_size: teamSize,
          rankings: rankedItems.map((item, index) => ({
            id: item.id,
            label: item.label,
            rank: index + 1,
          })),
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setStep("already");
      } else if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
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

  // --- STEP 1: Name, email, team size ---
  if (step === "info") {
    return (
      <div className="container">
        <div className="header">
          <h1>Priority Survey</h1>
          <p>Help us understand what matters most to you</p>
        </div>
        <div className="card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
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

          <div className="submit-area">
            <button className="submit-btn" onClick={handleInfoNext}>
              Next →
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    );
  }

  // --- STEP 2: Pick top 5 ---
  if (step === "select") {
    return (
      <div className="container">
        <div className="header">
          <h1>Priority Survey</h1>
          <p>Step 1 of 2</p>
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
                    <span className="select-label">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="submit-area" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="submit-btn"
              style={{ background: "var(--gray-300)", color: "var(--gray-700)" }}
              onClick={() => setStep("info")}
            >
              ← Back
            </button>
            <button
              className="submit-btn"
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

  // --- STEP 3: Rank the 5 ---
  return (
    <div className="container">
      <div className="header">
        <h1>Priority Survey</h1>
        <p>Step 2 of 2</p>
      </div>
      <div className="card">
        <div className="instructions">
          <strong>Now rank your top {MAX_SELECTIONS} in order</strong>
          Drag and drop to arrange them — place what matters <strong>most</strong> at the top
          and <strong>least</strong> at the bottom.
          Items in <span style={{ color: "#a16207", fontWeight: 600 }}>yellow</span> haven&apos;t
          been moved yet. Once you drag one, it turns{" "}
          <span style={{ color: "#15803d", fontWeight: 600 }}>green</span>.
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
                  rank={index + 1}
                  moved={movedIds.has(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

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
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit My Rankings"}
          </button>
        </div>

        <div className="progress-note" style={{ textAlign: "center", marginTop: 10 }}>
          {movedIds.size}/{rankedItems.length} items arranged
          {movedIds.size >= rankedItems.length ? " — All set! ✓" : ""}
        </div>

        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}
