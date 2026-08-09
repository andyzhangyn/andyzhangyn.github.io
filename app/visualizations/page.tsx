import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "../site-shell";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Interactive mathematical visualizations by Yuanning Zhang.",
  alternates: {
    canonical: "/visualizations/",
  },
  openGraph: {
    type: "website",
    url: "/visualizations/",
    title: "Mathematical Visualization Gallery | Yuanning Zhang",
    description:
      "Interactive projects on de Rham–Witt theory, exact sequences, and subquotients.",
  },
};

export default function VisualizationsPage() {
  return (
    <>
      <a className="skip-link" href="#gallery-content">
        Skip to content
      </a>

      <SiteHeader />

      <main className="gallery-exhibition" id="gallery-content">
        <div className="gallery-exhibition-inner">
          <header className="gallery-exhibition-header">
            <h1>gallery</h1>
          </header>

          <section className="gallery-wall" aria-label="Visualization projects">
            <article className="gallery-work gallery-work-domino">
              <div className="gallery-frame">
                <div className="gallery-frame-mat">
                  <div className="gallery-artwork">
                    <Image
                      className="gallery-artwork-image"
                      src="/gallery/what-is-a-domino-cover.png"
                      alt="Nested lattice diagrams with colored circular subquotients"
                      width={610}
                      height={620}
                      sizes="(max-width: 680px) calc(100vw - 70px), 460px"
                      priority
                    />
                  </div>
                </div>
                <Link
                  className="gallery-frame-link"
                  href="/visualizations/what-is-a-domino/"
                  aria-label="Open What is a domino?"
                >
                  <span className="gallery-frame-enter" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </div>
              <Link
                className="gallery-plaque"
                href="/visualizations/what-is-a-domino/"
              >
                <span aria-hidden="true">01</span>
                <h2>What is a domino?</h2>
              </Link>
            </article>

            <article className="gallery-work gallery-work-vakil">
              <div className="gallery-frame">
                <div className="gallery-frame-mat">
                  <div className="gallery-artwork">
                    <Image
                      className="gallery-artwork-image"
                      src="/gallery/vakils-picturebook-module-07-art.svg"
                      alt="Module 07 Snake lemma jigsaw with thin seams and clean color fields"
                      width={320}
                      height={320}
                      sizes="(max-width: 680px) calc(100vw - 70px), 400px"
                    />
                  </div>
                </div>
                <Link
                  className="gallery-frame-link"
                  href="/visualizations/vakil-picturebook/"
                  aria-label="Open Vakil's Picturebook"
                >
                  <span className="gallery-frame-enter" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </div>
              <Link
                className="gallery-plaque"
                href="/visualizations/vakil-picturebook/"
              >
                <span aria-hidden="true">02</span>
                <h2>Vakil&apos;s Picturebook</h2>
              </Link>
            </article>

            <article
              className="gallery-work gallery-work-zeta"
              aria-label="Zeta Function, in preparation"
            >
              <div className="gallery-frame gallery-frame-placeholder">
                <div className="gallery-frame-mat">
                  <div className="gallery-artwork gallery-artwork-zeta">
                    <p>In preparation</p>
                  </div>
                </div>
              </div>
              <div className="gallery-plaque gallery-plaque-static">
                <span aria-hidden="true">03</span>
                <h2>Zeta Function</h2>
              </div>
            </article>

          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
