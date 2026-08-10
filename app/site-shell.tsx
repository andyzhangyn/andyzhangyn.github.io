import Link from "next/link";

import { profile } from "./site-content";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrapper header-inner">
        <Link className="site-title" href="/" aria-label="Yuanning Zhang, home">
          {profile.name}
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          <input className="nav-trigger" id="nav-trigger" type="checkbox" />
          <label htmlFor="nav-trigger">
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="visually-hidden">Toggle navigation</span>
          </label>
          <div className="trigger">
            {profile.navigation.map((item) => (
              <a className="page-link" key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrapper footer-col-wrapper">
        <div className="footer-col footer-col-1">
          <ul className="contact-list">
            <li>{profile.name}</li>
            <li>{profile.email}</li>
          </ul>
        </div>
        <div className="footer-col footer-col-2">
          <address>
            Northwestern University
            <br />
            Department of Mathematics
            <br />
            Evanston, Illinois
          </address>
        </div>
      </div>
    </footer>
  );
}
