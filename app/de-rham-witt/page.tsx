import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "../site-shell";
import { readingList } from "./reading-data";
import { ReadingBrowser } from "./reading-browser";

const authorCollator = new Intl.Collator("en", { sensitivity: "base" });

function firstAuthorSurname(authors: string) {
  const firstAuthor = authors.split(/,|\sand\s/, 1)[0].trim();
  return firstAuthor.split(/\s+/).at(-1) ?? firstAuthor;
}

const readingListByYear = Array.from(
  readingList.reduce((groups, entry) => {
    const entries = groups.get(entry.year) ?? [];
    entries.push(entry);
    groups.set(entry.year, entries);
    return groups;
  }, new Map<string, (typeof readingList)[number][]>()),
  ([year, entries]) => ({
    year,
    entries: entries.toSorted((left, right) => {
      const authorOrder = authorCollator.compare(
        firstAuthorSurname(left.authors),
        firstAuthorSurname(right.authors),
      );

      // Preserve reading-list order for works by the same first author.
      return authorOrder;
    }),
  }),
);

export const metadata: Metadata = {
  title: "de Rham–Witt reading list",
  description: "A reading list on de Rham–Witt cohomology, F-gauges, and related topics in p-adic geometry.",
  alternates: {
    canonical: "/de-rham-witt/",
  },
  openGraph: {
    type: "article",
    url: "/de-rham-witt/",
    title: "de Rham–Witt reading list",
    description: "A reading list on de Rham–Witt cohomology, F-gauges, and related topics in p-adic geometry.",
  },
};

export default function DeRhamWittReadingPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <SiteHeader />

      <main className="content-page" id="main-content">
        <div className="wrapper content-page-wrapper">
          <header className="content-page-header">
            <h1>de Rham–Witt reading list</h1>
            <p>A reading list on de Rham–Witt cohomology, F-gauges, and related topics in p-adic geometry.</p>
          </header>

          <ReadingBrowser groups={readingListByYear} />
          <p className="bibliography-last-update">
            Last update: <time dateTime="2026-10-11">October 11, 2026</time>
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
