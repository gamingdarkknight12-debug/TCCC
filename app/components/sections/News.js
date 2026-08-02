'use client';

import { useEffect, useState } from 'react';
import { PageWrap, TabStrip } from '../UI';

const TABS = ['MCPL', 'BEDCL', 'Milestones', 'Blood Donation'];

function UpdateCard({ tag, title, body, image, children }) {
  return (
    <div className="news-main-card">
      {image && <img src={image} alt={title} className="news-main-card-img" />}
      <div className="news-pill">{tag}</div>
      <h3>{title}</h3>
      <p style={{ whiteSpace: 'pre-line' }}>{body}</p>
      {children}
    </div>
  );
}

function EmptyTab({ children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
      {children}
    </div>
  );
}

export function News() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('MCPL');

  useEffect(() => {
    fetch('/api/news', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  const carouselItems = items.filter((n) => n.placement === 'carousel');

  const mcplMatch = items.find((n) => n.kind === 'match_recap' && n.league === 'MCPL');
  const bedclMatch = items.find((n) => n.kind === 'match_recap' && n.league === 'BEDCL');
  const milestone = items.find((n) => n.tag === 'Milestone Watch');
  const bloodDonation = items.find((n) => n.tag === 'Community Event');

  return (
    <PageWrap
      id="news"
      title="News"
      subtitle="Latest Telugu Titans updates, player stories, and team highlights."
    >
      <div className="news-section">
        {/* Featured Player Carousel */}
        <div className="news-carousel">
          <div className="news-carousel-track">
            {carouselItems.map((item) => (
              <div key={item.id} className="news-player-card">
                <div className="news-player-img-wrap">
                  {item.image ? (
                    <img src={item.image} className="news-player-img" />
                  ) : (
                    <div className="news-player-img news-player-img-placeholder">
                      {item.title
                        .split(' ')
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="news-player-tag">{item.tag}</div>
                </div>
                <div className="news-player-content">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <TabStrip tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'MCPL' && (
          mcplMatch ? (
            <UpdateCard tag={mcplMatch.tag} title={mcplMatch.title} body={mcplMatch.body} image={mcplMatch.image} />
          ) : (
            <EmptyTab>No MCPL match published yet.</EmptyTab>
          )
        )}

        {tab === 'BEDCL' && (
          bedclMatch ? (
            <UpdateCard tag={bedclMatch.tag} title={bedclMatch.title} body={bedclMatch.body} image={bedclMatch.image} />
          ) : (
            <EmptyTab>No BEDCL match published yet.</EmptyTab>
          )
        )}

        {tab === 'Milestones' && (
          milestone ? (
            <UpdateCard tag={milestone.tag} title={milestone.title} body={milestone.body} image={milestone.image} />
          ) : (
            <EmptyTab>No milestones being tracked right now.</EmptyTab>
          )
        )}

        {tab === 'Blood Donation' && (
          bloodDonation ? (
            <a href="#gallery/2026/blood-donation" className="block">
              <UpdateCard tag={bloodDonation.tag} title={bloodDonation.title} body={bloodDonation.body} image={bloodDonation.image}>
                <div className="mt-3 text-sm font-bold text-amber-300">View photo gallery →</div>
              </UpdateCard>
            </a>
          ) : (
            <EmptyTab>No community event posted right now.</EmptyTab>
          )
        )}
      </div>
    </PageWrap>
  );
}
