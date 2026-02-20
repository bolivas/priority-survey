import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, step, selections, rankings, remaining_rankings, first_name, last_name, email, team_size } = body;

    if (!session_id || !step) {
      return NextResponse.json(
        { error: "session_id and step are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("survey_partials")
      .upsert(
        {
          session_id,
          step,
          selections: selections ?? null,
          rankings: rankings ?? null,
          remaining_rankings: remaining_rankings ?? null,
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          email: email ?? null,
          team_size: team_size ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save partial response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Partial save error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("survey_partials")
      .delete()
      .eq("session_id", session_id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete partial response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Partial delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
