import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "../site-shell";
import { profile } from "../site-content";

export const metadata: Metadata = {
  title: "Seminars",
  description: "Seminars and mini workshops.",
  alternates: { canonical: "/seminar/" },
};

export default function SeminarPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main className="content-page" id="main-content">
        <div className="wrapper content-page-wrapper">
          <header className="content-page-header">
            <h1>seminars</h1>
          </header>
          <div className="content-page-body">
            <article className="seminar-event">
              <div className="seminar-event-date">Fall 2026</div>
              <div>
                <h2>
                  <a href="/seminar/slmath/">SLMath graduate student seminar</a>
                </h2>
                <p>General seminars and mini workshops at SLMath.</p>
              </div>
            </article>
            {profile.seminars.map((seminar) => (
              <article className="seminar-event" key={seminar.href}>
                <div className="seminar-event-date">
                  <time dateTime={seminar.dateTime}>{seminar.date}</time>
                </div>
                <div>
                  <h2><a href={seminar.href}>{seminar.title}</a></h2>
                  <p>{seminar.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
