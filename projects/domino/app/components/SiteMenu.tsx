type MenuLanguage = "en" | "zh";
type MenuPage = "domino" | "slope";

export default function SiteMenu({
  active,
  language,
}: {
  active: MenuPage;
  language: MenuLanguage;
}) {
  const dominoHref = active === "domino" ? "./index.html" : "../index.html";
  const slopeHref = active === "domino"
    ? "./slope-spectral-sequence/index.html"
    : "./index.html";
  const items = [
    {
      id: "domino" as const,
      href: dominoHref,
      index: "01",
      label: language === "en" ? "What is a domino?" : "什么是多米诺？",
    },
    {
      id: "slope" as const,
      href: slopeHref,
      index: "02",
      label: language === "en" ? "Slope Spectral Sequence" : "斜率谱序列",
    },
  ];

  return (
    <nav
      className="site-menu"
      aria-label={language === "en" ? "Visualization projects" : "可视化项目"}
    >
      {items.map((item) => (
        <a
          className={`site-menu-link${active === item.id ? " is-active" : ""}`}
          href={item.href}
          aria-current={active === item.id ? "page" : undefined}
          key={item.id}
        >
          <span className="site-menu-index">{item.index}</span>
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
