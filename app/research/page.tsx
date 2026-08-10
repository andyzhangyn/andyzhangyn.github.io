import type { Metadata } from "next";

import { profile } from "../site-content";
import { SiteFooter, SiteHeader } from "../site-shell";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Yuanning Zhang's research interests, writing, seminars, and talks.",
  alternates: {
    canonical: "/research/",
  },
};

export default function ResearchPage() {
  const publicationCount = profile.writing.length;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <SiteHeader />

      <main className="content-page" id="main-content">
        <div className="wrapper content-page-wrapper">
          <header className="content-page-header">
            <h1>research</h1>
          </header>

          <div className="content-page-body">
            <section
              className="prose-page-body"
              aria-label="Research interests"
            >
              {profile.research.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p>
                {profile.research.galleryIntroduction}{" "}
                <a href="/visualizations/">gallery</a>.
              </p>
            </section>

            <section
              className="page-section"
              id="writing"
              aria-labelledby="writing-heading"
            >
              <h2 id="writing-heading">writing</h2>
              {profile.writing.map((item, index) => (
                <article className="publication" key={item.title}>
                  <p>
                    <span className="item-label">
                      [{publicationCount - index}]
                    </span>{" "}
                    {item.authors}, <em>{item.title}</em>.{" "}
                    {item.links.map((link) => (
                      <span className="bracket-link" key={link.label}>
                        [<a href={link.href}>{link.label}</a>]
                      </span>
                    ))}
                  </p>
                </article>
              ))}
            </section>

            <section
              className="page-section"
              id="seminars-talks"
              aria-labelledby="seminars-talks-heading"
            >
              <h2 id="seminars-talks-heading">seminars &amp; talks</h2>
              {profile.talks.map((talk) => (
                <article className="talk" key={talk.title}>
                  <p>
                    <time className="item-label" dateTime={talk.dateTime}>
                      {talk.date}
                    </time>{" "}
                    <em>{talk.title}</em>, {talk.venue}.
                    {talk.href ? (
                      <span className="bracket-link">
                        {" "}[
                        <a href={talk.href}>event page</a>]
                      </span>
                    ) : null}
                  </p>
                </article>
              ))}
              {profile.seminars.map((seminar) => (
                <article className="seminar" key={seminar.title}>
                  <p>
                    <time className="item-label" dateTime={seminar.dateTime}>
                      {seminar.date}
                    </time>{" "}
                    <em>{seminar.title}</em>. {seminar.description}{" "}
                    <span className="bracket-link">
                      [<a href={seminar.href}>seminar page</a>]
                    </span>
                  </p>
                </article>
              ))}
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
