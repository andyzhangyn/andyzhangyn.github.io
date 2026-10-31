"use client";

import { usePathname } from "next/navigation";

import { profile } from "./site-content";

function isCurrent(pathname: string, href: string, match: readonly string[]) {
  if (href === "/") return pathname === "/";
  return [href, ...match].some((prefix) => pathname.startsWith(prefix));
}

export function NavLinks() {
  const pathname = usePathname() ?? "/";
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;

  return profile.navigation.map((item) => {
    const current = isCurrent(path, item.href, item.match);
    return (
      <a
        className={current ? "page-link is-current" : "page-link"}
        key={item.href}
        href={item.href}
        aria-current={current ? "page" : undefined}
      >
        {item.label}
      </a>
    );
  });
}
