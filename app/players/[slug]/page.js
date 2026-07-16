import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseServer } from '../../lib/supabaseServer';
import { slugify } from '../../lib/slugify';
import { getPlayerCareer } from '../../lib/playerCareer';
import { Header, StatTable } from '../../components/UI';
import { ShareButton } from '../../components/ShareButton';

// Without this, Next.js can still serve a frozen render of this page after
// player data changes in Supabase (same issue /api/news hit — see that
// route's comment) — stats/photos here need to reflect the database on
// every request, not whatever was cached at first build/visit.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getPlayerData = cache(async (slug) => {
  const { data: players } = await supabaseServer
    .from('tccc_players')
    .select('canonical_name, role, skill, image_path')
    .eq('team', 'TT')
    .eq('active', true);

  const player = (players || []).find((p) => slugify(p.canonical_name) === slug);
  if (!player) return null;

  const { seasons, career } = await getPlayerCareer(player.canonical_name);
  return { player, seasons, career };
});

// Match-level tracking only exists from the 2026 season onward — older
// seasons live as a single pre-migration aggregate row with no per-match
// breakdown, so a "matches played" total summed across seasons would quietly
// undercount. Runs/wickets are reliable across every season, so the headline
// line sticks to those instead of implying a career matches-played count.
function careerLine(name, career) {
  const parts = [];
  if (career.runs > 0) parts.push(`${career.runs} runs`);
  if (career.wickets > 0) parts.push(`${career.wickets} wickets`);
  const stats = parts.length > 0 ? parts.join(' and ') : 'a growing record';
  return `${name} has ${stats} for Telugu Titans.`;
}

export async function generateMetadata({ params }) {
  const data = await getPlayerData(params.slug);
  if (!data) return {};

  const { player, career } = data;
  const description = careerLine(player.canonical_name, career);
  const image = player.image_path || '/tccc-logo.png';

  return {
    title: `${player.canonical_name} — Telugu Titans`,
    description,
    openGraph: {
      title: `${player.canonical_name} — Telugu Titans`,
      description,
      images: [image],
    },
  };
}

export default async function PlayerProfilePage({ params }) {
  const data = await getPlayerData(params.slug);
  if (!data) notFound();

  const { player, seasons, career } = data;
  const headerList = headers();
  const host = headerList.get('host');
  const protocol = host?.startsWith('localhost') ? 'http' : 'https';
  const pageUrl = `${protocol}://${host}/players/${slugify(player.canonical_name)}`;
  const initials = player.canonical_name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <a href="/#players" className="text-sm font-semibold text-amber-300 hover:underline">
          ← Back to Players
        </a>

        <div className="card mt-6 overflow-hidden p-0">
          <div className="flex flex-col items-center gap-6 p-8 sm:flex-row">
            {player.image_path ? (
              <img
                src={player.image_path}
                alt={player.canonical_name}
                className="h-40 w-40 rounded-3xl bg-black/20 object-contain"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-white/10 text-5xl font-black text-white/30">
                {initials}
              </div>
            )}

            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-black text-amber-300">{player.canonical_name}</h1>
              {player.role && (
                <p className="mt-1 text-lg font-semibold text-yellow-300">{player.role}</p>
              )}
              {player.skill && <p className="mt-1 text-white/70">{player.skill}</p>}
              <p className="mt-4 max-w-xl leading-7 text-white/75">
                {careerLine(player.canonical_name, career)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ShareButton
            url={pageUrl}
            title={`${player.canonical_name} — Telugu Titans`}
            text={careerLine(player.canonical_name, career)}
          />
        </div>

        <div className="mt-10">
          <StatTable
            title="Season by Season"
            headers={['Season', 'M', 'Runs', 'SR', 'Avg', 'Wkts', 'Econ']}
            rows={seasons.map((s) => [
              s.season,
              s.matches > 0 ? s.matches : '-', // pre-2026 seasons have no per-match tracking
              s.runs,
              s.sr,
              s.avg,
              s.wickets,
              s.economy,
            ])}
          />
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/40 px-4 py-8 text-center text-sm text-white/60">
        © 2026 Telugu Cricket Club Canada. Built for TCCC.
      </footer>
    </main>
  );
}
