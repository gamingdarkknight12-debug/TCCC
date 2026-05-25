'use client';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { stats2024, stats2025, stats2026, captains, legends, standings2024, standings2025 } from './data';
import { Header, PageWrap, InfoCard, HighlightCard, StatTable, SponsorBanner } from './components/UI';

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export default function Home() {
  const [season, setSeason] = useState('All-Time');
  const [selectedSchedule, setSelectedSchedule] = useState('BEDCL');
  const [teamHubTab, setTeamHubTab] = useState("Hall of Fame");
  const [playerSearch, setPlayerSearch] = useState("");
  const [captainPlayer, setCaptainPlayer] = useState("");
const [showVotingResults, setShowVotingResults] = useState(false);
const [match1Archived, setMatch1Archived] = useState(true);
const [showArchivedMatches, setShowArchivedMatches] = useState(false);
const [analysisTab, setAnalysisTab] = useState("pre");
const [selectedArchiveMatch, setSelectedArchiveMatch] = useState(null);
const [flippedMatch, setFlippedMatch] = useState(null);
const [analysisLeague, setAnalysisLeague] = useState("BEDCL");
const today = new Date();
today.setHours(0, 0, 0, 0);

const analysisData = {
"BEDCL-CricKnights-2026-05-17": {
  title: "Telugu Titans vs CricKnights",
  cards: [
    {
      title: "Opponent Snapshot",
      points: [
        "Division G semi-finalists last season and promoted to Division F.",
        "Batting-heavy team with multiple aggressive hitters.",
        "Recent scores include 292/8, 231/7, 195/9, 181/7.",
        "Bowling can leak runs under pressure."
      ],
    },
    {
      title: "Players To Watch",
      points: [
        "Ishpreet Singh — explosive opener who can change the game quickly.",
        "Karanvir Singh — consistent aggressive batter.",
        "Iqbaljit Singh — dangerous all-rounder.",
        "Sunil Kumar — bowling threat with 3-wicket spells."
      ],
    },
    {
      title: "CricKnights Strengths",
      points: [
        "Strong batting lineup with power hitters.",
        "Capable of scoring 180+ or 220+ totals.",
        "Middle order can accelerate quickly.",
        "All-rounders give them balance."
      ],
    },
    {
      title: "CricKnights Weaknesses",
      points: [
        "They lose wickets even while scoring big.",
        "Bowling is inconsistent and can leak runs.",
        "Some bowlers go for 12+ economy.",
        "Extras and wides increase under pressure."
      ],
    },
    {
      title: "Titans Bowling Strategy",
      points: [
        "Remove Ishpreet, Karanvir, Iqbaljit, and Saurabh early.",
        "Avoid slot balls and leg-side freebies.",
        "Use slower balls, wide yorkers, and change of pace.",
        "Keep extras low and take every catching chance."
      ],
    },
    {
      title: "Titans Batting Strategy",
      points: [
        "Do not throw wickets early and build a stable platform.",
        "Respect Sunil Kumar and Iqbaljit Singh during their spells.",
        "Put pressure on their supporting bowlers and force captaincy changes.",
        "Rotate strike regularly and punish loose deliveries immediately.",
        "Their bowling has leaked runs in previous matches if pressure builds.",
        "If chasing, stay calm — boundaries and extras will come."
      ],
    },
  ],
  },
    "BEDCL-Brampton Strikers-2026-05-03": {
    title: "Telugu Titans vs Brampton Strikers",
    cards: [
      {
        title: "Opponent Snapshot",
        points: [
          "Strong batting unit with aggressive top order.",
          "Can score quickly if powerplay is loose.",
          "Pressure builds if early wickets fall.",
          "Bowling attack becomes dangerous if defending 170+."
        ],
      },
      {
        title: "Players To Watch",
        points: [
          "Ali Shah — dangerous top-order batter.",
          "Ravi Patil — finisher and wicket taker.",
          "Hamza Talal — impact batting and fielding.",
          "Hafiz Asim Ali — middle overs hitter."
        ],
      },
      {
        title: "Titans Strategy",
        points: [
          "Get Ali Shah early.",
          "Keep extras low.",
          "Bat smart and avoid early wickets.",
          "Save wickets for final overs."
        ],
      },
      {
        title: "Prediction",
        points: [
          "If Titans control extras and take early wickets, this is a close contest.",
          "Target range: 155–175."
        ],
      },
    ],
  },
};

function AnalysisDetails({ match }) {
  if (!match) return null;

  const key = getAnalysisKey(match);
  const data = analysisData[key];

  if (!data) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-white/80">{data.title}</p>

      <div className="mt-5 grid gap-3 text-white/75 sm:grid-cols-2">
        <p>
          <span className="text-amber-300">League:</span> {match.league}
        </p>
        <p>
          <span className="text-amber-300">Date:</span> {match.date}
        </p>
        <p>
          <span className="text-amber-300">Time:</span> {match.time}
        </p>
        <p>
          <span className="text-amber-300">Ground:</span> {match.ground}
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {data.cards.map((card, index) => (
          <AnalysisCard
            key={index}
            title={card.title}
            points={card.points}
          />
        ))}
      </div>
    </div>
  );
}

function getMatchDate(match) {
  const d = new Date(`${match.date}T00:00:00`);
  return d;
}

function isMatchDone(match) {
  return getMatchDate(match) < today;
}

function getAnalysisKey(match) {
  return `${match.league}-${match.opponent}-${match.date}`.trim();
}

const analyzedMatches = schedule2026.filter((match) => analysisData[getAnalysisKey(match)]);

const upcomingAnalysisMatches = analyzedMatches
  .filter((match) => !isMatchDone(match))
  .sort((a, b) => getMatchDate(a) - getMatchDate(b));

const archivedAnalysisMatches = analyzedMatches
  .filter((match) => isMatchDone(match))
  .sort((a, b) => getMatchDate(a) - getMatchDate(b));

const currentUpcomingAnalysis = upcomingAnalysisMatches[0];

const matchSummaries = {
  "Telugu Titans vs Brampton Strikers": {
    result: "Telugu Titans won by 29 runs",
    summary: "Titans scored 166/9 and defended well, restricting Brampton Strikers to 139/8.",
    mvp: "Varun",
  },

  "Telugu Titans vs CricKnights": {
    result: "Lost by 33 runs (D/L)",
    summary: "CricKnights scored 184/8. Telugu Titans scored 155/8.",
    mvp: "Sai Kiran Reddy - 26 runs",
  },

  "Telugu Titans vs AKAAL XI": {
    result: "Won by 2 wickets",
    summary: "AKAAL XI scored 108 all out. Telugu Titans chased successfully.",
    mvp: "Nikhil Holagunda - 4 wickets",
  },
  "Telugu Titans vs SuperNovas CC": {
  result: "Match cancelled due to rain",
  summary: "The MCPL match on 2026-05-23 was abandoned due to rain. Both teams shared equal points.",
  mvp: "No MVP - Match abandoned",
},

"Telugu Titans vs GTA Sultans": {
  result: "Match cancelled due to rain",
  summary: "The BEDCL match on 2026-05-24 was abandoned due to rain. Both teams shared equal points.",
  mvp: "No MVP - Match abandoned",
},
};

const [polls, setPolls] = useState({
  "This weekend’s run machine ": [],
  "This weekend’s wicket hunter 🎯": [],
  "This weekend’s extras king 😭": [],
  "This weekend’s tuk tuk batsman 🫠": [],
});
const resultOpenDate = new Date("2026-05-17T00:00:00");
const canShowVotingResults = new Date() >= resultOpenDate;

const [pollInputs, setPollInputs] = useState({});
const [lockerNote, setLockerNote] = useState("");
const [lockerNotes, setLockerNotes] = useState([]);
const [captainNote, setCaptainNote] = useState("");
const [captainNotes, setCaptainNotes] = useState([]);
const [nicknamePlayer, setNicknamePlayer] = useState("");
const [nicknameText, setNicknameText] = useState("");
const [nicknames, setNicknames] = useState([]);
const [activeSection, setActiveSection] = useState("home");
const [playerCardSearch, setPlayerCardSearch] = useState("");
const [playerPage, setPlayerPage] = useState(1);
const playersPerPage = 6;

async function loadTeamHubData() {
  const res = await fetch("/api/teamhub");
  const data = await res.json();


  const groupedPolls = {
  "This weekend’s run machine ": [],
  "This weekend’s wicket hunter 🎯": [],
  "This weekend’s extras king 😭": [],
  "This weekend’s tuk tuk batsman 🫠": [],
  };

  data.polls.forEach((p) => {
    if (!groupedPolls[p.poll_name]) groupedPolls[p.poll_name] = [];
    groupedPolls[p.poll_name].push({
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
);  setNicknames(
    data.roastNames.map((x) => ({
      player: x.player_name,
      nickname: x.roast_name,
    }))
  );
}

useEffect(() => {
  loadTeamHubData();
}, []);
useEffect(() => {
  const updateSection = () => {
    const hash = window.location.hash.replace("#", "");
    setActiveSection(hash || "home");
  };

  updateSection();
  window.addEventListener("hashchange", updateSection);

  return () => window.removeEventListener("hashchange", updateSection);
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
  const option = polls[pollName][index];
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
    .map(([pollName, options]) => {
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
const allTime = useMemo(() => {
  const batting = {};
  const bowling = {};

  [...stats2026.batting, ...stats2025.batting, ...stats2024.batting].forEach((p) => {
    if (!batting[p.name]) {
      batting[p.name] = {
        ...p,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
      };
    }

    batting[p.name].runs += p.runs || 0;
    batting[p.name].balls += p.balls || 0;
    batting[p.name].fours += p.fours || 0;
    batting[p.name].sixes += p.sixes || 0;
  });

  [...stats2026.bowling, ...stats2025.bowling, ...stats2024.bowling].forEach((p) => {
    if (!bowling[p.name]) {
      bowling[p.name] = {
        ...p,
        overs: 0,
        runs: 0,
        wickets: 0,
      };
    }

    bowling[p.name].overs += p.overs || 0;
    bowling[p.name].runs += p.runs || 0;
    bowling[p.name].wickets += p.wickets || 0;
  });

  Object.values(batting).forEach((p) => {
    p.sr =
      p.balls > 0
        ? ((p.runs / p.balls) * 100).toFixed(1)
        : "-";
  });

  Object.values(bowling).forEach((p) => {
    p.economy =
      p.overs > 0
        ? (p.runs / p.overs).toFixed(1)
        : "-";
  });

  return {
    batting: Object.values(batting).sort((a, b) => b.runs - a.runs),
    bowling: Object.values(bowling).sort((a, b) => b.wickets - a.wickets),
  };
}, []);
let data = allTime;

if (season === "2026") data = stats2026;
if (season === "2025") data = stats2025;
if (season === "2024") data = stats2024;
  const [battingPage, setBattingPage] = useState(1);
const [bowlingPage, setBowlingPage] = useState(1);

const rowsPerPage = 10;
const battingRows = data?.batting || [];
const bowlingRows = data?.bowling || [];

const filteredBattingRows = battingRows.filter((p) =>
  p.name.toLowerCase().includes(playerSearch.toLowerCase())
);

const filteredBowlingRows = bowlingRows.filter((p) =>
  p.name.toLowerCase().includes(playerSearch.toLowerCase())
);
const pagedBattingRows = filteredBattingRows.slice(
  (battingPage - 1) * rowsPerPage,
  battingPage * rowsPerPage
);

const pagedBowlingRows = filteredBowlingRows.slice(
  (bowlingPage - 1) * rowsPerPage,
  bowlingPage * rowsPerPage
);

const battingTotalPages = Math.max(1, Math.ceil(filteredBattingRows.length / rowsPerPage));
const bowlingTotalPages = Math.max(1, Math.ceil(filteredBowlingRows.length / rowsPerPage));

function AnalysisCard({ title, points }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <h3 className="text-2xl font-black text-amber-300">{title}</h3>
      <ul className="mt-4 space-y-2 text-white/75">
        {points.map((point, index) => (
          <li key={index}>• {point}</li>
        ))}
      </ul>
    </div>
  );
}

  const topBatter = allTime.batting[0];
  const topBowler = allTime.bowling[0];
const players = [
      { name: "Bhanu Musunuru", role: "Captain", skill: "All-rounder", image: "/players/4.jpg" },
      { name: "Charan Teja", role: "Captain", skill: "All-rounder", image: "/players/5.jpeg" },
      { name: "Aadil Khan", role: "Vice Captain", skill: "All-rounder", image: "/players/21.jpeg" },
      { name: "Dheeraj A", skill: "All-rounder", image: "/players/25.jpg" },
      { name: "Srikanth", skill: "All-rounder", image: "/players/26.jpeg" },
      { name: "Arun", skill: "Bowler", image: "/players/3.jpg" },
      { name: "Amit Koul", skill: "All-rounder", image: "/players/1.jpeg" },
      { name: "Anand Chaitanya", skill: "All-rounder", image: "/players/2.jpeg" },
      { name: "Chari", skill: "All-rounder", image: "/players/6.jpeg" },
      { name: "Dheeraj N", skill: "Bowler", image: "/players/23.jpeg" },
      { name: "Inderjeet", skill: "Bowler", image: "/players/22.jpeg" },
      { name: "Kiran K",  skill: "All-rounder", image: "/players/7.jpg" },
      { name: "Manish Raj", skill: "Spin Bowling All-rounder", image: "/players/8.png" },
      { name: "Martin Thandhara", skill: "Bowler", image: "/players/9.jpg" },
      { name: "Nagesh Kowligi", skill: "Bowler", image: "/players/10.jpg" },
      { name: "Naveen Gajula", skill: "All-rounder", image: "/players/11.jpeg" },
      { name: "Nipun", skill: "Destructive Batter", image: "/players/24.jpeg" },
      { name: "Nikhil Holagunda", skill: "Spin BowlingAll-rounder", image: "/players/12.jpeg" },
      { name: "Prashanth", skill: "Spin Bowling All-rounder", image: "/players/20.jpg" },
      { name: "Sai Kiran Reddy", skill: "Impact Bowler", image: "/players/13.JPG" },
      { name: "Shanthan Akkiraju", skill: "Bowler", image: "/players/14.jpeg" },
      { name: "Varun Rambha", skill: "Batter", image: "/players/16.jpeg" },
      { name: "Vikas Tiwari", skill: "Bowler", image: "/players/17.jpeg" },
      { name: "Vikranth Nyalakonda", skill: "Wicket Keeper / Batter", image: "/players/18.jpeg" },
    
    ];
      const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(playerCardSearch.toLowerCase())
  );

  const pagedPlayers = filteredPlayers.slice(
    (playerPage - 1) * playersPerPage,
    playerPage * playersPerPage
  );

  const playerTotalPages = Math.ceil(
    filteredPlayers.length / playersPerPage
  );



const impactPlayerBat =
  allTime.batting.find((p) => p.name === "Srikanth Govula");

const impactPlayerBowl =
  allTime.bowling.find((p) => p.name === "Srikanth Govula");

const impactPlayer = {
  name: "Srikanth Govula",
  runs: impactPlayerBat?.runs || 0,
  wickets: impactPlayerBowl?.wickets || 0,
};

const emergingPlayerBat =
  allTime.batting.find((p) => p.name === "Kapil Sai Darshi") ||
  allTime.batting.find((p) => p.name === "Kapil");

const emergingPlayerBowl =
  allTime.bowling.find((p) => p.name === "Kapil Sai Darshi") ||
  allTime.bowling.find((p) => p.name === "Kapil");

const emergingPlayer = {
  name: "Kapil Sai Darshi",
  runs: emergingPlayerBat?.runs || 0,
  wickets: emergingPlayerBowl?.wickets || 0,
};

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />
     {activeSection === "home" &&  <div className="sponsor-banner">
      <SponsorBanner />
      </div>
      }
      {activeSection === "home" && (
      <section className="relative overflow-hidden px-4 pt-4 pb-16 md:pt-8 md:pb-24">
 {/* Team Switcher - Desktop + Mobile */}
<div className="relative z-30 mx-auto mb-8 flex max-w-7xl justify-center px-4 md:absolute md:right-8 md:top-8 md:mx-0 md:mb-0 md:block md:px-0">
  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-xl">
    <span className="rounded-full bg-amber-300 px-5 py-2 text-sm font-black text-black">
      TT
    </span>

    <a
      href="/fucc"
      className="rounded-full px-5 py-2 text-sm font-black text-white transition hover:bg-white/10"
    >
      FUCC
    </a>
  </div>
</div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(30,64,175,0.2),transparent_35%)]" />
<div className="hero-left-content relative mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
            <div>
            <div className="mb-4 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm text-amber-200">Telugu Titans</div>
            
<div className="mobile-title-logo">
  <h1 className="text-5xl font-black leading-none md:text-7xl">
    Beyond the Pitch, <span className="text-amber-300">We Unite.</span>
  </h1>

  <img
    src="/tccc-logo.png"
    alt="TCCC Logo"
    className="mobile-logo-inside"
  />
</div>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
            A cricket community built on performance, brotherhood, Telugu pride, and opportunities for players to grow on and off the field.</p>
            <NextMatchCard />
       
</div>
          <div className="home-logo-card flex justify-center lg;:justify-end">
            <div className="rounded-[2rem] border border-amber-300/25 bg-white/5 p-8 shadow-2xl shadow-amber-500/10">
            <Image src="/tccc-logo.png" alt="TCCC Logo" width={320} height={320} priority />
            </div>
            </div>

<div className="home-stats-grid mt-10 grid   w-[1400px] grid-cols-4 gap-6 max-w-5xl">
    <HighlightCard
    className="highlight-card"
      title="Run Machine"
      name={topBatter?.name}
      stat={`${topBatter?.runs || 0} all-time runs`}
      note="Top run scorer for Titans."
    />  
    <HighlightCard
    className="highlight-card"
      title="Wicket Leader"
      name={topBowler?.name}
      stat={`${topBowler?.wickets || 0} all-time wickets`}
      note="Leading wicket taker for Titans."
    />

    <HighlightCard
    className="highlight-card"
      title="Impact Player"
      name={impactPlayer?.name}
      stat={`${impactPlayer?.runs || 0} runs + ${impactPlayer?.wickets || 0} wickets`}
      note="Useful in pressure phases and team balance."
    />

    <HighlightCard
    className="highlight-card"
      title="Emerging Force of 2025"
      name={emergingPlayer?.name}
      stat={`${emergingPlayer?.wickets || 0} wickets + ${emergingPlayer?.runs || 0} runs`}
      note="Useful lower-order and bowling impact option."
    />

  </div>
        </div>
      </section> 
      )}

{activeSection === "news" && (
  <PageWrap
    id="news"
    title="News"
    subtitle="Latest Telugu Titans updates, player stories, and team highlights."
  >
    <div className="news-section">

      {/* Featured Player Carousel */}
      <div className="news-carousel">
        <div className="news-carousel-track">

          {[
            ["/players/12.jpeg", "HAT-TRICK STAR", "Nikhil Holagunda", "Four wickets and a hat-trick in the MCPL win. MVP performance when Titans needed it most."],
["/players/1.jpeg", "ABSOLUTE FIRE", "Amit Turns Back The Clock", "Amit came in breathing fire with sharp pace, aggressive intent, and serious pressure with the new ball."],
            ["/players/22.jpeg", "FIRST BALL STRIKE", "Inder Makes Statement", " Wicket on the very first ball — Inder announced himself instantly for the Titans."],          
            ["/players/24.jpeg", "RED HOT", "Nipun On Fire", "Nipun was breathing fire during practice sessions and looks match ready."],
        
["/players/13.JPG", "WATCH OUT", "Saikiran Loading", "Watch out for Saikiran who might be heading into his best season yet."],
         ["/players/16.jpeg", "PLAYER WATCH", "Varun – Rising Gem", "After joining last season, Varun quickly became a valuable player for the team."],

].map(([img, tag, title, text]) => (
            <div key={title} className="news-player-card">
              <div className="news-player-img-wrap">
                <img src={img} className="news-player-img" style={{ objectPosition: "50% 20%" }} />
                <div className="news-player-tag">{tag}</div>
              </div>
              <div className="news-player-content">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}

        </div>
      </div>

{/* Modern News Flow */}
<div className="news-flow-grid">
  <div className="news-main-card">
    <div className="news-pill">MCPL Match</div>
    <h3>Nikhil’s Hat-trick Heroics</h3>
    <p>
      Nikhil Holagunda delivered a match-winning spell with 4 wickets, including a hat-trick,
      helping Telugu Titans win the MCPL match by 2 wickets.
    </p>
  </div>

<div className="news-small-card">
  <div className="news-pill dark">Dream Start</div>
  <h3>Inder’s First Ball Strike</h3>
  <p>
    Inder announced himself in style — wicket on the very first ball after bowling a tight over under pressure.
  </p>
</div>

  <div className="news-small-card">
    <h3>Weekend Washed out</h3>
    <p>
      Both weekend matches on May 23 and May 24 were cancelled due to rain. Titans share equal points in both fixtures
    </p>
  </div>

  <div className="news-small-card">
    <h3>Vote Before The Team Does 👀</h3>
    <p>
       Titans are already fighting in Voting Arena. Pick your weekend heroes before the locker room arguments begin.
    </p>
  </div>

  <div className="news-small-card">
    <h3>Locker Room Secrets Loading 🤫</h3>
    <p>
      From roast sessions to match-day drama, Titans Locker Room is getting wild. Stay tuned for new drops this week.
    </p>
  </div>
</div>

    </div>
  </PageWrap>
)}
{activeSection === "teamhub" && (
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
    <div teamhub-tabs  className="mt-4 flex items-center justify-between rounded-xl border border-amber-300/20 bg-gradient-to-r from-amber-300/10 to-transparent px-3 py-2">
      <p className="text-xs text-amber-200">
        Weekly Highlights will be posted on social media
      </p>
 
<button
  onClick={() => {
    if (!canShowVotingResults) return;
    setShowVotingResults((prev) => !prev);
  }}
  disabled={!canShowVotingResults}
  className="btn btn-gold disabled:opacity-40 disabled:cursor-not-allowed"
>
  {canShowVotingResults
    ? showVotingResults
      ? "Show Votes"
      : "Show Results"
    : "Results open on match day"}
</button> 
    </div>



<div
  teamhub-tabs
  className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
>      {Object.keys(polls).map((pollName) => {
        const options = polls[pollName] || [];
        const sorted = [...options].sort((a, b) => b.votes - a.votes);
        const winner = sorted[0];

        return (
<div key={pollName} className="rounded-3xl border border-white/10 bg-white/5 p-4 x1:p-5">
            <h3 className="text-xl font-black text-amber-300">{pollName}</h3>

{showVotingResults ? (
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

{!showVotingResults && (
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
            className="h-fit w-[260px] rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 shadow-lg"      >
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
  <div teamhub-tabs >
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
          18 wickets • 5.98 economy • 48 overs
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
          29 wickets • 314 runs
        </div>
        <p className="mt-3 text-white/70">
          A true match-winner across seasons — delivering impact with both bat and ball when it matters most.
        </p>
      </div>

    </div>
  </div>
)}

  {teamHubTab === "Roast & Name" && (
    <div teamhub-tabs  className="grid gap-6 lg:grid-cols-3">
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
   )}   

{activeSection === "analysis" && (
  <PageWrap
    id="analysis"
    title="Match Analysis"
    subtitle={
      currentUpcomingAnalysis
        ? `Upcoming clash: Telugu Titans vs ${currentUpcomingAnalysis.opponent}`
        : "No upcoming match analysis available"
    }
  >
    <div className="mb-6 flex flex-wrap gap-3">
      <button
        onClick={() => {
          setAnalysisTab("pre");
          setSelectedArchiveMatch(null);
        }}
        className={`btn ${analysisTab === "pre" ? "btn-gold" : "btn-ghost"}`}
      >
        Upcoming Match Analysis
      </button>

      <button
        onClick={() => {
          setAnalysisTab("archive");
          setSelectedArchiveMatch(null);
        }}
        className={`btn ${analysisTab === "archive" ? "btn-gold" : "btn-ghost"}`}
      >
        Past Matches Analysis
      </button>
    </div>

    {analysisTab === "pre" && (
      <>
        {!currentUpcomingAnalysis ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-black text-amber-300">
              No Upcoming Analysis
            </h3>
            <p className="mt-3 text-white/75">
              Once a future match analysis is added, it will show here automatically.
            </p>
          </div>
        ) : (
          <AnalysisDetails match={currentUpcomingAnalysis} />
        )}
      </>
    )}

    {analysisTab === "archive" && !selectedArchiveMatch && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {archivedAnalysisMatches.map((match, index) => {
          const key = getAnalysisKey(match);

          return (
            <button
              key={key}
              onClick={() => setSelectedArchiveMatch(getAnalysisKey(match))}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:bg-amber-300 hover:text-black"
            >
<div className="text-lg font-black">
  Match {match.matchNo || index + 1}
</div>
              <div className="text-sm">
                Telugu Titans vs {match.opponent}
              </div>
              <div className="mt-2 text-xs opacity-70">
                {match.league} • {match.date}
              </div>
            </button>
          );
        })}
      </div>
    )}

    {analysisTab === "archive" && selectedArchiveMatch && (
      <div>
        <button
          onClick={() => setSelectedArchiveMatch(null)}
          className="btn btn-ghost mb-5"
        >
          ← Back to Archived Matches
        </button>

        <AnalysisDetails
          match={archivedAnalysisMatches.find(
            (match) => getAnalysisKey(match) === selectedArchiveMatch
          )}
        />
      </div>
    )}
  </PageWrap>
)}


{activeSection === "seasons" && (
<PageWrap
  id="seasons"
  title="Seasons"
  subtitle="Telugu Titans league journey across BEDCL, HDCL, and MCPL."
>
  <div className="grid gap-6 md:grid-cols-3">

    <InfoCard
      title="2024 Season"
      text="BEDCL: Telugu Titans finished 6th in Division E - Conference A with 25 points. HDCL: Telugu Titans finished 8th in Group C with 30 points."
    />

    <InfoCard
      title="2025 Season"
      text="BEDCL: Telugu Titan finished 4th in Division F - Conference B with 70 points. HDCL: Telugu Titans finished 6th in Group A with 75 points."
    />

    <InfoCard
      title="2026 Season"
      text="Telugu Titans are competing in BEDCL and MCPL with a stronger squad, better depth, and bigger goals for the season."
    />

  </div>

  <div className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
    <h3 className="text-2xl font-bold text-amber-300">
      Season Direction
    </h3>

    <p className="mt-4 leading-7 text-white/75">
      From rebuilding years to a stronger 2026 squad, Telugu Titans are focused
      on consistency, availability, stronger batting partnerships, controlled
      bowling, and converting close matches into wins.
    </p>
  </div>
</PageWrap>
)}
{activeSection === "schedule2026" && (
  <PageWrap
    id="schedule2026"
    title="2026 Season Schedule"
    subtitle="Select BEDCL or MCPL schedule."
  >
    <div className="mb-6 flex flex-wrap gap-3">
      <button
        onClick={() => setSelectedSchedule("BEDCL")}
        className={`btn ${selectedSchedule === "BEDCL" ? "btn-gold" : "btn-ghost"}`}
      >
        BEDCL Schedule
      </button>

      <button
        onClick={() => setSelectedSchedule("MCPL")}
        className={`btn ${selectedSchedule === "MCPL" ? "btn-gold" : "btn-ghost"}`}
      >
        MCPL Schedule
      </button>
    </div>

    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {schedule2026
        .filter((match) => match.league === selectedSchedule)
        .map((match, i) => {
          const matchKey = `Telugu Titans vs ${match.opponent}`;
          const result = matchSummaries[matchKey];
          const isFlipped = flippedMatch === `${matchKey}-${i}`;

          return (
            <div
              key={`${matchKey}-${i}`}
              onClick={() =>
                setFlippedMatch(isFlipped ? null : `${matchKey}-${i}`)
              }
              className="cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-300/40 hover:bg-white/10"
            >
              {isFlipped ? (
                result ? (
                  <>
                    <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-black">
                      MATCH SUMMARY
                    </span>

                    <h3 className="mt-4 text-2xl font-black text-amber-300">
                      {result.result}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-white/75">
                      {result.summary}
                    </p>

                    <div className="mt-5 rounded-2xl border border-amber-300/20 bg-black/30 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                        MVP OF THE MATCH
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        🏆 {result.mvp}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-amber-300">
                      MATCH SUMMARY
                    </span>

                    <h3 className="mt-4 text-2xl font-black text-amber-300">
                      Result Coming Soon
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-white/70">
                      Match summary and MVP will be updated after the game.
                    </p>
                  </>
                )
              ) : (
                <>
                  <div className="mb-3 inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-black">
                    {match.league}
                  </div>

                  <h3 className="text-2xl font-black text-amber-300">
                    Telugu Titans vs {match.opponent}
                  </h3>

                  <div className="mt-5 space-y-3 text-white/80">
                    <p>
                      <span className="font-black text-amber-300">Date:</span>{" "}
                      {match.day}, {match.date}
                    </p>

                    <p>
                      <span className="font-black text-amber-300">Time:</span>{" "}
                      {match.time}
                    </p>

                    <p>
                      <span className="font-black text-amber-300">Home/Away:</span>{" "}
                      {match.homeAway}
                    </p>

                    <p>
                      <span className="font-black text-amber-300">Ground:</span>{" "}
                      {match.ground}
                    </p>
                  </div>
                </>
              )}
            </div>
          );
        })}
    </div>
  </PageWrap>
)}
{activeSection === "stats" && (
<PageWrap id="stats" title="Player Stats" subtitle="Historical performance across available seasons.">
  <div>
  <div className="mb-6">
<input
  value={playerSearch}
  onChange={(e) => {
    setPlayerSearch(e.target.value);
    setBattingPage(1);
    setBowlingPage(1);
  }}
  placeholder="Search player stats..."
  className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-amber-300"
/>
  </div>
  </div>
<div>
  <div className="mb-6 flex flex-wrap gap-3">
    {['All-Time', '2026', '2025', '2024'].map((s) => (
      <button
        key={s}
        onClick={() => {
          setSeason(s)
        setBattingPage(1)
        setBowlingPage(1)
    }}
        className={`btn ${season === s ? 'btn-gold' : 'btn-ghost'}`}
      >
        {s}
      </button>
    ))}
  </div>
  </div>



  <div className="stats-table-grid grid gap-6 lg:grid-cols-2">
    <div>
      <div className="stats-pagination mt-4 flex items-center justify-between">
  <button
    onClick={() => setBattingPage((p) => Math.max(1, p - 1))}
    disabled={battingPage === 1}
    className="btn btn-ghost disabled:opacity-40"
  >
    Previous
  </button>

  <span className="text-sm text-white/70">
    Page {battingPage} of {battingTotalPages}
  </span>

  <button
    onClick={() => setBattingPage((p) => Math.min(battingTotalPages, p + 1))}
    disabled={battingPage === battingTotalPages}
    className="btn btn-ghost disabled:opacity-40"
  >
    Next
  </button>
  </div>
    <div className="table-wrap">
<StatTable
  title="Batting Leaders"
  headers={
    season === "2026"
      ? ["Player", "R", "B", "4s", "6s", "SR", "Avg"]
      : ["Player", "Runs", "Balls", "4s", "6s", "SR"]
  }
 rows={pagedBattingRows.map((p) =>
    season === "2026"
      ? [p.name, p.runs, p.balls, p.fours || "-", p.sixes || "-", p.sr, p.avg]
      : [p.name, p.runs, p.balls, p.fours || "-", p.sixes || "-", p.sr]
  )}
/>

</div>
</div>
<div>
<div className="stats-pagination mt-4 flex items-center justify-between">
  <button
    onClick={() => setBowlingPage((p) => Math.max(1, p - 1))}
    disabled={bowlingPage === 1}
    className="btn btn-ghost disabled:opacity-40"
  >
    Previous
  </button>

  <span className="text-sm text-white/70">
    Page {bowlingPage} of {bowlingTotalPages}
  </span>

  <button
    onClick={() => setBowlingPage((p) => Math.min(bowlingTotalPages, p + 1))}
    disabled={bowlingPage === bowlingTotalPages}
    className="btn btn-ghost disabled:opacity-40"
  >
    Next
  </button>
</div>

  <div className="table-wrap">
<StatTable
  title="Bowling Leaders"
  headers={
    season === "2026"
      ? ["Player", "O", "R", "W", "E", "Dots", "Wd", "NB"]
      : ["Player", "Overs", "Runs", "Wickets", "Eco"]
  }
  rows={pagedBowlingRows.map((p) =>
    season === "2026"
      ? [p.name, p.overs, p.runs, p.wickets, p.economy, p.dots, p.wides, p.noBalls]
      : [p.name, p.overs, p.runs, p.wickets, p.economy]
  )}
/>
</div>

</div>
  </div>
</PageWrap>
)}

{activeSection === "players" && (
  <PageWrap
    id="players"
    title="Players"
    subtitle="Meet the Telugu Titans squad under TCCC banner."
  >
    <input
      value={playerCardSearch}
      onChange={(e) => {
        setPlayerCardSearch(e.target.value);
        setPlayerPage(1);
      }}
      placeholder="Search player..."
      className="mb-6 w-full max-w-md rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-amber-300"
    />
    <div className="mt-6 flex items-center justify-between rounded-2xl  border-white/10 bg-white/5 px-4 py-3">
      <button
        onClick={() => setPlayerPage((p) => Math.max(1, p - 1))}
        disabled={playerPage === 1}
        className="btn btn-ghost disabled:opacity-40"
      >
        Previous
      </button>

      <span className="text-sm font-bold text-white/70">
        Page {playerPage} of {playerTotalPages}
      </span>

      <button
        onClick={() => setPlayerPage((p) => Math.min(playerTotalPages, p + 1))}
        disabled={playerPage === playerTotalPages}
        className="btn btn-ghost disabled:opacity-40"
      >
        Next
      </button>
    </div>
    <div className="player-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pagedPlayers.map((p, i) => (
        <div
          key={`${p.name}-${i}`}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
        >
          <img
            src={p.image}
            alt={p.name}
            className="h-72 w-full object-cover"
            style={{ objectPosition: "50% 25%" }}
          />

          <div className="p-4">
            <h3 className="text-xl font-bold text-amber-300">{p.name}</h3>

            {p.role && (
              <p className="text-sm font-semibold text-yellow-300">
                {p.role}
              </p>
            )}

            <p className="mt-1 text-white/70">{p.skill}</p>
          </div>
        </div>
      ))}
    </div>


  </PageWrap>
)}

{activeSection === "about" && (
<PageWrap id="about" title="About TCCC" subtitle="A cricket club built for community, competition, and growth."><div className="grid gap-6 md:grid-cols-2"><InfoCard title="Our Story" text="The club’s roots go back to Andhra Tycoons in 2008, later reformed as Telugu Cricket Club Canada in 2022." /><InfoCard title="Our Vision" text="Batting for a stronger South Asian community through cricket, while developing younger players and creating opportunities." /><InfoCard title="Competitive + Recreational" text="TCCC supports both serious competition and recreational cricket." /><InfoCard title="Future Roadmap" text="Multiple teams, international exposure, cricket leagues, and community-driven development." /></div>
  </PageWrap>   
)}

      {/* <PageWrap id="contact" title="Contact / Join TCCC" subtitle="For players, supporters, sponsors, and community members."><div className="card p-6"><h3 className="text-2xl font-bold text-amber-300">Coming Next</h3><p className="mt-4 leading-7 text-white/75">This section can include Instagram, YouTube, WhatsApp contact, sponsor inquiry, and player registration workflow.</p></div></PageWrap> */}
      <footer className="border-t border-white/10 bg-black/40 px-4 py-8 text-center text-sm text-white/60">© 2026 Telugu Cricket Club Canada. Built for TCCC.</footer>
    </main>
  );
}

function Standing({ title, rows }) {
  return <StatTable title={title} headers={['Conference','Team','GP','W','L','NR','Pts']} rows={rows} />;
}

const schedule2026 = [
  // BEDCL
  { league: "BEDCL", opponent: "Brampton Strikers", date: "2026-05-03", day: "Sunday", time: "11:35 AM", ground: "Dixie-407 - C (North-West)", homeAway: "Home" },
  { league: "BEDCL", opponent: "CricKnights", date: "2026-05-17", day: "Sunday", time: "3:40 PM", ground: "Dixie-407 - A (North-East)", homeAway: "Home" },
  { league: "BEDCL", opponent: "GTA Sultans", date: "2026-05-24", day: "Sunday", time: "7:30 AM", ground: "Keele West", homeAway: "Away" },
  { league: "BEDCL", opponent: "Jaguar B", date: "2026-05-31", day: "Sunday", time: "7:30 AM", ground: "Dixie-407 - C (North-West)", homeAway: "Away" },
  { league: "BEDCL", opponent: "GTA Sultans", date: "2026-06-14", day: "Sunday", time: "7:30 AM", ground: "Creditview - C", homeAway: "Home" },
  { league: "BEDCL", opponent: "CricKnights", date: "2026-06-20", day: "Saturday", time: "7:30 AM", ground: "Humber College Ground", homeAway: "Away" },
  { league: "BEDCL", opponent: "Brampton Browns", date: "2026-06-27", day: "Saturday", time: "11:35 AM", ground: "Torbram Ground", homeAway: "Home" },
  { league: "BEDCL", opponent: "Meadowvale Mustangs", date: "2026-07-04", day: "Saturday", time: "7:30 AM", ground: "BSP - Artificial", homeAway: "Away" },
  { league: "BEDCL", opponent: "Avengers B", date: "2026-07-11", day: "Saturday", time: "7:30 AM", ground: "Creditview - A", homeAway: "Away" },
  { league: "BEDCL", opponent: "Northern Warriors", date: "2026-07-19", day: "Sunday", time: "7:30 AM", ground: "Keele West", homeAway: "Home" },
  { league: "BEDCL", opponent: "6ixers", date: "2026-08-02", day: "Sunday", time: "7:30 AM", ground: "Creditview - A", homeAway: "Home" },
  { league: "BEDCL", opponent: "Meadowvale Mustangs", date: "2026-08-09", day: "Sunday", time: "3:40 PM", ground: "Humber College Ground", homeAway: "Home" },
  { league: "BEDCL", opponent: "Avengers B", date: "2026-08-22", day: "Saturday", time: "7:30 AM", ground: "Humber College Ground", homeAway: "Home" },
  { league: "BEDCL", opponent: "Brampton Browns", date: "2026-08-30", day: "Sunday", time: "7:30 AM", ground: "BSP - Artificial", homeAway: "Away" },
  { league: "BEDCL", opponent: "Golden United", date: "2026-09-06", day: "Sunday", time: "7:30 AM", ground: "Dixie-407 - C (North-West)", homeAway: "Away" },
  { league: "BEDCL", opponent: "Kanada Sports Team", date: "2026-09-19", day: "Saturday", time: "11:35 AM", ground: "BSP - Artificial", homeAway: "Away" },

// MCPL
{
  league: "MCPL",
  opponent: "AKAAL XI",
  date: "2026-05-17",
  day: "Sunday",
  time: "3:45 PM",
  ground: "Mavis",
  homeAway: "Away"
},
{
  league: "MCPL",
  opponent: "SuperNovas CC",
  date: "2026-05-23",
  day: "Saturday",
  time: "9:00 AM",
  ground: "Danville",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "Toronto Lightning XI",
  date: "2026-05-31",
  day: "Sunday",
  time: "9:00 AM",
  ground: "Aquinas",
  homeAway: "Away"
},
{
  league: "MCPL",
  opponent: "Northern Lightning CC",
  date: "2026-06-07",
  day: "Sunday",
  time: "9:00 AM",
  ground: "Aquinas",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "AKAAL XI",
  date: "2026-06-24",
  day: "Wednesday",
  time: "5:30 PM",
  ground: "Danville",
  homeAway: "Away"
},
{
  league: "MCPL",
  opponent: "Predators CC B",
  date: "2026-06-28",
  day: "Sunday",
  time: "8:45 AM",
  ground: "Mavis",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "Toronto Pacers",
  date: "2026-07-01",
  day: "Wednesday",
  time: "8:45 AM",
  ground: "Mavis",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "WI Sports Mississauga",
  date: "2026-07-15",
  day: "Wednesday",
  time: "5:30 PM",
  ground: "Aquinas",
  homeAway: "Away"
},
{
  league: "MCPL",
  opponent: "Toronto Lightning XI",
  date: "2026-07-19",
  day: "Sunday",
  time: "9:00 AM",
  ground: "Aquinas",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "SuperNovas CC",
  date: "2026-08-01",
  day: "Saturday",
  time: "3:45 PM",
  ground: "Mavis",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "Northern Lightning CC",
  date: "2026-08-02",
  day: "Sunday",
  time: "9:00 AM",
  ground: "Danville",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "Toronto Pacers",
  date: "2026-08-12",
  day: "Wednesday",
  time: "5:30 PM",
  ground: "Danville",
  homeAway: "Away"
},
{
  league: "MCPL",
  opponent: "Predators CC B",
  date: "2026-08-29",
  day: "Saturday",
  time: "9:00 AM",
  ground: "Danville",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "WI Sports Mississauga",
  date: "2026-09-26",
  day: "Saturday",
  time: "3:45 PM",
  ground: "Aquinas",
  homeAway: "Home"
},
{
  league: "MCPL",
  opponent: "Toronto Lightning XI",
  date: "2026-10-04",
  day: "Sunday",
  time: "3:45 PM",
  ground: "Mavis",
  homeAway: "Away"
},
];

function getNextMatches() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = schedule2026
    .map((m) => ({
      ...m,
      matchDate: new Date(`${m.date}T00:00:00`),
    }))
    .filter((m) => m.matchDate >= today)
    .sort((a, b) => a.matchDate - b.matchDate);

  if (!upcoming.length) return [];

  const firstDate = upcoming[0].matchDate;
  const day = firstDate.getDay(); // 0 Sunday, 6 Saturday

  let weekendStart = new Date(firstDate);
  let weekendEnd = new Date(firstDate);

  if (day === 6) {
    weekendEnd.setDate(weekendStart.getDate() + 1); // Saturday + Sunday
  } else if (day === 0) {
    weekendStart.setDate(weekendStart.getDate() - 1); // Saturday
  }

  weekendStart.setHours(0, 0, 0, 0);
  weekendEnd.setHours(23, 59, 59, 999);

  return upcoming.filter(
    (m) => m.matchDate >= weekendStart && m.matchDate <= weekendEnd
  );
}

function NextMatchCard() {
  const nextMatches = getNextMatches();

  if (!nextMatches.length) return null;

  const today = new Date();
  const matchDate = new Date(`${nextMatches[0].date}T00:00:00`);
  const diffDays = Math.ceil((matchDate - today) / (1000 * 60 * 60 * 24));

  let reminderText = "Upcoming Match";
  if (diffDays === 1) reminderText = "Reminder: Match Tomorrow";
  if (diffDays === 0) reminderText = "Match Day";

  return (
    <div className="mt-6 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5">
      <div className="text-sm font-bold uppercase tracking-widest text-amber-300">
        {nextMatches.length > 1 ? `Upcoming Matches` : reminderText}
      </div>

      <div className="mt-4 grid gap-4">
        {nextMatches.map((match, index) => (
          <div
            key={`${match.date}-${match.time}-${index}`}
            className="rounded-2xl border border-amber-300/20 bg-black/20 p-4"
          >
            <h3 className="text-2xl font-black text-white">
              Telugu Titans vs {match.opponent}
            </h3>

            <div className="mt-3 grid gap-2 text-white/75 sm:grid-cols-2">
              <p><span className="text-amber-300">League:</span> {match.league}</p>
              <p><span className="text-amber-300">Date:</span> {match.date}</p>
              <p><span className="text-amber-300">Time:</span> {match.time}</p>
              <p><span className="text-amber-300">Ground:</span> {match.ground}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}