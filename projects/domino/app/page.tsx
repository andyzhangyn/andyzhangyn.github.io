"use client";

import katex from "katex";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useSiteLanguage } from "./components/LanguageProvider";
import SiteMenu from "./components/SiteMenu";

type Column = -3 | -2 | -1 | 0 | 1 | 2 | 3;
type FiltrationLevel = 1 | 2 | 3;
type ElementaryIndex = -2 | -1 | 0 | 1 | 2;
type Language = "en" | "zh";
type TutorialSection = "filtration" | "domino";
type DominoTopic = "elementary" | "distinguished" | "two-dimensional";
const polynomialDominoKeys = [
  "0,3;1",
  "0,3;V",
  "0,4;1",
  "0,4;V",
  "0,4;V^2",
] as const;
type PolynomialDominoKey = (typeof polynomialDominoKeys)[number];
type DistinguishedDominoKey =
  | "-1,1"
  | "0,2"
  | "1,3"
  | "-2,0,2"
  | "-1,1,3"
  | "0,2,4"
  | "1,3,5";
type IdealView = {
  kind: "filtration" | "quotient";
  level: FiltrationLevel;
};

type DistinguishedDominoSpec = {
  key: DistinguishedDominoKey;
  indices: readonly number[];
  j: -2 | -1 | 0 | 1;
  length: 2 | 3;
};

type BasisPoint = {
  column: Column;
  row: number;
};

type VisualBasisPoint = {
  point: BasisPoint;
  formula: string;
  plain: string;
};

type PointCoordinate = {
  column: number;
  row: number;
};

type RingOperator = "F" | "V";

const columns: Column[] = [-3, -2, -1, 0, 1, 2, 3];
const sourceRowsByColumn: Record<Column, number[]> = {
  [-3]: [0, 1],
  [-2]: [0, 1, 2],
  [-1]: [0, 1, 2, 3],
  0: [0, 1, 2, 3, 4],
  1: [0, 1, 2, 3],
  2: [0, 1, 2],
  3: [0, 1],
};
const targetRows = [0, 1, 2, 3, 4];
const distinguishedDominoes: DistinguishedDominoSpec[] = [
  { key: "-1,1", indices: [-1, 1], j: -1, length: 2 },
  { key: "0,2", indices: [0, 2], j: 0, length: 2 },
  { key: "1,3", indices: [1, 3], j: 1, length: 2 },
  { key: "-2,0,2", indices: [-2, 0, 2], j: -2, length: 3 },
  { key: "-1,1,3", indices: [-1, 1, 3], j: -1, length: 3 },
  { key: "0,2,4", indices: [0, 2, 4], j: 0, length: 3 },
  { key: "1,3,5", indices: [1, 3, 5], j: 1, length: 3 },
];

const distinguishedDominoesByDimension = {
  2: distinguishedDominoes.filter((domino) => domino.length === 2),
  3: distinguishedDominoes.filter((domino) => domino.length === 3),
} as const;

const polynomialDominoSpecs: Record<
  PolynomialDominoKey,
  { j: 3 | 4; vPower: 0 | 1 | 2 }
> = {
  "0,3;1": { j: 3, vPower: 0 },
  "0,3;V": { j: 3, vPower: 1 },
  "0,4;1": { j: 4, vPower: 0 },
  "0,4;V": { j: 4, vPower: 1 },
  "0,4;V^2": { j: 4, vPower: 2 },
};

function buildPolynomialDominoPoints({
  j,
  vPower,
}: {
  j: 3 | 4;
  vPower: 0 | 1 | 2;
}): Record<0 | 1, readonly VisualBasisPoint[]> {
  const sourceLiftChain: VisualBasisPoint[] = Array.from({ length: 4 }, (_, exponent) => ({
    point: { column: -exponent as Column, row: 0 },
    formula: exponent === 0 ? "1" : latexPower("V", exponent),
    plain: exponent === 0 ? "1" : plainPower("V", exponent),
  }));
  const sourceSubobjectChain: VisualBasisPoint[] = Array.from(
    { length: vPower + 5 },
    (_, vExponent) => {
      if (vExponent <= vPower) {
        const pExponent = vExponent - vPower;
        const fExponent = vPower + 1 - vExponent;

        return {
          point: { column: fExponent as Column, row: pExponent },
          formula: latexPower("p", pExponent) + latexPower("F", fExponent),
          plain: plainPower("p", pExponent) + plainPower("F", fExponent),
        };
      }

      const displayedVExponent = vExponent - vPower - 1;
      return {
        point: { column: -displayedVExponent as Column, row: 1 },
        formula: "p" + latexPower("V", displayedVExponent),
        plain: "p" + plainPower("V", displayedVExponent),
      };
    },
  );
  const targetLiftChain: VisualBasisPoint[] = Array.from({ length: 4 }, (_, exponent) => ({
    point: { column: -exponent as Column, row: 0 },
    formula: "d" + latexPower("V", exponent),
    plain: "d" + plainPower("V", exponent),
  }));
  const targetStart = j - vPower - 1;
  const targetSubobjectChain: VisualBasisPoint[] = Array.from(
    { length: 4 - targetStart },
    (_, offset) => {
      const exponent = targetStart + offset;
      return {
        point: { column: -exponent as Column, row: 1 },
        formula: "pd" + latexPower("V", exponent),
        plain: "pd" + plainPower("V", exponent),
      };
    },
  );

  return {
    0: [...sourceSubobjectChain, ...sourceLiftChain],
    1: [...targetLiftChain, ...targetSubobjectChain],
  };
}

const polynomialDominoPoints: Record<
  PolynomialDominoKey,
  Record<0 | 1, readonly VisualBasisPoint[]>
> = Object.fromEntries(
  polynomialDominoKeys.map((key) => [
    key,
    buildPolynomialDominoPoints(polynomialDominoSpecs[key]),
  ]),
) as Record<PolynomialDominoKey, Record<0 | 1, readonly VisualBasisPoint[]>>;

type Selection =
  | { type: "whole" }
  | { type: "quotient-space" }
  | { type: "elementary-space" }
  | { type: "distinguished-space" }
  | { type: "polynomial-space" }
  | { type: "point"; point: BasisPoint };
type MapSelection = Exclude<Selection, { type: "point"; point: BasisPoint }>;
type AutomaticPreview = {
  phase: "visible" | "fading";
  selection: MapSelection;
  sequence: number;
};

const automaticPreviewHoldMs = 2000;
const automaticPreviewFadeMs = 450;

type PolygonPoint = [number, number];

type PlotGeometry = {
  baselineY: number;
  centerX: number;
  height: number;
  idealPoints: string;
  quotientClipPath: string;
  step: number;
  viewBox: string;
  width: number;
};

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

function latexPower(glyph: string, exponent: number) {
  if (exponent === 0) return "";
  return exponent === 1 ? glyph : glyph + "^{" + exponent + "}";
}

function latexTerm({ column, row }: BasisPoint, degree: 0 | 1) {
  const p = latexPower("p", row);

  if (degree === 0) {
    if (column < 0) return p + latexPower("V", -column);
    if (column === 0) return row === 0 ? "1" : p;
    return p + latexPower("F", column);
  }

  if (column < 0) return p + "d" + latexPower("V", -column);
  if (column === 0) return p + "d";
  return p + latexPower("F", column) + "d";
}

function BasisTerm({
  column,
  row,
  degree,
}: BasisPoint & { degree: 0 | 1 }) {
  return <Latex formula={latexTerm({ column, row }, degree)} />;
}

function plainPower(glyph: string, exponent: number) {
  if (exponent === 0) return "";
  return exponent === 1 ? glyph : `${glyph}^${exponent}`;
}

function plainTerm({ column, row }: BasisPoint, degree: 0 | 1) {
  const p = plainPower("p", row);

  if (degree === 0) {
    if (column < 0) return `${p}${plainPower("V", -column)}`;
    if (column === 0) return row === 0 ? "1" : p;
    return `${p}${plainPower("F", column)}`;
  }

  if (column < 0) return `${p}d${plainPower("V", -column)}`;
  if (column === 0) return `${p}d`;
  return `${p}${plainPower("F", column)}d`;
}

function imageOf(point: BasisPoint): BasisPoint {
  return {
    column: point.column,
    row: point.column > 0 ? point.row + point.column : point.row,
  };
}

function keyOf(point: BasisPoint) {
  return `${point.column}:${point.row}`;
}

function polynomialPointsFor(key: PolynomialDominoKey, degree: 0 | 1) {
  return polynomialDominoPoints[key][degree];
}

function polynomialPointAt(
  key: PolynomialDominoKey,
  degree: 0 | 1,
  point: PointCoordinate,
) {
  return polynomialPointsFor(key, degree).find(
    (candidate) => keyOf(candidate.point) === `${point.column}:${point.row}`,
  ) ?? null;
}

function liesInPolynomialDomino(
  point: PointCoordinate,
  degree: 0 | 1,
  key: PolynomialDominoKey,
) {
  return polynomialPointAt(key, degree, point) !== null;
}

function liesInPolynomialCoimage(point: BasisPoint, key: PolynomialDominoKey) {
  return liesInPolynomialDomino(point, 0, key)
    && liesInPolynomialDomino(point, 1, key);
}

function liesInFiltration(point: PointCoordinate, level: FiltrationLevel) {
  return point.row + Math.max(-point.column, 0) >= level;
}

function liesInElementaryDomino(
  point: PointCoordinate,
  degree: 0 | 1,
  index: ElementaryIndex,
) {
  if (degree === 0) return point.row === 0 && point.column <= 0;
  return point.row === 0 && point.column <= -index;
}

function liesInDistinguishedDomino(
  point: PointCoordinate,
  degree: 0 | 1,
  domino: DistinguishedDominoSpec,
) {
  if (degree === 0) {
    return point.row + Math.max(point.column, 0) < domino.length;
  }

  return point.row < domino.length
    && point.row + point.column < 1 - domino.j;
}

function elementaryMapStart(index: ElementaryIndex): 0 | 1 | 2 {
  return Math.max(index, 0) as 0 | 1 | 2;
}

function liesInElementaryMap(point: BasisPoint, index: ElementaryIndex) {
  return point.row === 0 && point.column <= -elementaryMapStart(index);
}

function distinguishedMapStart(
  domino: DistinguishedDominoSpec,
  row: number,
): 0 | 1 | 2 | 3 {
  return Math.max(domino.j + row, 0) as 0 | 1 | 2 | 3;
}

function liesInDistinguishedCoimage(
  point: BasisPoint,
  domino: DistinguishedDominoSpec,
) {
  return liesInDistinguishedDomino(point, 0, domino)
    && liesInDistinguishedDomino(imageOf(point), 1, domino);
}

function preimageOf(point: BasisPoint): BasisPoint | null {
  if (point.column <= 0) return point;

  const sourceRow = point.row - point.column;
  return sourceRow < 0 ? null : { column: point.column, row: sourceRow };
}

function liesInDistinguishedImage(
  point: BasisPoint,
  domino: DistinguishedDominoSpec,
) {
  if (!liesInDistinguishedDomino(point, 1, domino)) return false;

  const source = preimageOf(point);
  return source !== null && liesInDistinguishedCoimage(source, domino);
}

function liesInQuotientCoimage(point: BasisPoint, level: FiltrationLevel) {
  return !liesInFiltration(point, level)
    && !liesInFiltration(imageOf(point), level);
}

function liesInQuotientImage(point: BasisPoint, level: FiltrationLevel) {
  if (liesInFiltration(point, level)) return false;

  const source = preimageOf(point);
  return source !== null && liesInQuotientCoimage(source, level);
}

function liesInWholeImage(point: BasisPoint) {
  return preimageOf(point) !== null;
}

function distinguishedPositiveCoimagePoints(domino: DistinguishedDominoSpec) {
  return columns.flatMap((column) => {
    if (column <= 0) return [];

    return sourceRowsByColumn[column]
      .map((row) => ({ column, row }))
      .filter((point) => liesInDistinguishedCoimage(point, domino));
  });
}

function distinguishedPositiveExtents(domino: DistinguishedDominoSpec) {
  return distinguishedPositiveCoimagePoints(domino).reduce<Map<number, number>>(
    (byRow, point) => {
      const diagonalRow = point.row + point.column;
      byRow.set(diagonalRow, Math.max(byRow.get(diagonalRow) ?? 0, point.column));
      return byRow;
    },
    new Map(),
  );
}

function distinguishedImageEnd(domino: DistinguishedDominoSpec, row: number) {
  return Math.min(row, -domino.j - row);
}

function imageEndClass(column: number) {
  if (column < 0) return `distinguished-end-n${-column}`;
  if (column > 0) return `distinguished-end-p${column}`;
  return "distinguished-end-0";
}

function operatorImage(
  point: BasisPoint,
  degree: 0 | 1,
  operator: RingOperator,
): PointCoordinate {
  if (degree === 1) {
    return operator === "F"
      ? { column: point.column + 1, row: point.row }
      : { column: point.column - 1, row: point.row + 1 };
  }

  if (operator === "F") {
    return point.column < 0
      ? { column: point.column + 1, row: point.row + 1 }
      : { column: point.column + 1, row: point.row };
  }

  return point.column > 0
    ? { column: point.column - 1, row: point.row + 1 }
    : { column: point.column - 1, row: point.row };
}

function operatorIsNonzero(
  point: BasisPoint,
  degree: 0 | 1,
  operator: RingOperator,
  quotientLevel: FiltrationLevel | null,
  elementaryIndex: ElementaryIndex | null,
  distinguishedDomino: DistinguishedDominoSpec | null,
  polynomialDomino: PolynomialDominoKey | null,
) {
  const image = operatorImage(point, degree, operator);

  if (polynomialDomino !== null) {
    return liesInPolynomialDomino(image, degree, polynomialDomino);
  }

  if (quotientLevel !== null) {
    return !liesInFiltration(image, quotientLevel);
  }

  if (elementaryIndex !== null) {
    return liesInElementaryDomino(image, degree, elementaryIndex);
  }

  if (distinguishedDomino !== null) {
    return liesInDistinguishedDomino(image, degree, distinguishedDomino);
  }

  return true;
}

function columnClass(column: Column) {
  if (column < 0) return `column-n${-column}`;
  if (column > 0) return `column-p${column}`;
  return "column-0";
}

function levelClass(point: BasisPoint, degree: 0 | 1) {
  const level = degree === 0 && point.column < 0
    ? point.row - point.column
    : point.row;
  return level < 0 ? `level-n${-level}` : `level-${level}`;
}

function OperatorArrows({
  anchor,
  degree,
  showF,
  showV,
}: {
  anchor: BasisPoint;
  degree: 0 | 1;
  showF: boolean;
  showV: boolean;
}) {
  return (
    <div className="operator-arrows" aria-hidden="true">
      <div className={`operator-origin ${columnClass(anchor.column)} ${levelClass(anchor, degree)}`}>
        {showF ? (
          <>
            <span className="operator-vector vector-f" />
            <i className="operator-label operator-label-f">F</i>
          </>
        ) : null}
        {showV ? (
          <>
            <span className="operator-vector vector-v" />
            <i className="operator-label operator-label-v">V</i>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MapRoleLabel({ role }: { role: "coim" | "im" }) {
  const accessibleRole = role === "coim" ? "co-image" : "image";

  return (
    <span
      className={`map-role-label ${role === "coim" ? "coimage-role-label" : "image-role-label"}`}
      aria-label={`${accessibleRole} of d`}
    >
      <Latex formula={"\\operatorname{" + role + "}(d)"} />
    </span>
  );
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

function svgPoints(points: PolygonPoint[]) {
  return points
    .map(([x, y]) => `${roundCoordinate(x)},${roundCoordinate(y)}`)
    .join(" ");
}

function roundedPolygonPath(points: PolygonPoint[], radius: number) {
  const corners = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous[0] - point[0], previous[1] - point[1]);
    const nextLength = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const offset = Math.min(radius, previousLength / 2, nextLength / 2);
    const start: PolygonPoint = [
      point[0] + ((previous[0] - point[0]) / previousLength) * offset,
      point[1] + ((previous[1] - point[1]) / previousLength) * offset,
    ];
    const end: PolygonPoint = [
      point[0] + ((next[0] - point[0]) / nextLength) * offset,
      point[1] + ((next[1] - point[1]) / nextLength) * offset,
    ];

    return { point, start, end };
  });

  const first = corners[0];
  return [
    `M ${roundCoordinate(first.start[0])} ${roundCoordinate(first.start[1])}`,
    ...corners.flatMap((corner, index) => {
      const nextCorner = corners[(index + 1) % corners.length];
      return [
        `Q ${roundCoordinate(corner.point[0])} ${roundCoordinate(corner.point[1])} ${roundCoordinate(corner.end[0])} ${roundCoordinate(corner.end[1])}`,
        `L ${roundCoordinate(nextCorner.start[0])} ${roundCoordinate(nextCorner.start[1])}`,
      ];
    }),
    "Z",
  ].join(" ");
}

function cssPolygon(points: PolygonPoint[]) {
  return `polygon(${points
    .map(([x, y]) => `${roundCoordinate(x)}px ${roundCoordinate(y)}px`)
    .join(", ")})`;
}

function usePlotGeometry<T extends Element>(
  overlayRef: RefObject<T | null>,
  degree: 0 | 1,
  level: FiltrationLevel,
) {
  const [geometry, setGeometry] = useState<PlotGeometry | null>(null);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const plot = overlay?.parentElement;
    const origin = plot?.querySelector<HTMLElement>(".lattice-node.column-0.level-0");
    const next = plot?.querySelector<HTMLElement>(".lattice-node.column-p1.level-0");

    if (!overlay || !plot || !origin || !next) return;

    const updateGeometry = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const originRect = origin.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const width = overlayRect.width;
      const height = overlayRect.height;
      const centerX = originRect.left + originRect.width / 2 - overlayRect.left;
      const baselineY = originRect.top + originRect.height / 2 - overlayRect.top;
      const step = nextRect.left - originRect.left;
      const apexX = centerX - level * step;
      const filtrationY = baselineY - level * step;
      const idealPolygon: PolygonPoint[] = degree === 0
        ? apexX > 0
          ? [[0, 0], [width, 0], [width, filtrationY], [apexX, filtrationY], [0, filtrationY - apexX]]
          : [[0, 0], [width, 0], [width, filtrationY], [0, filtrationY]]
        : apexX > 0
          ? [[0, 0], [width, 0], [width, filtrationY], [centerX, filtrationY], [apexX, baselineY], [0, baselineY]]
          : [[0, 0], [width, 0], [width, filtrationY], [centerX, filtrationY], [0, baselineY + apexX]];
      const quotientPolygon: PolygonPoint[] = degree === 0
        ? apexX > 0
          ? [[apexX, filtrationY], [width, filtrationY], [width, baselineY], [centerX, baselineY]]
          : [[0, filtrationY], [width, filtrationY], [width, baselineY], [centerX, baselineY], [0, baselineY - centerX]]
        : apexX > 0
          ? [[0, baselineY], [apexX, baselineY], [centerX, filtrationY], [width, filtrationY], [width, height], [0, height]]
          : [[0, baselineY + apexX], [centerX, filtrationY], [width, filtrationY], [width, height], [0, height]];
      const nextGeometry: PlotGeometry = {
        baselineY,
        centerX,
        height,
        idealPoints: svgPoints(idealPolygon),
        quotientClipPath: cssPolygon(quotientPolygon),
        step,
        viewBox: `0 0 ${width} ${height}`,
        width,
      };

      setGeometry((current) => current?.idealPoints === nextGeometry.idealPoints
        && current.quotientClipPath === nextGeometry.quotientClipPath
        && current.viewBox === nextGeometry.viewBox
        ? current
        : nextGeometry);
    };

    updateGeometry();
    const observer = new ResizeObserver(updateGeometry);
    observer.observe(plot);
    window.addEventListener("resize", updateGeometry);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateGeometry);
    };
  }, [degree, level, overlayRef]);

  return geometry;
}

function IdealRegion({
  degree,
  level,
  variant,
}: {
  degree: 0 | 1;
  level: FiltrationLevel;
  variant: IdealView["kind"];
}) {
  const overlayRef = useRef<SVGSVGElement>(null);
  const geometry = usePlotGeometry(overlayRef, degree, level);

  return (
    <svg
      ref={overlayRef}
      className={`ideal-region ${variant}-region`}
      viewBox={geometry?.viewBox ?? "0 0 1 1"}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {geometry ? <polygon points={geometry.idealPoints} /> : null}
    </svg>
  );
}

function QuotientSpaceControl({
  level,
  onPreview,
}: {
  level: FiltrationLevel;
  onPreview: (active: boolean) => void;
}) {
  const controlRef = useRef<HTMLButtonElement>(null);
  const geometry = usePlotGeometry(controlRef, 0, level);

  return (
    <button
      ref={controlRef}
      type="button"
      className={`quotient-space-control${geometry ? " is-ready" : ""}`}
      style={geometry ? { clipPath: geometry.quotientClipPath } : undefined}
      aria-label={`Preview the image and co-image of d on R ${level}`}
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onMouseDown={(event) => event.preventDefault()}
      onFocus={() => onPreview(true)}
      onBlur={() => onPreview(false)}
    />
  );
}

function QuotientMapOutline({
  degree,
  level,
}: {
  degree: 0 | 1;
  level: FiltrationLevel;
}) {
  const overlayRef = useRef<SVGSVGElement>(null);
  const geometry = usePlotGeometry(overlayRef, degree, level);
  const span = geometry ? (level - 1) * geometry.step : 0;
  const outlinePoints: PolygonPoint[] | null = geometry && level > 1
    ? degree === 0
      ? [
          [geometry.centerX - span, geometry.baselineY - span],
          [geometry.centerX, geometry.baselineY - span],
          [geometry.centerX + span, geometry.baselineY],
          [geometry.centerX, geometry.baselineY],
        ]
      : [
          [geometry.centerX - span, geometry.baselineY],
          [geometry.centerX, geometry.baselineY],
          [geometry.centerX + span, geometry.baselineY - span],
          [geometry.centerX, geometry.baselineY - span],
        ]
    : null;
  const outlinePath = outlinePoints ? roundedPolygonPath(outlinePoints, 13) : null;

  return (
    <svg
      ref={overlayRef}
      className={`quotient-map-outline ${degree === 0 ? "coimage-outline" : "image-outline"}`}
      viewBox={geometry?.viewBox ?? "0 0 1 1"}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {geometry && level === 1 ? (
        <circle cx={geometry.centerX} cy={geometry.baselineY} r="13" />
      ) : null}
      {outlinePath ? <path d={outlinePath} /> : null}
    </svg>
  );
}

function ElementarySpaceControl({
  index,
  onPreview,
}: {
  index: ElementaryIndex;
  onPreview: (active: boolean) => void;
}) {
  const start = elementaryMapStart(index);

  return (
    <button
      type="button"
      className={`elementary-space-control elementary-start-${start}`}
      aria-label={`Preview the image and co-image of d on U ${index}`}
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onMouseDown={(event) => event.preventDefault()}
      onFocus={() => onPreview(true)}
      onBlur={() => onPreview(false)}
    />
  );
}

function ElementaryMapChain({
  degree,
  index,
}: {
  degree: 0 | 1;
  index: ElementaryIndex;
}) {
  const start = elementaryMapStart(index);

  return (
    <span
      className={`elementary-map-chain ${degree === 0 ? "coimage-chain" : "image-chain"} elementary-start-${start}`}
      aria-hidden="true"
    />
  );
}

function DistinguishedSpaceControls({
  domino,
  onPreview,
}: {
  domino: DistinguishedDominoSpec;
  onPreview: (active: boolean) => void;
}) {
  const extensions = distinguishedPositiveExtents(domino);

  return (
    <>
      {Array.from({ length: domino.length }, (_, row) => {
        if (extensions.has(row)) return null;

        const start = distinguishedMapStart(domino, row);

        return (
          <button
            type="button"
            className={`elementary-space-control distinguished-space-control elementary-start-${start} distinguished-row-${row}`}
            aria-label={`Preview chain ${row + 1} in the image and co-image of d on U ${domino.key}`}
            key={`distinguished-control-${row}`}
            onMouseEnter={() => onPreview(true)}
            onMouseLeave={() => onPreview(false)}
            onMouseDown={(event) => event.preventDefault()}
            onFocus={() => onPreview(true)}
            onBlur={() => onPreview(false)}
          />
        );
      })}
      {[...extensions].map(([diagonalRow, endColumn]) => (
        <button
          type="button"
          className={`distinguished-extension-control distinguished-row-${diagonalRow} distinguished-extension-${endColumn}`}
          aria-label={`Preview the extended co-image chain ${diagonalRow + 1} of d on U ${domino.key}`}
          key={`distinguished-extension-control-${diagonalRow}`}
          onMouseEnter={() => onPreview(true)}
          onMouseLeave={() => onPreview(false)}
          onMouseDown={(event) => event.preventDefault()}
          onFocus={() => onPreview(true)}
          onBlur={() => onPreview(false)}
        />
      ))}
    </>
  );
}

function DistinguishedMapChains({
  degree,
  domino,
}: {
  degree: 0 | 1;
  domino: DistinguishedDominoSpec;
}) {
  const extensionRows = distinguishedPositiveExtents(domino);

  return Array.from({ length: domino.length }, (_, row) => {
    if (degree === 0 && extensionRows.has(row)) return null;

    const start = distinguishedMapStart(domino, row);
    const imageEnd = distinguishedImageEnd(domino, row);

    return (
      <span
        className={`elementary-map-chain distinguished-map-chain ${degree === 0 ? `coimage-chain elementary-start-${start}` : `image-chain ${imageEndClass(imageEnd)}`} distinguished-row-${row}`}
        aria-hidden="true"
        key={`distinguished-map-${degree}-${row}`}
      />
    );
  });
}

function DistinguishedCoimageExtensions({
  domino,
}: {
  domino: DistinguishedDominoSpec;
}) {
  const overlayRef = useRef<SVGSVGElement>(null);
  const geometry = usePlotGeometry(overlayRef, 0, 1);
  const extensions = distinguishedPositiveExtents(domino);
  const raySteps = geometry
    ? Math.ceil(Math.max(geometry.centerX, geometry.baselineY) / geometry.step) + 3
    : 0;

  return (
    <svg
      ref={overlayRef}
      className="distinguished-coimage-extension"
      viewBox={geometry?.viewBox ?? "0 0 1 1"}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {geometry ? [...extensions].map(([diagonalRow, endColumn]) => {
        const originX = geometry.centerX;
        const originY = geometry.baselineY - diagonalRow * geometry.step;
        const points = svgPoints([
          [originX - raySteps * geometry.step, originY - raySteps * geometry.step],
          [
            originX + endColumn * geometry.step,
            originY + endColumn * geometry.step,
          ],
        ]);

        return (
          <g key={`distinguished-extension-${diagonalRow}`}>
            <polyline className="coimage-extension-edge" points={points} />
            <polyline className="coimage-extension-fill" points={points} />
          </g>
        );
      }) : null}
    </svg>
  );
}

type PolynomialChainSpec = {
  imageEnd: -3 | -2 | -1 | 0;
  row: 0 | 1;
  start: 0 | 1 | 2 | 3;
};

function polynomialChainSpecs(key: PolynomialDominoKey): readonly PolynomialChainSpec[] {
  const { j, vPower } = polynomialDominoSpecs[key];
  const targetStart = (j - vPower - 1) as 1 | 2 | 3;

  return [
    { start: 0, row: 0, imageEnd: 0 },
    {
      start: targetStart,
      row: 1,
      imageEnd: -targetStart as -3 | -2 | -1,
    },
  ];
}

function polynomialRowClass(row: PolynomialChainSpec["row"]) {
  return `distinguished-row-${row}`;
}

function PolynomialSpaceControls({
  dominoKey,
  onPreview,
}: {
  dominoKey: PolynomialDominoKey;
  onPreview: (active: boolean) => void;
}) {
  return polynomialChainSpecs(dominoKey).map((chain, index) => (
    <button
      type="button"
      className={`elementary-space-control distinguished-space-control polynomial-space-control elementary-start-${chain.start} ${polynomialRowClass(chain.row)}`}
      aria-label={`Preview chain ${index + 1} in the image and co-image of d on U ${dominoKey}`}
      key={`polynomial-control-${dominoKey}-${index}`}
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onMouseDown={(event) => event.preventDefault()}
      onFocus={() => onPreview(true)}
      onBlur={() => onPreview(false)}
    />
  ));
}

function PolynomialMapChains({
  degree,
  dominoKey,
}: {
  degree: 0 | 1;
  dominoKey: PolynomialDominoKey;
}) {
  return polynomialChainSpecs(dominoKey).map((chain, index) => (
    <span
      className={`elementary-map-chain distinguished-map-chain ${degree === 0
        ? `coimage-chain elementary-start-${chain.start}`
        : `image-chain ${imageEndClass(chain.imageEnd)}`} ${polynomialRowClass(chain.row)}`}
      aria-hidden="true"
      key={`polynomial-map-${dominoKey}-${degree}-${index}`}
    />
  ));
}

function PolynomialTails({
  degree,
}: {
  degree: 0 | 1;
}) {
  const tails: BasisPoint[] = [
    { column: -3, row: 0 },
    { column: -3, row: 1 },
  ];

  return tails.map((point, index) => (
    <span
      className={`ellipsis polynomial-tail ${degree === 0
        ? "source-polynomial-tail"
        : "target-polynomial-tail"} ${columnClass(point.column)} ${levelClass(point, degree)}`}
      aria-hidden="true"
      key={`polynomial-tail-${degree}-${index}`}
    >
      ···
    </span>
  ));
}

function FiltrationTerm({ level }: { level: FiltrationLevel }) {
  return <Latex formula={"V^{" + level + "}+dV^{" + level + "}"} />;
}

function FiltrationIdeal() {
  return <Latex className="control-formula" formula={"V^nR+dV^nR"} />;
}

function FiltrationStatement({ language }: { language: Language }) {
  return language === "en" ? (
    <><Latex formula="R" /> has a filtration given by the right ideals <FiltrationIdeal />.</>
  ) : (
    <><Latex formula="R" /> 具有由右理想 <FiltrationIdeal /> 给出的滤过。</>
  );
}

function TruncationStatement({ language }: { language: Language }) {
  return language === "en" ? (
    <>
      Define the truncation <Latex formula={"R_n:=R/(V^nR+dV^nR)"} />.
    </>
  ) : (
    <>
      定义截断 <Latex formula={"R_n:=R/(V^nR+dV^nR)"} />。
    </>
  );
}

function CompletedRaynaudRingFormula() {
  return <Latex className="completion-formula" formula={"\\widehat{R}:=\\varprojlim_n R_n"} />;
}

function CompletionStatement({ language }: { language: Language }) {
  return language === "en" ? (
    <>
      Define the completion <CompletedRaynaudRingFormula />; in this project, we visualize
      {" "}<Latex formula={"\\widehat{R}"} /> using the same lattice as <Latex formula="R" />.
    </>
  ) : (
    <>
      定义完备化 <CompletedRaynaudRingFormula />；在本项目中，我们使用与 <Latex formula="R" />
      {" "}相同的格点图来表示 <Latex formula={"\\widehat{R}"} />。
    </>
  );
}

function DominoStatement({ language }: { language: Language }) {
  const elementaryDomino = (
    <Latex formula={"U_j:=\\widehat{R}/\\widehat{R}(F,dV^{j-1})"} />
  );
  const domino = <Latex formula={"U=(d:U^0\\to U^1)"} />;
  const dimension = (
    <Latex formula={"\\dim(U):=\\dim_k(U^0/VU^0)=\\dim_k(U^1[F])"} />
  );

  return language === "en" ? (
    <>
      Define the elementary domino as the quotient {elementaryDomino}, concentrated in degrees
      {" "}<Latex formula="0" /> and <Latex formula="1" />. A domino is a two-term
      {" "}<Latex formula="R" />-module {domino} that is a finite iterated extension
      of elementary dominoes. Its dimension is {dimension}; equivalently, this is the
      length of its type sequence <Latex formula="J(U)" />.
    </>
  ) : (
    <>
      定义初等多米诺为商 {elementaryDomino}，它集中在次数 <Latex formula="0" /> 与
      {" "}<Latex formula="1" />。一般的多米诺是二项 <Latex formula="R" />-模
      {" "}{domino}，并且是初等多米诺的有限次迭代扩张。其维数定义为 {dimension}；
      等价地，它就是类型序列 <Latex formula="J(U)" /> 的长度。
    </>
  );
}

function ElementaryDominoTutorial({ language }: { language: Language }) {
  return language === "en" ? (
    <>
      The dominoes <Latex formula="U_j" /> shown here are the dimension-one dominoes.
      Their index is the Euler characteristic
      {" "}<Latex formula={"j=\\dim_k\\ker(d)-\\dim_k\\operatorname{coker}(d)"} />.
    </>
  ) : (
    <>
      这里展示的 <Latex formula="U_j" /> 是一维多米诺。其下标就是 Euler 特征
      {" "}<Latex formula={"j=\\dim_k\\ker(d)-\\dim_k\\operatorname{coker}(d)"} />。
    </>
  );
}

function DistinguishedDominoTutorial({ language }: { language: Language }) {
  const typeSequence = <Latex formula={"J=(j,j+2,\\ldots,j+2n-2)"} />;
  const distinguished = (
    <Latex formula={"U_J:=\\widehat R/\\widehat R(F^n,dV^{j-1})"} />
  );

  return language === "en" ? (
    <>
      For the adjacent type sequence {typeSequence}, the distinguished domino
      {" "}{distinguished} is the unique domino of type <Latex formula="J" /> with
      maximal <Latex formula="p" />-exponent <Latex formula="n" />. It is indecomposable
      and has dimension <Latex formula="n" />.
    </>
  ) : (
    <>
      对于相邻类型序列 {typeSequence}，特选多米诺 {distinguished} 是类型
      {" "}<Latex formula="J" /> 中具有最大 <Latex formula="p" />-指数
      {" "}<Latex formula="n" /> 的唯一多米诺。它不可分解，且维数为
      {" "}<Latex formula="n" />。
    </>
  );
}

function TwoDimensionalDominoTutorial({ language }: { language: Language }) {
  const extension = (
    <Latex formula={"0\\to U_{j_2}\\to U_{j_1,j_2;f}\\to U_{j_1}\\to0"} />
  );
  const polynomial = (
    <Latex formula={"0\\ne f(V)\\in k_\\sigma[V]_{\\le j_2-j_1-2}"} />
  );

  return language === "en" ? (
    <>
      Every indecomposable two-dimensional domino is a nonsplit extension
      {" "}{extension}, with <Latex formula={"j_2-j_1\\ge2"} />. In
      {" "}<Latex formula={"U_{j_1,j_2;f}"} />, the first two indices give the type
      sequence and {polynomial} records the extension class, up to a change of frame.
    </>
  ) : (
    <>
      每个不可分解的二维多米诺都是一个非分裂扩张 {extension}，其中
      {" "}<Latex formula={"j_2-j_1\\ge2"} />。在记号
      {" "}<Latex formula={"U_{j_1,j_2;f}"} /> 中，前两个下标给出类型序列，而
      {" "}{polynomial} 在换标架作用下记录扩张类。
    </>
  );
}

function RingDegreeLabel({
  degree,
  quotientLevel,
  elementaryIndex,
  distinguishedDomino,
  polynomialDomino,
}: {
  degree: 0 | 1;
  quotientLevel: FiltrationLevel | null;
  elementaryIndex: ElementaryIndex | null;
  distinguishedDomino: DistinguishedDominoSpec | null;
  polynomialDomino: PolynomialDominoKey | null;
}) {
  if (polynomialDomino !== null) {
    return <Latex formula={"U_{" + polynomialDomino + "}^{" + degree + "}"} />;
  }

  if (distinguishedDomino !== null) {
    return (
      <Latex formula={"U_{" + distinguishedDomino.key + "}^{" + degree + "}"} />
    );
  }

  if (elementaryIndex !== null) {
    return (
      <Latex formula={"U_{" + elementaryIndex + "}^{" + degree + "}"} />
    );
  }

  if (quotientLevel === null) {
    return <Latex formula={"R^{" + degree + "}"} />;
  }

  return <Latex formula={"R_{" + quotientLevel + "}^{" + degree + "}"} />;
}

function RaynaudRingFormula() {
  return (
    <Latex
      className="definition-formula"
      displayMode
      formula={"R:=W_\\sigma\\{F,V,d\\}/(FV=VF=p,\\ d^2=0,\\ FdV=d)=R^0\\oplus R^1"}
    />
  );
}

function RaynaudSetup({ language }: { language: Language }) {
  if (language === "zh") {
    return (
      <>
        <p className="setup-copy">
          <strong className="setup-kicker">设定：</strong>
          Raynaud 环是非交换分次 <Latex formula={"\\mathbb{Z}_p"} />-代数
        </p>
        <div className="definition-display"><RaynaudRingFormula /></div>
        <p className="setup-copy">
          其中 <Latex formula="W" /> 表示特征为 <Latex formula="p" /> 的完美域
          {" "}<Latex formula="k" /> 上的 Witt 向量环。下标 <Latex formula={"\\sigma"} />
          {" "}表示 Frobenius 半线性条件；在本可视化中我们略去这些条件。
        </p>
      </>
    );
  }

  return (
    <>
      <p className="setup-copy">
        <strong className="setup-kicker">Setup:</strong>
        The Raynaud ring is the noncommutative graded{" "}
        <Latex formula={"\\mathbb{Z}_p"} />-algebra
      </p>
      <div className="definition-display"><RaynaudRingFormula /></div>
      <p className="setup-copy">
        where <Latex formula="W" /> denotes the ring of Witt vectors of a perfect field
        {" "}<Latex formula="k" /> of characteristic <Latex formula="p" />. The subscript
        {" "}<Latex formula={"\\sigma"} /> denotes the Frobenius
        {" "}semilinearity conditions, which we suppress for this visualization project.
      </p>
    </>
  );
}

export default function Home() {
  const { language, setLanguage } = useSiteLanguage();
  const [openTutorialSection, setOpenTutorialSection] = useState<TutorialSection | null>("filtration");
  const [openDominoTopic, setOpenDominoTopic] = useState<DominoTopic | null>(null);
  const [preview, setPreview] = useState<Selection | null>(null);
  const [automaticPreview, setAutomaticPreview] = useState<AutomaticPreview | null>(null);
  const automaticPreviewSequence = useRef(0);
  const automaticPreviewHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const automaticPreviewFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [operatorsEnabled, setOperatorsEnabled] = useState(true);
  const [idealView, setIdealView] = useState<IdealView | null>(null);
  const [elementaryIndex, setElementaryIndex] = useState<ElementaryIndex | null>(null);
  const [distinguishedKey, setDistinguishedKey] = useState<DistinguishedDominoKey | null>(null);
  const [polynomialKey, setPolynomialKey] = useState<PolynomialDominoKey | null>(null);
  const polynomialVPower = polynomialKey === null
    ? 0
    : polynomialDominoSpecs[polynomialKey].vPower;
  const distinguishedDomino = distinguishedDominoes.find(
    (domino) => domino.key === distinguishedKey,
  ) ?? null;
  const filtrationLevel = idealView?.kind === "filtration" ? idealView.level : null;
  const quotientLevel = idealView?.kind === "quotient" ? idealView.level : null;
  const activePreview = preview ?? automaticPreview?.selection ?? null;
  const automaticPreviewIsFading = preview === null && automaticPreview?.phase === "fading";
  const hoveredPoint = activePreview?.type === "point" ? activePreview.point : null;
  const candidateImage = hoveredPoint
    ? polynomialKey !== null
      ? polynomialPointAt(polynomialKey, 1, hoveredPoint)?.point ?? null
      : imageOf(hoveredPoint)
    : null;
  const hoveredImage = candidateImage
    && (quotientLevel === null || !liesInFiltration(candidateImage, quotientLevel))
    && (elementaryIndex === null || liesInElementaryDomino(candidateImage, 1, elementaryIndex))
    && (distinguishedDomino === null
      || liesInDistinguishedDomino(candidateImage, 1, distinguishedDomino))
    && (polynomialKey === null
      || liesInPolynomialDomino(candidateImage, 1, polynomialKey))
    ? candidateImage
    : null;
  const showWholeImage = activePreview?.type === "whole"
    && quotientLevel === null
    && elementaryIndex === null
    && distinguishedDomino === null
    && polynomialKey === null;
  const showQuotientMap = activePreview?.type === "quotient-space" && quotientLevel !== null;
  const showElementaryMap = activePreview?.type === "elementary-space" && elementaryIndex !== null;
  const showDistinguishedMap = activePreview?.type === "distinguished-space"
    && distinguishedDomino !== null;
  const showPolynomialMap = activePreview?.type === "polynomial-space"
    && polynomialKey !== null;
  const showMapRegions = showWholeImage
    || showQuotientMap
    || showElementaryMap
    || showDistinguishedMap
    || showPolynomialMap;
  const sourceShowsF = hoveredPoint !== null
    && operatorIsNonzero(
      hoveredPoint,
      0,
      "F",
      quotientLevel,
      elementaryIndex,
      distinguishedDomino,
      polynomialKey,
    );
  const sourceShowsV = hoveredPoint !== null
    && operatorIsNonzero(
      hoveredPoint,
      0,
      "V",
      quotientLevel,
      elementaryIndex,
      distinguishedDomino,
      polynomialKey,
    );
  const targetShowsF = hoveredImage !== null
    && operatorIsNonzero(
      hoveredImage,
      1,
      "F",
      quotientLevel,
      elementaryIndex,
      distinguishedDomino,
      polynomialKey,
    );
  const targetShowsV = hoveredImage !== null
    && operatorIsNonzero(
      hoveredImage,
      1,
      "V",
      quotientLevel,
      elementaryIndex,
      distinguishedDomino,
      polynomialKey,
    );

  const clearAutomaticPreviewTimers = () => {
    if (automaticPreviewHoldTimer.current !== null) {
      clearTimeout(automaticPreviewHoldTimer.current);
      automaticPreviewHoldTimer.current = null;
    }
    if (automaticPreviewFadeTimer.current !== null) {
      clearTimeout(automaticPreviewFadeTimer.current);
      automaticPreviewFadeTimer.current = null;
    }
  };

  const startAutomaticPreview = (selection: MapSelection | null) => {
    clearAutomaticPreviewTimers();
    automaticPreviewSequence.current += 1;

    if (selection === null) {
      setAutomaticPreview(null);
      return;
    }

    const sequence = automaticPreviewSequence.current;
    setAutomaticPreview({ phase: "visible", selection, sequence });
    automaticPreviewHoldTimer.current = setTimeout(() => {
      setAutomaticPreview((current) => current?.sequence === sequence
        ? { ...current, phase: "fading" }
        : current);
    }, automaticPreviewHoldMs);
    automaticPreviewFadeTimer.current = setTimeout(() => {
      setAutomaticPreview((current) => current?.sequence === sequence ? null : current);
    }, automaticPreviewHoldMs + automaticPreviewFadeMs);
  };

  useEffect(() => () => {
    if (automaticPreviewHoldTimer.current !== null) {
      clearTimeout(automaticPreviewHoldTimer.current);
    }
    if (automaticPreviewFadeTimer.current !== null) {
      clearTimeout(automaticPreviewFadeTimer.current);
    }
  }, []);

  const toggleIdealView = (kind: IdealView["kind"], level: FiltrationLevel) => {
    const willSelect = idealView?.kind !== kind || idealView.level !== level;
    setPreview(null);
    setElementaryIndex(null);
    setDistinguishedKey(null);
    setPolynomialKey(null);
    setIdealView((current) => current?.kind === kind && current.level === level
      ? null
      : { kind, level });
    startAutomaticPreview(kind === "filtration"
      ? null
      : willSelect
        ? { type: "quotient-space" }
        : { type: "whole" });
  };

  const toggleElementaryDomino = (index: ElementaryIndex) => {
    const willSelect = elementaryIndex !== index;
    setPreview(null);
    setIdealView(null);
    setDistinguishedKey(null);
    setPolynomialKey(null);
    setElementaryIndex((current) => current === index ? null : index);
    startAutomaticPreview(willSelect ? { type: "elementary-space" } : { type: "whole" });
  };

  const toggleDistinguishedDomino = (key: DistinguishedDominoKey) => {
    const willSelect = distinguishedKey !== key;
    setPreview(null);
    setIdealView(null);
    setElementaryIndex(null);
    setPolynomialKey(null);
    setDistinguishedKey((current) => current === key ? null : key);
    startAutomaticPreview(willSelect ? { type: "distinguished-space" } : { type: "whole" });
  };

  const togglePolynomialDomino = (key: PolynomialDominoKey) => {
    const willSelect = polynomialKey !== key;
    setPreview(null);
    setIdealView(null);
    setElementaryIndex(null);
    setDistinguishedKey(null);
    setPolynomialKey((current) => current === key ? null : key);
    startAutomaticPreview(willSelect ? { type: "polynomial-space" } : { type: "whole" });
  };

  const toggleTutorialSection = (section: TutorialSection) => {
    setOpenTutorialSection((current) => current === section ? null : section);
  };

  const toggleDominoTopic = (topic: DominoTopic) => {
    setOpenDominoTopic((current) => current === topic ? null : topic);
  };

  return (
    <main className="page-shell" lang={language === "zh" ? "zh-CN" : "en"}>
      <header className="hero">
        <h1>{language === "en" ? "What is a domino?" : "什么是多米诺？"}</h1>
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

      <SiteMenu active="domino" language={language} />

      <section
        className="ring-definition"
        aria-label={language === "en" ? "Setup for the Raynaud ring" : "Raynaud 环的设定"}
      >
        <RaynaudSetup language={language} />
      </section>

      <div className="viewer-scroll">
        <section
          className="viewer"
          aria-label={language === "en" ? "Raynaud ring basis visualization" : "Raynaud 环基底可视化"}
        >
          <section className="lattice-panel source-panel" aria-labelledby="degree-zero">
            <header className="panel-heading">
              <h2 id="degree-zero">
                <RingDegreeLabel
                  degree={0}
                  quotientLevel={quotientLevel}
                  elementaryIndex={elementaryIndex}
                  distinguishedDomino={distinguishedDomino}
                  polynomialDomino={polynomialKey}
                />
              </h2>
            </header>

            <div className="plot-wrap">
              <div
                className={`lattice-plot source-plot${showWholeImage ? " is-whole" : ""}${automaticPreviewIsFading ? " is-auto-map-fading" : ""}${quotientLevel !== null ? " is-quotient" : ""}${elementaryIndex !== null ? " is-elementary" : ""}${distinguishedDomino !== null ? " is-distinguished" : ""}${polynomialKey !== null ? " is-polynomial" : ""}${polynomialVPower >= 1 ? " is-polynomial-v" : ""}${polynomialVPower >= 2 ? " is-polynomial-v2" : ""}`}
                onMouseLeave={() => setPreview(null)}
              >
                {quotientLevel === null
                && elementaryIndex === null
                && distinguishedDomino === null
                && polynomialKey === null ? (
                  <button
                    type="button"
                    className="whole-ring-control"
                    aria-label="Preview all of degree 0"
                    onMouseEnter={() => setPreview({ type: "whole" })}
                    onMouseLeave={() => setPreview(null)}
                    onMouseDown={(event) => event.preventDefault()}
                    onFocus={() => setPreview({ type: "whole" })}
                    onBlur={() => setPreview(null)}
                  >
                    <span className="source-region-edge source-region-edge-v" aria-hidden="true" />
                    <span className="source-region-edge source-region-edge-f" aria-hidden="true" />
                  </button>
                ) : null}
                {quotientLevel !== null ? (
                  <QuotientSpaceControl
                    level={quotientLevel}
                    onPreview={(active) => setPreview(active ? { type: "quotient-space" } : null)}
                  />
                ) : null}
                {elementaryIndex !== null ? (
                  <ElementarySpaceControl
                    index={elementaryIndex}
                    onPreview={(active) => setPreview(active ? { type: "elementary-space" } : null)}
                  />
                ) : null}
                {distinguishedDomino !== null ? (
                  <DistinguishedSpaceControls
                    domino={distinguishedDomino}
                    onPreview={(active) => setPreview(
                      active ? { type: "distinguished-space" } : null,
                    )}
                  />
                ) : null}
                {polynomialKey !== null ? (
                  <PolynomialSpaceControls
                    dominoKey={polynomialKey}
                    onPreview={(active) => setPreview(
                      active ? { type: "polynomial-space" } : null,
                    )}
                  />
                ) : null}
                {idealView ? (
                  <IdealRegion degree={0} level={idealView.level} variant={idealView.kind} />
                ) : null}
                {showQuotientMap && quotientLevel !== null ? (
                  <QuotientMapOutline degree={0} level={quotientLevel} />
                ) : null}
                {showElementaryMap && elementaryIndex !== null ? (
                  <ElementaryMapChain degree={0} index={elementaryIndex} />
                ) : null}
                {showDistinguishedMap && distinguishedDomino !== null ? (
                  <>
                    <DistinguishedMapChains degree={0} domino={distinguishedDomino} />
                    <DistinguishedCoimageExtensions domino={distinguishedDomino} />
                  </>
                ) : null}
                {showPolynomialMap && polynomialKey !== null ? (
                  <PolynomialMapChains degree={0} dominoKey={polynomialKey} />
                ) : null}
                {showMapRegions ? <MapRoleLabel role="coim" /> : null}
                {operatorsEnabled && hoveredPoint && (sourceShowsF || sourceShowsV) ? (
                  <OperatorArrows
                    key={`source-operators-${keyOf(hoveredPoint)}`}
                    anchor={hoveredPoint}
                    degree={0}
                    showF={sourceShowsF}
                    showV={sourceShowsV}
                  />
                ) : null}

                {polynomialKey !== null
                  ? polynomialPointsFor(polynomialKey, 0).map((basisPoint) => {
                    const { point } = basisPoint;
                    const targetPoint = polynomialPointAt(polynomialKey, 1, point);
                    const imageIsZero = targetPoint === null;
                    const pointSelection: Selection = { type: "point", point };
                    const isActive = hoveredPoint !== null
                      && keyOf(point) === keyOf(hoveredPoint);
                    const isCoimageMember = showPolynomialMap
                      && liesInPolynomialCoimage(point, polynomialKey);

                    return (
                      <button
                        type="button"
                        className={`lattice-node source-node ${columnClass(point.column)} ${levelClass(point, 0)} label-top${imageIsZero ? " maps-to-zero" : ""}${isActive ? " is-active" : ""}${isCoimageMember ? " is-coimage-member" : ""}`}
                        key={`source-${polynomialKey}-${point.column}-${point.row}`}
                        aria-label={`${basisPoint.plain} maps to ${targetPoint?.plain ?? "0"}`}
                        onMouseEnter={() => setPreview(pointSelection)}
                        onMouseLeave={() => setPreview(null)}
                        onMouseDown={(event) => event.preventDefault()}
                        onFocus={() => setPreview(pointSelection)}
                        onBlur={() => setPreview(null)}
                      >
                        <span className="point" aria-hidden="true" />
                        <span className="node-label">
                          <Latex formula={basisPoint.formula} />
                        </span>
                      </button>
                    );
                  })
                  : columns.flatMap((column) =>
                    sourceRowsByColumn[column].map((row) => {
                    const point: BasisPoint = { column, row };
                    const target = imageOf(point);
                    const imageIsZero = quotientLevel !== null
                      ? liesInFiltration(target, quotientLevel)
                      : elementaryIndex !== null
                        ? !liesInElementaryDomino(target, 1, elementaryIndex)
                        : distinguishedDomino !== null
                          && !liesInDistinguishedDomino(target, 1, distinguishedDomino);
                    const pointSelection: Selection = { type: "point", point };
                    const isActive = hoveredPoint !== null && keyOf(point) === keyOf(hoveredPoint);
                    const isCoimageMember = showWholeImage
                      || (showQuotientMap
                        && quotientLevel !== null
                        && liesInQuotientCoimage(point, quotientLevel))
                      || (showElementaryMap
                        && elementaryIndex !== null
                        && liesInElementaryMap(point, elementaryIndex))
                      || (showDistinguishedMap
                        && distinguishedDomino !== null
                        && liesInDistinguishedCoimage(point, distinguishedDomino));

                    if (quotientLevel !== null && liesInFiltration(point, quotientLevel)) {
                      return null;
                    }

                    if (elementaryIndex !== null
                      && !liesInElementaryDomino(point, 0, elementaryIndex)) {
                      return null;
                    }

                    if (distinguishedDomino !== null
                      && !liesInDistinguishedDomino(point, 0, distinguishedDomino)) {
                      return null;
                    }

                    return (
                      <button
                        type="button"
                        className={`lattice-node source-node ${columnClass(column)} ${levelClass(point, 0)} label-top${imageIsZero ? " maps-to-zero" : ""}${isActive ? " is-active" : ""}${isCoimageMember ? " is-coimage-member" : ""}`}
                        key={`source-${column}-${row}`}
                        aria-label={`${plainTerm(point, 0)} maps to ${imageIsZero ? "0" : plainTerm(target, 1)}`}
                        onMouseEnter={() => setPreview(pointSelection)}
                        onMouseLeave={() => setPreview(null)}
                        onMouseDown={(event) => event.preventDefault()}
                        onFocus={() => setPreview(pointSelection)}
                        onBlur={() => setPreview(null)}
                      >
                        <span className="point" aria-hidden="true" />
                        <span className="node-label">
                          <BasisTerm {...point} degree={0} />
                        </span>
                      </button>
                    );
                    }),
                  )}

                {polynomialKey !== null ? (
                  <PolynomialTails degree={0} />
                ) : null}

                {quotientLevel === null && polynomialKey === null ? (
                  <span className="ellipsis ellipsis-left source-ellipsis" aria-hidden="true">···</span>
                ) : null}
                {elementaryIndex === null
                && distinguishedDomino === null
                && polynomialKey === null ? (
                  <span className="ellipsis ellipsis-right" aria-hidden="true">···</span>
                ) : null}
                {quotientLevel === null
                && elementaryIndex === null
                && distinguishedDomino === null
                && polynomialKey === null ? (
                  <span className="ellipsis ellipsis-up" aria-hidden="true">⋮</span>
                ) : null}
              </div>
            </div>
          </section>

          <section
            className="mapping"
            aria-label={language === "en" ? "Left multiplication by d" : "左乘 d"}
          >
            <span className="mapping-label"><Latex formula="d" /></span>
            <span className="mapping-arrow" aria-hidden="true" />
          </section>

          <section className="lattice-panel target-panel" aria-labelledby="degree-one">
            <header className="panel-heading">
              <h2 id="degree-one">
                <RingDegreeLabel
                  degree={1}
                  quotientLevel={quotientLevel}
                  elementaryIndex={elementaryIndex}
                  distinguishedDomino={distinguishedDomino}
                  polynomialDomino={polynomialKey}
                />
              </h2>
              <button
                type="button"
                className="operator-toggle"
                aria-label={language === "en"
                  ? operatorsEnabled ? "Hide F and V directions" : "Show F and V directions"
                  : operatorsEnabled ? "隐藏 F、V 方向" : "显示 F、V 方向"}
                aria-pressed={operatorsEnabled}
                onClick={() => setOperatorsEnabled((current) => !current)}
              >
                <span className="toggle-origin" aria-hidden="true" />
                <span className="toggle-vector toggle-vector-f" aria-hidden="true" />
                <span className="toggle-vector toggle-vector-v" aria-hidden="true" />
                <i className="toggle-label toggle-label-f" aria-hidden="true">F</i>
                <i className="toggle-label toggle-label-v" aria-hidden="true">V</i>
              </button>
            </header>

            <div className="plot-wrap">
              <div className={`lattice-plot target-plot${automaticPreviewIsFading ? " is-auto-map-fading" : ""}${quotientLevel !== null ? " is-quotient" : ""}${elementaryIndex !== null ? " is-elementary" : ""}${distinguishedDomino !== null ? " is-distinguished" : ""}${polynomialKey !== null ? " is-polynomial" : ""}${polynomialVPower >= 1 ? " is-polynomial-v" : ""}${polynomialVPower >= 2 ? " is-polynomial-v2" : ""}`}>
                {idealView ? (
                  <IdealRegion degree={1} level={idealView.level} variant={idealView.kind} />
                ) : null}
                {showQuotientMap && quotientLevel !== null ? (
                  <QuotientMapOutline degree={1} level={quotientLevel} />
                ) : null}
                {showElementaryMap && elementaryIndex !== null ? (
                  <ElementaryMapChain degree={1} index={elementaryIndex} />
                ) : null}
                {showDistinguishedMap && distinguishedDomino !== null ? (
                  <DistinguishedMapChains degree={1} domino={distinguishedDomino} />
                ) : null}
                {showPolynomialMap && polynomialKey !== null ? (
                  <PolynomialMapChains degree={1} dominoKey={polynomialKey} />
                ) : null}
                <div className={`image-region${showWholeImage ? " is-visible" : ""}`} aria-hidden="true">
                  <span className="region-edge region-edge-left" />
                  <span className="region-edge region-edge-right" />
                </div>
                {showMapRegions ? <MapRoleLabel role="im" /> : null}
                {operatorsEnabled && hoveredImage && (targetShowsF || targetShowsV) ? (
                  <OperatorArrows
                    key={`target-operators-${keyOf(hoveredImage)}`}
                    anchor={hoveredImage}
                    degree={1}
                    showF={targetShowsF}
                    showV={targetShowsV}
                  />
                ) : null}

                {polynomialKey !== null
                  ? polynomialPointsFor(polynomialKey, 1).map((basisPoint) => {
                    const { point } = basisPoint;
                    const isImage = hoveredImage !== null
                      && keyOf(point) === keyOf(hoveredImage);

                    return (
                      <div
                        className={`lattice-node target-node ${columnClass(point.column)} ${levelClass(point, 1)} label-top${isImage ? " is-image" : ""}${showPolynomialMap ? " is-image-member" : ""}`}
                        key={`target-${polynomialKey}-${point.column}-${point.row}`}
                        aria-label={basisPoint.plain}
                      >
                        <span className="point" aria-hidden="true" />
                        <span className="node-label">
                          <Latex formula={basisPoint.formula} />
                        </span>
                      </div>
                    );
                  })
                  : columns.flatMap((column) =>
                    targetRows.map((row) => {
                    const point: BasisPoint = { column, row };
                    const isImage = hoveredImage !== null && keyOf(point) === keyOf(hoveredImage);
                    const isImageMember = (showWholeImage && liesInWholeImage(point))
                      || (showQuotientMap
                        && quotientLevel !== null
                        && liesInQuotientImage(point, quotientLevel))
                      || (showElementaryMap
                        && elementaryIndex !== null
                        && liesInElementaryMap(point, elementaryIndex))
                      || (showDistinguishedMap
                        && distinguishedDomino !== null
                        && liesInDistinguishedImage(point, distinguishedDomino));

                    if (quotientLevel !== null && liesInFiltration(point, quotientLevel)) {
                      return null;
                    }

                    if (elementaryIndex !== null
                      && !liesInElementaryDomino(point, 1, elementaryIndex)) {
                      return null;
                    }

                    if (distinguishedDomino !== null
                      && !liesInDistinguishedDomino(point, 1, distinguishedDomino)) {
                      return null;
                    }

                    return (
                      <div
                        className={`lattice-node target-node ${columnClass(column)} ${levelClass(point, 1)} label-top${isImage ? " is-image" : ""}${isImageMember ? " is-image-member" : ""}`}
                        key={`target-${column}-${row}`}
                        aria-label={plainTerm(point, 1)}
                      >
                        <span className="point" aria-hidden="true" />
                        <span className="node-label">
                          <BasisTerm {...point} degree={1} />
                        </span>
                      </div>
                    );
                    }),
                  )}

                {polynomialKey !== null ? (
                  <PolynomialTails degree={1} />
                ) : null}

                {quotientLevel === null && polynomialKey === null ? (
                  <span className="ellipsis ellipsis-left" aria-hidden="true">···</span>
                ) : null}
                {elementaryIndex === null
                && distinguishedDomino === null
                && polynomialKey === null ? (
                  <span className="ellipsis ellipsis-right" aria-hidden="true">···</span>
                ) : null}
                {quotientLevel === null
                && elementaryIndex === null
                && distinguishedDomino === null
                && polynomialKey === null ? (
                  <span className="ellipsis ellipsis-up" aria-hidden="true">⋮</span>
                ) : null}
              </div>
            </div>
          </section>
        </section>
      </div>

      <div className="truncation-controls" aria-label="Raynaud ring tutorial">
        <div className="tutorial-tabs" role="group" aria-label="Tutorial chapters">
          <button
            type="button"
            className={`tutorial-tab${openTutorialSection === "filtration" ? " is-active" : ""}`}
            aria-controls="tutorial-filtration"
            aria-expanded={openTutorialSection === "filtration"}
            onClick={() => toggleTutorialSection("filtration")}
          >
            <span className="tutorial-tab-index">01</span>
            <span className="tutorial-tab-title">
              {language === "en" ? "Filtration" : "滤过"}
            </span>
            <span className="tutorial-tab-symbol" aria-hidden="true">
              {openTutorialSection === "filtration" ? "−" : "+"}
            </span>
          </button>
          <button
            type="button"
            className={`tutorial-tab${openTutorialSection === "domino" ? " is-active" : ""}`}
            aria-controls="tutorial-dominoes"
            aria-expanded={openTutorialSection === "domino"}
            onClick={() => toggleTutorialSection("domino")}
          >
            <span className="tutorial-tab-index">02</span>
            <span className="tutorial-tab-title">
              {language === "en" ? "Domino" : "多米诺"}
            </span>
            <span className="tutorial-tab-symbol" aria-hidden="true">
              {openTutorialSection === "domino" ? "−" : "+"}
            </span>
          </button>
        </div>

        <div className="tutorial-stage">
          <section
            id="tutorial-filtration"
            className="tutorial-panel tutorial-chapter"
            aria-label="Filtration, truncation, and completion"
            hidden={openTutorialSection !== "filtration"}
          >
            <div className="filtration-overview">
              <div className="filtration-part" role="group" aria-label="V-adic filtration">
                <span className="tutorial-kicker">
                  {language === "en" ? "Filtration" : "滤过"}
                </span>
                <p className="tutorial-statement">
                  <FiltrationStatement language={language} />
                </p>
                <div className="control-options">
                  {([1, 2, 3] as FiltrationLevel[]).map((level) => (
                    <button
                      type="button"
                      className="truncation-button filtration-button"
                      aria-label={"Toggle V to the " + level + " plus dV to the " + level + " filtration"}
                      aria-pressed={filtrationLevel === level}
                      key={level}
                      onClick={() => toggleIdealView("filtration", level)}
                    >
                      <FiltrationTerm level={level} />
                    </button>
                  ))}
                  <span className="control-more" aria-hidden="true">···</span>
                </div>
              </div>

              <div className="filtration-part" role="group" aria-label="Raynaud ring quotients">
                <span className="tutorial-kicker">
                  {language === "en" ? "Truncation" : "截断"}
                </span>
                <p className="tutorial-statement">
                  <TruncationStatement language={language} />
                </p>
                <div className="control-options">
                  {([1, 2, 3] as FiltrationLevel[]).map((level) => (
                    <button
                      type="button"
                      className="truncation-button quotient-button"
                      aria-label={"Toggle the Raynaud quotient R " + level}
                      aria-pressed={quotientLevel === level}
                      key={level}
                      onClick={() => toggleIdealView("quotient", level)}
                    >
                      <Latex formula={"R_{" + level + "}"} />
                    </button>
                  ))}
                  <span className="control-more" aria-hidden="true">···</span>
                </div>
              </div>

              <div className="filtration-part filtration-part-completion">
                <span className="tutorial-kicker">
                  {language === "en" ? "Completion" : "完备化"}
                </span>
                <p className="tutorial-statement tutorial-statement-only">
                  <CompletionStatement language={language} />
                </p>
              </div>
            </div>
          </section>

          <section
            id="tutorial-dominoes"
            className="tutorial-panel tutorial-chapter"
            hidden={openTutorialSection !== "domino"}
          >
            <p className="tutorial-statement domino-statement">
              <DominoStatement language={language} />
            </p>
            <ul className="domino-topic-list">
              <li className="domino-topic">
                <button
                  type="button"
                  className="domino-topic-trigger"
                  aria-controls="domino-topic-elementary"
                  aria-expanded={openDominoTopic === "elementary"}
                  onClick={() => toggleDominoTopic("elementary")}
                >
                  <span className="domino-topic-bullet" aria-hidden="true" />
                  <span>{language === "en" ? "elementary domino" : "初等多米诺"}</span>
                  <span className="domino-topic-symbol" aria-hidden="true">
                    {openDominoTopic === "elementary" ? "−" : "+"}
                  </span>
                </button>
                <div
                  id="domino-topic-elementary"
                  className="domino-topic-panel"
                  role="group"
                  aria-label="Elementary domino quotients"
                  hidden={openDominoTopic !== "elementary"}
                >
                  <p className="domino-topic-copy">
                    <ElementaryDominoTutorial language={language} />
                  </p>
                  <div className="control-options">
                    <span className="control-more control-more-left" aria-hidden="true">···</span>
                    {([-2, -1, 0, 1, 2] as ElementaryIndex[]).map((index) => (
                      <button
                        type="button"
                        className="truncation-button domino-button"
                        aria-label={"Toggle the elementary domino U " + index}
                        aria-pressed={elementaryIndex === index}
                        key={index}
                        onClick={() => toggleElementaryDomino(index)}
                      >
                        <Latex formula={"U_{" + index + "}"} />
                      </button>
                    ))}
                    <span className="control-more control-more-right" aria-hidden="true">···</span>
                  </div>
                </div>
              </li>

              <li className="domino-topic">
                <button
                  type="button"
                  className="domino-topic-trigger"
                  aria-controls="domino-topic-distinguished"
                  aria-expanded={openDominoTopic === "distinguished"}
                  onClick={() => toggleDominoTopic("distinguished")}
                >
                  <span className="domino-topic-bullet" aria-hidden="true" />
                  <span>{language === "en" ? "distinguished domino" : "特选多米诺"}</span>
                  <span className="domino-topic-symbol" aria-hidden="true">
                    {openDominoTopic === "distinguished" ? "−" : "+"}
                  </span>
                </button>
                <div
                  id="domino-topic-distinguished"
                  className="domino-topic-panel"
                  role="group"
                  aria-label="Distinguished domino quotients"
                  hidden={openDominoTopic !== "distinguished"}
                >
                  <p className="domino-topic-copy">
                    <DistinguishedDominoTutorial language={language} />
                  </p>
                  <div className="distinguished-groups">
                    {([2, 3] as const).map((dimension) => (
                      <div className="distinguished-dimension-row" key={dimension}>
                        <span className="dimension-label">
                          {language === "en" ? `dim ${dimension}` : `${dimension}维`}
                        </span>
                        <div className="control-options">
                          <span className="control-more control-more-left" aria-hidden="true">···</span>
                          {distinguishedDominoesByDimension[dimension].map((domino) => (
                            <button
                              type="button"
                              className="truncation-button distinguished-button"
                              aria-label={"Toggle the distinguished domino U " + domino.key}
                              aria-pressed={distinguishedKey === domino.key}
                              key={domino.key}
                              onClick={() => toggleDistinguishedDomino(domino.key)}
                            >
                              <Latex formula={"U_{" + domino.indices.join(",") + "}"} />
                            </button>
                          ))}
                          <span className="control-more control-more-right" aria-hidden="true">···</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </li>

              <li className="domino-topic">
                <button
                  type="button"
                  className="domino-topic-trigger"
                  aria-controls="domino-topic-two-dimensional"
                  aria-expanded={openDominoTopic === "two-dimensional"}
                  onClick={() => toggleDominoTopic("two-dimensional")}
                >
                  <span className="domino-topic-bullet" aria-hidden="true" />
                  <span>{language === "en" ? "2-dimensional dominoes" : "二维多米诺"}</span>
                  <span className="domino-topic-symbol" aria-hidden="true">
                    {openDominoTopic === "two-dimensional" ? "−" : "+"}
                  </span>
                </button>
                <div
                  id="domino-topic-two-dimensional"
                  className="domino-topic-panel"
                  role="group"
                  aria-label="Two-dimensional polynomial dominoes"
                  hidden={openDominoTopic !== "two-dimensional"}
                >
                  <p className="domino-topic-copy">
                    <TwoDimensionalDominoTutorial language={language} />
                  </p>
                  <div className="polynomial-groups">
                    {([3, 4] as const).map((terminalType) => (
                      <div className="polynomial-type-row" key={terminalType}>
                        <span className="polynomial-type-label">
                          <Latex formula={"J=(0," + terminalType + ")"} />
                        </span>
                        <div className="control-options">
                          {polynomialDominoKeys
                            .filter((key) => polynomialDominoSpecs[key].j === terminalType)
                            .map((key) => (
                              <button
                                type="button"
                                className="truncation-button polynomial-button"
                                aria-label={"Toggle the two-dimensional domino U " + key}
                                aria-pressed={polynomialKey === key}
                                key={key}
                                onClick={() => togglePolynomialDomino(key)}
                              >
                                <Latex formula={"U_{" + key + "}"} />
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
