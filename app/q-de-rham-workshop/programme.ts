export const programme = [
  {
    title: "Overview",
    speaker: "Yuanning Zhang",
    speakerUrl: "/",
    notesHref: "/notes/q-de-rham-habiro-talk-1.pdf",
    description: "This talk introduces the two starting points of the workshop: deforming de Rham cohomology and assembling quantum invariants at roots of unity. Simple examples of the q-derivative and of evaluation in the Habiro ring illustrate the roles of q = 1 and roots of unity. We then outline how the arithmetic and topological perspectives meet in the study of Habiro cohomology.",
    references: [
      { author: "Scholze", title: "Canonical q-deformations in arithmetic geometry", url: "https://arxiv.org/abs/1606.01796" },
      { author: "Wagner", title: "q-Hodge complexes over the Habiro ring", url: "https://arxiv.org/abs/2510.04782" },
    ],
  },
  {
    title: "q-de Rham cohomology and prismatic cohomology",
    speaker: "Kai Shaikh",
    speakerUrl: "https://kaishaikh.github.io/",
    description: "Beginning with the q-de Rham complex of a polynomial algebra, we explain Scholze’s proposed canonical q-deformation and why independence of coordinates is a substantive problem. Specialization at q = 1 and at p-th roots of unity provides a first view of its cohomological meaning. We introduce the prismatic perspective and explain how it resolves coordinate independence in the p-complete setting, distinguishing this from the global theory.",
    references: [
      { author: "Scholze", title: "Canonical q-deformations in arithmetic geometry", url: "https://arxiv.org/abs/1606.01796" },
      { author: "Bhatt–Scholze", title: "Prisms and prismatic cohomology", url: "https://arxiv.org/abs/1905.08229" },
    ],
  },
  {
    title: "From WRT invariants to the Habiro ring",
    speaker: "Tudor-Ioan Caba",
    description: "Starting from knots and their colored Jones polynomials, we explain how surgery on framed links leads to Witten–Reshetikhin–Turaev invariants of 3-manifolds. For integral homology 3-spheres, Habiro assembles the invariants at roots of unity into a single element of the Habiro ring. We introduce this cyclotomic completion and its basic properties, explaining how evaluation at roots of unity and Taylor expansion connect quantum invariants with arithmetic.",
    references: [
      { author: "Habiro", title: "Cyclotomic completions of polynomial rings", url: "https://arxiv.org/abs/math/0209324" },
      { author: "Habiro", title: "A unified Witten–Reshetikhin–Turaev invariant for integral homology spheres", url: "https://arxiv.org/abs/math/0605314" },
    ],
  },
  {
    title: "Concrete computations and Habiro rings of number fields",
    speaker: "canceled",
    description: "We explore the questions of Garoufalidis–Zagier and Garoufalidis–Scholze–Wheeler–Zagier through concrete q-series and expansions arising from quantum knot invariants and perturbative Chern–Simons theory. An example will illustrate how number fields enter the picture and why a naive extension of coefficients in the classical Habiro ring is insufficient. This leads to an introduction to Habiro rings of number fields and their gluing conditions, providing an arithmetic example to revisit in the final talk.",
    references: [
      { author: "Garoufalidis–Zagier", title: "Asymptotics of Nahm sums at roots of unity", url: "https://arxiv.org/abs/1812.07690" },
      { author: "Garoufalidis–Scholze–Wheeler–Zagier", title: "The Habiro ring of a number field", url: "https://arxiv.org/abs/2412.04241" },
    ],
  },
  {
    title: "THH and the motivic/even filtrations",
    speaker: "Giacomo Bertizzolo",
    speakerUrl: "https://gbertizzolo.github.io/",
    description: "This talk introduces topological Hochschild homology and explains how filtrations on topological invariants give rise to arithmetic cohomology theories. We discuss the motivic filtration of Bhatt–Morrow–Scholze and the even filtration of Hahn–Raksit–Wilson, emphasizing their purpose and their relationship in the relevant settings. The aim is to prepare the objects and ideas needed for the final talk, rather than to develop the full machinery.",
    references: [
      { author: "Bhatt–Morrow–Scholze", title: "Topological Hochschild homology and integral p-adic Hodge theory", url: "https://arxiv.org/abs/1802.03261" },
      { author: "Hahn–Raksit–Wilson", title: "A motivic filtration on the topological cyclic homology of commutative ring spectra", url: "https://arxiv.org/abs/2206.11208" },
    ],
  },
  {
    title: "Habiro cohomology and its relationship with THH",
    speaker: "Sin Hang Jason Yeung",
    description: "We first introduce Wagner’s construction of algebraic Habiro cohomology: a suitable q-Hodge filtration produces a q-Hodge complex that descends to the Habiro ring. Building on Talk 5, we then explain how THH over connective complex K-theory ku supplies such filtrations under appropriate hypotheses, and how equivariant structures give a homotopy-theoretic description of Habiro descent. The number-field case recovers the Habiro rings from Talk 4 and brings the arithmetic and topological perspectives together.",
    references: [
      { author: "Wagner", title: "q-Hodge complexes over the Habiro ring", url: "https://arxiv.org/abs/2510.04782" },
      { author: "Wagner", title: "q-de Rham cohomology and topological Hochschild homology over ku", url: "https://arxiv.org/abs/2510.06057" },
    ],
  },
];
