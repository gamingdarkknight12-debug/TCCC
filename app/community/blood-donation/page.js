import { Header } from '../../components/UI';

export const metadata = {
  title: 'Blood Donation Camp — Telugu Titans',
  description: 'Photos from the TCCC Blood Donation Camp at Canadian Blood Services, Mississauga.',
};

// Photos get added here as they come in — each entry is just the file path
// under /public plus an optional caption. No admin upload flow exists yet;
// new event photos are dropped into /public/community/blood-donation and
// listed here.
const PHOTOS = [];

export default function BloodDonationGalleryPage() {
  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <Header />

      <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <a href="/#news" className="text-sm font-semibold text-amber-300 hover:underline">
          ← Back to News
        </a>

        <div className="card mt-6 p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-black">
            Community Event
          </div>
          <h1 className="mt-4 text-3xl font-black text-amber-300 sm:text-4xl">
            Blood Donation Camp — July 25
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-white/75">
            TCCC joined Canadian Blood Services in Mississauga on Saturday, July 25, 2026 to donate
            blood and save lives, proudly supported by The Nimesh Shah Real Estate Group and TVIBE.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-black text-amber-300">Photos</h2>

          {PHOTOS.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              Photos coming soon — check back after the event.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {PHOTOS.map((photo, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <img src={photo.src} alt={photo.caption || 'Blood donation camp'} className="h-full w-full object-cover" />
                  {photo.caption && (
                    <p className="p-2 text-xs text-white/60">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/40 px-4 py-8 text-center text-sm text-white/60">
        © 2026 Telugu Cricket Club Canada. Built for TCCC.
      </footer>
    </main>
  );
}
