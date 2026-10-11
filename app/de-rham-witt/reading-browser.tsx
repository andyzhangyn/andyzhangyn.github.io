"use client";

import { useEffect, useRef, useState } from "react";
import type { ReadingEntry } from "./reading-data";

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[–—−]/g, "-");
}

export function ReadingBrowser({ groups }: {
  groups: { year: string; entries: ReadingEntry[] }[];
}) {
  const [query, setQuery] = useState("");
  const [activeYear, setActiveYear] = useState(groups[0]?.year ?? "");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateDecade() {
      const years = listRef.current?.querySelectorAll<HTMLElement>(".bibliography-year");
      if (!years?.length) return;
      let current = years[0];
      for (const year of years) {
        if (year.getBoundingClientRect().top > 64) break;
        current = year;
      }
      setActiveYear(current.dataset.year ?? "");
    }
    updateDecade();
    window.addEventListener("scroll", updateDecade, { passive: true });
    window.addEventListener("resize", updateDecade);
    return () => {
      window.removeEventListener("scroll", updateDecade);
      window.removeEventListener("resize", updateDecade);
    };
  }, [query]);
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  let number = 0;
  const visible = groups.map((group) => ({
    year: group.year,
    entries: group.entries.map((entry) => ({ ...entry, number: ++number }))
      .filter((entry) => {
        const text = normalize(`${entry.authors} ${entry.title} ${entry.year} ${entry.publication}`);
        return terms.every((term) => text.includes(term));
      }),
  })).filter((group) => group.entries.length);
  const count = visible.reduce((sum, group) => sum + group.entries.length, 0);

  return (
    <>
      <div className="reading-layout" ref={listRef}>
        <div className="reading-toolbar">
        {count > 0 && <div className="reading-current-decade" data-decade={activeYear.slice(0, 3)} aria-label="Current decade">
          {activeYear.slice(0, 3)}0s
        </div>}
      <div className="reading-search">
        <label htmlFor="reading-search">Search</label>
        <input id="reading-search" type="search" value={query}
          placeholder="Author, title, or year" autoComplete="off"
          onInput={(event) => setQuery(event.currentTarget.value)} />
        {query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
        <span className="reading-count" role="status">{count} / {number}</span>
      </div>
        </div>
        <div className="bibliography-groups">
          {visible.map((group) => (
            <section className="bibliography-year" data-year={group.year} data-decade={group.year.slice(0, 3)} id={`reading-${group.year}`} key={group.year}>
              <h2>{group.year}</h2>
              <ol className="bibliography-list bibliography-list-numbered" start={group.entries[0].number}>
                {group.entries.map((entry) => (
                  <li key={entry.title} value={entry.number}>
                    <p>
                      {entry.authors}, <em>{entry.title}</em>, {entry.publication}.
                      {entry.links.map((link) => (
                        <span className="bracket-link" key={link.href}>
                          {" "}[<a href={link.href}>{link.label}</a>]
                        </span>
                      ))}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {!count && <p className="reading-empty">No matching references.</p>}
        </div>
      </div>
    </>
  );
}
