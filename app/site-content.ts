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
    src: "/profile-photo-outdoors.jpg",
    width: 1093,
    height: 1738,
    alt: "Yuanning Zhang outdoors with a camera strap",
  },

  introduction:
    "My interests lie in p-adic geometry, especially the stacky approach to F-gauges and de Rham-Witt cohomology.",

  navigation: [
    { label: "about", href: "/", match: [] },
    { label: "research", href: "/research/", match: ["/writing/", "/seminars-talks/"] },
    { label: "reading", href: "/de-rham-witt/", match: [] },
    { label: "seminar", href: "/seminar/", match: ["/q-de-rham-workshop/"] },
    { label: "gallery", href: "/visualizations/", match: [] },
  ],

  research: {
    paragraphs: [
      "My current interests center on the relationship between the classical work of Ekedahl, Illusie–Raynaud, and Nygaard and modern developments in p-adic geometry. I am particularly interested in how de Rham-Witt cohomology, the slope spectral sequence, dominoes, and F-gauges can be understood through the stacky approach to prismatic cohomology.",
      "I am also interested in topics in positive-characteristic algebraic geometry, such as Ekedahl–Oort stratifications, p-primary Brauer groups, and K3 surfaces.",
      "Recently, I have also become interested in q-de Rham cohomology, Habiro cohomology, and even filtrations, especially their connections with arithmetic geometry and homotopy theory.",
      "Before graduate school, I worked on algebraic combinatorics, especially Schubert calculus, k-Schur functions, and q-analogues.",
    ],
    galleryIntroduction:
      "I also enjoy creating mathematical visualizations through vibe coding with the help of Codex and Claude Code; some of these projects can be found in the",
  },

  writing: [
    {
      year: "2026",
      authors: "Y. Zhang",
      title: "The stacky approach to de Rham-Witt cohomology",
      links: [
        {
          label: "arXiv:2610",
          href: "https://arxiv.org/abs/2610.28149",
        },
      ],
    },
    {
      year: "2026",
      authors: "Y. Zhang",
      title: "Harder-Narasimhan filtration of torsion F-gauges",
      links: [
        {
          label: "arXiv:2609",
          href: "https://arxiv.org/abs/2609.27089",
        },
      ],
    },
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
      date: "Fall 2026",
      dateTime: "2026",
      sortDate: "2026-09-01",
      title: "SLMath graduate student seminar",
      description:
        "A graduate student seminar and mini workshops that I co-organize with Erika Beserra at SLMath in Fall 2026.",
      href: "/seminar/slmath/",
    },
    {
      date: "September 23–25, 2026",
      dateTime: "2026-09-23",
      title: "q-de Rham cohomology and Habiro rings",
      description:
        "A mini workshop on q-de Rham cohomology and Habiro rings that I organized at SLMath in September 2026, bringing together arithmetic geometry and quantum topology.",
      href: "/q-de-rham-workshop/",
    },
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
      date: "November 23, 2026",
      dateTime: "2026-11-23",
      title: "The stacky approach to de Rham–Witt cohomology",
      venue: "SLMath Motivic Homotopy Theory research seminar",
      href: "",
    },
    {
      date: "November 9, 2026",
      dateTime: "2026-11-09",
      title: "Harder–Narasimhan filtrations of torsion F-gauges",
      venue: "SLMath graduate student seminar",
      href: "/seminar/slmath/#seminar-2026-11-09",
    },
    {
      date: "October 29, 2026",
      dateTime: "2026-10-29",
      title: "The stacky approach to de Rham-Witt cohomology",
      venue: "Simons Collaboration on Perfection Work-in-Progress Seminar",
      href: "",
    },
    {
      date: "October 9, 2026",
      dateTime: "2026-10-09",
      title: "Harder-Narasimhan filtration of torsion F-gauges",
      venue: "Student arithmetic geometry seminar, Berkeley",
      href: "",
    },
    {
      date: "September 23, 2026",
      dateTime: "2026-09-23",
      title: "q-de Rham cohomology and Habiro rings",
      venue: "SLMath mini workshop",
      href: "/q-de-rham-workshop/",
      notesHref: "/notes/q-de-rham-habiro-talk-1.pdf",
    },
    {
      date: "April 25, 2026",
      dateTime: "2026-04-25",
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

  researchVisits: [
    {
      date: "October 19–23, 2026",
      dateTime: "2026-10-19",
      place: "ICERM, Brown University",
      role: "Research cluster participant",
      title: "K3 Surfaces over Finite Fields",
      href: "https://icerm.brown.edu/program/semester_research_cluster/sp-f26-rc1",
    },
    {
      date: "August 17–December 18, 2026",
      dateTime: "2026-08-17",
      place: "SLMath",
      role: "Stephen Della Pietra Program Associate Fellow",
      title: "Motivic Homotopy Theory: Connections and Applications",
      href: "https://www.slmath.org/programs/384",
    },
    {
      date: "March 19–21, 2025",
      dateTime: "2025-03-19",
      place: "University of California, Berkeley",
      role: "NSF FRG meeting",
      title: "Higher Categorical Structures in Algebraic Geometry",
      href: "https://antieau.github.io/grants/202209-frg.html",
    },
  ],

  conferences: [
    {
      date: "March 2024, 2025, 2026, 2027",
      dateTime: "2027-03",
      title: "Simons Collaboration on Perfection in Algebra, Geometry, and Topology, Annual Meetings",
      venue: "Simons Foundation, New York City",
      href: "",
    },
    {
      date: "July 2025",
      dateTime: "2025-07",
      title: "Bootcamp for the 2025 Summer Research Institute in Algebraic Geometry",
      venue: "Colorado State University",
      note: "Working-group mentor: Alexander Petrov.",
      href: "",
    },
    {
      date: "March 2025",
      dateTime: "2025-03",
      title: "Arizona Winter School on Representation Theory of p-adic Groups",
      venue: "University of Arizona",
      href: "https://swc-math.github.io/aws/2025/index.html",
    },
    {
      date: "December 2024",
      dateTime: "2024-12",
      title: "Hot Topics: Life after the Telescope Conjecture",
      venue: "SLMath",
      href: "",
    },
    {
      date: "November 2023 and March 2024",
      dateTime: "2023-11",
      title: "Special Year on p-adic Arithmetic Geometry, Workshops",
      venue: "IAS",
      href: "https://www.ias.edu/math/events/sp-p-adic-arithmetic-geometry",
    },
    {
      date: "March 2024",
      dateTime: "2024-03",
      title: "Arizona Winter School on Abelian Varieties",
      venue: "University of Arizona",
      href: "",
    },
    {
      date: "July 2023",
      dateTime: "2023-07",
      title: "IHES Summer School: Recent Advances in Algebraic K-theory",
      venue: "IHES",
      href: "https://indico.math.cnrs.fr/event/8837/",
    },
    {
      date: "June–July 2023",
      dateTime: "2023-06",
      title: "MSRI Summer Graduate School: Introduction to Derived Algebraic Geometry",
      venue: "UC Berkeley",
      href: "",
    },
    {
      date: "January–February 2023",
      dateTime: "2023-01",
      title: "Topological Hochschild Homology and Zeta Values, Masterclass",
      venue: "University of Copenhagen",
      href: "https://www.math.ku.dk/english/calendar/events/zeta-values/",
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
