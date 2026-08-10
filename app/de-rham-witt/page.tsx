import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "../site-shell";
import { readingList } from "./reading-data";

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

      return authorOrder || authorCollator.compare(left.title, right.title);
    }),
  }),
);

export const metadata: Metadata = {
  title: "de Rham–Witt reading list",
  description: "A reading list on de Rham-Witt cohomology, F-gauges, and related topics.",
  alternates: {
    canonical: "/de-rham-witt/",
  },
  openGraph: {
    type: "article",
    url: "/de-rham-witt/",
    title: "de Rham–Witt reading list",
    description: "A reading list on de Rham-Witt cohomology, F-gauges, and related topics.",
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
            <p>A reading list on de Rham-Witt cohomology, F-gauges, and related topics.</p>
          </header>

          <div className="bibliography-groups">
            {readingListByYear.map((group) => (
              <section className="bibliography-year" key={group.year}>
                <h2>{group.year}</h2>
                <ul className="bibliography-list">
                  {group.entries.map((entry) => (
                    <li key={entry.title}>
                      <p>
                        {entry.authors}, <em>{entry.title}</em>, {entry.publication}.
                        {entry.links.map((link) => (
                          <span className="bracket-link" key={link.href}>
                            {" "}[
                            <a href={link.href}>{link.label}</a>]
                          </span>
                        ))}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
