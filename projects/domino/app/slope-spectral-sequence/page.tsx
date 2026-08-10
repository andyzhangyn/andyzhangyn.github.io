"use client";

import katex from "katex";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSiteLanguage } from "../components/LanguageProvider";
import SiteMenu from "../components/SiteMenu";

type Language = "en" | "zh";
type Dimension = 1 | 2 | 3 | 4;
type GeometryExample = "abelian" | "k3" | "enriques";
type EnriquesType = "classical" | "singular" | "supersingular";
type SpectralView = "domino" | "slopes" | "combined";
type SlopePart = "zero" | "positive";
type SpectralParts = {
  domino: boolean;
  positiveSlope: boolean;
  slopeZero: boolean;
};
type EnriquesParts = {
  nilpotentTorsion: boolean;
  semisimpleTorsion: boolean;
  slopeZero: boolean;
};
type EnriquesTerm = {
  i: number;
  j: number;
  nilpotentTorsion: number;
  semisimpleTorsion: number;
  slopeZero: number;
};
type Fraction = {
  denominator: number;
  numerator: number;
};
type NewtonBlock = {
  dimension: number;
  id: string;
  slopes: readonly Fraction[];
};
type NewtonPolygonSpec = {
  height?: number | "infinity";
  id: string;
  isOrdinary: boolean;
  isSupersingular: boolean;
  pRank: number;
  slopes: readonly Fraction[];
};
type DominoNumber = {
  i: number;
  j: number;
  value: number;
};
type SpectralDifferential = {
  order: number;
  sourceI: number;
  sourceJ: number;
  targetI: number;
  targetJ: number;
};
type SpecializationEdge = {
  from: string;
  to: string;
};

const dimensions: Dimension[] = [1, 2, 3, 4];
const artinInvariants = Array.from({ length: 10 }, (_, index) => 10 - index);
const artinInvariantPositions = artinInvariants.map(
  (_, index) => 82 + 356 * index / (artinInvariants.length - 1),
);

const enriquesTerms: Record<EnriquesType, readonly EnriquesTerm[]> = {
  classical: [
    { i: 0, j: 0, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 1 },
    { i: 1, j: 1, nilpotentTorsion: 0, semisimpleTorsion: 1, slopeZero: 10 },
    { i: 1, j: 2, nilpotentTorsion: 0, semisimpleTorsion: 1, slopeZero: 0 },
    { i: 2, j: 2, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 1 },
  ],
  singular: [
    { i: 0, j: 0, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 1 },
    { i: 0, j: 2, nilpotentTorsion: 0, semisimpleTorsion: 1, slopeZero: 0 },
    { i: 1, j: 1, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 10 },
    { i: 2, j: 1, nilpotentTorsion: 0, semisimpleTorsion: 1, slopeZero: 0 },
    { i: 2, j: 2, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 1 },
  ],
  supersingular: [
    { i: 0, j: 0, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 1 },
    { i: 0, j: 2, nilpotentTorsion: 1, semisimpleTorsion: 0, slopeZero: 0 },
    { i: 1, j: 1, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 10 },
    { i: 1, j: 2, nilpotentTorsion: 1, semisimpleTorsion: 0, slopeZero: 0 },
    { i: 2, j: 2, nilpotentTorsion: 0, semisimpleTorsion: 0, slopeZero: 1 },
  ],
};

function gcd(a: number, b: number) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    [x, y] = [y, x % y];
  }

  return x || 1;
}

function fraction(numerator: number, denominator = 1): Fraction {
  const divisor = gcd(numerator, denominator);
  const sign = denominator < 0 ? -1 : 1;

  return {
    numerator: sign * numerator / divisor,
    denominator: sign * denominator / divisor,
  };
}

function addFractions(left: Fraction, right: Fraction) {
  return fraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function compareFractions(left: Fraction, right: Fraction) {
  return left.numerator * right.denominator - right.numerator * left.denominator;
}

function fractionValue(value: Fraction) {
  return value.numerator / value.denominator;
}

function sameFraction(value: Fraction, numerator: number, denominator = 1) {
  return compareFractions(value, fraction(numerator, denominator)) === 0;
}

function repeatedSlope(value: Fraction, multiplicity: number) {
  return Array.from({ length: multiplicity }, () => value);
}

const newtonBlocks: readonly NewtonBlock[] = [
  {
    dimension: 1,
    id: "ordinary",
    slopes: [fraction(0), fraction(1)],
  },
  {
    dimension: 1,
    id: "half",
    slopes: [fraction(1, 2), fraction(1, 2)],
  },
  {
    dimension: 3,
    id: "thirds",
    slopes: [
      ...repeatedSlope(fraction(1, 3), 3),
      ...repeatedSlope(fraction(2, 3), 3),
    ],
  },
  {
    dimension: 4,
    id: "quarters",
    slopes: [
      ...repeatedSlope(fraction(1, 4), 4),
      ...repeatedSlope(fraction(3, 4), 4),
    ],
  },
];

function compareSlopeLists(left: readonly Fraction[], right: readonly Fraction[]) {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const comparison = compareFractions(left[index], right[index]);
    if (comparison !== 0) return comparison;
  }

  return left.length - right.length;
}

function enumerateNewtonPolygons(dimension: Dimension) {
  const polygons: NewtonPolygonSpec[] = [];
  const counts = Array.from({ length: newtonBlocks.length }, () => 0);

  const visit = (blockIndex: number, remainingDimension: number) => {
    if (blockIndex === newtonBlocks.length) {
      if (remainingDimension !== 0) return;

      const slopes = newtonBlocks
        .flatMap((block, index) =>
          Array.from({ length: counts[index] }, () => block.slopes).flat(),
        )
        .sort(compareFractions);
      const pRank = slopes.filter((slope) => sameFraction(slope, 0)).length;
      const isOrdinary = pRank === dimension;
      const isSupersingular = slopes.every((slope) => sameFraction(slope, 1, 2));

      polygons.push({
        id: counts
          .map((count, index) => count > 0 ? `${newtonBlocks[index].id}-${count}` : null)
          .filter(Boolean)
          .join("_"),
        isOrdinary,
        isSupersingular,
        pRank,
        slopes,
      });
      return;
    }

    const block = newtonBlocks[blockIndex];
    const maximum = Math.floor(remainingDimension / block.dimension);

    for (let count = 0; count <= maximum; count += 1) {
      counts[blockIndex] = count;
      visit(blockIndex + 1, remainingDimension - count * block.dimension);
    }
    counts[blockIndex] = 0;
  };

  visit(0, dimension);
  return polygons.sort((left, right) => compareSlopeLists(left.slopes, right.slopes));
}

const polygonsByDimension = Object.fromEntries(
  dimensions.map((dimension) => [dimension, enumerateNewtonPolygons(dimension)]),
) as Record<Dimension, NewtonPolygonSpec[]>;

const k3NewtonPolygons: readonly NewtonPolygonSpec[] = [
  ...Array.from({ length: 10 }, (_, index) => {
    const height = index + 1;

    return {
      height,
      id: `k3-height-${height}`,
      isOrdinary: height === 1,
      isSupersingular: false,
      pRank: height === 1 ? 1 : 0,
      slopes: [
        ...repeatedSlope(fraction(height - 1, height), height),
        ...repeatedSlope(fraction(1), 22 - 2 * height),
        ...repeatedSlope(fraction(height + 1, height), height),
      ],
    } satisfies NewtonPolygonSpec;
  }),
  {
    height: "infinity",
    id: "k3-height-infinity",
    isOrdinary: false,
    isSupersingular: true,
    pRank: 0,
    slopes: repeatedSlope(fraction(1), 22),
  },
];

function binomial(n: number, r: number) {
  if (r < 0 || r > n) return 0;
  let result = 1;

  for (let index = 1; index <= Math.min(r, n - r); index += 1) {
    result = result * (n - index + 1) / index;
  }

  return result;
}

function exteriorPowerSlopes(slopes: readonly Fraction[], degree: number) {
  const sums: Fraction[][] = Array.from({ length: degree + 1 }, () => []);
  sums[0] = [fraction(0)];
  let processed = 0;

  for (const slope of slopes) {
    processed += 1;
    for (let rank = Math.min(degree, processed); rank >= 1; rank -= 1) {
      sums[rank].push(
        ...sums[rank - 1].map((partialSum) => addFractions(partialSum, slope)),
      );
    }
  }

  return sums[degree];
}

function slopeWeight(slope: Fraction, i: number) {
  const numerator = slope.numerator;
  const denominator = slope.denominator;

  if (numerator >= (i - 1) * denominator && numerator < i * denominator) {
    return fraction(numerator - (i - 1) * denominator, denominator);
  }
  if (numerator >= i * denominator && numerator < (i + 1) * denominator) {
    return fraction((i + 1) * denominator - numerator, denominator);
  }

  return fraction(0);
}

function slopeNumber(slopes: readonly Fraction[], i: number) {
  const total = slopes.reduce(
    (sum, slope) => addFractions(sum, slopeWeight(slope, i)),
    fraction(0),
  );
  const value = fractionValue(total);
  const rounded = Math.round(value);

  if (Math.abs(value - rounded) > 1e-9) {
    throw new Error(`Expected an integral slope number, received ${value}.`);
  }

  return rounded;
}

function dominoNumbers(
  dimension: Dimension,
  hOneSlopes: readonly Fraction[],
) {
  const values = new Map<string, number>();
  const exteriorSlopes = new Map<number, readonly Fraction[]>();
  const getValue = (i: number, j: number) => values.get(`${i},${j}`) ?? 0;

  for (let i = 0; i <= dimension - 2; i += 1) {
    for (let j = 2; j <= dimension; j += 1) {
      const totalDegree = i + j;
      const crystallineSlopes = exteriorSlopes.get(totalDegree)
        ?? exteriorPowerSlopes(hOneSlopes, totalDegree);
      exteriorSlopes.set(totalDegree, crystallineSlopes);

      const hodgeNumber = binomial(dimension, i) * binomial(dimension, j);
      const value = hodgeNumber
        - slopeNumber(crystallineSlopes, i)
        + 2 * getValue(i - 1, j + 1)
        - getValue(i - 2, j + 2);

      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Invalid domino number T^${i},${j}=${value}.`);
      }
      values.set(`${i},${j}`, value);
    }
  }

  return values;
}

function possibleDifferentials(
  dimension: Dimension,
  values: Map<string, number>,
) {
  const differentials: SpectralDifferential[] = [];

  for (let order = 1; order <= dimension; order += 1) {
    for (let sourceI = 0; sourceI + order <= dimension; sourceI += 1) {
      for (let sourceJ = 0; sourceJ <= dimension; sourceJ += 1) {
        const targetI = sourceI + order;
        const targetJ = sourceJ - order + 1;
        const targetDominoI = targetI - 1;

        if (targetJ < 0) continue;
        if ((values.get(`${sourceI},${sourceJ}`) ?? 0) === 0) continue;
        if ((values.get(`${targetDominoI},${targetJ}`) ?? 0) === 0) continue;

        differentials.push({
          order,
          sourceI,
          sourceJ,
          targetI,
          targetJ,
        });
      }
    }
  }

  return differentials;
}

function slopeSpectralTerms(
  dimension: Dimension,
  hOneSlopes: readonly Fraction[],
) {
  const terms = new Map<string, readonly Fraction[]>();
  const slopesByDegree = new Map<number, readonly Fraction[]>();

  for (let totalDegree = 0; totalDegree <= 2 * dimension; totalDegree += 1) {
    slopesByDegree.set(
      totalDegree,
      exteriorPowerSlopes(hOneSlopes, totalDegree).sort(compareFractions),
    );
  }

  for (let i = 0; i <= dimension; i += 1) {
    for (let j = 0; j <= dimension; j += 1) {
      const crystallineSlopes = slopesByDegree.get(i + j) ?? [];
      terms.set(
        `${i},${j}`,
        crystallineSlopes.filter((slope) =>
          compareFractions(slope, fraction(i)) >= 0
          && compareFractions(slope, fraction(i + 1)) < 0,
        ),
      );
    }
  }

  return terms;
}

function k3DominoNumbers(polygon: NewtonPolygonSpec) {
  return new Map<string, number>([
    ["0,2", polygon.isSupersingular ? 1 : 0],
  ]);
}

function k3SlopeSpectralTerms(polygon: NewtonPolygonSpec) {
  const dimension = 2;
  const terms = new Map<string, readonly Fraction[]>();
  const slopesByDegree = new Map<number, readonly Fraction[]>([
    [0, [fraction(0)]],
    [1, []],
    [2, polygon.slopes],
    [3, []],
    [4, [fraction(2)]],
  ]);

  for (let i = 0; i <= dimension; i += 1) {
    for (let j = 0; j <= dimension; j += 1) {
      const crystallineSlopes = slopesByDegree.get(i + j) ?? [];
      terms.set(
        `${i},${j}`,
        crystallineSlopes.filter((slope) =>
          compareFractions(slope, fraction(i)) >= 0
          && compareFractions(slope, fraction(i + 1)) < 0,
        ),
      );
    }
  }

  return terms;
}

function validateNewtonData() {
  const expectedCounts: Record<Dimension, number> = {
    1: 2,
    2: 3,
    3: 5,
    4: 8,
  };
  const expectedSpecializationCovers: Record<Dimension, number> = {
    1: 1,
    2: 2,
    3: 4,
    4: 8,
  };
  const expectedStratumDimensions: Record<Dimension, readonly number[]> = {
    1: [1, 0],
    2: [3, 2, 1],
    3: [6, 5, 4, 3, 2],
    4: [10, 9, 8, 7, 6, 6, 5, 4],
  };

  for (const dimension of dimensions) {
    const polygons = polygonsByDimension[dimension];
    if (polygons.length !== expectedCounts[dimension]) {
      throw new Error(`Unexpected Newton polygon count in dimension ${dimension}.`);
    }
    const covers = specializationCovers(polygons);
    if (covers.length !== expectedSpecializationCovers[dimension]) {
      throw new Error(`Unexpected specialization order in dimension ${dimension}.`);
    }
    const stratumDimensions = newtonStratumDimensions(dimension, polygons);
    const displayedStratumDimensions = polygons.map(
      ({ id }) => stratumDimensions.get(id),
    );
    if (
      displayedStratumDimensions.some(
        (value, index) => value !== expectedStratumDimensions[dimension][index],
      )
    ) {
      throw new Error(`Unexpected Newton stratum dimensions in dimension ${dimension}.`);
    }

    for (const polygon of polygons) {
      const values = dominoNumbers(dimension, polygon.slopes);
      const spectralTerms = slopeSpectralTerms(dimension, polygon.slopes);

      for (let i = 0; i <= dimension - 2; i += 1) {
        for (let j = 2; j <= dimension; j += 1) {
          const value = values.get(`${i},${j}`) ?? 0;
          const dual = values.get(`${dimension - i - 2},${dimension - j + 2}`) ?? 0;
          if (value !== dual) {
            throw new Error(`Domino duality failed in dimension ${dimension}.`);
          }
        }
      }

      for (let totalDegree = 0; totalDegree <= 2 * dimension; totalDegree += 1) {
        const expectedSlopes = exteriorPowerSlopes(
          polygon.slopes,
          totalDegree,
        ).sort(compareFractions);
        const displayedSlopes = Array.from(
          { length: dimension + 1 },
          (_, i) => {
            const j = totalDegree - i;
            return j >= 0 && j <= dimension
              ? spectralTerms.get(`${i},${j}`) ?? []
              : [];
          },
        ).flat().sort(compareFractions);

        if (
          displayedSlopes.length !== expectedSlopes.length
          || displayedSlopes.some(
            (slope, index) => compareFractions(slope, expectedSlopes[index]) !== 0,
          )
        ) {
          throw new Error(
            `Slope spectral terms failed in dimension ${dimension}, degree ${totalDegree}.`,
          );
        }
      }

      if (polygon.isSupersingular) {
        const tZeroTwo = values.get("0,2") ?? 0;
        if (tZeroTwo !== binomial(dimension, 2)) {
          throw new Error(`Supersingular T^0,2 failed in dimension ${dimension}.`);
        }
      }
      if (polygon.isOrdinary && [...values.values()].some((value) => value !== 0)) {
        throw new Error(`Ordinary domino numbers failed in dimension ${dimension}.`);
      }
    }
  }
}

function validateK3Data() {
  if (k3NewtonPolygons.length !== 11) {
    throw new Error("Expected the ten finite K3 heights and the supersingular case.");
  }

  const covers = specializationCovers(k3NewtonPolygons);
  if (covers.length !== 10) {
    throw new Error("Unexpected K3 height specialization order.");
  }

  for (const polygon of k3NewtonPolygons) {
    const totalSlope = polygon.slopes.reduce(
      (sum, slope) => addFractions(sum, slope),
      fraction(0),
    );
    if (polygon.slopes.length !== 22 || !sameFraction(totalSlope, 22)) {
      throw new Error(`Invalid K3 Newton polygon ${polygon.id}.`);
    }

    const values = k3DominoNumbers(polygon);
    const expectedDomino = polygon.isSupersingular ? 1 : 0;
    if ((values.get("0,2") ?? 0) !== expectedDomino) {
      throw new Error(`Invalid K3 domino number for ${polygon.id}.`);
    }

    const terms = k3SlopeSpectralTerms(polygon);
    const displayedMiddleSlopes = Array.from({ length: 3 }, (_, i) =>
      terms.get(`${i},${2 - i}`) ?? [],
    ).flat().sort(compareFractions);
    if (
      displayedMiddleSlopes.length !== polygon.slopes.length
      || displayedMiddleSlopes.some(
        (slope, index) => compareFractions(slope, polygon.slopes[index]) !== 0,
      )
    ) {
      throw new Error(`K3 slope terms failed for ${polygon.id}.`);
    }
  }
}

function Latex({
  formula,
  className,
  displayMode = false,
}: {
  formula: string;
  className?: string;
  displayMode?: boolean;
}) {
  const markup = katex.renderToString(formula, {
    displayMode,
    output: "htmlAndMathml",
    strict: "ignore",
    throwOnError: false,
  });

  return (
    <span
      className={(className ? className + " " : "") + "latex"}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function fractionLatex(value: Fraction) {
  if (value.denominator === 1) return `${value.numerator}`;
  return `\\frac{${value.numerator}}{${value.denominator}}`;
}

function slopeMultisetTerms(slopes: readonly Fraction[]) {
  const groups: Array<{ count: number; slope: Fraction }> = [];

  for (const slope of slopes) {
    const previous = groups.at(-1);
    if (previous && compareFractions(previous.slope, slope) === 0) {
      previous.count += 1;
    } else {
      groups.push({ count: 1, slope });
    }
  }

  return groups.map(({ count, slope }) => {
    const term = slope.denominator === 1
      ? fractionLatex(slope)
      : `\\left(${fractionLatex(slope)}\\right)`;
    return count === 1 ? term : `${term}^{\\times ${count}}`;
  });
}

function slopeMultisetFormula(slopes: readonly Fraction[]) {
  return slopeMultisetTerms(slopes).join(",\\;");
}

function normalizedDieudonneSlopes(
  slopes: readonly Fraction[],
  column: number,
) {
  return slopes.map((slope) => addFractions(slope, fraction(-column)));
}

function polygonCumulativeHeights(polygon: NewtonPolygonSpec) {
  const heights = [fraction(0)];

  polygon.slopes.forEach((slope) => {
    heights.push(addFractions(heights.at(-1) ?? fraction(0), slope));
  });

  return heights;
}

function specializesTo(
  genericPolygon: NewtonPolygonSpec,
  specialPolygon: NewtonPolygonSpec,
) {
  const genericHeights = polygonCumulativeHeights(genericPolygon);
  const specialHeights = polygonCumulativeHeights(specialPolygon);
  let isStrict = false;

  for (let index = 0; index < genericHeights.length; index += 1) {
    const comparison = compareFractions(
      genericHeights[index],
      specialHeights[index],
    );
    if (comparison > 0) return false;
    if (comparison < 0) isStrict = true;
  }

  return isStrict;
}

function specializationCovers(polygons: readonly NewtonPolygonSpec[]) {
  const edges: SpecializationEdge[] = [];

  polygons.forEach((genericPolygon) => {
    polygons.forEach((specialPolygon) => {
      if (!specializesTo(genericPolygon, specialPolygon)) return;

      const hasIntermediatePolygon = polygons.some((intermediatePolygon) =>
        intermediatePolygon.id !== genericPolygon.id
        && intermediatePolygon.id !== specialPolygon.id
        && specializesTo(genericPolygon, intermediatePolygon)
        && specializesTo(intermediatePolygon, specialPolygon),
      );

      if (!hasIntermediatePolygon) {
        edges.push({
          from: genericPolygon.id,
          to: specialPolygon.id,
        });
      }
    });
  });

  return edges;
}

function newtonStratumDimensions(
  dimension: Dimension,
  polygons: readonly NewtonPolygonSpec[],
) {
  const ambientDimension = dimension * (dimension + 1) / 2;
  const edges = specializationCovers(polygons);
  const codimensions = new Map<string, number>();

  const getCodimension = (polygonId: string): number => {
    const savedCodimension = codimensions.get(polygonId);
    if (savedCodimension !== undefined) return savedCodimension;

    const incomingEdges = edges.filter(({ to }) => to === polygonId);
    if (incomingEdges.length === 0) {
      const polygon = polygons.find(({ id }) => id === polygonId);
      if (!polygon?.isOrdinary) {
        throw new Error(`Newton specialization order has a nonordinary generic point.`);
      }
      codimensions.set(polygonId, 0);
      return 0;
    }

    const pathCodimensions = incomingEdges.map(
      ({ from }) => getCodimension(from) + 1,
    );
    if (pathCodimensions.some((value) => value !== pathCodimensions[0])) {
      throw new Error(`Newton specialization order is not graded.`);
    }

    codimensions.set(polygonId, pathCodimensions[0]);
    return pathCodimensions[0];
  };

  return new Map(
    polygons.map(({ id }) => [id, ambientDimension - getCodimension(id)]),
  );
}

const stratumDimensionsByDimension = Object.fromEntries(
  dimensions.map((dimension) => [
    dimension,
    newtonStratumDimensions(dimension, polygonsByDimension[dimension]),
  ]),
) as Record<Dimension, Map<string, number>>;

validateNewtonData();
validateK3Data();

function NewtonPolygonFamilyChart({
  chartId,
  dimension,
  displaySelectedOnly = false,
  familyLabel,
  getNodeLabel,
  language,
  onSelect,
  polygons,
  selectedPolygonId,
  showBreakpoints = false,
}: {
  chartId: string;
  dimension: Dimension;
  displaySelectedOnly?: boolean;
  familyLabel: string;
  getNodeLabel?: (polygon: NewtonPolygonSpec, index: number) => string;
  language: Language;
  onSelect: (id: string) => void;
  polygons: readonly NewtonPolygonSpec[];
  selectedPolygonId: string;
  showBreakpoints?: boolean;
}) {
  const [pinnedEndpointId, setPinnedEndpointId] = useState<string | null>(() => {
    const selectedPolygon = polygons.find(
      (polygon) => polygon.id === selectedPolygonId,
    );

    return selectedPolygon
      && (selectedPolygon.isOrdinary || selectedPolygon.isSupersingular)
      ? selectedPolygon.id
      : null;
  });

  useEffect(() => {
    const clearPinnedEndpoint = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element)
        || target.closest("[data-newton-endpoint]") === null) {
        setPinnedEndpointId(null);
      }
    };

    document.addEventListener("pointerdown", clearPinnedEndpoint);
    return () => document.removeEventListener("pointerdown", clearPinnedEndpoint);
  }, []);

  const chart = {
    bottom: 254,
    left: 48,
    right: 492,
    top: 18,
  };
  const xMaximum = polygons[0]?.slopes.length ?? 2 * dimension;
  const totalHeight = polygons[0]?.slopes.reduce(
    (sum, slope) => sum + fractionValue(slope),
    0,
  ) ?? dimension;
  const yMaximum = Math.round(totalHeight);
  const axisTicks = (maximum: number) => maximum <= 8
    ? Array.from({ length: maximum + 1 }, (_, value) => value)
    : Array.from(
      new Set([0, ...Array.from({ length: Math.floor(maximum / 5) }, (_, index) =>
        (index + 1) * 5,
      ), maximum]),
    );
  const xTicks = axisTicks(xMaximum);
  const yTicks = axisTicks(yMaximum);
  const xPosition = (value: number) =>
    chart.left + (chart.right - chart.left) * value / xMaximum;
  const yPosition = (value: number) =>
    chart.bottom - (chart.bottom - chart.top) * value / yMaximum;
  const series = polygons.map((polygon, index) => {
    let cumulativeHeight = 0;
    const points = [{ x: xPosition(0), y: yPosition(0) }];

    polygon.slopes.forEach((slope, slopeIndex) => {
      cumulativeHeight += fractionValue(slope);
      points.push({
        x: xPosition(slopeIndex + 1),
        y: yPosition(cumulativeHeight),
      });
    });
    const breakpoints = points
      .map((point, pointIndex) => ({
        ...point,
        isEndpoint:
          pointIndex === 0 || pointIndex === polygon.slopes.length,
        pointIndex,
      }))
      .filter(
        ({ isEndpoint, pointIndex }) =>
          isEndpoint
          || compareFractions(
            polygon.slopes[pointIndex - 1],
            polygon.slopes[pointIndex],
          ) !== 0,
      );

    return {
      breakpoints,
      colorIndex: index,
      path: points
        .map(({ x, y }, pointIndex) =>
          `${pointIndex === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`,
        )
        .join(" "),
      polygon,
    };
  });
  const chartSeries = displaySelectedOnly
    ? series.filter(({ polygon }) => polygon.id === selectedPolygonId)
    : series;
  const orderedSeries = [
    ...chartSeries.filter(({ polygon }) => polygon.id !== selectedPolygonId),
    ...chartSeries.filter(({ polygon }) => polygon.id === selectedPolygonId),
  ];
  const specializationEdges = specializationCovers(polygons);
  const specializationDepth = new Map<string, number>();
  const getSpecializationDepth = (polygonId: string): number => {
    const savedDepth = specializationDepth.get(polygonId);
    if (savedDepth !== undefined) return savedDepth;

    const incomingEdges = specializationEdges.filter(({ to }) => to === polygonId);
    const depth = incomingEdges.length === 0
      ? 0
      : 1 + Math.max(
        ...incomingEdges.map(({ from }) => getSpecializationDepth(from)),
      );
    specializationDepth.set(polygonId, depth);
    return depth;
  };
  polygons.forEach(({ id }) => getSpecializationDepth(id));
  const maximumDepth = Math.max(...specializationDepth.values());
  const levelGroups = Array.from(
    { length: maximumDepth + 1 },
    (_, depth) => series.filter(({ polygon }) =>
      specializationDepth.get(polygon.id) === depth,
    ),
  );
  const widestLevel = Math.max(...levelGroups.map((level) => level.length));
  const specializationHeight = widestLevel > 1 ? 142 : 108;
  const specializationPositions = new Map(
    levelGroups.flatMap((level, depth) =>
      level.map(({ polygon }, index) => {
        const x = 82 + 356 * depth / Math.max(maximumDepth, 1);
        const y = level.length === 1
          ? specializationHeight / 2
          : 42 + (specializationHeight - 84) * index / (level.length - 1);
        return [
          polygon.id,
          {
            x,
            y,
          },
        ] as const;
      }),
    ),
  );

  const specializationEdgePath = ({ from, to }: SpecializationEdge) => {
    const source = specializationPositions.get(from);
    const target = specializationPositions.get(to);
    if (!source || !target) return "";

    const deltaX = target.x - source.x;
    const deltaY = target.y - source.y;
    const length = Math.hypot(deltaX, deltaY);
    const unitX = deltaX / length;
    const unitY = deltaY / length;

    return [
      `M${(source.x + unitX * 17).toFixed(2)}`,
      (source.y + unitY * 17).toFixed(2),
      `L${(target.x - unitX * 19).toFixed(2)}`,
      (target.y - unitY * 19).toFixed(2),
    ].join(" ");
  };

  return (
    <div className="newton-family">
      <svg
        className="newton-family-chart"
        viewBox="0 0 520 292"
        role="group"
        aria-label={language === "en"
          ? `Newton polygons for ${familyLabel}`
          : `${familyLabel}的牛顿多边形`}
      >
        {xTicks.map((value) => (
          <g key={`x-${value}`}>
            <line
              className="newton-grid-line"
              x1={xPosition(value)}
              x2={xPosition(value)}
              y1={chart.top}
              y2={chart.bottom}
            />
            <text
              className="newton-axis-tick"
              x={xPosition(value)}
              y={chart.bottom + 18}
              textAnchor="middle"
            >
              {value}
            </text>
          </g>
        ))}
        {yTicks.map((value) => (
          <g key={`y-${value}`}>
            <line
              className="newton-grid-line"
              x1={chart.left}
              x2={chart.right}
              y1={yPosition(value)}
              y2={yPosition(value)}
            />
            <text
              className="newton-axis-tick"
              x={chart.left - 12}
              y={yPosition(value) + 4}
              textAnchor="end"
            >
              {value}
            </text>
          </g>
        ))}
        <path
          className="newton-axis-line"
          d={`M${chart.left} ${chart.top}V${chart.bottom}H${chart.right}`}
        />
        {orderedSeries.map(({ breakpoints, colorIndex, path, polygon }) => {
          const isSelected = polygon.id === selectedPolygonId;
          const slopeList = polygon.slopes
            .map((slope) => `${slope.numerator}/${slope.denominator}`)
            .join(", ");
          const accessibleName = language === "en"
            ? `Newton polygon ${colorIndex + 1}: ${slopeList}`
            : `牛顿多边形 ${colorIndex + 1}：${slopeList}`;

          return (
            <g
              className={`newton-series newton-color-${colorIndex}${isSelected ? " is-selected" : ""}`}
              key={polygon.id}
            >
              <path
                className="newton-family-line"
                d={path}
                aria-hidden="true"
              />
              {showBreakpoints && isSelected
                ? breakpoints.map(
                  ({ x, y, isEndpoint }, breakpointIndex) => (
                      <g
                        className={`newton-breakpoint${isEndpoint ? " is-endpoint" : ""}`}
                        aria-hidden="true"
                        key={`${polygon.id}-breakpoint-${breakpointIndex}`}
                      >
                        <circle
                          className="newton-breakpoint-ring"
                          cx={x}
                          cy={y}
                          r={isEndpoint ? "3.8" : "5.2"}
                        />
                        <circle
                          className="newton-breakpoint-core"
                          cx={x}
                          cy={y}
                          r={isEndpoint ? "1.2" : "1.7"}
                        />
                      </g>
                    ),
                  )
                : null}
              <path
                className="newton-family-hit"
                d={path}
                role="button"
                tabIndex={0}
                aria-label={accessibleName}
                aria-pressed={isSelected}
                onClick={() => onSelect(polygon.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(polygon.id);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>

      <div className="newton-specialization">
        <div
          className="newton-specialization-map"
          style={{ height: specializationHeight }}
          aria-label={language === "en"
            ? `Specialization order of Newton polygons for ${familyLabel}`
          : `${familyLabel}牛顿多边形的特化偏序`}
        >
          <span className="newton-specialization-endpoint is-generic">
            {language === "en" ? "generic" : "一般"}
          </span>
          <span className="newton-specialization-endpoint is-special">
            {language === "en" ? "special" : "特殊"}
          </span>

          <svg
            className="newton-specialization-edges"
            viewBox={`0 0 520 ${specializationHeight}`}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <marker
                id={`specialization-arrow-${chartId}`}
                viewBox="0 0 8 8"
                refX="6.4"
                refY="4"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path className="newton-specialization-arrow" d="M0 0L8 4L0 8Z" />
              </marker>
            </defs>
            {specializationEdges.map((edge) => (
              <path
                className="newton-specialization-edge"
                d={specializationEdgePath(edge)}
                markerEnd={`url(#specialization-arrow-${chartId})`}
                key={`${edge.from}-${edge.to}`}
              />
            ))}
          </svg>

          {series.map(({ colorIndex, polygon }, index) => {
            const position = specializationPositions.get(polygon.id);
            if (!position) return null;
            const endpointLabel = polygon.isOrdinary
              ? language === "en" ? "Ordinary" : "普通"
              : polygon.isSupersingular
                ? language === "en" ? "Supersingular" : "超奇异"
                : null;
            const isEndpointLabelPinned = pinnedEndpointId === polygon.id;
            const nodeLabel = getNodeLabel?.(polygon, index) ?? `${index + 1}`;

            return (
              <button
                type="button"
                className={`newton-poset-node newton-color-${colorIndex}${endpointLabel ? " has-endpoint-label" : ""}${isEndpointLabelPinned ? " is-label-pinned" : ""}`}
                style={{
                  left: `${100 * position.x / 520}%`,
                  top: `${100 * position.y / specializationHeight}%`,
                }}
                aria-label={language === "en"
                  ? `Newton polygon ${nodeLabel}: ${slopeMultisetFormula(polygon.slopes)}`
                  : `牛顿多边形 ${nodeLabel}：${slopeMultisetFormula(polygon.slopes)}`}
                aria-pressed={polygon.id === selectedPolygonId}
                data-newton-endpoint={endpointLabel ? "true" : undefined}
                onClick={() => {
                  onSelect(polygon.id);
                  if (endpointLabel) setPinnedEndpointId(polygon.id);
                }}
                key={polygon.id}
              >
                {nodeLabel}
                {endpointLabel ? (
                  <span className="newton-endpoint-label" aria-hidden="true">
                    {endpointLabel}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DominoLattice({
  activeParts,
  artinHighlightInvariant,
  artinHighlightSequence,
  dimension,
  showDifferentials,
  showRanges,
  slopePart,
  slopeTerms,
  values,
  view,
}: {
  activeParts: SpectralParts;
  artinHighlightInvariant?: number | null;
  artinHighlightSequence?: number;
  dimension: Dimension;
  showDifferentials: boolean;
  showRanges: boolean;
  slopePart: SlopePart;
  slopeTerms: Map<string, readonly Fraction[]>;
  values: Map<string, number>;
  view: SpectralView;
}) {
  const {
    domino: showDominoPart,
    positiveSlope: showPositiveSlopePart,
    slopeZero: showSlopeZeroPart,
  } = activeParts;
  const hasActivePart =
    showDominoPart || showPositiveSlopePart || showSlopeZeroPart;
  const hasArtinDominoHighlight =
    artinHighlightInvariant != null && showDominoPart && view !== "slopes";
  const latticeSize = dimension + 1;
  const rows = Array.from({ length: latticeSize }, (_, index) => dimension - index);
  const columns = Array.from({ length: latticeSize }, (_, index) => index);
  const [hoveredDiagonal, setHoveredDiagonal] = useState<number | null>(null);
  const [selectedDiagonal, setSelectedDiagonal] = useState<number | null>(null);
  const [hoveredCombinedTerm, setHoveredCombinedTerm] = useState<{
    i: number;
    j: number;
  } | null>(null);
  const [hoveredSlopeTerms, setHoveredSlopeTerms] = useState<readonly string[]>([]);
  const numbers: DominoNumber[] = rows.flatMap((j) =>
    columns.map((i) => ({
      i,
      j,
      value: values.get(`${i},${j}`) ?? 0,
    })),
  );
  const diagonalHasDomino = (totalDegree: number) =>
    numbers.some(({ i, j, value }) =>
      i <= dimension - 2
      && j >= 2
      && i + j === totalDegree
      && value > 0
    );
  const activeDominoDiagonal = hoveredDiagonal !== null
      && diagonalHasDomino(hoveredDiagonal)
    ? hoveredDiagonal
    : selectedDiagonal !== null && diagonalHasDomino(selectedDiagonal)
      ? selectedDiagonal
      : null;
  const differentials = possibleDifferentials(dimension, values);
  const differentialHoverEnabled =
    showDominoPart && view !== "slopes" && showDifferentials;
  const activeDifferentialDiagonal = hasArtinDominoHighlight
    ? 2
    : activeDominoDiagonal;
  const visibleDifferentials = differentialHoverEnabled
      && activeDifferentialDiagonal !== null
    ? differentials.filter(
      ({ sourceI, sourceJ }) => sourceI + sourceJ === activeDifferentialDiagonal,
    )
    : [];
  const differentialTargets = new Set(
    visibleDifferentials.map(({ targetI, targetJ }) => `${targetI},${targetJ}`),
  );
  const hoveredDominoNumbers = activeDominoDiagonal === null
    ? []
    : numbers
      .filter(({ i, j, value }) =>
        i <= dimension - 2
        && j >= 2
        && i + j === activeDominoDiagonal
        && value > 0,
      )
      .sort((left, right) => left.i - right.i);
  const hoveredCombinedSlopes = hoveredCombinedTerm === null
    ? []
    : normalizedDieudonneSlopes(
      slopeTerms.get(`${hoveredCombinedTerm.i},${hoveredCombinedTerm.j}`) ?? [],
      hoveredCombinedTerm.i,
    );
  const hoveredCombinedSlopeZeroRank = hoveredCombinedSlopes.filter((slope) =>
    sameFraction(slope, 0)
  ).length;
  const hoveredCombinedPositiveSlopes = hoveredCombinedTerm !== null
      && hoveredCombinedTerm.i < dimension
      && hoveredCombinedTerm.j > 0
    ? hoveredCombinedSlopes.filter((slope) =>
      compareFractions(slope, fraction(0)) > 0
    )
    : [];
  const hoveredCombinedDominoRank = hoveredCombinedTerm !== null
      && hoveredCombinedTerm.i <= dimension - 2
      && hoveredCombinedTerm.j >= 2
    ? values.get(`${hoveredCombinedTerm.i},${hoveredCombinedTerm.j}`) ?? 0
    : 0;
  const hasHoveredCombinedReadout = hoveredCombinedTerm !== null && (
    (showSlopeZeroPart && hoveredCombinedSlopeZeroRank > 0)
    || (showPositiveSlopePart && hoveredCombinedPositiveSlopes.length > 0)
    || (showDominoPart && hoveredCombinedDominoRank > 0)
  );
  const diagonalSlices = Array.from(
    { length: Math.max(0, 2 * dimension - 3) },
    (_, index) => {
      const totalDegree = index + 2;
      const dominoes = numbers
        .filter(({ i, j }) =>
          i <= dimension - 2
          && j >= 2
          && i + j === totalDegree,
        )
        .sort((left, right) => left.i - right.i);

      return { dominoes, totalDegree };
    },
  );
  const matrixStyle = {
    gridTemplateColumns: `72px repeat(${latticeSize}, var(--spectral-step))`,
    gridTemplateRows: `repeat(${latticeSize}, var(--spectral-step)) 28px`,
  } satisfies CSSProperties;
  const trackDiagonal = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;

    if (!showDominoPart || view === "slopes" || dimension < 2) {
      setHoveredDiagonal(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const step = (bounds.height - 28) / latticeSize;
    const x = event.clientX - bounds.left - 72;
    const y = event.clientY - bounds.top;
    const dominoRangeSize = (dimension - 1) * step;

    if (x < 0 || y < 0 || x > dominoRangeSize || y > dominoRangeSize) {
      setHoveredDiagonal(null);
      return;
    }

    const nearestTotalDegree = Math.round(dimension + (x - y) / step);
    const nextDiagonal = Math.min(
      2 * dimension - 2,
      Math.max(2, nearestTotalDegree),
    );
    setHoveredDiagonal(diagonalHasDomino(nextDiagonal) ? nextDiagonal : null);
  };

  return (
    <div className="spectral-lattice-stack">
      <div
        className={`spectral-matrix spectral-size-${dimension} is-${view}-view`}
        style={matrixStyle}
        role="img"
        aria-label={`${latticeSize} by ${latticeSize} slope spectral sequence lattice showing ${
          view === "domino"
            ? `domino numbers${differentialHoverEnabled
              ? " and possible differentials for the hovered diagonal"
              : ""}`
            : view === "slopes"
              ? `${slopePart} slopes`
              : "slope zero, positive slope, and domino parts"
        }`}
        onPointerMove={trackDiagonal}
        onClick={() => setSelectedDiagonal(null)}
        onMouseLeave={() => {
          setHoveredDiagonal(null);
          setHoveredCombinedTerm(null);
          setHoveredSlopeTerms([]);
        }}
      >
      {showRanges && showDominoPart && dimension >= 2 ? (
        <div
          className={`domino-range${view === "combined" ? " is-combined-range" : ""}`}
          style={{
            gridColumn: `2 / span ${dimension - 1}`,
            gridRow: `1 / span ${dimension - 1}`,
          }}
          aria-hidden="true"
        />
      ) : null}

      {showRanges && showPositiveSlopePart ? (
        <div
          className={`positive-slope-range${view === "combined" ? " is-combined-range" : ""}`}
          style={{
            gridColumn: `2 / span ${dimension}`,
            gridRow: `1 / span ${dimension}`,
          }}
          aria-hidden="true"
        />
      ) : null}

      {showRanges && showSlopeZeroPart ? (
        <div
          className={`slope-zero-range${view === "combined" ? " is-combined-range" : ""}`}
          style={{
            gridColumn: `2 / span ${latticeSize}`,
            gridRow: `1 / span ${latticeSize}`,
          }}
          aria-hidden="true"
        />
      ) : null}

      {diagonalSlices.map(({ dominoes, totalDegree }) => {
        const firstDomino = dominoes[0];
        if (!firstDomino) return null;

        return (
          <svg
            className={`diagonal-domino-highlight${showDominoPart && view !== "slopes" && activeDominoDiagonal === totalDegree ? " is-active" : ""}${hasArtinDominoHighlight && totalDegree === 2 ? " is-artin-highlighted" : ""}`}
            style={{
              gridColumn: `${firstDomino.i + 2} / span ${dominoes.length + 1}`,
              gridRow: `${dimension - firstDomino.j + 1} / span ${dominoes.length}`,
            }}
            viewBox={`0 0 ${dominoes.length + 1} ${dominoes.length}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
            data-total-degree={totalDegree}
            key={`${totalDegree}-${hasArtinDominoHighlight && totalDegree === 2
              ? artinHighlightSequence
              : "idle"}`}
          >
            {dominoes.map((domino, index) => (
              <g className="diagonal-domino-unit" key={`${domino.i}-${domino.j}`}>
                <rect
                  className="diagonal-domino-unit-source"
                  x={index}
                  y={index}
                  width="1"
                  height="1"
                />
                <rect
                  className="diagonal-domino-unit-target"
                  x={index + 1}
                  y={index}
                  width="1"
                  height="1"
                />
                <rect
                  className="diagonal-domino-unit-outline"
                  x={index}
                  y={index}
                  width="2"
                  height="1"
                />
                <line
                  className="diagonal-domino-unit-divider"
                  x1={index + 1}
                  y1={index}
                  x2={index + 1}
                  y2={index + 1}
                />
              </g>
            ))}
          </svg>
        );
      })}

      {visibleDifferentials.length > 0 ? (
        <svg
          className="spectral-differential-overlay"
          style={{
            gridColumn: `2 / span ${latticeSize}`,
            gridRow: `1 / span ${latticeSize}`,
          }}
          viewBox={`0 0 ${latticeSize} ${latticeSize}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <marker
              id="spectral-differential-arrowhead"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path className="spectral-differential-arrowhead" d="M0 0L8 4L0 8Z" />
            </marker>
          </defs>
          {visibleDifferentials.map((differential) => {
            const {
              order,
              sourceI,
              sourceJ,
              targetI,
              targetJ,
            } = differential;
            const sourceX = sourceI + 0.5;
            const sourceY = dimension - sourceJ + 0.5;
            const targetX = targetI + 0.5;
            const targetY = dimension - targetJ + 0.5;
            const deltaX = targetX - sourceX;
            const deltaY = targetY - sourceY;
            const length = Math.hypot(deltaX, deltaY);
            const unitX = deltaX / length;
            const unitY = deltaY / length;
            const startX = sourceX + unitX * 0.18;
            const startY = sourceY + unitY * 0.18;
            const endX = targetX - unitX * 0.24;
            const endY = targetY - unitY * 0.24;
            const labelOffset = order === 1 ? -0.16 : 0.14;
            const labelX = (sourceX + targetX) / 2 - unitY * labelOffset;
            const labelY = (sourceY + targetY) / 2 + unitX * labelOffset;

            return (
              <g
                className={`spectral-differential is-order-${order}${hasArtinDominoHighlight ? " is-artin-highlighted" : ""}`}
                data-differential={`d${order}`}
                data-artin-differential={hasArtinDominoHighlight
                  ? artinHighlightInvariant
                  : undefined}
                key={`${order}-${sourceI}-${sourceJ}-${hasArtinDominoHighlight
                  ? artinHighlightSequence
                  : "hover"}`}
              >
                <line
                  className="spectral-differential-line"
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  markerEnd="url(#spectral-differential-arrowhead)"
                />
                <text
                  className="spectral-differential-label"
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  d
                  <tspan className="spectral-differential-label-order" dy="0.055">
                    {order}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      ) : null}

      {rows.map((j, rowIndex) => (
        <span
          className="spectral-axis-label spectral-axis-j"
          style={{ gridColumn: 1, gridRow: rowIndex + 1 }}
          aria-hidden="true"
          key={`j-${j}`}
        >
          <Latex formula={`${j}`} />
        </span>
      ))}
      {columns.map((i) => (
        <span
          className="spectral-axis-label spectral-axis-i"
          style={{ gridColumn: i + 2, gridRow: latticeSize + 1 }}
          aria-hidden="true"
          key={`i-${i}`}
        >
          <Latex formula={`${i}`} />
        </span>
      ))}
      <span
        className="spectral-axis-name spectral-axis-name-j"
        aria-hidden="true"
      >
        <Latex formula="H^j" />
      </span>
      <span
        className="spectral-axis-name spectral-axis-name-i"
        aria-hidden="true"
      >
        <Latex formula={"W\\Omega_X^i"} />
      </span>

      {numbers.map(({ i, j, value }) => {
        const rowIndex = dimension - j;
        const isInDominoRange = i <= dimension - 2 && j >= 2;
        const isNonzero = view === "domino" && isInDominoRange && value !== 0;
        const slopes = slopeTerms.get(`${i},${j}`) ?? [];
        const normalizedSlopes = normalizedDieudonneSlopes(slopes, i);
        const isInPositiveSlopeRange = i < dimension && j > 0;
        const selectedSlopes = view === "slopes"
          ? normalizedSlopes.filter((slope) =>
            slopePart === "zero"
              ? sameFraction(slope, 0)
              : isInPositiveSlopeRange && compareFractions(slope, fraction(0)) > 0,
          )
          : [];
        const slopeTermsForDisplay = slopePart === "zero" && selectedSlopes.length > 0
          ? [`${selectedSlopes.length}`]
          : slopeMultisetTerms(selectedSlopes);
        const hasSlopes = view === "slopes" && selectedSlopes.length > 0;
        const slopeZeroRank = normalizedSlopes.filter((slope) =>
          sameFraction(slope, 0)
        ).length;
        const positiveSlopeRank = isInPositiveSlopeRange
          ? normalizedSlopes.filter((slope) =>
            compareFractions(slope, fraction(0)) > 0
          ).length
          : 0;
        const dominoRank = isInDominoRange ? value : 0;
        const isDiagonalSource = view !== "slopes"
          && activeDominoDiagonal !== null
          && isInDominoRange
          && i + j === activeDominoDiagonal;
        const isDiagonalTarget = view !== "slopes"
          && activeDominoDiagonal !== null
          && i >= 1
          && i <= dimension - 1
          && j >= 2
          && i + j === activeDominoDiagonal + 1;
        const isDifferentialTarget = differentialHoverEnabled
          && differentialTargets.has(`${i},${j}`);
        const isCombinedHovered = view === "combined"
          && hoveredCombinedTerm?.i === i
          && hoveredCombinedTerm.j === j;
        const isArtinDominoSource = hasArtinDominoHighlight
          && i === 0
          && j === 2;
        const canSelectDomino = showDominoPart
          && view !== "slopes"
          && dominoRank > 0;
        const toggleSelectedDomino = () => {
          if (!canSelectDomino) return;
          const diagonal = i + j;
          setSelectedDiagonal((current) => current === diagonal ? null : diagonal);
        };

        return (
          <span
              className={`spectral-node${isInDominoRange ? " is-in-domino-range" : ""}${isNonzero ? " is-nonzero" : ""}${hasSlopes ? " is-slope-active" : ""}${isDiagonalSource ? " is-diagonal-source" : ""}${isDiagonalTarget ? " is-diagonal-target" : ""}${isDifferentialTarget ? " is-differential-target" : ""}${isCombinedHovered ? " is-combined-hovered" : ""}${isArtinDominoSource ? " is-artin-domino-source" : ""}`}
              style={{ gridColumn: i + 2, gridRow: rowIndex + 1 }}
              aria-label={view === "domino"
                ? isInDominoRange
                  ? `T ${i},${j} equals ${value}`
                  : `T ${i},${j} lies outside the domino range`
                : view === "slopes"
                  ? `The ${slopePart === "zero" ? "slope zero" : "positive slope"} part at ${i},${j} has rank ${selectedSlopes.length}${selectedSlopes.length ? ` and slopes ${slopeMultisetFormula(selectedSlopes)}` : ""}`
                  : `The overview term at ${i},${j} has slope zero rank ${slopeZeroRank}, positive slope rank ${positiveSlopeRank}, and domino rank ${dominoRank}`}
              data-coordinate={`${i},${j}`}
              data-domino-value={view === "domino" && isInDominoRange ? value : undefined}
              data-diagonal-slice={view === "domino" && isInDominoRange ? i + j : undefined}
              data-slope-count={view === "slopes" ? selectedSlopes.length : undefined}
              data-slope-part={view === "slopes" ? slopePart : undefined}
              data-combined-slope-zero-rank={view === "combined" ? slopeZeroRank : undefined}
              data-combined-positive-rank={view === "combined" ? positiveSlopeRank : undefined}
              data-combined-domino-rank={view === "combined" ? dominoRank : undefined}
              data-artin-domino={isArtinDominoSource ? artinHighlightInvariant : undefined}
              onMouseEnter={view === "combined" && hasActivePart
                ? () => setHoveredCombinedTerm({ i, j })
                : hasSlopes
                  ? () => setHoveredSlopeTerms(slopeTermsForDisplay)
                  : undefined}
              onMouseLeave={view === "combined" && hasActivePart
                ? () => setHoveredCombinedTerm(null)
                : hasSlopes
                  ? () => setHoveredSlopeTerms([])
                  : undefined}
              onClick={canSelectDomino
                ? (event) => {
                  event.stopPropagation();
                  toggleSelectedDomino();
                }
                : undefined}
              onKeyDown={canSelectDomino
                ? (event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  toggleSelectedDomino();
                }
                : undefined}
              role={canSelectDomino ? "button" : undefined}
              tabIndex={canSelectDomino ? 0 : undefined}
              aria-pressed={canSelectDomino
                ? activeDominoDiagonal === i + j
                : undefined}
              key={`${i}-${j}-${isArtinDominoSource ? artinHighlightSequence : "idle"}`}
            >
            {isNonzero ? (
              <span className="spectral-value">{value}</span>
            ) : null}
            {view === "slopes" && hasSlopes ? (
              <>
                <span className="spectral-slope-rank">{selectedSlopes.length}</span>
                <span className="spectral-slope-hover-tile" aria-hidden="true" />
              </>
            ) : null}
            {view === "combined" ? (
              <span className="combined-part-rings" aria-hidden="true">
                {showDominoPart && dominoRank > 0 ? (
                  <span className="combined-part-ring is-domino" />
                ) : null}
                {showPositiveSlopePart && positiveSlopeRank > 0 ? (
                  <span className="combined-part-ring is-positive-slope" />
                ) : null}
                {showSlopeZeroPart && slopeZeroRank > 0 ? (
                  <span className="combined-part-ring is-slope-zero" />
                ) : null}
              </span>
            ) : null}
            {(view === "domino" && (isNonzero || isDiagonalTarget || isDifferentialTarget))
              || (view === "slopes" && hasSlopes) ? (
                <span className="spectral-point" aria-hidden="true" />
              ) : null}
          </span>
        );
      })}
      </div>

      {view === "domino" ? (
        <div
          className={`spectral-domino-readout${hoveredDominoNumbers.length || hasArtinDominoHighlight ? " is-active" : ""}`}
          aria-live="polite"
        >
          {hasArtinDominoHighlight ? (
            <Latex formula={`U_{${artinHighlightInvariant}}`} />
          ) : (
            hoveredDominoNumbers.map(({ i, j, value }) => (
              <Latex formula={`T^{${i},${j}}=${value}`} key={`${i}-${j}`} />
            ))
          )}
        </div>
      ) : view === "slopes" ? (
        <div
          className={`spectral-slope-readout${hoveredSlopeTerms.length ? " is-active" : ""}`}
          aria-live="polite"
        >
          {slopePart === "zero" && hoveredSlopeTerms.length ? (
            <span>rank</span>
          ) : null}
          {hoveredSlopeTerms.map((formula, index) => (
            <Latex formula={formula} key={`${formula}-${index}`} />
          ))}
        </div>
      ) : (
        <div
          className={`spectral-combined-readout${hasHoveredCombinedReadout || hasArtinDominoHighlight ? " is-active" : ""}`}
          aria-live="polite"
        >
          {hasArtinDominoHighlight ? (
            <span
              className="spectral-combined-readout-part is-domino"
              role="group"
              aria-label={`Domino U ${artinHighlightInvariant}`}
            >
              <span
                className="spectral-combined-readout-mark is-domino"
                aria-hidden="true"
              />
              <Latex formula={`U_{${artinHighlightInvariant}}`} />
            </span>
          ) : hoveredCombinedTerm && hasHoveredCombinedReadout ? (
            <>
              {showSlopeZeroPart && hoveredCombinedSlopeZeroRank > 0 ? (
                <span
                  className="spectral-combined-readout-part is-slope-zero"
                  role="group"
                  aria-label="Slope zero part"
                >
                  <span
                    className="spectral-combined-readout-mark is-slope-zero"
                    aria-hidden="true"
                  />
                  <span>rank</span>
                  <Latex
                    formula={`${hoveredCombinedSlopeZeroRank}`}
                  />
                </span>
              ) : null}
              {showPositiveSlopePart && hoveredCombinedPositiveSlopes.length > 0 ? (
                <span
                  className="spectral-combined-readout-part is-positive-slope"
                  role="group"
                  aria-label="Positive slope part"
                >
                  <span
                    className="spectral-combined-readout-mark is-positive-slope"
                    aria-hidden="true"
                  />
                  {slopeMultisetTerms(hoveredCombinedPositiveSlopes).map(
                    (formula, index) => (
                      <Latex formula={formula} key={`${formula}-${index}`} />
                    ),
                  )}
                </span>
              ) : null}
              {showDominoPart && hoveredCombinedDominoRank > 0 ? (
                <span
                  className="spectral-combined-readout-part is-domino"
                  role="group"
                  aria-label="Domino part"
                >
                  <span
                    className="spectral-combined-readout-mark is-domino"
                    aria-hidden="true"
                  />
                  <Latex
                    formula={`T^{${hoveredCombinedTerm.i},${hoveredCombinedTerm.j}}=${hoveredCombinedDominoRank}`}
                  />
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EnriquesTypeSelector({
  language,
  onSelect,
  selectedType,
}: {
  language: Language;
  onSelect: (type: EnriquesType) => void;
  selectedType: EnriquesType;
}) {
  const types: readonly {
    groupScheme: string;
    id: EnriquesType;
    labelEn: string;
    labelZh: string;
  }[] = [
    {
      groupScheme: "\\mathbf Z/2",
      id: "classical",
      labelEn: "Classical",
      labelZh: "经典型",
    },
    {
      groupScheme: "\\mu_2",
      id: "singular",
      labelEn: "Singular",
      labelZh: "奇异型",
    },
    {
      groupScheme: "\\alpha_2",
      id: "supersingular",
      labelEn: "Supersingular",
      labelZh: "超奇异型",
    },
  ];

  return (
    <div className="enriques-type-panel">
      <div
        className="enriques-type-options"
        role="group"
        aria-label={language === "en" ? "Enriques surface type" : "Enriques 曲面类型"}
      >
        {types.map((type) => (
          <button
            type="button"
            className="enriques-type-option"
            aria-pressed={selectedType === type.id}
            onClick={() => onSelect(type.id)}
            key={type.id}
          >
            <span className="enriques-type-name">
              {language === "en" ? type.labelEn : type.labelZh}
            </span>
            <span className="enriques-picard-label">
              <Latex formula={`\\operatorname{Pic}^{\\tau}_{X/k}=${type.groupScheme}`} />
            </span>
          </button>
        ))}
      </div>

      <div className="enriques-tau-note">
        <Latex formula={"\\tau"} />
        <span>
          {language === "en"
            ? "denotes the numerically trivial part of the Picard scheme;"
            : "表示 Picard 概形中的数值平凡部分；"}
        </span>
        <Latex formula={"\\operatorname{Pic}^{\\tau}_{X/k}"} />
        <span>
          {language === "en"
            ? "parametrizes line bundles numerically equivalent to zero."
            : "参数化数值等价于零的线丛。"}
        </span>
      </div>
    </div>
  );
}

function EnriquesLattice({
  activeParts,
  enriquesType,
  language,
  showRanges,
}: {
  activeParts: EnriquesParts;
  enriquesType: EnriquesType;
  language: Language;
  showRanges: boolean;
}) {
  const rows = [2, 1, 0] as const;
  const columns = [0, 1, 2] as const;
  const [hoveredCoordinate, setHoveredCoordinate] = useState<string | null>(null);
  const terms = new Map(
    enriquesTerms[enriquesType].map((term) => [`${term.i},${term.j}`, term]),
  );
  const cells = rows.flatMap((j) => columns.map((i) => ({ i, j })));
  const hoveredTerm = hoveredCoordinate === null
    ? undefined
    : terms.get(hoveredCoordinate);
  const hasVisiblePiece = (term: EnriquesTerm | undefined) => Boolean(term && (
    (activeParts.slopeZero && term.slopeZero > 0)
    || (activeParts.semisimpleTorsion && term.semisimpleTorsion > 0)
    || (activeParts.nilpotentTorsion && term.nilpotentTorsion > 0)
  ));
  const matrixStyle = {
    gridTemplateColumns: "72px repeat(3, var(--spectral-step))",
    gridTemplateRows: "repeat(3, var(--spectral-step)) 28px",
  } satisfies CSSProperties;

  return (
    <div className="spectral-lattice-stack enriques-lattice-stack">
      <div
        className="spectral-matrix enriques-spectral-matrix"
        style={matrixStyle}
        role="img"
        aria-label={language === "en"
          ? `The E1 page for a ${enriquesType} Enriques surface in characteristic 2`
          : `特征 2 的${enriquesType === "classical" ? "经典型" : enriquesType === "singular" ? "奇异型" : "超奇异型"} Enriques 曲面的 E1 页`}
        onMouseLeave={() => setHoveredCoordinate(null)}
      >
        {showRanges && activeParts.slopeZero ? (
          <span
            className="enriques-range-frame is-slope-zero"
            style={{ gridColumn: "2 / span 3", gridRow: "1 / span 3" }}
            aria-hidden="true"
          />
        ) : null}
        {showRanges && activeParts.semisimpleTorsion ? (
          <span
            className="enriques-range-frame is-semisimple-torsion"
            style={{ gridColumn: "2 / span 3", gridRow: "1 / span 2" }}
            aria-hidden="true"
          />
        ) : null}
        {showRanges && activeParts.nilpotentTorsion ? (
          <span
            className="enriques-range-frame is-nilpotent-torsion"
            style={{ gridColumn: "2 / span 2", gridRow: "1 / span 1" }}
            aria-hidden="true"
          />
        ) : null}

        {rows.map((j, rowIndex) => (
          <span
            className="spectral-axis-label spectral-axis-j"
            style={{ gridColumn: 1, gridRow: rowIndex + 1 }}
            aria-hidden="true"
            key={`j-${j}`}
          >
            <Latex formula={`${j}`} />
          </span>
        ))}
        {columns.map((i) => (
          <span
            className="spectral-axis-label spectral-axis-i"
            style={{ gridColumn: i + 2, gridRow: 4 }}
            aria-hidden="true"
            key={`i-${i}`}
          >
            <Latex formula={`${i}`} />
          </span>
        ))}
        <span className="spectral-axis-name spectral-axis-name-j" aria-hidden="true">
          <Latex formula="H^j" />
        </span>
        <span className="spectral-axis-name spectral-axis-name-i" aria-hidden="true">
          <Latex formula={"W\\Omega_X^i"} />
        </span>

        {cells.map(({ i, j }) => {
          const coordinate = `${i},${j}`;
          const term = terms.get(coordinate);
          const isVisible = hasVisiblePiece(term);
          const showsSlopeZero = Boolean(
            activeParts.slopeZero && term && term.slopeZero > 0,
          );
          const showsSemisimpleTorsion = Boolean(
            activeParts.semisimpleTorsion && term && term.semisimpleTorsion > 0,
          );
          const showsNilpotentTorsion = Boolean(
            activeParts.nilpotentTorsion && term && term.nilpotentTorsion > 0,
          );
          const coreClass = showsSlopeZero
            ? "is-slope-zero"
            : showsSemisimpleTorsion
              ? "is-semisimple-torsion"
              : "is-nilpotent-torsion";

          return (
            <span
              className={`spectral-node enriques-spectral-node${isVisible ? " is-active" : ""}`}
              style={{ gridColumn: i + 2, gridRow: 3 - j }}
              aria-label={isVisible
                ? `${coordinate}: slope zero rank ${term?.slopeZero ?? 0}, semisimple torsion length ${term?.semisimpleTorsion ?? 0}, nilpotent torsion length ${term?.nilpotentTorsion ?? 0}`
                : `${coordinate}: zero among the selected parts`}
              data-coordinate={coordinate}
              onMouseEnter={() => setHoveredCoordinate(isVisible ? coordinate : null)}
              key={coordinate}
            >
              {isVisible ? (
                <span className="enriques-term-parts" aria-hidden="true">
                  <span className={`enriques-core-circle ${coreClass}`} />
                  {showsSemisimpleTorsion ? (
                    <span className="enriques-torsion-outline is-semisimple-torsion" />
                  ) : null}
                  {showsNilpotentTorsion ? (
                    <span className="enriques-torsion-outline is-nilpotent-torsion" />
                  ) : null}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>

      <div
        className={`enriques-term-readout${hasVisiblePiece(hoveredTerm) ? " is-active" : ""}`}
        aria-live="polite"
      >
        {hoveredTerm && hasVisiblePiece(hoveredTerm) ? (
          <>
            {activeParts.slopeZero && hoveredTerm.slopeZero > 0 ? (
              <span
                className="enriques-readout-part is-slope-zero"
                aria-label={language === "en"
                  ? `Slope zero rank ${hoveredTerm.slopeZero}`
                  : `斜率 0 的 rank 是 ${hoveredTerm.slopeZero}`}
              >
                <span className="enriques-readout-mark" aria-hidden="true" />
                <span>rank</span>
                <span>{hoveredTerm.slopeZero}</span>
              </span>
            ) : null}
            {activeParts.semisimpleTorsion && hoveredTerm.semisimpleTorsion > 0 ? (
              <span
                className="enriques-readout-part is-semisimple-torsion"
                aria-label={language === "en"
                  ? "Semisimple torsion: a copy of k with F equal to sigma and V equal to zero"
                  : "半单有限挠：一份 k，其中 F 等于 sigma，V 等于 0"}
              >
                <span className="enriques-readout-mark" aria-hidden="true" />
                <Latex formula={"k\\text{ with }F=\\sigma,\\;V=0"} />
              </span>
            ) : null}
            {activeParts.nilpotentTorsion && hoveredTerm.nilpotentTorsion > 0 ? (
              <span
                className="enriques-readout-part is-nilpotent-torsion"
                aria-label={language === "en"
                  ? "Nilpotent torsion: a copy of k with F and V equal to zero"
                  : "幂零有限挠：一份 k，其中 F 和 V 都等于 0"}
              >
                <span className="enriques-readout-mark" aria-hidden="true" />
                <Latex formula={"k\\text{ with }F=V=0"} />
              </span>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function supersingularPolygon(dimension: Dimension) {
  return polygonsByDimension[dimension].find((polygon) => polygon.isSupersingular)
    ?? polygonsByDimension[dimension][0];
}

export default function SlopeSpectralSequencePage() {
  const { language, setLanguage } = useSiteLanguage();
  const [geometry, setGeometry] = useState<GeometryExample>("abelian");
  const [dimension, setDimension] = useState<Dimension>(3);
  const [activeParts, setActiveParts] = useState<SpectralParts>({
    domino: true,
    positiveSlope: true,
    slopeZero: true,
  });
  const [enriquesParts, setEnriquesParts] = useState<EnriquesParts>({
    nilpotentTorsion: true,
    semisimpleTorsion: true,
    slopeZero: true,
  });
  const [enriquesType, setEnriquesType] = useState<EnriquesType>("classical");
  const [showDifferentials, setShowDifferentials] = useState(true);
  const [showRanges, setShowRanges] = useState(true);
  const [selectedPolygonId, setSelectedPolygonId] = useState(
    supersingularPolygon(3).id,
  );
  const [selectedArtinInvariant, setSelectedArtinInvariant] = useState<number | null>(null);
  const [artinHighlightInvariant, setArtinHighlightInvariant] = useState<number | null>(null);
  const [artinHighlightSequence, setArtinHighlightSequence] = useState(0);
  const isK3 = geometry === "k3";
  const isEnriques = geometry === "enriques";
  const isSurfaceExample = isK3 || isEnriques;
  const spectralDimension: Dimension = isSurfaceExample ? 2 : dimension;
  const polygons = isK3 ? k3NewtonPolygons : polygonsByDimension[dimension];
  const selectedPolygon = polygons.find((polygon) => polygon.id === selectedPolygonId)
    ?? (isK3
      ? k3NewtonPolygons.find((polygon) => polygon.isSupersingular)
        ?? k3NewtonPolygons[0]
      : supersingularPolygon(dimension));
  const selectedStratumDimension = isSurfaceExample
    ? undefined
    : stratumDimensionsByDimension[dimension].get(selectedPolygon.id);
  const values = useMemo(
    () => isK3
      ? k3DominoNumbers(selectedPolygon)
      : dominoNumbers(dimension, selectedPolygon.slopes),
    [dimension, isK3, selectedPolygon],
  );
  const slopeTerms = useMemo(
    () => isK3
      ? k3SlopeSpectralTerms(selectedPolygon)
      : slopeSpectralTerms(dimension, selectedPolygon.slopes),
    [dimension, isK3, selectedPolygon],
  );
  const activePartCount = Number(activeParts.slopeZero)
    + Number(activeParts.positiveSlope)
    + Number(activeParts.domino);
  const enriquesPartCount = Number(enriquesParts.slopeZero)
    + Number(enriquesParts.semisimpleTorsion)
    + Number(enriquesParts.nilpotentTorsion);
  const spectralView: SpectralView = activePartCount === 1
    ? activeParts.domino ? "domino" : "slopes"
    : "combined";
  const slopePart: SlopePart =
    activeParts.positiveSlope && !activeParts.slopeZero ? "positive" : "zero";
  const sliderStyle = {
    "--dimension-progress": `${100 * (dimension - 1) / (dimensions.length - 1)}%`,
  } as CSSProperties;

  useEffect(() => {
    if (artinHighlightInvariant === null) return;

    const timeout = window.setTimeout(() => {
      setArtinHighlightInvariant(null);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [artinHighlightInvariant, artinHighlightSequence]);

  const clearArtinInvariant = () => {
    setSelectedArtinInvariant(null);
    setArtinHighlightInvariant(null);
  };

  const changeDimension = (nextDimension: Dimension) => {
    setDimension(nextDimension);
    setSelectedPolygonId(supersingularPolygon(nextDimension).id);
    clearArtinInvariant();
  };

  const changeGeometry = (nextGeometry: GeometryExample) => {
    setGeometry(nextGeometry);
    clearArtinInvariant();
    if (nextGeometry === "k3") {
      setSelectedPolygonId(
        k3NewtonPolygons.find((polygon) => polygon.isSupersingular)?.id
          ?? k3NewtonPolygons[0].id,
      );
    } else if (nextGeometry === "abelian") {
      setSelectedPolygonId(supersingularPolygon(dimension).id);
    }
  };

  const selectNewtonPolygon = (polygonId: string) => {
    setSelectedPolygonId(polygonId);
    const nextPolygon = polygons.find((polygon) => polygon.id === polygonId);

    if (!isK3 || !nextPolygon?.isSupersingular) {
      clearArtinInvariant();
    }
  };

  const selectArtinInvariant = (invariant: number) => {
    setSelectedArtinInvariant(invariant);
    setArtinHighlightInvariant(invariant);
    setArtinHighlightSequence((current) => current + 1);
    setShowDifferentials(true);
    setActiveParts((current) => current.domino
      ? current
      : { ...current, domino: true });
  };

  const toggleSpectralPart = (part: keyof SpectralParts) => {
    setActiveParts((current) => ({
      ...current,
      [part]: !current[part],
    }));
  };

  const toggleEnriquesPart = (part: keyof EnriquesParts) => {
    setEnriquesParts((current) => ({
      ...current,
      [part]: !current[part],
    }));
  };

  return (
    <main className="page-shell slope-page" lang={language === "zh" ? "zh-CN" : "en"}>
      <header className="hero">
        <h1>
          {language === "en" ? "Slope Spectral Sequence" : "斜率谱序列"}
        </h1>
        <button
          type="button"
          className="language-toggle"
          aria-label={language === "en" ? "切换为中文" : "Switch to English"}
          onClick={() => setLanguage((current) => current === "en" ? "zh" : "en")}
        >
          <span className={language === "zh" ? "is-active" : undefined}>中</span>
          <span className="language-divider" aria-hidden="true">/</span>
          <span className={language === "en" ? "is-active" : undefined}>En</span>
        </button>
      </header>

      <SiteMenu active="slope" language={language} />

      <section className="slope-introduction">
        <p>
          <strong className="setup-kicker">
            {language === "en" ? "Setup:" : "设定："}
          </strong>
          {language === "en" ? (
            <>
              For a smooth proper variety <Latex formula="X" /> over a perfect field
              of characteristic <Latex formula="p>0" />, the slope spectral sequence
              begins with
            </>
          ) : (
            <>
              对于特征 <Latex formula="p>0" /> 的完美域上的光滑固有簇
              {" "}<Latex formula="X" />，斜率谱序列从下式开始：
            </>
          )}
        </p>
        <div className="slope-sequence-formula">
          <Latex
            displayMode
            formula={"E_1^{i,j}=H^j(X,W\\Omega_X^i)\\;\\Longrightarrow\\;H_{\\mathrm{crys}}^{i+j}(X/W)"}
          />
        </div>
        <p>
          {language === "en" ? (
            <>
              The number <Latex formula={"T^{i,j}(X)=\\dim U_X^{i,j}"} /> measures the
              domino carried by the differential leaving <Latex formula="E_1^{i,j}" />.
            </>
          ) : (
            <>
              数值 <Latex formula={"T^{i,j}(X)=\\dim U_X^{i,j}"} /> 表示从
              {" "}<Latex formula="E_1^{i,j}" /> 出发的微分所携带的多米诺维数。
            </>
          )}
        </p>
        <div
          className="slope-example-switcher"
          role="group"
          aria-label={language === "en" ? "Geometric example" : "具体例子"}
        >
          <span className="slope-example-label">
            {language === "en" ? "Examples" : "具体例子"}
          </span>
          <button
            type="button"
            aria-pressed={geometry === "abelian"}
            onClick={() => changeGeometry("abelian")}
          >
            {language === "en" ? "Abelian variety" : "阿贝尔簇"}
          </button>
          <button
            type="button"
            aria-pressed={geometry === "k3"}
            onClick={() => changeGeometry("k3")}
          >
            {language === "en" ? "K3 surface" : "K3 曲面"}
          </button>
          <button
            type="button"
            aria-pressed={geometry === "enriques"}
            onClick={() => changeGeometry("enriques")}
          >
            {language === "en" ? "Enriques surface" : "Enriques 曲面"}
          </button>
        </div>
      </section>

      <div className="slope-workspace">
        <div className="slope-control-column">
          <section className="dimension-step" aria-labelledby="dimension-heading">
            <div className="slope-step-heading">
              <span className="slope-step-index">01</span>
              <div>
                <h2 id="dimension-heading">
                  {language === "en" ? "Dimension" : "维数"}
                  <span>
                    <Latex
                      formula={isEnriques
                        ? "\\dim X=2,\\quad \\operatorname{char}(k)=2"
                        : isK3
                          ? "\\dim X=2"
                          : `g=${dimension}`}
                    />
                    {!isSurfaceExample ? <> · {spectralDimension + 1} × {spectralDimension + 1}</> : null}
                  </span>
                </h2>
              </div>
            </div>
            {!isSurfaceExample ? (
            <div className="dimension-slider-wrap">
              <input
                className="dimension-slider"
                type="range"
                min="1"
                max="4"
                step="1"
                value={dimension}
                style={sliderStyle}
                aria-label={language === "en" ? "Dimension of the abelian variety" : "阿贝尔簇的维数"}
                aria-valuetext={`g = ${dimension}`}
                onChange={(event) => changeDimension(Number(event.target.value) as Dimension)}
              />
              <div className="dimension-ticks" aria-hidden="true">
                {dimensions.map((value) => (
                  <span className={value === dimension ? "is-current" : undefined} key={value}>
                    {value}
                  </span>
                ))}
              </div>
            </div>
            ) : null}
          </section>

          <section className="newton-step" aria-labelledby="newton-heading">
            <div className="slope-step-heading compact">
              <span className="slope-step-index">02</span>
              <div>
                <h2 id="newton-heading">
                  {isEnriques
                    ? language === "en" ? "Enriques type" : "Enriques 类型"
                    : language === "en" ? "Newton polygon" : "牛顿多边形"}
                  {isK3 ? <span><Latex formula={"H^2_{\\mathrm{crys}}"} /></span> : null}
                </h2>
              </div>
            </div>

            {isEnriques ? (
              <EnriquesTypeSelector
                language={language}
                onSelect={setEnriquesType}
                selectedType={enriquesType}
              />
            ) : (
              <>
                <NewtonPolygonFamilyChart
                  key={`${geometry}-${dimension}`}
                  chartId={`${geometry}-${dimension}`}
                  dimension={spectralDimension}
                  displaySelectedOnly={isK3}
                  familyLabel={language === "en"
                    ? isK3 ? "K3 surfaces" : `abelian ${dimension}-folds`
                    : isK3 ? "K3 曲面" : `${dimension} 维阿贝尔簇`}
                  getNodeLabel={isK3
                    ? (polygon) => polygon.height === "infinity"
                      ? "∞"
                      : `${polygon.height}`
                    : undefined}
                  language={language}
                  onSelect={selectNewtonPolygon}
                  polygons={polygons}
                  selectedPolygonId={selectedPolygon.id}
                  showBreakpoints={isK3}
                />

                {isK3 && selectedPolygon.isSupersingular ? (
                  <div className="artin-invariant-selector">
                    <div
                      className="artin-invariant-map"
                      role="group"
                      aria-label={language === "en" ? "Artin invariant" : "Artin 不变量"}
                    >
                      <svg
                        className="artin-refinement-diagram"
                        viewBox="0 0 520 96"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <defs>
                          <marker
                            id="artin-specialization-arrow"
                            viewBox="0 0 8 8"
                            refX="6.4"
                            refY="4"
                            markerWidth="7"
                            markerHeight="7"
                            orient="auto"
                          >
                            <path
                              className="artin-invariant-arrow"
                              d="M0 0L8 4L0 8Z"
                            />
                          </marker>
                        </defs>
                        <path
                          className="artin-refinement-trunk"
                          d="M438 0V10C438 20 426 24 410 24H260V36"
                        />
                        <line
                          className="artin-refinement-rail"
                          x1="82"
                          x2="438"
                          y1="36"
                          y2="36"
                        />
                        <circle
                          className="artin-refinement-junction"
                          cx="260"
                          cy="36"
                          r="2.5"
                        />
                        {artinInvariantPositions.map((position) => (
                          <line
                            className="artin-refinement-branch"
                            x1={position}
                            x2={position}
                            y1="36"
                            y2="64"
                            key={`branch-${position}`}
                          />
                        ))}
                        {artinInvariantPositions.slice(0, -1).map(
                          (position, index) => (
                            <line
                              className="artin-invariant-edge"
                              x1={position + 14}
                              x2={artinInvariantPositions[index + 1] - 16}
                              y1="78"
                              y2="78"
                              markerEnd="url(#artin-specialization-arrow)"
                              key={`${position}-${index}`}
                            />
                          ),
                        )}
                      </svg>
                      {artinInvariants.map((invariant, index) => (
                        <button
                          type="button"
                          className={`artin-invariant-option newton-color-${index}`}
                          style={{
                            left: `${100 * artinInvariantPositions[index] / 520}%`,
                          }}
                          aria-label={language === "en"
                            ? `Artin invariant ${invariant}`
                            : `Artin 不变量 ${invariant}`}
                          aria-pressed={selectedArtinInvariant === invariant}
                          aria-controls="spectral-lattice-panel"
                          onClick={() => selectArtinInvariant(invariant)}
                          key={invariant}
                        >
                          {invariant}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="selected-newton-summary is-in-newton-step">
                  {isK3 ? (
                    <>
                      <span>{language === "en" ? "height" : "高度"}</span>
                      <Latex
                        formula={`h(\\widehat{\\mathrm{Br}}_X)=${selectedPolygon.height === "infinity"
                          ? "\\infty"
                          : selectedPolygon.height}`}
                      />
                      <span className="newton-summary-divider" aria-hidden="true">·</span>
                    </>
                  ) : null}
                  <span>{language === "en" ? "slopes of " : "斜率："}</span>
                  <Latex formula={isK3 ? "H^2_{\\mathrm{crys}}" : "H^1_{\\mathrm{crys}}"} />
                  <span aria-hidden="true">:</span>
                  <Latex formula={slopeMultisetFormula(selectedPolygon.slopes)} />
                  {!isK3 ? (
                    <>
                      <span className="newton-summary-divider" aria-hidden="true">·</span>
                      <Latex
                        formula={`\\dim \\mathcal A_{${dimension}}^{\\xi}=${selectedStratumDimension}`}
                      />
                    </>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>

        <section
          className={`domino-number-step${isEnriques ? " is-enriques" : ""}`}
          aria-labelledby="slope-spectral-heading"
        >
          <div className="slope-step-heading compact">
            <span className="slope-step-index">03</span>
            <div>
              <h2 id="slope-spectral-heading">
                {language === "en" ? "Slope spectral sequence" : "斜率谱序列"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="range-frame-toggle"
            className="range-frame-toggle"
            aria-label={language === "en"
              ? showRanges ? "Hide range frames" : "Show range frames"
              : showRanges ? "隐藏区域框" : "显示区域框"}
            aria-pressed={showRanges}
            aria-controls="spectral-lattice-panel"
            onClick={() => setShowRanges((current) => !current)}
          >
            {isEnriques ? (
              <span className="range-frame-icon is-enriques" aria-hidden="true">
                <span className="range-frame-icon-box is-slope-zero" />
                <span className="range-frame-icon-box is-semisimple-torsion" />
                <span className="range-frame-icon-box is-nilpotent-torsion" />
              </span>
            ) : (
              <span className="range-frame-icon" aria-hidden="true">
                  <span className="range-frame-icon-box is-slope-zero" />
                  <span className="range-frame-icon-box is-positive-slope" />
                  <span className="range-frame-icon-box is-domino" />
              </span>
            )}
          </button>

          {!isEnriques ? (
            <button
              type="button"
              id="differential-toggle"
              className="differential-toggle"
              aria-label={language === "en"
                ? showDifferentials ? "Hide possible differentials" : "Show possible differentials"
                : showDifferentials ? "隐藏可能的微分" : "显示可能的微分"}
              aria-pressed={showDifferentials}
              aria-controls="spectral-lattice-panel"
              onClick={() => setShowDifferentials((current) => !current)}
            >
              <span className="differential-toggle-icon" aria-hidden="true">
                d<span className="differential-toggle-order">r</span>
                <span className="differential-toggle-arrow">→</span>
              </span>
            </button>
          ) : null}

          <div
            className={`spectral-part-controls${isEnriques ? " is-enriques" : ""}`}
            role="group"
            aria-label={language === "en" ? "Spectral-sequence parts" : "斜率谱序列部分"}
          >
            <button
              type="button"
              id="slope-part-zero"
              className="spectral-part-button is-slope-zero"
              aria-pressed={isEnriques ? enriquesParts.slopeZero : activeParts.slopeZero}
              aria-controls="spectral-lattice-panel"
              onClick={() => isEnriques
                ? toggleEnriquesPart("slopeZero")
                : toggleSpectralPart("slopeZero")}
            >
              <span className="spectral-part-button-mark is-slope-zero" aria-hidden="true" />
              {language === "en" ? "Slope 0" : "斜率 0"}
            </button>
            {isEnriques ? (
              <>
                <button
                  type="button"
                  id="spectral-part-semisimple-torsion"
                  className="spectral-part-button is-semisimple-torsion"
                  aria-pressed={enriquesParts.semisimpleTorsion}
                  aria-controls="spectral-lattice-panel"
                  onClick={() => toggleEnriquesPart("semisimpleTorsion")}
                >
                  <span className="spectral-part-button-mark is-semisimple-torsion" aria-hidden="true" />
                  {language === "en" ? "Semisimple torsion" : "半单有限挠"}
                </button>
                <button
                  type="button"
                  id="spectral-part-nilpotent-torsion"
                  className="spectral-part-button is-nilpotent-torsion"
                  aria-pressed={enriquesParts.nilpotentTorsion}
                  aria-controls="spectral-lattice-panel"
                  onClick={() => toggleEnriquesPart("nilpotentTorsion")}
                >
                  <span className="spectral-part-button-mark is-nilpotent-torsion" aria-hidden="true" />
                  {language === "en" ? "Nilpotent torsion" : "幂零有限挠"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  id="slope-part-positive"
                  className="spectral-part-button is-positive-slope"
                  aria-pressed={activeParts.positiveSlope}
                  aria-controls="spectral-lattice-panel"
                  onClick={() => toggleSpectralPart("positiveSlope")}
                >
                  <span className="spectral-part-button-mark is-positive-slope" aria-hidden="true" />
                  {language === "en" ? "Positive slope" : "正斜率"}
                </button>
                <button
                  type="button"
                  id="spectral-part-domino"
                  className="spectral-part-button is-domino"
                  aria-pressed={activeParts.domino}
                  aria-controls="spectral-lattice-panel"
                  onClick={() => toggleSpectralPart("domino")}
                >
                  <span className="spectral-part-button-mark is-domino" aria-hidden="true" />
                  {language === "en" ? "Domino" : "多米诺"}
                </button>
              </>
            )}
          </div>

          <div
            id="spectral-lattice-panel"
            className="spectral-lattice-wrap"
            role="region"
            aria-labelledby={!isEnriques && activePartCount === 1
              ? activeParts.domino
                ? "spectral-part-domino"
                : `slope-part-${slopePart}`
              : undefined}
            aria-label={isEnriques
              ? language === "en"
                ? `${enriquesPartCount} selected parts of the integral E1 page`
                : `整系数 E1 页中已选择 ${enriquesPartCount} 个部分`
              : activePartCount !== 1
              ? activePartCount === 3
                ? language === "en"
                  ? "All spectral-sequence parts"
                  : "全部斜率谱序列部分"
                : language === "en"
                  ? "Selected spectral-sequence parts"
                  : "已选择的斜率谱序列部分"
              : undefined}
          >
            {isEnriques ? (
              <EnriquesLattice
                activeParts={enriquesParts}
                enriquesType={enriquesType}
                language={language}
                showRanges={showRanges}
                key={`${enriquesType}-${Number(enriquesParts.slopeZero)}-${Number(enriquesParts.semisimpleTorsion)}-${Number(enriquesParts.nilpotentTorsion)}-${Number(showRanges)}`}
              />
            ) : (
              <DominoLattice
                activeParts={activeParts}
                artinHighlightInvariant={isK3 && selectedPolygon.isSupersingular
                  ? artinHighlightInvariant
                  : null}
                artinHighlightSequence={artinHighlightSequence}
                dimension={spectralDimension}
                showDifferentials={showDifferentials}
                showRanges={showRanges}
                slopePart={slopePart}
                slopeTerms={slopeTerms}
                values={values}
                view={spectralView}
                key={`${geometry}-${spectralDimension}-${selectedPolygon.id}-${Number(activeParts.slopeZero)}-${Number(activeParts.positiveSlope)}-${Number(activeParts.domino)}`}
              />
            )}
          </div>

          {isEnriques ? (
            <div
              className={`spectral-remark${showRanges ? " is-visible" : ""}`}
              role="status"
              aria-live="polite"
            >
              {showRanges ? (
                <p>
                  <span className="spectral-remark-icon" aria-hidden="true">
                    <span className="range-frame-icon is-enriques">
                      <span className="range-frame-icon-box is-slope-zero" />
                      <span className="range-frame-icon-box is-semisimple-torsion" />
                      <span className="range-frame-icon-box is-nilpotent-torsion" />
                    </span>
                  </span>
                  <span>
                    {language === "en"
                      ? "These range frames follow from Ekedahl’s Poincaré duality."
                      : "这些区域框来自 Ekedahl 的庞加莱对偶。"}
                  </span>
                </p>
              ) : null}
            </div>
          ) : (
          <div
            className={`spectral-remark${showRanges || showDifferentials ? " is-visible" : ""}`}
            role="status"
            aria-live="polite"
          >
            {showRanges ? (
              <p>
                <span className="spectral-remark-icon" aria-hidden="true">
                  <span className="range-frame-icon">
                    <span className="range-frame-icon-box is-slope-zero" />
                    <span className="range-frame-icon-box is-positive-slope" />
                    <span className="range-frame-icon-box is-domino" />
                  </span>
                </span>
                <span>
                  {language === "en"
                    ? "These range frames follow from Ekedahl’s Poincaré duality."
                    : "这些区域框来自 Ekedahl 的庞加莱对偶。"}
                </span>
              </p>
            ) : null}
            {showDifferentials ? (
              <p>
                <span className="spectral-remark-icon" aria-hidden="true">
                  <span className="differential-toggle-icon">
                    d<span className="differential-toggle-order">r</span>
                    <span className="differential-toggle-arrow">→</span>
                  </span>
                </span>
                <span>
                  {language === "en"
                    ? "The positions of these differentials follow from Illusie–Raynaud’s survival of the heart."
                    : "这些微分的位置来自 Illusie–Raynaud 的 survival of the heart。"}
                </span>
              </p>
            ) : null}
          </div>
          )}
        </section>
      </div>
    </main>
  );
}
