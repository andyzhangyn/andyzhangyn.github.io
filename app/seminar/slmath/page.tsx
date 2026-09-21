import type { Metadata } from "next";
import Link from "next/link";


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
                <h2 id="oct-2-title">Topic TBA</h2>
                <p className="slmath-speaker">
                  <a href="https://sites.google.com/view/guyshtotland/home">Guy Shtotland</a>
                </p>
              </div>
            </article>
          </div>
        </div>
      </main>
    </>
  );
}
