type MenuLanguage = "en" | "zh";
type MenuPage = "domino" | "slope";

export default function SiteMenu({
  active,
  language,
}: {
  active: MenuPage;
  language: MenuLanguage;
}) {
  const items = [
    {
      id: "domino" as const,
      href: "/visualizations/what-is-a-domino/",
      index: "01",
      label: language === "en" ? "What is a domino?" : "什么是多米诺？",
    },
    {
      id: "slope" as const,
      href: "/visualizations/slope-spectral-sequence/",
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
          target="_top"
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
