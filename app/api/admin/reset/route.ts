import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("survey_responses")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to reset results" },
        { status: 500 }
      );
    }

    const { error: partialsError } = await supabase
      .from("survey_partials")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (partialsError) {
      console.error("Supabase partials delete error:", partialsError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
