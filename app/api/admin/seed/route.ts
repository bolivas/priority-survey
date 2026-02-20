import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SURVEY_ITEMS = [
  { id: "lead-gen", label: "Lead Generation & Quality" },
  { id: "prospect-outreach", label: "Prospect Outreach & Contact" },
  { id: "follow-up-nurture", label: "Follow-Up, Nurture & Appointment Setting" },
  { id: "client-onboarding", label: "Quoting, Fact-Finding & Client Onboarding" },
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

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
  "Anthony", "Betty", "Mark", "Margaret", "Steven", "Sandra", "Paul", "Ashley",
  "Andrew", "Dorothy", "Joshua", "Kimberly", "Kenneth", "Emily", "Kevin", "Donna",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
];

const TEAM_SIZES = ["1-2", "3-20", "20+"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateResponse(index: number) {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@example.com`;
  const teamSize = pick(TEAM_SIZES);

  const shuffled = shuffle(SURVEY_ITEMS);
  const top5 = shuffled.slice(0, 5);
  const rest = shuffled.slice(5);

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    team_size: teamSize,
    rankings: top5.map((item, i) => ({ id: item.id, label: item.label, rank: i + 1 })),
    remaining_rankings: rest.map((item, i) => ({ id: item.id, label: item.label, rank: i + 6 })),
    submitted_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { password, count = 10 } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = Array.from({ length: count }, (_, i) => generateResponse(i));

    const { error } = await supabase.from("survey_responses").insert(rows);

    if (error) {
      console.error("Supabase seed error:", error);
      return NextResponse.json({ error: "Failed to seed responses" }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
