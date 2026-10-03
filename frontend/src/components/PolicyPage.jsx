import { useEffect } from "react";
import { Link } from "react-router-dom";

import { DEFAULT_PUBLIC_VERSION, versionConfigs } from "../lib/versions";

const CONTACT_EMAIL = "cbs@ybam.org.my";

const REFUND_POLICY =
  "All registrations are final and non-refundable; for any exceptional refund request, please contact us via email, cbs@ybam.org.my.";

const TERMS_AND_CONDITIONS =
  'By registering for the International Contemporary Buddhist Seminar ("the Seminar"), participants acknowledge that the Organisers may make reasonable adjustments to the programme, schedule, speakers, or venue where necessary, and may manage attendance to ensure a safe, respectful, and smooth experience for all. The Organisers may also record or photograph elements of the event for archival or promotional use. Any such decisions will be made with due consideration for participants and the overall integrity of the Conference.';

function linkContactEmail(text) {
  return text.split(CONTACT_EMAIL).reduce(
    (nodes, part, index) =>
      index === 0
        ? [part]
        : [
            ...nodes,
            <a key={`email-${index}`} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>,
            part,
          ],
    [],
  );
}

export function PolicyPage({ focus }) {
  const config = versionConfigs[DEFAULT_PUBLIC_VERSION];
  const title = focus === "terms" ? "Terms & Conditions" : "Refund Policy";

  useEffect(() => {
    document.title = `${title} | ${config.siteName}`;
    document.getElementById(focus)?.scrollIntoView();
  }, [config.siteName, focus, title]);

  return (
    <div className={`site-shell version-${DEFAULT_PUBLIC_VERSION}`}>
      <header className="topbar">
        <Link className="brand-lockup" to="/">
          <span className="brand-kicker">YBAM</span>
          <span className="brand-title">{config.siteName}</span>
        </Link>
        <nav className="topnav">
          <Link to="/">{config.nav.home}</Link>
          <Link to="/register">{config.nav.register}</Link>
        </nav>
      </header>

      <main>
        <section className="register-shell">
          <div className="register-card">
            <section className="subsection-card" id="terms">
              <div className="section-heading compact">
                <h2>Terms &amp; Conditions</h2>
              </div>
              <p>{TERMS_AND_CONDITIONS}</p>
            </section>

            <section className="subsection-card" id="refund-policy">
              <div className="section-heading compact">
                <h2>Refund Policy</h2>
              </div>
              <p>{linkContactEmail(REFUND_POLICY)}</p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
