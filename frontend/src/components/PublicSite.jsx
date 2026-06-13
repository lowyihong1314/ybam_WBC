import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PosterPreview } from "./PosterPreview";
import { fetchGuestData } from "../lib/api";
import { withBasePath } from "../lib/basePath";
import {
  DEFAULT_PUBLIC_VERSION,
  normalizeVersion,
  versionConfigs,
} from "../lib/versions";

function GuestCards({ items, emptyText, type }) {
  if (!items.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="cards-grid">
      {items.map((item) => (
        <article className="info-card" key={`${type}-${item.name}`}>
          <div className="avatar-shell">
            {item.avatar ? (
              <img className="avatar-image" src={withBasePath(item.avatar)} alt={item.name} />
            ) : (
              <div className="avatar-fallback">{item.name?.slice(0, 1) || "Y"}</div>
            )}
          </div>
          <h3>{item.name}</h3>
          <p className="card-meta">
            {item.role || item.institution || item.title || ""}
          </p>
          <p className="card-submeta">
            {[item.university, item.country, item.time].filter(Boolean).join(" · ")}
          </p>
          <p>{item.topic || item.bio || ""}</p>
        </article>
      ))}
    </div>
  );
}

function Programme({ programme, emptyText }) {
  const day1Items = programme?.day1?.items || [];
  const day2Items = programme?.day2?.items || [];

  if (!day1Items.length && !day2Items.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="programme-grid">
      {[programme.day1, programme.day2].map((day) => (
        <section className="programme-card" key={day.title}>
          <h3>{day.title}</h3>
          <div className="programme-list">
            {day.items.map((item) => (
              <div className={`programme-item ${item.highlight ? "highlight" : ""}`} key={`${day.title}-${item.time}-${item.title}`}>
                <div className="programme-time">{item.time}</div>
                <div className="programme-title">{item.title}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function PublicSite({ forcedVersion }) {
  const params = useParams();
  const version = normalizeVersion(forcedVersion || params.version || DEFAULT_PUBLIC_VERSION);
  const config = versionConfigs[version];
  const [guestData, setGuestData] = useState({
    speakers: [],
    committee: [],
    programme: { day1: { items: [] }, day2: { items: [] } },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.lang = config.htmlLang;
    document.title = `${config.headline} | YBAM`;
  }, [config]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchGuestData(version);
        if (!cancelled) {
          setGuestData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.payload?.error || err.message || "Failed to load data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return (
    <div className={`site-shell version-${version}`}>
      <header className="topbar">
        <Link className="brand-lockup" to={version === DEFAULT_PUBLIC_VERSION ? "/" : `/${version}`}>
          <span className="brand-kicker">YBAM</span>
          <span className="brand-title">{config.siteName}</span>
        </Link>
        <nav className="topnav">
          <Link to={version === DEFAULT_PUBLIC_VERSION ? "/" : `/${version}`}>{config.nav.home}</Link>
          <a href="#programme">{config.nav.programme}</a>
          <a href="#speakers">{config.nav.speakers}</a>
          <Link to={version === DEFAULT_PUBLIC_VERSION ? "/register" : `/${version}/register`}>
            {config.nav.register}
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">YBAM</p>
            <h1>{config.headline}</h1>
            <p className="hero-strapline">{config.strapline}</p>
            <p className="hero-description">{config.description}</p>

            <div className="hero-actions">
              <a className="primary-button" href="#programme">
                {config.ctaPrimary}
              </a>
              <a className="secondary-button" href="#partners">
                {config.ctaSecondary}
              </a>
            </div>

            <div className="fact-strip">
              <div>
                <span>{config.language === "zh" ? "日期" : "Date"}</span>
                <strong>{config.dateLabel}</strong>
              </div>
              <div>
                <span>{config.language === "zh" ? "地点" : "Location"}</span>
                <strong>{config.locationLabel}</strong>
              </div>
              <div>
                <span>{config.language === "zh" ? "会场" : "Venue focus"}</span>
                <strong>{config.shortName}</strong>
              </div>
            </div>
          </div>

          <aside className="hero-aside">
            {config.posterImage ? (
              <PosterPreview
                alt={`${config.siteName} poster`}
                hint={config.language === "zh" ? "点击查看海报大图" : "Click to enlarge poster"}
                src={config.posterImage}
              />
            ) : null}
            <div className="language-pill">
              {config.language === "zh" ? "中文现场" : "English programme"}
            </div>
            <h2>{config.audienceLabel}</h2>
            <div className="quick-facts">
              {config.quickFacts.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p className="eyebrow">{config.language === "zh" ? "活动概览" : "Overview"}</p>
            <h2>{config.language === "zh" ? "本会场的讨论重点" : "What this conference focuses on"}</h2>
          </div>
          <div className="narrative-grid">
            {config.sections.map((section) => (
              <article className="narrative-card" key={section.title}>
                <p className="eyebrow">{section.eyebrow}</p>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="feature-grid">
            {config.featureCards.map((card) => (
              <article className="feature-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block" id="programme">
          <div className="section-heading">
            <p className="eyebrow">{config.language === "zh" ? "议程" : "Programme"}</p>
            <h2>{config.language === "zh" ? "活动议程" : "Conference programme"}</h2>
          </div>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : error ? (
            <div className="empty-state">{error}</div>
          ) : (
            <Programme programme={guestData.programme} emptyText={config.programmePlaceholder} />
          )}
        </section>

        <section className="section-block" id="speakers">
          <div className="split-heading">
            <div className="section-heading">
              <p className="eyebrow">{config.language === "zh" ? "讲者" : "Speakers"}</p>
              <h2>{config.language === "zh" ? "讲者资料" : "Featured voices"}</h2>
            </div>
            <div className="section-heading">
              <p className="eyebrow">{config.language === "zh" ? "委员会" : "Committee"}</p>
              <h2>{config.language === "zh" ? "筹备团队" : "Technical and editorial members"}</h2>
            </div>
          </div>
          {loading ? (
            <div className="dual-columns">
              <div className="empty-state">Loading...</div>
              <div className="empty-state">Loading...</div>
            </div>
          ) : (
            <div className="dual-columns">
              <GuestCards
                items={guestData.speakers.speakers || []}
                emptyText={config.peoplePlaceholder}
                type="speaker"
              />
              <GuestCards
                items={guestData.committee.members || []}
                emptyText={config.peoplePlaceholder}
                type="committee"
              />
            </div>
          )}
        </section>

        <section className="section-block" id="partners">
          <div className="section-heading">
            <p className="eyebrow">{config.language === "zh" ? "合作单位" : "Partners"}</p>
            <h2>{config.partnersTitle}</h2>
            <p className="hero-description compact-copy">{config.partnersSubtitle}</p>
          </div>
          {config.partners.length ? (
            <div className="partners-grid">
              {config.partners.map((partner) => (
                <div className="partner-card" key={partner.name}>
                  <img src={withBasePath(partner.image)} alt={partner.name} />
                  <span>{partner.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {config.language === "zh"
                ? "合作单位视觉资料整理中。"
                : "Partner branding will be added to this version later."}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <p>{config.footer}</p>
      </footer>
    </div>
  );
}
