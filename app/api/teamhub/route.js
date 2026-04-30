import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function GET() {
  const [polls, locker, captain, roast] = await Promise.all([
    supabaseServer.from("teamhub_polls").select("*").order("created_at", { ascending: false }),
    supabaseServer.from("teamhub_locker_notes").select("*").order("created_at", { ascending: false }),
    supabaseServer.from("teamhub_captain_notes").select("*").order("created_at", { ascending: false }),
    supabaseServer.from("teamhub_roast_names").select("*").order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    polls: polls.data || [],
    lockerNotes: locker.data || [],
    captainNotes: captain.data || [],
    roastNames: roast.data || [],
  });
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.type === "addPollOption") {
      const { data, error } = await supabaseServer
        .from("teamhub_polls")
        .insert({
          poll_name: body.pollName,
          option_name: body.optionName,
          votes: 0,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (body.type === "votePoll") {
      const { data: current, error: readError } = await supabaseServer
        .from("teamhub_polls")
        .select("votes")
        .eq("id", body.id)
        .single();

      if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

      const { data, error } = await supabaseServer
        .from("teamhub_polls")
        .update({ votes: (current?.votes || 0) + 1 })
        .eq("id", body.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (body.type === "lockerNote") {
      const { data, error } = await supabaseServer
        .from("teamhub_locker_notes")
        .insert({ note: body.note })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (body.type === "captainNote") {
      const { data, error } = await supabaseServer
        .from("teamhub_captain_notes")
        .insert({
          note: body.note,
          player_name: body.player_name,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (body.type === "roastName") {
      const { data, error } = await supabaseServer
        .from("teamhub_roast_names")
        .insert({
          player_name: body.playerName,
          roast_name: body.roastName,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}