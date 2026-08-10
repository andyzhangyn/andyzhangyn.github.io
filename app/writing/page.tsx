import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "../site-shell";

export const metadata: Metadata = {
  title: "Writing — moved to Research",
  description: "Yuanning Zhang's writing is now part of the Research page.",
  alternates: {
    canonical: "/research/",
  },
  robots: { index: false, follow: true },
};

export default function WritingPage() {
  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/research/#writing" />

      <a className="skip-link" href="/research/#writing">
        Skip to content
      </a>

      <SiteHeader />

      <main className="content-page" id="main-content">
        <div className="wrapper content-page-wrapper">
          <header className="content-page-header">
            <h1>writing</h1>
          </header>

          <div className="content-page-body prose-page-body">
            <p>
              Writing is now part of the{" "}
              <a href="/research/#writing">Research page</a>.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
