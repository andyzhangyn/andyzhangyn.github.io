import Image from "next/image";
import { profile } from "./site-content";
import { SiteFooter, SiteHeader } from "./site-shell";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <SiteHeader />

      <main className="page-content" id="main-content">
        <div className="wrapper">
          <section className="home" id="top">
            <h1 className="visually-hidden">{profile.name}</h1>

            <figure className="portrait-wrap">
              <Image
                className="portrait-image"
                src={profile.portrait.src}
                width={profile.portrait.width}
                height={profile.portrait.height}
                alt={profile.portrait.alt}
                priority
              />
            </figure>

            <div className="home-copy">
              <p>
                I am a Ph.D. student in mathematics at{" "}
                {profile.institution.name}, advised by{" "}
                <a href={profile.advisor.url}>{profile.advisor.name}</a>.
              </p>
              <p>{profile.introduction}</p>
            </div>
          </section>

          <section className="page-section" id="background">
            <h2>background</h2>
            <div className="education-list">
              {profile.education.map((item) => (
                <article className="education-item" key={item.school}>
                  <p>
                    <span className="item-label">{item.years}</span>{" "}
                    <em>{item.degree}</em> at {item.school}.
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
