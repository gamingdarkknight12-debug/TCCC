'use client';

import { useEffect, useState } from 'react';
import { PageWrap } from '../UI';

function isPredictionPoll(pollName) {
  return pollName.startsWith("Predict:");
}

const parseStatNum = (v) => {
  if (v === undefined || v === null || v === "-") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

function topByStat(players, valueFn, minFn) {
  let best = null;
  for (const p of players) {
    if (minFn && !minFn(p)) continue;
    const value = valueFn(p);
    if (value === null || value === undefined) continue;
    if (!best || value > best.value) best = { player: p, value };
  }
  return best;
}

const AWARD_DEFS = [
  {
    icon: "🦾",
    title: "Iron Man",
    pick: (players) => topByStat(players, (p) => p.matches),
    stat: (r) => `${r.value} matches played`,
    blurb: (r) => `${r.player.name} showed up more than anyone else this season.`,
  },
  {
    icon: "🏆",
    title: "Most Valuable Player",
    pick: (players) => topByStat(players, (p) => (p.runs || 0) + (p.wickets || 0) * 20),
    stat: (r) => `${r.player.runs || 0} runs • ${r.player.wickets || 0} wickets`,
    blurb: (r) => `${r.player.name} swung the game more often than anyone this year.`,
  },
  {
    icon: "💥",
    title: "Six Machine",
    pick: (players) => topByStat(players, (p) => p.sixes, (p) => p.sixes > 0),
    stat: (r) => `${r.value} sixes`,
    blurb: (r) => `${r.player.name} keeps sending the ball into the next postal code.`,
  },
  {
    icon: "🚀",
    title: "Strike Rate Rocket",
    pick: (players) => topByStat(players, (p) => p.sr, (p) => p.sr !== null && p.balls >= 20),
    stat: (r) => `SR ${r.value.toFixed(1)}`,
    blurb: (r) => `${r.player.name} doesn't believe in dot balls.`,
  },
  {
    icon: "🧊",
    title: "The Wall",
    pick: (players) => topByStat(players, (p) => p.avg, (p) => p.avg !== null && p.runs >= 100),
    stat: (r) => `Avg ${r.value.toFixed(1)}`,
    blurb: (r) => `${r.player.name} makes the bowlers earn every single wicket.`,
  },
  {
    icon: "🔥",
    title: "Wicket Hunter",
    pick: (players) => topByStat(players, (p) => p.wickets, (p) => p.wickets > 0),
    stat: (r) => `${r.value} wickets`,
    blurb: (r) => `${r.player.name} keeps ending innings before they get started.`,
  },
  {
    icon: "🎯",
    title: "Economy King",
    pick: (players) => topByStat(players, (p) => (p.economy === null ? null : -p.economy), (p) => p.economy !== null && p.overs >= 15),
    stat: (r) => `Economy ${(-r.value).toFixed(1)}`,
    blurb: (r) => `${r.player.name} makes batters work for every run.`,
  },
  {
    icon: "😅",
    title: "Extras Donation Award",
    pick: (players) => topByStat(players, (p) => (p.wides || 0) + (p.noBalls || 0), (p) => (p.wides || 0) + (p.noBalls || 0) > 0),
    stat: (r) => `${r.value} freebies conceded`,
    blurb: (r) => `${r.player.name} is basically sponsoring the opposition's total.`,
  },
];

function buildAwardPlayers(batting, bowling) {
  const map = new Map();
  const get = (name) => {
    if (!map.has(name)) map.set(name, { name, matches: 0 });
    return map.get(name);
  };

  for (const b of batting) {
    const p = get(b.name);
    p.matches = Math.max(p.matches, b.matches || 0);
    p.runs = b.runs || 0;
    p.balls = b.balls || 0;
    p.sixes = b.sixes || 0;
    p.sr = parseStatNum(b.sr);
    p.avg = parseStatNum(b.avg);
  }

  for (const w of bowling) {
    const p = get(w.name);
    p.matches = Math.max(p.matches, w.matches || 0);
    p.wickets = w.wickets || 0;
    p.overs = w.overs || 0;
    p.economy = parseStatNum(w.economy);
    p.wides = w.wides || 0;
    p.noBalls = w.noBalls || 0;
  }

  return [...map.values()];
}

function computeAwards(batting, bowling) {
  const players = buildAwardPlayers(batting, bowling);
  return AWARD_DEFS.map((def) => {
    const result = def.pick(players);
    if (!result) return null;
    return { ...def, result };
  }).filter(Boolean);
}

// Local calendar day as YYYY-MM-DD, so it can be compared directly against
// the poll's stored match_date string without any UTC/local timezone drift.
function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function matchNarrativeLine(match) {
  if (match.result.summary) return match.result.summary;

  const { teamScore, opponentScore, result } = match.result;
  if (teamScore && opponentScore) {
    return `Telugu Titans scored ${teamScore} against ${match.opponent}'s ${opponentScore}.${result ? ` ${result}.` : ""}`;
  }
  return result ? `${result}.` : `Telugu Titans faced ${match.opponent}.`;
}

function matchHighlightLine(match) {
  const { ground, league, homeAway } = match;
  const venue = ground ? ` at ${ground}` : "";
  const homeAwayText = homeAway ? ` (${homeAway} fixture)` : "";

  return `${league} matchday${venue}${homeAwayText}.`;
}

export function TeamHub() {
  const [teamHubTab, setTeamHubTab] = useState("Voting Arena");
  const [polls, setPolls] = useState({});
  const [pollInputs, setPollInputs] = useState({});
  const [captainNote, setCaptainNote] = useState("");
  const [captainNotes, setCaptainNotes] = useState([]);
  const [captainPlayer, setCaptainPlayer] = useState("");
  const [awards, setAwards] = useState([]);
  const [timelineMatches, setTimelineMatches] = useState([]);

  useEffect(() => {
    fetch("/api/stats?season=2026")
      .then((res) => res.json())
      .then((data) => setAwards(computeAwards(data.batting || [], data.bowling || [])))
      .catch(() => setAwards([]));

    fetch("/api/matches?season=2026")
      .then((res) => res.json())
      .then((data) =>
        setTimelineMatches(
          (data.matches || [])
            .filter((m) => m.status !== "scheduled")
            .reverse()
        )
      )
      .catch(() => setTimelineMatches([]));
  }, []);

  async function loadTeamHubData() {
    const res = await fetch("/api/teamhub");
    const data = await res.json();

    const groupedPolls = {};

    data.polls.forEach((p) => {
      if (!groupedPolls[p.poll_name]) groupedPolls[p.poll_name] = { options: [], matchDate: p.match_date || null };
      groupedPolls[p.poll_name].options.push({
        id: p.id,
        name: p.option_name,
        votes: p.votes,
      });
    });

    setPolls(groupedPolls);
    setCaptainNotes(
      data.captainNotes.map((x) => ({
        note: x.note,
        player: x.player_name,
      }))
    );
  }

  useEffect(() => {
    loadTeamHubData();
  }, []);

  async function addPollOption(pollName) {
    const value = (pollInputs[pollName] || "").trim();
    if (!value) return;

    await fetch("/api/teamhub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "addPollOption",
        pollName,
        optionName: value,
      }),
    });

    setPollInputs((prev) => ({ ...prev, [pollName]: "" }));
    loadTeamHubData();
  }

  async function votePoll(pollName, index) {
    const option = polls[pollName].options[index];
    const pollKey = `voted_${pollName}`;
    if (localStorage.getItem(pollKey)) {
      alert("You already voted for this poll.");
      return;
    }

    await fetch("/api/teamhub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "votePoll",
        id: option.id,
      }),
    });

    localStorage.setItem(pollKey, "true");
    loadTeamHubData();
  }

  function publishVotingResults() {
    const resultsText = Object.entries(polls)
      .map(([pollName, { options }]) => {
        if (!options.length) return `${pollName}\nNo votes yet`;

        // sort by votes DESC
        const sorted = [...options].sort((a, b) => b.votes - a.votes);

        const lines = sorted.map((opt, index) => {
          const winnerTag = index === 0 ? " 🏆" : "";
          return `${opt.name} - ${opt.votes} votes${winnerTag}`;
        });

        return `🏏 ${pollName}\n${lines.join("\n")}`;
      })
      .join("\n\n");

    const message = `🔥 Team Hub Voting Results 🔥\n\n${resultsText}\n\nStay tuned 💪`;

    navigator.clipboard.writeText(message);
    alert("Voting results copied! Paste in WhatsApp.");
  }

  async function addCaptainNote() {
    if (!captainPlayer.trim()) {
      alert("Please enter player name");
      return;
    }

    if (!captainNote.trim()) {
      alert("Please enter strategy note");
      return;
    }

    const res = await fetch("/api/teamhub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "captainNote",
        note: captainNote,
        player_name: captainPlayer,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.log(err);
      alert("Error saving");
      return;
    }

    setCaptainNote("");
    setCaptainPlayer("");

    loadTeamHubData();
  }

  return (
    <PageWrap
      id="teamhub"
      title="Team Hub"
      subtitle="Titans digital dressing room — votes, fun, memories, goals, and team culture."
    >
      <div className=" teamhub-tabs mb-8 flex flex-wrap gap-3">
        {[
          "Voting Arena",
          "Awards Room",
          "Season Timeline",
          "War Room",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setTeamHubTab(tab)}
            className={`btn ${teamHubTab === tab ? "btn-gold" : "btn-ghost"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {teamHubTab === "Voting Arena" && (
        <div>
          <div
            teamhub-tabs
            className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {Object.keys(polls).map((pollName) => {
              const { options = [], matchDate } = polls[pollName] || {};
              const sorted = [...options].sort((a, b) => b.votes - a.votes);
              const prediction = isPredictionPoll(pollName);
              const revealResults = !!matchDate && todayStr() >= matchDate;

              return (
                <div key={pollName} className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 xl:p-5">
                  <h3 className="text-base font-black leading-snug text-amber-300 break-words sm:text-lg">{pollName}</h3>

                  {revealResults ? (
                    <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 sm:mt-5 sm:px-4 sm:py-3">
                      {sorted.length === 0 ? (
                        <p className="text-sm text-white/60">No votes yet.</p>
                      ) : (
                        <>
                          <div className="text-xs font-black text-amber-300 sm:text-sm">
                            🏆 Winner: {sorted[0].name} - {sorted[0].votes} votes
                          </div>

                          {sorted.slice(1, 3).map((item, i) => (
                            <div key={item.id || item.name} className="mt-1.5 text-xs font-bold text-white/75 sm:mt-2 sm:text-sm">
                              {i + 2}. {item.name} - {item.votes} votes
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
                        {options.length === 0 ? (
                          <p className="rounded-xl bg-black/30 p-3 text-sm text-white/60 sm:p-4">
                            No options yet. Add the first name below.
                          </p>
                        ) : (
                          sorted.map((option, index) => (
                            <button
                              key={`${option.name}-${index}`}
                              onClick={() =>
                                votePoll(
                                  pollName,
                                  options.findIndex((o) => o.id === option.id)
                                )
                              }
                              className="flex w-full items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-left text-sm font-bold text-white/80 hover:bg-amber-300 hover:text-black sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
                            >
                              <span>{option.name}</span>
                              <span>{option.votes} votes</span>
                            </button>
                          ))
                        )}
                      </div>

                      {!prediction && (
                        <div className="mt-3 flex gap-2 sm:mt-5">
                          <input
                            value={pollInputs[pollName] || ""}
                            onChange={(e) =>
                              setPollInputs((prev) => ({
                                ...prev,
                                [pollName]: e.target.value,
                              }))
                            }
                            placeholder="Add player name"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
                          />
                          <button onClick={() => addPollOption(pollName)} className="btn btn-gold px-3 py-2 text-sm sm:px-4 sm:py-3">
                            Add
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {teamHubTab === "Season Timeline" && (
        <div teamhub-tabs>
          <h2 className="text-4xl font-black text-amber-300">2026 Season Timeline</h2>
          <p className="mt-2 mb-8 text-white/70">
            Every match, day one to now — results, MVPs, and scorelines as they were published.
          </p>

          {timelineMatches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No matches recorded for 2026 yet.
            </div>
          ) : (
            <div className="relative space-y-3 border-l-2 border-amber-300/20 pl-5">
              {timelineMatches.map((match) => (
                <div key={match.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-300" />

                  <div className="timeline-match-card rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-black">
                        {match.league}
                      </span>
                      <span className="text-xs text-white/60">
                        {match.day}, {match.date}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-black text-amber-300">
                      Telugu Titans vs {match.opponent}
                    </h3>

                    {match.result ? (
                      <>
                        <p className="mt-1 text-sm font-bold text-white">{match.result.result}</p>
                        {match.result.teamScore && match.result.opponentScore && (
                          <p className="mt-0.5 text-xs text-white/60">
                            {match.result.teamScore} vs {match.result.opponentScore}
                          </p>
                        )}
                        <p className="mt-2 text-xs leading-5 text-white/75">{matchNarrativeLine(match)}</p>
                        <p className="mt-0.5 text-xs leading-5 text-white/75">{matchHighlightLine(match)}</p>

                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {match.result.mvp && (
                            <div className="inline-block rounded-lg border border-amber-300/20 bg-black/30 px-2.5 py-1.5 text-xs text-amber-300">
                              🏆 MVP: {match.result.mvp}
                            </div>
                          )}
                          {match.bestBatter && (
                            <div className="inline-block rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white/80">
                              🏏 Best Batter: {match.bestBatter.name} — {match.bestBatter.runs} runs
                            </div>
                          )}
                          {match.bestBowler && (
                            <div className="inline-block rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white/80">
                              🎯 Best Bowler: {match.bestBowler.name} — {match.bestBowler.wickets} wickets
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-white/60">Upcoming — result not posted yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {teamHubTab === "War Room" && (
        <div teamhub-tabs className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-3xl font-black text-amber-300">
              War Room Strategy Note
            </h3>
            <p className="mt-3 text-white/70">
              Share match Strategy, plans, suggestions and ideas for the captain
            </p>
            <input
              value={captainPlayer}
              onChange={(e) => setCaptainPlayer(e.target.value)}
              placeholder="Player name"
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            />
            <textarea
              value={captainNote}
              onChange={(e) => setCaptainNote(e.target.value)}
              placeholder="Share your Strategy..."
              className="mt-5 h-40 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none"
            />

            <button onClick={addCaptainNote} className="btn btn-gold mt-4">
              Submit
            </button>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
            <h3 className="text-2xl font-black text-amber-300">Submitted Notes</h3>

            <div className="mt-5 space-y-3">
              {captainNotes.length === 0 ? (
                <p className="text-white/60">No Strategies yet.</p>
              ) : (
                captainNotes.map((item, i) => (
                  <div key={i} className="rounded-xl bg-black/30 p-3 text-smtext-white/75">
                    <div className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">
                      {item.player}
                    </div>

                    <div>{item.note}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {teamHubTab === "Awards Room" && (
        <div teamhub-tabs>
          <h2 className="text-4xl font-black text-amber-300">2026 Season Awards</h2>
          <p className="mt-2 mb-8 text-white/70">
            Auto-crowned straight from this season's batting and bowling numbers — no votes needed.
          </p>

          <div teamhub-tabs className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {awards.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Not enough 2026 stats yet — check back after a few more matches.
              </div>
            ) : (
              awards.map((award) => (
                <div
                  key={award.title}
                  className="award-card rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-5"
                >
                  <div className="flex items-center gap-1.5 text-sm uppercase tracking-widest text-yellow-400">
                    <span>{award.icon}</span>
                    <span>{award.title}</span>
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-white">{award.result.player.name}</h3>
                  <div className="mt-2 text-lg font-semibold text-yellow-300">{award.stat(award.result)}</div>
                  <p className="mt-3 text-sm leading-6 text-white/60">{award.blurb(award.result)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </PageWrap>
  );
}
