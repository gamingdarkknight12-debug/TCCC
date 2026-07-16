'use client';

import { useEffect, useState } from 'react';
import { PageWrap, StatTable } from '../UI';

function isPredictionPoll(pollName) {
  return pollName.startsWith("Predict:");
}

const parseStatNum = (v) => {
  if (v === undefined || v === null || v === "-") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

// tiebreakFn (optional): when two players are exactly equal on the primary
// stat (e.g. both took 15 wickets), whoever has the higher tiebreak value
// wins instead of it being whichever player happened to be encountered
// first while iterating — that was previously arbitrary (DB row order),
// which is how Srikanth Govula beat Shanthan Akkiraju for "Wicket Hunter"
// despite Shanthan's economy being clearly better on the same 15 wickets.
function topByStat(players, valueFn, minFn, tiebreakFn) {
  let best = null;
  for (const p of players) {
    if (minFn && !minFn(p)) continue;
    const value = valueFn(p);
    if (value === null || value === undefined) continue;
    if (!best || value > best.value) {
      best = { player: p, value };
    } else if (value === best.value && tiebreakFn) {
      const tb = tiebreakFn(p);
      const bestTb = tiebreakFn(best.player);
      if (tb !== null && bestTb !== null && tb > bestTb) best = { player: p, value };
    }
  }
  return best;
}

const AWARD_DEFS = [
  {
    icon: "🦾",
    title: "Iron Man",
    pick: (players) => topByStat(players, (p) => p.matches, null, (p) => (p.runs || 0) + (p.wickets || 0) * 20),
    stat: (r) => `${r.value} matches played`,
    blurb: (r) => `${r.player.name} showed up more than anyone else this season.`,
  },
  {
    icon: "🏆",
    title: "Most Valuable Player",
    pick: (players) => topByStat(players, (p) => (p.runs || 0) + (p.wickets || 0) * 20, null, (p) => -p.matches),
    stat: (r) => `${r.player.runs || 0} runs • ${r.player.wickets || 0} wickets`,
    blurb: (r) => `${r.player.name} swung the game more often than anyone this year.`,
  },
  {
    icon: "💥",
    title: "Six Machine",
    pick: (players) => topByStat(players, (p) => p.sixes, (p) => p.sixes > 0, (p) => p.sr),
    stat: (r) => `${r.value} sixes`,
    blurb: (r) => `${r.player.name} keeps sending the ball into the next postal code.`,
  },
  {
    icon: "🚀",
    title: "Strike Rate Rocket",
    pick: (players) => topByStat(players, (p) => p.sr, (p) => p.sr !== null && p.balls >= 20, (p) => p.runs),
    stat: (r) => `SR ${r.value.toFixed(1)}`,
    blurb: (r) => `${r.player.name} doesn't believe in dot balls.`,
  },
  {
    icon: "🧊",
    title: "The Wall",
    pick: (players) => topByStat(players, (p) => p.avg, (p) => p.avg !== null && p.runs >= 100, (p) => p.runs),
    stat: (r) => `Avg ${r.value.toFixed(1)}`,
    blurb: (r) => `${r.player.name} makes the bowlers earn every single wicket.`,
  },
  {
    icon: "🔥",
    title: "Wicket Hunter",
    pick: (players) => topByStat(players, (p) => p.wickets, (p) => p.wickets > 0, (p) => (p.economy === null ? null : -p.economy)),
    stat: (r) => `${r.value} wickets`,
    blurb: (r) => `${r.player.name} keeps ending innings before they get started.`,
  },
  {
    icon: "🎯",
    title: "Economy King",
    pick: (players) => topByStat(players, (p) => (p.economy === null ? null : -p.economy), (p) => p.economy !== null && p.overs >= 15, (p) => p.wickets),
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


function formatMatchDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

const emptyFantasyForm = {
  id: null,
  ownerName: "",
  batter1Id: "",
  batter2Id: "",
  bowler1Id: "",
  bowler2Id: "",
  captainId: "",
  viceCaptainId: "",
};

export function TeamHub() {
  const [teamHubTab, setTeamHubTab] = useState("Voting Arena");
  const [polls, setPolls] = useState({});
  const [pollInputs, setPollInputs] = useState({});
  const [captainNote, setCaptainNote] = useState("");
  const [captainNotes, setCaptainNotes] = useState([]);
  const [captainPlayer, setCaptainPlayer] = useState("");
  const [captainFromPlayer, setCaptainFromPlayer] = useState("");
  const [awards, setAwards] = useState([]);
  const [timelineMatches, setTimelineMatches] = useState([]);

  const [fantasyAuthed, setFantasyAuthed] = useState(null);
  const [fantasyPassword, setFantasyPassword] = useState("");
  const [fantasyLoginMessage, setFantasyLoginMessage] = useState("");
  const [fantasyRoster, setFantasyRoster] = useState({ batters: [], bowlers: [] });
  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [fantasyStandings, setFantasyStandings] = useState([]);
  const [fantasyForm, setFantasyForm] = useState(emptyFantasyForm);
  const [fantasyFormMessage, setFantasyFormMessage] = useState("");
  const [fantasyLock, setFantasyLock] = useState({ locked: false, reason: null, upcomingMatches: [] });

  useEffect(() => {
    fetch("/api/fantasy-session")
      .then((res) => res.json())
      .then((data) => setFantasyAuthed(!!data.authed))
      .catch(() => setFantasyAuthed(false));
  }, []);

  async function loadFantasyData() {
    const [rosterRes, teamsRes, standingsRes, lockRes] = await Promise.all([
      fetch("/api/fantasy/roster"),
      fetch("/api/fantasy/teams"),
      fetch("/api/fantasy/standings"),
      fetch("/api/fantasy/lock-status"),
    ]);
    setFantasyRoster(await rosterRes.json());
    const teamsData = await teamsRes.json();
    setFantasyTeams(teamsData.teams || []);
    const standingsData = await standingsRes.json();
    setFantasyStandings(standingsData.standings || []);
    setFantasyLock(await lockRes.json());
  }

  useEffect(() => {
    if (fantasyAuthed) loadFantasyData();
  }, [fantasyAuthed]);

  async function fantasyLogin(e) {
    e.preventDefault();
    setFantasyLoginMessage("Checking...");
    const res = await fetch("/api/fantasy-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: fantasyPassword }),
    });
    if (res.ok) {
      setFantasyAuthed(true);
      setFantasyLoginMessage("");
    } else {
      setFantasyLoginMessage("Wrong password.");
    }
  }

  function editFantasyTeam(team) {
    setFantasyForm({
      id: team.id,
      ownerName: team.ownerName,
      batter1Id: String(team.batter1Id),
      batter2Id: String(team.batter2Id),
      bowler1Id: String(team.bowler1Id),
      bowler2Id: String(team.bowler2Id),
      captainId: String(team.captainId),
      viceCaptainId: String(team.viceCaptainId),
    });
    setFantasyFormMessage("");
  }

  async function submitFantasyTeam(e) {
    e.preventDefault();
    const f = fantasyForm;
    if (!f.ownerName.trim()) return setFantasyFormMessage("Enter your name.");
    if (!f.batter1Id || !f.batter2Id || !f.bowler1Id || !f.bowler2Id) return setFantasyFormMessage("Pick 2 batters and 2 bowlers.");
    if (f.batter1Id === f.batter2Id) return setFantasyFormMessage("Pick two different batters.");
    if (f.bowler1Id === f.bowler2Id) return setFantasyFormMessage("Pick two different bowlers.");
    const squad = [f.batter1Id, f.batter2Id, f.bowler1Id, f.bowler2Id];
    if (!f.captainId || !squad.includes(f.captainId)) return setFantasyFormMessage("Pick a Captain from your 4 picks.");
    if (!f.viceCaptainId || !squad.includes(f.viceCaptainId)) return setFantasyFormMessage("Pick a Vice-Captain from your 4 picks.");
    if (f.captainId === f.viceCaptainId) return setFantasyFormMessage("Captain and Vice-Captain must be different players.");

    setFantasyFormMessage("Saving...");
    const res = await fetch("/api/fantasy/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: f.id,
        ownerName: f.ownerName.trim(),
        batter1Id: Number(f.batter1Id),
        batter2Id: Number(f.batter2Id),
        bowler1Id: Number(f.bowler1Id),
        bowler2Id: Number(f.bowler2Id),
        captainId: Number(f.captainId),
        viceCaptainId: Number(f.viceCaptainId),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFantasyFormMessage(data.error || "Something went wrong.");
      return;
    }
    setFantasyFormMessage("Squad saved!");
    setFantasyForm(emptyFantasyForm);
    loadFantasyData();
  }

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
    if (!captainFromPlayer.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!captainPlayer.trim()) {
      alert("Please enter who this is for");
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
        player_name: `${captainFromPlayer.trim()} -> ${captainPlayer.trim()}`,
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
    setCaptainFromPlayer("");

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
          "Fantasy League",
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
              const totalVotes = sorted.reduce((sum, o) => sum + (o.votes || 0), 0);
              const prediction = isPredictionPoll(pollName);
              const revealResults = !!matchDate && todayStr() >= matchDate;

              return (
                <div key={pollName} className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 xl:p-5">
                  <h3 className="text-base font-black leading-snug text-amber-300 break-words sm:text-lg">{pollName}</h3>

                  {revealResults ? (
                    <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 sm:mt-5 sm:px-4 sm:py-3">
                      {sorted.length === 0 || totalVotes === 0 ? (
                        <p className="text-sm text-white/60">No votes were cast for this one.</p>
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
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input
                value={captainFromPlayer}
                onChange={(e) => setCaptainFromPlayer(e.target.value)}
                placeholder="From (your name)"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              />
              <input
                value={captainPlayer}
                onChange={(e) => setCaptainPlayer(e.target.value)}
                placeholder="To (player name)"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              />
            </div>
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

            <div className="mt-5 space-y-4">
              {captainNotes.length === 0 ? (
                <p className="text-white/60">No Strategies yet.</p>
              ) : (
                captainNotes.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-lg"
                  >
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-amber-300">
                      {item.player}
                    </div>

                    <div className="text-sm leading-6 text-white/80">{item.note}</div>
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

      {teamHubTab === "Fantasy League" && (
        <div teamhub-tabs>
          {!fantasyAuthed ? (
            <form onSubmit={fantasyLogin} className="card max-w-lg p-6">
              <h3 className="text-2xl font-bold text-amber-300">Fantasy League</h3>
              <p className="mt-3 text-white/65">
                Private to the friend group — enter the fantasy password to join or view standings.
              </p>
              <input
                type="password"
                value={fantasyPassword}
                onChange={(e) => setFantasyPassword(e.target.value)}
                placeholder="Fantasy password"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-amber-300"
              />
              <button className="btn btn-gold mt-4" type="submit">
                Enter
              </button>
              {fantasyLoginMessage && (
                <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-white/75">{fantasyLoginMessage}</div>
              )}
            </form>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-3xl font-black text-amber-300">
                  {fantasyForm.id ? "Edit Your Squad" : "Build Your Squad"}
                </h3>
                <p className="mt-3 text-white/70">
                  Pick 2 batters, 2 bowlers, then choose a Captain (2x points) and Vice-Captain (1.5x) from those 4.
                  1 point per run, 20 points per wicket. Locked once your squad earns its first point.
                </p>

                {fantasyLock.upcomingMatches?.length > 0 && (
                  <p className="mt-3 text-sm font-semibold text-amber-300">
                    {fantasyLock.upcomingMatches.length === 1
                      ? `These picks are for: vs ${fantasyLock.upcomingMatches[0].opponent} (${formatMatchDate(fantasyLock.upcomingMatches[0].matchDate)})`
                      : `These picks are for: ${fantasyLock.upcomingMatches
                          .map((m) => `vs ${m.opponent} (${formatMatchDate(m.matchDate)})`)
                          .join(", ")}`}
                  </p>
                )}

                {fantasyLock.locked ? (
                  <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">
                    🔒 {fantasyLock.reason}
                  </div>
                ) : (
                <form onSubmit={submitFantasyTeam} className="mt-5 grid gap-3">
                  <input
                    value={fantasyForm.ownerName}
                    onChange={(e) => setFantasyForm((f) => ({ ...f, ownerName: e.target.value }))}
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={fantasyForm.batter1Id}
                      onChange={(e) => setFantasyForm((f) => ({ ...f, batter1Id: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Batter 1</option>
                      {fantasyRoster.batters.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={fantasyForm.batter2Id}
                      onChange={(e) => setFantasyForm((f) => ({ ...f, batter2Id: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Batter 2</option>
                      {fantasyRoster.batters.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={fantasyForm.bowler1Id}
                      onChange={(e) => setFantasyForm((f) => ({ ...f, bowler1Id: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Bowler 1</option>
                      {fantasyRoster.bowlers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={fantasyForm.bowler2Id}
                      onChange={(e) => setFantasyForm((f) => ({ ...f, bowler2Id: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Bowler 2</option>
                      {fantasyRoster.bowlers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={fantasyForm.captainId}
                      onChange={(e) => setFantasyForm((f) => ({ ...f, captainId: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Captain (2x)</option>
                      {[fantasyForm.batter1Id, fantasyForm.batter2Id, fantasyForm.bowler1Id, fantasyForm.bowler2Id]
                        .filter(Boolean)
                        .map((id) => {
                          const p = [...fantasyRoster.batters, ...fantasyRoster.bowlers].find((x) => String(x.id) === id);
                          return p ? <option key={id} value={id}>{p.name}</option> : null;
                        })}
                    </select>
                    <select
                      value={fantasyForm.viceCaptainId}
                      onChange={(e) => setFantasyForm((f) => ({ ...f, viceCaptainId: e.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Vice-Captain (1.5x)</option>
                      {[fantasyForm.batter1Id, fantasyForm.batter2Id, fantasyForm.bowler1Id, fantasyForm.bowler2Id]
                        .filter(Boolean)
                        .map((id) => {
                          const p = [...fantasyRoster.batters, ...fantasyRoster.bowlers].find((x) => String(x.id) === id);
                          return p ? <option key={id} value={id}>{p.name}</option> : null;
                        })}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button className="btn btn-gold" type="submit">
                      {fantasyForm.id ? "Save Changes" : "Submit Squad"}
                    </button>
                    {fantasyForm.id && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => { setFantasyForm(emptyFantasyForm); setFantasyFormMessage(""); }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {fantasyFormMessage && (
                    <div className="rounded-2xl bg-black/30 p-4 text-sm text-white/75">{fantasyFormMessage}</div>
                  )}
                </form>
                )}
              </div>

              <div className="grid gap-6">
                <StatTable
                  title="Standings"
                  headers={["Rank", "Team", "Points"]}
                  rows={fantasyStandings.map((s, i) => [i + 1, s.ownerName, s.points])}
                />

                <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
                  <h3 className="text-2xl font-black text-amber-300">All Squads</h3>
                  <div className="mt-5 space-y-4">
                    {fantasyTeams.length === 0 ? (
                      <p className="text-white/60">No squads submitted yet.</p>
                    ) : (
                      fantasyTeams.map((team) => (
                        <div key={team.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-black uppercase tracking-widest text-amber-300">
                              {team.ownerName}
                            </div>
                            <div className="text-sm font-bold text-white/70">{team.points} pts</div>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-white/80">
                            {team.picks.join(", ")}
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            Captain: {team.captain} · Vice-Captain: {team.viceCaptain}
                          </div>
                          {team.locked ? (
                            <div className="mt-2 text-xs font-semibold text-amber-300">Locked</div>
                          ) : fantasyLock.locked ? (
                            <div className="mt-2 text-xs text-white/50">Picks closed for now</div>
                          ) : (
                            <button
                              onClick={() => editFantasyTeam(team)}
                              className="btn btn-ghost mt-3 px-3 py-1.5 text-xs"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrap>
  );
}
