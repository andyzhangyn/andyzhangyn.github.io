import type { Metadata } from "next";
import { HabiroDiagram } from "./habiro-diagram";
import { programme } from "./programme";
import { referenceGroups } from "./references";
import { BibliographyDisclosure } from "./bibliography-disclosure";


export const metadata: Metadata = {
  title: "q-de Rham cohomology and Habiro rings",
  description: "SLMath mini workshop, September 23–25, 2026, 10–11 am and 1–2 pm each day.",
  alternates: { canonical: "/seminar/slmath/habiro/" },
};

export default function HabiroWorkshopPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main className="content-page slmath-page" id="main-content">
        <div className="wrapper content-page-wrapper">
          <p className="slmath-back">
            <a href="/seminar/slmath/">← SLMath graduate student seminar</a>
          </p>
          <header className="content-page-header slmath-banner habiro-art-banner">
            <HabiroDiagram />
            <div className="habiro-banner-copy">
            <p className="slmath-eyebrow">SLMath · Mini Workshop</p>
            <h1>q-de Rham cohomology and Habiro rings</h1>
            <p className="habiro-banner-subtitle"><em>Arithmetic geometry meets quantum topology</em></p>
            <p className="slmath-intro">
              <time dateTime="2026-09-23">September 23</time>–<time dateTime="2026-09-25">25, 2026</time>
              {" · Wednesday–Friday · 10–11 am & 1–2 pm each day · Eisenbud Auditorium, SLMath"}
            </p>
            </div>
          </header>
          <div className="prose-page-body">
            <p>Remaining speakers to be announced.</p>
            <p>We thank <a href="https://tessbouis.com/">Tess Bouis</a> for suggesting ideas for the individual talk topics.</p>
          </div>
          <section aria-labelledby="programme-heading">
            <div className="slmath-schedule-heading">
              <h2 id="programme-heading">Programme</h2>
            </div>
            <div className="academic-table-scroll" role="region" aria-label="Workshop programme" tabIndex={0}>
              <table className="academic-table">
                <thead><tr><th scope="col">Time</th><th scope="col">Talk</th><th scope="col">Topic</th><th scope="col">Speaker</th></tr></thead>
                <tbody>
                  {programme.map((talk, index) => (
                    <tr key={talk.title}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <time dateTime={`2026-09-${23 + Math.floor(index / 2)}`}>
                          {["Wed, Sep 23", "Thu, Sep 24", "Fri, Sep 25"][Math.floor(index / 2)]}
                        </time>
                        <br />
                        {index % 2 === 0 ? "10–11 am" : "1–2 pm"}
                      </td>
                      <th scope="row">Talk {index + 1}</th>
                      <td>
                        <strong>{talk.title}</strong>
                        <p>{talk.description}</p>
                        <p className="workshop-reference-label">Suggested references</p>
                        <div className="workshop-reference-prose">
                          {talk.references.map(ref => (
                            <p key={ref.url}>
                              {ref.author}, <a href={ref.url}>{ref.title}</a>.
                            </p>
                          ))}
                        </div>
                      </td>
                      <td>{talk.speakerUrl ? <a href={talk.speakerUrl}>{talk.speaker}</a> : (talk.speaker ?? "TBD")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <BibliographyDisclosure>
            <summary>
              <h2>References</h2>
              <span className="bibliography-toggle" aria-hidden="true">
                <span className="bibliography-show">Show</span>
                <span className="bibliography-hide">Hide</span>
              </span>
            </summary>
            <div className="bibliography-groups">
              {referenceGroups.map((group, index) => (
                <section className="bibliography-group" key={group.title} aria-labelledby={`reference-group-${index}`}>
                  <h3 id={`reference-group-${index}`}>{group.title}</h3>
                  <div className="bibliography-entries">
                    {group.references.map(ref => (
                      <p key={ref.url}>
                        {ref.author}, <a href={ref.url}>{ref.title}</a>.
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </BibliographyDisclosure>
        </div>
      </main>
    </>
  );
}
