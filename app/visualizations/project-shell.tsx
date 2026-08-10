import Link from "next/link";

import { SiteHeader } from "../site-shell";

export function VisualizationProjectShell({
  children,
  externalLink,
  info,
  title,
}: Readonly<{
  children: React.ReactNode;
  externalLink?: {
    href: string;
    label: string;
  };
  info?: string;
  title: string;
}>) {
  return (
    <>
      <a className="skip-link" href="#visualization-content">
        Skip to content
      </a>

      <SiteHeader />

      <main className="visualization-project" id="visualization-content">
        <div className="visualization-project-bar">
          <Link
            className="visualization-project-back"
            href="/visualizations/"
            aria-label="Back to gallery"
          >
            <span aria-hidden="true">←</span>
            <span>gallery</span>
          </Link>
          <div className="visualization-project-title">
            <p>{title}</p>
            {info ? (
              <details className="visualization-project-info">
                <summary aria-label="About the picture conventions">?</summary>
                <div role="note">{info}</div>
              </details>
            ) : null}
          </div>
          {externalLink ? (
            <a
              className="visualization-project-source"
              href={externalLink.href}
              target="_blank"
              rel="noreferrer"
            >
              <span>{externalLink.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
        {children}
      </main>
    </>
  );
}
