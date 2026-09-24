import type { Metadata } from "next";
import Link from "next/link";

const remainingSchedule = [
  {
    date: "2026-10-09",
    label: "Friday, October 9",
    noSeminar: "Geometric Representation Theory and 3d Mirror Symmetry workshop (October 5–9).",
  },
  { date: "2026-10-16", label: "Friday, October 16" },
  {
    date: "2026-10-23",
    label: "Friday, October 23",
    noSeminar: "Motivic Homotopy Theory: Connections and Applications workshop (October 19–23).",
  },
  { date: "2026-10-30", label: "Friday, October 30" },
  {
    date: "2026-11-06",
    label: "Friday, November 6",
    venueNote: "All seminars must take place in the Eisenbud Auditorium this week.",
  },
  { date: "2026-11-13", label: "Friday, November 13" },
  { date: "2026-11-20", label: "Friday, November 20" },
  {
    date: "2026-11-27",
    label: "Friday, November 27",
    noSeminar: "SLMath is closed for Thanksgiving (November 26–27).",
  },
  { date: "2026-12-04", label: "Friday, December 4" },
  { date: "2026-12-11", label: "Friday, December 11" },
  { date: "2026-12-18", label: "Friday, December 18" },
];

export const metadata: Metadata = {
  title: "SLMath graduate student seminar",
  description:
    "Fall 2026 schedule for the SLMath graduate student seminar and mini workshops.",
  alternates: { canonical: "/seminar/slmath/" },
};

export default function SLMathSeminarPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <main className="content-page slmath-page" id="main-content">
        <div className="wrapper content-page-wrapper">
          <p className="slmath-back"><a href="/seminar/">← All seminars</a></p>
          <header className="content-page-header slmath-banner">
            <p className="slmath-eyebrow">SLMath · Fall 2026</p>
            <h1>Graduate student seminar</h1>
            <p className="slmath-intro">Organizers: <a href="https://sites.google.com/husky.neu.edu/beserra-erika">Erika Beserra</a> and <Link href="/">Yuanning Zhang</Link>.</p>
          </header>

          <p>Welcome! This is the webpage for the SLMath graduate student seminar and mini workshops in Fall 2026.</p>
          <p><strong>Fridays, 10–11 am</strong> · Eisenbud Auditorium, SLMath.</p>
          <h2 className="academic-section-title">Schedule</h2>
          <div className="seminar-schedule">
            <article className="seminar-event" aria-labelledby="sept-11-title">
              <div className="seminar-event-date">
                <time dateTime="2026-09-11">Friday, September 11</time>
                <span>11 am–12 pm</span>
                <span className="academic-note"><em>Note the time change</em></span>
              </div>
              <div>
                <h2 id="sept-11-title">Quantum Groups and KLR Algebras</h2>
                <p className="slmath-speaker"><a href="https://sites.google.com/husky.neu.edu/beserra-erika">Erika Beserra</a></p>
                <p className="slmath-abstract" id="erika-abstract">
                  <strong>Abstract.</strong> We will introduce the negative half of
                  the quantum group, discuss a positivity question, and walk
                  through the idea of the proof of positivity of the canonical
                  bases through categorification via KLR algebras. If there is
                  remaining time, we will introduce cyclotomic quotients of KLR
                  algebras, and their generalizations, KLRW algebras.
                </p>
              </div>
            </article>
            <article className="seminar-event" aria-labelledby="sept-18-title">
              <div className="seminar-event-date">
                <time dateTime="2026-09-18">Friday, September 18</time>
                <span>10–11 am</span>
              </div>
              <div>
                <h2 id="sept-18-title">Higher 𝔸<sup>1</sup>-coverings</h2>
                <p className="slmath-speaker">Marco Giustetto</p>
                <p className="slmath-abstract" id="marco-abstract">
                  <strong>Abstract.</strong> We will give a (very) quick overview of
                  Morel&apos;s theory of 𝔸<sup>1</sup>-coverings and discuss some of
                  its applications — for instance, motivic knots. We will then
                  introduce 𝔸<sup>1</sup>-<i>n</i>-coverings, present a classification
                  theorem for them — analogous to the topological classification
                  of coverings — and give a variety of examples. Finally, we will
                  answer a question of Morel on a geometric criterion for
                  recognizing 𝔸<sup>1</sup>-coverings between schemes over a field.
                  This is based on joint work with Thor Wittich.
                </p>
              </div>
            </article>
            <article className="seminar-event" aria-labelledby="workshop-title">
              <div className="seminar-event-date">
                <span><time dateTime="2026-09-23">September 23</time>–<time dateTime="2026-09-25">25</time></span>
                <span>Wednesday–Friday</span>
                <span>10–11 am &amp; 1–2 pm</span>
              </div>
              <div>
                <p className="seminar-event-kind">Mini Workshop</p>
                <h2 id="workshop-title"><a href="/seminar/slmath/habiro/">q-de Rham cohomology and Habiro rings</a></h2>
              </div>
            </article>
            <article className="seminar-event" aria-labelledby="oct-2-title">
              <div className="seminar-event-date">
                <time dateTime="2026-10-02">Friday, October 2</time>
                <span>10–11 am</span>
              </div>
              <div>
                <h2 id="oct-2-title">Relative Kazhdan Lusztig isomorphism for GL₂ₙ/Sp₂ₙ</h2>
                <p className="slmath-speaker">
                  <a href="https://sites.google.com/view/guyshtotland/home">Guy Shtotland</a>
                </p>
                <p className="slmath-abstract">
                  <strong>Abstract.</strong> The Kazhdan Lusztig isomorphism, which
                  relates the affine Hecke algebra of a p-adic group to the
                  equivariant K-theory of the Steinberg variety of its Langlands
                  dual, played a key role in the proof of the Deligne Langlands
                  conjecture on the classification of tamely ramified irreducible
                  representations. For a spherical variety X, we can construct two
                  modules over the affine Hecke algebra: the first by considering
                  Iwahori invariant functions on X, and the second using relative
                  Langlands duality and equivariant K-theory. It is natural to
                  expect a relationship between these modules. I will discuss this
                  relationship for X = GL₂ₙ/Sp₂ₙ and its application to the study
                  of distinguished representations.
                </p>
              </div>
            </article>
            {remainingSchedule.map((event) => (
              <article className="seminar-event" key={event.date} aria-labelledby={`seminar-${event.date}`}>
                <div className="seminar-event-date">
                  <time dateTime={event.date}>{event.label}</time>
                  {!event.noSeminar && <span>10–11 am</span>}
                </div>
                <div>
                  <h2 id={`seminar-${event.date}`}>{event.noSeminar ? "No seminar" : "Topic TBA"}</h2>
                  {event.noSeminar ? (
                    <p>{event.noSeminar}</p>
                  ) : (
                    <>
                      <p className="slmath-speaker">Speaker TBA</p>
                      {event.venueNote && <p className="academic-note">{event.venueNote}</p>}
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
