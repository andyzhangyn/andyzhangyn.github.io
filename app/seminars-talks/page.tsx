import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "../site-shell";

export const metadata: Metadata = {
  title: "Seminars & Talks — moved to Research",
  description:
    "Yuanning Zhang's seminars and talks are now part of the Research page.",
  alternates: {
    canonical: "/research/",
  },
  robots: { index: false, follow: true },
};

export default function SeminarsTalksPage() {
  return (
    <>
      <meta
        httpEquiv="refresh"
        content="0;url=/research/#seminars-talks"
      />

      <a className="skip-link" href="/research/#seminars-talks">
        Skip to content
      </a>

      <SiteHeader />

      <main className="content-page" id="main-content">
        <div className="wrapper content-page-wrapper">
          <header className="content-page-header">
            <h1>seminars &amp; talks</h1>
          </header>

          <div className="content-page-body prose-page-body">
            <p>
              Seminars and talks are now part of the{" "}
              <a href="/research/#seminars-talks">Research page</a>.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
