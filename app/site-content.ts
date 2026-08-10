/**
 * Edit this file when your academic information changes.
 *
 * The first draft below was assembled from public Northwestern, workshop, and
 * arXiv pages. Please confirm every line before publishing the repository.
 */
export const profile = {
  name: "Yuanning Zhang",
  role: "Ph.D. student in mathematics",
  email: "yuanningzhang2026@u.northwestern.edu",
  institution: {
    name: "Northwestern University",
    url: "https://www.math.northwestern.edu/",
  },
  advisor: {
    name: "Ben Antieau",
    url: "https://antieau.github.io/",
  },
  portrait: {
    src: "/profile-photo.jpg",
    width: 1050,
    height: 1470,
    alt: "Yuanning Zhang browsing a shop display while holding a coffee",
  },

  introduction:
    "My interests lie in p-adic geometry, especially the stacky approach to F-gauges and de Rham-Witt cohomology.",

  navigation: [
    { label: "research", href: "/research/" },
    { label: "reading", href: "/de-rham-witt/" },
    { label: "gallery", href: "/visualizations/" },
  ],

  research: {
    paragraphs: [
      "My current interests center on the relationship between the classical work of Ekedahl, Illusie–Raynaud, and Nygaard and modern developments in p-adic geometry. I am particularly interested in how de Rham-Witt cohomology, the slope spectral sequence, dominoes, and F-gauges can be understood through the stacky approach to prismatic cohomology.",
      "I am also interested in topics in positive-characteristic algebraic geometry, such as Ekedahl–Oort stratifications, p-primary Brauer groups, and K3 surfaces.",
      "Before graduate school, I worked on algebraic combinatorics, especially Schubert calculus and k-Schur functions.",
    ],
    galleryIntroduction:
      "I also enjoy creating mathematical visualizations through vibe coding with the help of Codex and Claude Code; some of these projects can be found in the",
  },

  writing: [
    {
      year: "2026",
      authors: "Y. Zhang",
      title: "Higher dimensional dominoes in de Rham-Witt cohomology",
      links: [
        {
          label: "arXiv:2607",
          href: "https://arxiv.org/abs/2607.26323",
        },
      ],
    },
    {
      year: "2020",
      authors:
        "The 2020 Polymath Jr. REU “q-binomials and the Grassmannian group”",
      title:
        "Filtering cohomology of ordinary and Lagrangian Grassmannians",
      links: [
        {
          label: "arXiv:2011",
          href: "https://arxiv.org/abs/2011.03179",
        },
      ],
    },
  ],

  seminars: [
    {
      date: "Winter–Spring 2024",
      dateTime: "2024",
      title: "Prismatic F-gauges learning seminar",
      description:
        "A learning seminar on prismatic F-gauges that I organized during Winter and Spring 2024.",
      href: "https://yuanningzhang.notion.site/Prismatic-F-gauges-learning-seminar-Winter-Spring-2024-face29e4eaa4477e997876fff3690e6e",
    },
  ],

  talks: [
    {
      date: "April 2026",
      dateTime: "2026-04",
      title: "From F-crystals to Hodge–Witt cohomology",
      venue: "IU–Purdue Joint Workshop on Prismatic F-gauges",
      href: "https://www.math.purdue.edu/~mondalsh/workshop-f-gauges.html",
    },
    {
      date: "March 30, 2026",
      dateTime: "2026-03-30",
      title: "Nygaard filtered prismatization in mixed characteristics",
      venue: "IU–Purdue Arithmetic Geometry Learning Seminar",
      href: "https://sites.google.com/view/purdue-iu-seminar-2026/home",
    },
  ],

  visits: [
    {
      dates: "17 August to 18 December 2026",
      program: "Fall 2026 program on motivic homotopy theory",
      href: "https://www.slmath.org/programs/384",
    },
  ],

  education: [
    {
      years: "2021–present",
      school: "Northwestern University",
      degree: "Ph.D. student in Mathematics",
    },
    {
      years: "2017–2021",
      school: "University of California, Berkeley",
      degree: "B.A. in Mathematics and Computer Science",
    },
  ],
} as const;
