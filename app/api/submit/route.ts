import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, team_size, rankings, remaining_rankings } = body;

    if (!first_name || !last_name || !email || !team_size || !rankings) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already submitted
    const { data: existing } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("email", email.toLowerCase())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "This email has already submitted a response." },
        { status: 409 }
      );
    }

    // Insert the response
    const { error } = await supabase.from("survey_responses").insert({
      first_name,
      last_name,
      email: email.toLowerCase(),
      team_size,
      rankings,
      remaining_rankings: remaining_rankings || [],
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email has already submitted a response." },
          { status: 409 }
        );
      }
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
