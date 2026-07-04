export const schedule2026 = [
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
  { league: "MCPL", opponent: "AKAAL XI", date: "2026-05-17", day: "Sunday", time: "3:45 PM", ground: "Mavis", homeAway: "Away" },
  { league: "MCPL", opponent: "SuperNovas CC", date: "2026-05-23", day: "Saturday", time: "9:00 AM", ground: "Danville", homeAway: "Home" },
  { league: "MCPL", opponent: "Toronto Lightning XI", date: "2026-05-31", day: "Sunday", time: "9:00 AM", ground: "Aquinas", homeAway: "Away" },
  { league: "MCPL", opponent: "Northern Lightning CC", date: "2026-06-07", day: "Sunday", time: "9:00 AM", ground: "Aquinas", homeAway: "Home" },
  { league: "MCPL", opponent: "AKAAL XI", date: "2026-06-24", day: "Wednesday", time: "5:30 PM", ground: "Danville", homeAway: "Away" },
  { league: "MCPL", opponent: "Predators CC B", date: "2026-06-28", day: "Sunday", time: "8:45 AM", ground: "Mavis", homeAway: "Home" },
  { league: "MCPL", opponent: "Toronto Pacers", date: "2026-07-01", day: "Wednesday", time: "8:45 AM", ground: "Mavis", homeAway: "Home" },
  { league: "MCPL", opponent: "WI Sports Mississauga", date: "2026-07-15", day: "Wednesday", time: "5:30 PM", ground: "Aquinas", homeAway: "Away" },
  { league: "MCPL", opponent: "Toronto Lightning XI", date: "2026-07-19", day: "Sunday", time: "9:00 AM", ground: "Aquinas", homeAway: "Home" },
  { league: "MCPL", opponent: "SuperNovas CC", date: "2026-08-01", day: "Saturday", time: "3:45 PM", ground: "Mavis", homeAway: "Home" },
  { league: "MCPL", opponent: "Northern Lightning CC", date: "2026-08-02", day: "Sunday", time: "9:00 AM", ground: "Danville", homeAway: "Home" },
  { league: "MCPL", opponent: "Toronto Pacers", date: "2026-08-12", day: "Wednesday", time: "5:30 PM", ground: "Danville", homeAway: "Away" },
  { league: "MCPL", opponent: "Predators CC B", date: "2026-08-29", day: "Saturday", time: "9:00 AM", ground: "Danville", homeAway: "Home" },
  { league: "MCPL", opponent: "WI Sports Mississauga", date: "2026-09-26", day: "Saturday", time: "3:45 PM", ground: "Aquinas", homeAway: "Home" },
  { league: "MCPL", opponent: "Toronto Lightning XI", date: "2026-10-04", day: "Sunday", time: "3:45 PM", ground: "Mavis", homeAway: "Away" },
];

export function getNextMatches() {
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
