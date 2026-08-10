import type { Metadata } from "next";
import "./minima.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://andyzhangyn.github.io"),
  title: {
    default: "Yuanning Zhang | Mathematics",
    template: "%s | Yuanning Zhang",
  },
  description:
    "Yuanning Zhang is a Ph.D. student in mathematics at Northwestern University.",
  authors: [{ name: "Yuanning Zhang" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Yuanning Zhang | Mathematics",
    description:
      "P-adic geometry, cohomology in positive characteristic, prismatic cohomology, and the stacky approach.",
    siteName: "Yuanning Zhang",
  },
  twitter: {
    card: "summary",
    title: "Yuanning Zhang | Mathematics",
    description:
      "P-adic geometry, cohomology in positive characteristic, prismatic cohomology, and the stacky approach.",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
