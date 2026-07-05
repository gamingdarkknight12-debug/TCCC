'use client';

import { useEffect, useState } from 'react';
import { PageWrap } from '../UI';

export function News() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  const carouselItems = items.filter((n) => n.placement === 'carousel');
  const flowItems = items.filter((n) => n.placement === 'main' || n.placement === 'small');

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
                  <img src={item.image} className="news-player-img" style={{ objectPosition: "50% 20%" }} />
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

        {/* Modern News Flow */}
        <div className="news-flow-grid">
          {flowItems.map((item) => (
            <div
              key={item.id}
              className={item.placement === 'main' ? 'news-main-card' : 'news-small-card'}
            >
              {item.image && item.placement === 'main' && (
                <img src={item.image} alt={item.title} className="news-main-card-img" />
              )}
              <div className={item.placement === 'main' ? 'news-pill' : 'news-pill dark'}>
                {item.tag}
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </PageWrap>
  );
}
