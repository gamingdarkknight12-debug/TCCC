'use client';

import { useEffect, useState } from 'react';
import { PageWrap } from '../UI';

function isPredictionPoll(pollName) {
  return pollName.startsWith("Predict:");
}

// Local calendar day as YYYY-MM-DD, so it can be compared directly against
// the poll's stored match_date string without any UTC/local timezone drift.
function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function TeamHub() {
  const [teamHubTab, setTeamHubTab] = useState("Hall of Fame");
  const [showVotingResults, setShowVotingResults] = useState(false);
  const [polls, setPolls] = useState({});
  const [pollInputs, setPollInputs] = useState({});
  const [lockerNote, setLockerNote] = useState("");
  const [lockerNotes, setLockerNotes] = useState([]);
  const [captainNote, setCaptainNote] = useState("");
  const [captainNotes, setCaptainNotes] = useState([]);
  const [captainPlayer, setCaptainPlayer] = useState("");
  const [nicknamePlayer, setNicknamePlayer] = useState("");
  const [nicknameText, setNicknameText] = useState("");
  const [nicknames, setNicknames] = useState([]);
  const [legendStats, setLegendStats] = useState({ arun: null, srikanth: null });

  useEffect(() => {
    fetch("/api/stats?season=all")
      .then((res) => res.json())
      .then((data) => {
        const findByPrefix = (rows, prefix) =>
          (rows || []).find((r) => r.name.toLowerCase().startsWith(prefix.toLowerCase()));

        const arunBowling = findByPrefix(data.bowling, "arun");
        const srikanthBatting = findByPrefix(data.batting, "srikanth govula");
        const srikanthBowling = findByPrefix(data.bowling, "srikanth govula");

        setLegendStats({
          arun: arunBowling
            ? `${arunBowling.wickets} wickets • ${arunBowling.economy} economy • ${arunBowling.overs} overs`
            : null,
          srikanth:
            srikanthBowling || srikanthBatting
              ? `${srikanthBowling?.wickets ?? 0} wickets • ${srikanthBatting?.runs ?? 0} runs`
              : null,
        });
      })
      .catch(() => {});
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
    setLockerNotes(data.lockerNotes.map((x) => x.note));
    setCaptainNotes(
      data.captainNotes.map((x) => ({
        note: x.note,
        player: x.player_name,
      }))
    );
    setNicknames(
      data.roastNames.map((x) => ({
        player: x.player_name,
        nickname: x.roast_name,
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

  async function addLockerNote() {
    const value = lockerNote.trim();
    if (!value) return;

    await fetch("/api/teamhub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "lockerNote",
        note: value,
      }),
    });

    setLockerNote("");
    loadTeamHubData();
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

  async function addNickname() {
    const playerName = nicknamePlayer.trim();
    const roastName = nicknameText.trim();

    if (!playerName || !roastName) {
      alert("Please enter both player name and roast name");
      return;
    }

    const res = await fetch("/api/teamhub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "roastName",
        playerName,
        roastName,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert("Save failed: " + result.error);
      console.error(result);
      return;
    }

    setNicknamePlayer("");
    setNicknameText("");
    await loadTeamHubData();
  }

  return (
    <PageWrap
      id="teamhub"
      title="Team Hub"
      subtitle="Titans digital dressing room — votes, fun, memories, goals, and team culture."
    >
      <div className=" teamhub-tabs mb-8 flex flex-wrap gap-3">
        {[
          "Hall of Fame",
          "Voting Arena",
          "Locker Room",
          "War Room",
          "Roast & Name",
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
          <div teamhub-tabs className="mt-4 flex items-center justify-between rounded-xl border border-amber-300/20 bg-gradient-to-r from-amber-300/10 to-transparent px-3 py-2">
            <p className="text-xs text-amber-200">
              Match predictions reveal their results automatically on match day. Player of the Match voting stays open — use the button to peek at standings.
            </p>

            <button
              onClick={() => setShowVotingResults((prev) => !prev)}
              className="btn btn-gold"
            >
              {showVotingResults ? "Show Votes" : "Show Results"}
            </button>
          </div>

          <div
            teamhub-tabs
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {Object.keys(polls).map((pollName) => {
              const { options = [], matchDate } = polls[pollName] || {};
              const sorted = [...options].sort((a, b) => b.votes - a.votes);
              const prediction = isPredictionPoll(pollName);
              const revealResults = prediction ? !!matchDate && todayStr() >= matchDate : showVotingResults;

              return (
                <div key={pollName} className="rounded-3xl border border-white/10 bg-white/5 p-4 x1:p-5">
                  <h3 className="text-lg font-black leading-snug text-amber-300 break-words">{pollName}</h3>

                  {revealResults ? (
                    <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3">
                      {sorted.length === 0 ? (
                        <p className="text-white/60">No votes yet.</p>
                      ) : (
                        <>
                          <div className="text-sm font-black text-amber-300">
                            🏆 Winner: {sorted[0].name} - {sorted[0].votes} votes
                          </div>

                          {sorted.slice(1, 3).map((item, i) => (
                            <div key={item.id || item.name} className="mt-2 text-sm font-bold text-white/75">
                              {i + 2}. {item.name} - {item.votes} votes
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mt-5 space-y-3">
                        {options.length === 0 ? (
                          <p className="rounded-2xl bg-black/30 p-4 text-white/60">
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
                              className="flex w-full items-center justify-between rounded-2xl bg-black/30 px-4 py-3 text-left font-bold text-white/80 hover:bg-amber-300 hover:text-black"
                            >
                              <span>{option.name}</span>
                              <span>{option.votes} votes</span>
                            </button>
                          ))
                        )}
                      </div>

                      {!prediction && (
                        <div className="mt-5 flex gap-2">
                          <input
                            value={pollInputs[pollName] || ""}
                            onChange={(e) =>
                              setPollInputs((prev) => ({
                                ...prev,
                                [pollName]: e.target.value,
                              }))
                            }
                            placeholder="Add player name"
                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                          />
                          <button onClick={() => addPollOption(pollName)} className="btn btn-gold">
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

      {teamHubTab === "Locker Room" && (
        <div teamhub-tabs className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
            <h3 className="text-2xl font-black text-amber-300">Locker Room Wall</h3>
            <p className="mt-3 text-white/70">
              Leave fun notes, memories, season goals, promises, jokes, or moments we can look back at later in the season.
            </p>

            <textarea
              value={lockerNote}
              onChange={(e) => setLockerNote(e.target.value)}
              placeholder="Write a locker room note..."
              className="mt-5 h-36 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none"
            />

            <button onClick={addLockerNote} className="btn btn-gold mt-4">
              Post Note
            </button>
          </div>

          <div className="flex flex-wrap gap-4 lg:col-span-2">
            {lockerNotes.length === 0 ? (
              <div className="h-fit w-[260px] rounded-xl border border-white/10 bg-white/5 p-4 text-white/60">
                No locker room notes yet.
              </div>
            ) : (
              lockerNotes.map((note, i) => (
                <div
                  key={i}
                  className="h-fit w-[260px] rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 shadow-lg"
                >
                  <div className="mb-2 text-xs font-black uppercase tracking-widest text-amber-300">
                    Locker Note #{i + 1}
                  </div>

                  <p className="break-words text-sm leading-5 text-white/80">
                    {note}
                  </p>
                </div>
              ))
            )}
          </div>
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

      {teamHubTab === "Hall of Fame" && (
        <div teamhub-tabs>
          <h2 className="text-4xl font-black text-amber-300">
            Legends of Our Team
          </h2>

          <p className="mt-2 mb-8 text-white/70">
            Honouring players who built the foundation of the team.
          </p>

          <div teamhub-tabs className="grid gap-6 md:grid-cols-2">
            {/* Arun */}
            <div className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-6">
              <div className="text-xs font-bold text-yellow-400">
                BOWLING PILLAR
              </div>
              <h3 className="mt-2 text-2xl font-black text-white">Arun</h3>
              <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 text-sm text-yellow-300">
                {legendStats.arun || "Loading…"}
              </div>
              <p className="mt-3 text-white/70">
                One of the strongest bowling performers from the 2024 season and a key name in the team’s early success.
              </p>
            </div>

            {/* Govula Srikanth */}
            <div className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-6">
              <div className="text-xs font-bold text-yellow-400">
                ALL-TIME IMPACT PLAYER
              </div>
              <h3 className="mt-2 text-2xl font-black text-white">
                Govula Srikanth
              </h3>
              <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 text-sm text-yellow-300">
                {legendStats.srikanth || "Loading…"}
              </div>
              <p className="mt-3 text-white/70">
                A true match-winner across seasons — delivering impact with both bat and ball when it matters most.
              </p>
            </div>
          </div>
        </div>
      )}

      {teamHubTab === "Roast & Name" && (
        <div teamhub-tabs className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
            <h3 className="text-2xl font-black text-amber-300">Suggest a Name</h3>

            <input
              value={nicknamePlayer}
              onChange={(e) => setNicknamePlayer(e.target.value)}
              placeholder="Player name"
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            />

            <input
              value={nicknameText}
              onChange={(e) => setNicknameText(e.target.value)}
              placeholder="Roastingname"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            />

            <button onClick={addNickname} className="btn btn-gold mt-4">
              Submit
            </button>
          </div>

          <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
            {nicknames.length === 0 ? (
              <div className="min-h-[70px]rounded-2xl border border-white/10 bg-white/5 p-3 text-white/60">
                No nicknames added yet.
              </div>
            ) : (
              nicknames.map((item, i) => (
                <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-black uppercase tracking-widest text-amber-300">
                    {item.player}
                  </div>
                  <div className="mt-1 text-xl font-black text-white">
                    {item.nickname}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </PageWrap>
  );
}
