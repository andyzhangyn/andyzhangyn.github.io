import { useState, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// ———— tokens ————
const T = {
  paper: "#F7F3EA", ink: "#2A2620", faint: "#9A9280", line: "#DDD6C4",
  A: "#B23A2A", B: "#2E5E8C", C: "#4A6B4F", D: "#A8752C",
  E: "#6B5B8E", F: "#3E7C7B", X: "#B23A2A", Y: "#2E5E8C",
};
const HUE = {
  ...T, ka: T.A, kb: T.B, kc: T.C, qa: T.D, qb: T.E, qc: T.F,
  Cm: T.A, Ci: T.B, Cp: T.C, Hm: T.A, Hi: T.B, Hp: T.C,
  B1: "#2E5E8C", B2: "#4879A6", B3: "#6E94BE",
  C1: "#4A6B4F", C2: "#67876B", C3: "#86A489",
  D1: "#A8752C", D2: "#BE8E45", D3: "#D2A768",
  HB1: "#2E5E8C", HB2: "#4879A6", HB3: "#6E94BE",
  HC1: "#4A6B4F", HC2: "#67876B", HC3: "#86A489",
  HD1: "#A8752C", HD2: "#BE8E45", HD3: "#D2A768",
  P: "#A8752C", Q: "#2E5E8C", R: "#4A6B4F",
  HP: "#A8752C", HQ: "#2E5E8C", HR: "#4A6B4F",
  SN2: T.A, SN1: T.B, SN0: T.ink, SP1: T.C, SP2: T.D,
  QL1: "#24496E", QL2: "#2E5E8C", QL3: "#4879A6", QL4: "#6E94BE",
  W: "#2E5E8C", F1: "#24496E", F2: "#2E5E8C", F3: "#4879A6", F4: "#6E94BE",
  S: "#6B5B8E", HS: "#6B5B8E",
  Dm: "#A8752C", Di: "#BE8E45", Dp: "#D2A768", HC: "#2E5E8C", HD: "#BE8E45",
  QAC: "#6E94BE", QAB: "#4879A6", QBC: "#67876B",
};
const serif = `Georgia, "Songti SC", "Noto Serif SC", serif`;
const mono = `ui-monospace, "SF Mono", Menlo, monospace`;
const N = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳","㉑","㉒","㉓","㉔","㉕","㉖","㉗","㉘","㉙","㉚","㉛","㉜","㉝","㉞","㉟","㊱","㊲","㊳","㊴","㊵","㊶","㊷","㊸","㊹","㊺","㊻"];
const SUB = ["₀","₁","₂","₃","₄","₅"];
const SUP = ["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"];

function bandPath(x1, y1, x2, y2, width = 12, inset = 0) {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  const nx = -uy * width / 2, ny = ux * width / 2;
  const ax = x1 + ux * inset, ay = y1 + uy * inset;
  const bx = x2 - ux * inset, by = y2 - uy * inset;
  return `M ${ax + nx} ${ay + ny} L ${bx + nx} ${by + ny} L ${bx - nx} ${by - ny} L ${ax - nx} ${ay - ny} Z`;
}

function bandPolygon(x1, y1, x2, y2, width = 12, inset = 0) {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  const nx = -uy * width / 2, ny = ux * width / 2;
  const ax = x1 + ux * inset, ay = y1 + uy * inset;
  const bx = x2 - ux * inset, by = y2 - uy * inset;
  return [
    [ax + nx, ay + ny], [bx + nx, by + ny],
    [bx - nx, by - ny], [ax - nx, ay - ny],
  ];
}

const polygonArea = (points) => points.reduce((sum, point, index) => {
  const next = points[(index + 1) % points.length];
  return sum + point[0] * next[1] - next[0] * point[1];
}, 0) / 2;

const edgeCross = (a, b, point) =>
  (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);

function intersectConvexPolygons(subject, clip) {
  let output = subject.slice();
  const orientation = Math.sign(polygonArea(clip)) || 1;
  for (let edge = 0; edge < clip.length && output.length; edge++) {
    const a = clip[edge], b = clip[(edge + 1) % clip.length];
    const input = output;
    output = [];
    for (let index = 0; index < input.length; index++) {
      const p = input[index], q = input[(index + 1) % input.length];
      const pInside = edgeCross(a, b, p) * orientation >= -1e-7;
      const qInside = edgeCross(a, b, q) * orientation >= -1e-7;
      if (pInside && qInside) {
        output.push(q);
      } else if (pInside !== qInside) {
        const r = [q[0] - p[0], q[1] - p[1]];
        const s = [b[0] - a[0], b[1] - a[1]];
        const denominator = r[0] * s[1] - r[1] * s[0];
        if (Math.abs(denominator) > 1e-9) {
          const ap = [a[0] - p[0], a[1] - p[1]];
          const t2 = (ap[0] * s[1] - ap[1] * s[0]) / denominator;
          output.push([p[0] + t2 * r[0], p[1] + t2 * r[1]]);
        }
        if (!pInside && qInside) output.push(q);
      }
    }
  }
  return output;
}

const polygonPath = (points) => points.length
  ? `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`
  : "";

const polygonCenter = (points) => points.reduce(
  (sum, [x, y]) => [sum[0] + x / points.length, sum[1] + y / points.length],
  [0, 0],
);

// One shared tooth profile for every chapter: a short shoulder, a rounded
// lobe, and an explicit normal direction. This is the profile used by the
// spectral-sequence strips, scaled only by the requested bulge depth.
function puzzleEdgeWithTab(x0, y0, x1, y1, centerX, centerY, normalX, normalY) {
  const dx = x1 - x0, dy = y1 - y0, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  const along = (centerX - x0) * ux + (centerY - y0) * uy;
  const shoulder = Math.min(9, length * 0.27);
  if (along <= shoulder + 1 || along >= length - shoulder - 1) {
    return { f: `L ${x1} ${y1}`, r: `L ${x0} ${y0}` };
  }
  const control = shoulder * 4 / 9;
  const curveReach = shoulder * 2 / 3;
  const a = [centerX - ux * shoulder, centerY - uy * shoulder];
  const b = [centerX + ux * shoulder, centerY + uy * shoulder];
  const c1 = [a[0] + ux * control, a[1] + uy * control];
  const c2 = [centerX - ux * curveReach + normalX, centerY - uy * curveReach + normalY];
  const tip = [centerX + normalX, centerY + normalY];
  const c3 = [centerX + ux * curveReach + normalX, centerY + uy * curveReach + normalY];
  const c4 = [b[0] - ux * control, b[1] - uy * control];
  return {
    f: `L ${a[0]} ${a[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${tip[0]} ${tip[1]} C ${c3[0]} ${c3[1]} ${c4[0]} ${c4[1]} ${b[0]} ${b[1]} L ${x1} ${y1}`,
    r: `L ${b[0]} ${b[1]} C ${c4[0]} ${c4[1]} ${c3[0]} ${c3[1]} ${tip[0]} ${tip[1]} C ${c2[0]} ${c2[1]} ${c1[0]} ${c1[1]} ${a[0]} ${a[1]} L ${x0} ${y0}`,
  };
}

// Vakil's convention here is directional: vertical tabs point right and
// horizontal tabs point down. Keeping that invariant in the helpers prevents
// neighboring rows or columns from accidentally reversing the visual flow.
function puzzleV(x, y0, y1, bulge = 10) {
  return puzzleEdgeWithTab(x, y0, x, y1, x, (y0 + y1) / 2, bulge, 0);
}

function puzzleH(y, x0, x1, bulge = 10) {
  return puzzleEdgeWithTab(x0, y, x1, y, (x0 + x1) / 2, y, 0, bulge);
}

// A tab on an oblique seam. Vakil's diagonal connectors also point downward,
// so the bulge is measured in the positive screen-y direction rather than in
// the normal direction of the segment.
function puzzleDiagonalDown(x0, y0, x1, y1, bulge = 7) {
  const dx = x1 - x0, dy = y1 - y0, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  return puzzleEdgeWithTab(
    x0, y0, x1, y1, (x0 + x1) / 2, (y0 + y1) / 2,
    -uy * bulge, ux * bulge,
  );
}

// The rightward normal used by the spectral-sequence strips: a falling seam
// points right-up and a rising seam points right-down.
function puzzleDiagonalRight(x0, y0, x1, y1, bulge = 11) {
  const dx = x1 - x0, dy = y1 - y0, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  return puzzleEdgeWithTab(
    x0, y0, x1, y1, (x0 + x1) / 2, (y0 + y1) / 2,
    Math.abs(uy) * bulge, -Math.sign(uy) * ux * bulge,
  );
}

// Give an intersection cell teeth only along the sides that attach it to the
// source and target modules. Each chosen edge is normalized left-to-right, so
// the spectral-sequence right-up/right-down convention is independent of SVG
// path order; the other two sides remain straight.
function puzzleCellPath(points, toothedEdges, bulge = 5.5) {
  if (!points.length) return "";
  const edges = points.map((start, index) => {
    const end = points[(index + 1) % points.length];
    if (!toothedEdges.has(index)) return `L ${end[0]} ${end[1]}`;
    const forward = start[0] <= end[0];
    const left = forward ? start : end;
    const right = forward ? end : start;
    const edge = puzzleDiagonalRight(...left, ...right, bulge);
    return forward ? edge.f : edge.r;
  });
  return `M ${points[0][0]} ${points[0][1]} ${edges.join(" ")} Z`;
}

function splitCubic(points, t) {
  const mix = (a, b) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  const p01 = mix(points[0], points[1]);
  const p12 = mix(points[1], points[2]);
  const p23 = mix(points[2], points[3]);
  const p012 = mix(p01, p12);
  const p123 = mix(p12, p23);
  const point = mix(p012, p123);
  return {
    left: [points[0], p01, p012, point],
    right: [point, p123, p23, points[3]],
  };
}

// Preserve the original cubic on both sides and replace only its middle with
// the same rounded tooth profile used by the straight seams. The absolute
// normal keeps the tooth pointing down-right regardless of path traversal.
function puzzleCubicRightDown(start, control1, control2, end, bulge = 9) {
  const t0 = 0.32, t1 = 0.68;
  const atT1 = splitCubic([start, control1, control2, end], t1);
  const atT0 = splitCubic(atT1.left, t0 / t1);
  const before = atT0.left, after = atT1.right;
  const toothStart = before[3], toothEnd = after[0];
  const depth = bulge / Math.SQRT2;
  const tooth = puzzleEdgeWithTab(
    toothStart[0], toothStart[1], toothEnd[0], toothEnd[1],
    (toothStart[0] + toothEnd[0]) / 2,
    (toothStart[1] + toothEnd[1]) / 2,
    depth, depth,
  );
  return {
    f: `C ${before[1][0]} ${before[1][1]} ${before[2][0]} ${before[2][1]} ${before[3][0]} ${before[3][1]} ${tooth.f} C ${after[1][0]} ${after[1][1]} ${after[2][0]} ${after[2][1]} ${after[3][0]} ${after[3][1]}`,
    r: `C ${after[2][0]} ${after[2][1]} ${after[1][0]} ${after[1][1]} ${after[0][0]} ${after[0][1]} ${tooth.r} C ${before[2][0]} ${before[2][1]} ${before[1][0]} ${before[1][1]} ${before[0][0]} ${before[0][1]}`,
  };
}

function linearPuzzle(xs, y0, y1) {
  const boundaries = xs.slice(1, -1).map((x) => puzzleV(x, y0, y1));
  const rightEdge = (i) => i === xs.length - 1 ? `V ${y1}` : boundaries[i - 1].f;
  const leftEdge = (i) => i === 0 ? `V ${y0}` : boundaries[i - 1].r;
  const span = (from, to) => `M ${xs[from]} ${y0} H ${xs[to]} ${rightEdge(to)} H ${xs[from]} ${leftEdge(from)} Z`;
  return {
    seams: [
      `M ${xs[0]} ${y0} H ${xs.at(-1)} V ${y1} H ${xs[0]} Z`,
      ...boundaries.map((edge, i) => `M ${xs[i + 1]} ${y0} ${edge.f}`),
    ],
    tiles: xs.slice(0, -1).map((_, i) => span(i, i + 1)),
    span,
  };
}

// A complex is the one-strip version of the spectral-sequence zigzag: there
// is one module in each degree and no parallel filtration lanes. Seven square
// cells run through three alternating diagonal modules, with cells 3 and 5
// shared at the two turns.
function complexZigzagPuzzle() {
  const radius = 30;
  const centers = [
    [50, 112], [80, 82], [110, 52], [140, 82],
    [170, 112], [200, 82], [230, 52],
  ];
  const cells = centers.map(([cx, cy]) => [
    [cx - radius, cy], [cx, cy - radius],
    [cx + radius, cy], [cx, cy + radius],
  ]);
  const samePoint = (a, b) =>
    Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
  const sharedEdge = (leftIndex, rightIndex) => {
    const left = cells[leftIndex], right = cells[rightIndex];
    const edgeIndex = left.findIndex((start, index) => {
      const end = left[(index + 1) % left.length];
      return right.some((point) => samePoint(point, start))
        && right.some((point) => samePoint(point, end));
    });
    return { edgeIndex, start: left[edgeIndex], end: left[(edgeIndex + 1) % left.length] };
  };
  const toothedEdges = cells.map(() => new Set());
  const shared = centers.slice(0, -1).map((_, index) => {
    const edge = sharedEdge(index, index + 1);
    toothedEdges[index].add(edge.edgeIndex);
    const reverseIndex = cells[index + 1].findIndex((start, candidate) => {
      const end = cells[index + 1][(candidate + 1) % cells[index + 1].length];
      return samePoint(start, edge.end) && samePoint(end, edge.start);
    });
    toothedEdges[index + 1].add(reverseIndex);
    const forward = edge.start[0] <= edge.end[0];
    const a = forward ? edge.start : edge.end;
    const b = forward ? edge.end : edge.start;
    const tooth = puzzleDiagonalRight(...a, ...b, 7);
    return `M ${edge.start[0]} ${edge.start[1]} ${forward ? tooth.f : tooth.r}`;
  });
  const tiles = cells.map((points, index) =>
    puzzleCellPath(points, toothedEdges[index], 7));
  // Build every module from the same toothed cells used for interaction.
  // Joining the subpaths keeps the fill boundary and the visible seam exactly
  // coincident, including the two turns where consecutive modules overlap.
  const modulePath = (from, to) => tiles.slice(from, to + 1).join(" ");
  return {
    centers,
    tiles,
    seams: shared,
    shapes: {
      Cm: modulePath(0, 2),
      Ci: modulePath(2, 4),
      Cp: modulePath(4, 6),
    },
  };
}

function cornerPuzzle(side) {
  const [x0, x1, x2, x3] = [44, 100, 156, 212];
  const [y0, y1, y2, y3] = [24, 80, 136, 192];
  const v1a = puzzleV(x1, y0, y1, 9), v1b = puzzleV(x1, y1, y2, 9);
  const v2a = puzzleV(x2, y0, y1, 9), v2b = puzzleV(x2, y1, y2, 9);
  const h1a = puzzleH(y1, x0, x1, 9), h1b = puzzleH(y1, x1, x2, 9), h1c = puzzleH(y1, x2, x3, 9);
  const h2a = puzzleH(y2, x0, x1, 9), h2b = puzzleH(y2, x1, x2, 9), h2c = puzzleH(y2, x2, x3, 9);

  if (side === "left") {
    return {
      seams: [
        `M ${x0} ${y0} H ${x3} V ${y2} H ${x2} V ${y3} H ${x0} Z`,
        `M ${x1} ${y0} ${v1a.f} ${v1b.f}`, `M ${x2} ${y0} ${v2a.f} ${v2b.f}`,
        `M ${x0} ${y1} ${h1a.f} ${h1b.f}`, `M ${x0} ${y2} ${h2a.f} ${h2b.f}`,
      ],
      shapes: {
        A: `M ${x0} ${y0} H ${x2} ${v2a.f} ${v2b.f} ${h2b.r} ${h2a.r} V ${y0} Z`,
        B: `M ${x1} ${y0} H ${x3} V ${y2} H ${x2} ${h2b.r} ${v1b.r} ${v1a.r} Z`,
        C: `M ${x0} ${y1} ${h1a.f} ${h1b.f} ${v2b.f} V ${y3} H ${x0} Z`,
      },
      tiles: {
        1: `M ${x2} ${y0} H ${x3} V ${y2} H ${x2} ${v2b.r} ${v2a.r} Z`,
        2: `M ${x1} ${y0} H ${x2} ${v2a.f} ${h1b.r} ${v1a.r} Z`,
        3: `M ${x1} ${y1} ${h1b.f} ${v2b.f} ${h2b.r} ${v1b.r} Z`,
        4: `M ${x0} ${y0} H ${x1} ${v1a.f} ${h1a.r} V ${y0} Z`,
        5: `M ${x0} ${y1} ${h1a.f} ${v1b.f} ${h2a.r} V ${y1} Z`,
        6: `M ${x0} ${y2} ${h2a.f} ${h2b.f} V ${y3} H ${x0} Z`,
      },
    };
  }

  return {
    seams: [
      `M ${x0} ${y0} H ${x3} V ${y3} H ${x1} V ${y2} H ${x0} Z`,
      `M ${x1} ${y0} ${v1a.f} ${v1b.f}`, `M ${x2} ${y0} ${v2a.f} ${v2b.f}`,
      `M ${x1} ${y1} ${h1b.f} ${h1c.f}`, `M ${x1} ${y2} ${h2b.f} ${h2c.f}`,
    ],
    shapes: {
      A: `M ${x0} ${y0} H ${x2} ${v2a.f} ${v2b.f} ${h2b.r} H ${x0} V ${y0} Z`,
      B: `M ${x1} ${y0} H ${x3} V ${y2} ${h2c.r} ${h2b.r} ${v1b.r} ${v1a.r} Z`,
      C: `M ${x1} ${y1} ${h1b.f} ${h1c.f} V ${y3} H ${x1} V ${y2} ${v1b.r} Z`,
    },
    tiles: {
      1: `M ${x0} ${y0} H ${x1} ${v1a.f} ${v1b.f} H ${x0} V ${y0} Z`,
      2: `M ${x1} ${y0} H ${x2} ${v2a.f} ${h1b.r} ${v1a.r} Z`,
      3: `M ${x1} ${y1} ${h1b.f} ${v2b.f} ${h2b.r} ${v1b.r} Z`,
      4: `M ${x2} ${y0} H ${x3} V ${y1} ${h1c.r} ${v2a.r} Z`,
      5: `M ${x2} ${y1} ${h1c.f} V ${y2} ${h2c.r} ${v2b.r} Z`,
      6: `M ${x1} ${y2} ${h2b.f} ${h2c.f} V ${y3} H ${x1} Z`,
    },
  };
}

function commutingSquarePuzzle() {
  const xs = [35, 95, 165, 225], ys = [20, 80, 150, 210];
  const v = {
    1: ys.slice(0, -1).map((_, r) => puzzleV(xs[1], ys[r], ys[r + 1], 9)),
    2: ys.slice(0, -1).map((_, r) => puzzleV(xs[2], ys[r], ys[r + 1], 9)),
  };
  const h = {
    1: xs.slice(0, -1).map((_, c) => puzzleH(ys[1], xs[c], xs[c + 1], 9)),
    2: xs.slice(0, -1).map((_, c) => puzzleH(ys[2], xs[c], xs[c + 1], 9)),
  };
  const cell = (c, r) => {
    const top = r === 0 ? `H ${xs[c + 1]}` : h[r][c].f;
    const right = c === 2 ? `V ${ys[r + 1]}` : v[c + 1][r].f;
    const bottom = r === 2 ? `H ${xs[c]}` : h[r + 1][c].r;
    const left = c === 0 ? `V ${ys[r]}` : v[c][r].r;
    return `M ${xs[c]} ${ys[r]} ${top} ${right} ${bottom} ${left} Z`;
  };
  const curveQS = puzzleCubicRightDown(
    [165, 80], [158, 118], [132, 143], [95, 150], 9,
  );
  const curveSQ = puzzleCubicRightDown(
    [95, 150], [102, 112], [128, 87], [165, 80], 9,
  );
  return {
    seams: [
      `M ${xs[0]} ${ys[0]} H ${xs[3]} V ${ys[3]} H ${xs[0]} Z`,
      `M ${xs[1]} ${ys[0]} ${v[1][0].f} ${v[1][1].f} ${v[1][2].f}`,
      `M ${xs[2]} ${ys[0]} ${v[2][0].f} ${v[2][1].f} ${v[2][2].f}`,
      `M ${xs[0]} ${ys[1]} ${h[1][0].f} ${h[1][1].f} ${h[1][2].f}`,
      `M ${xs[0]} ${ys[2]} ${h[2][0].f} ${h[2][1].f} ${h[2][2].f}`,
      `M ${xs[2]} ${ys[1]} ${curveQS.f}`,
      `M ${xs[1]} ${ys[2]} ${curveSQ.f}`,
    ],
    shapes: {
      A: `M ${xs[0]} ${ys[0]} H ${xs[2]} ${v[2][0].f} ${curveQS.f} ${h[2][0].r} H ${xs[0]} V ${ys[0]} Z`,
      B: `M ${xs[1]} ${ys[0]} H ${xs[3]} V ${ys[2]} ${h[2][2].r} ${h[2][1].r} ${v[1][1].r} ${v[1][0].r} Z`,
      C: `M ${xs[1]} ${ys[2]} ${curveSQ.f} ${h[1][2].f} V ${ys[3]} H ${xs[1]} ${v[1][2].r} Z`,
      D: `M ${xs[0]} ${ys[1]} ${h[1][0].f} ${h[1][1].f} ${v[2][1].f} ${v[2][2].f} H ${xs[0]} V ${ys[1]} Z`,
    },
    tiles: {
      1: cell(0, 0), 2: cell(0, 1), 3: cell(1, 0),
      4: `M ${xs[1]} ${ys[1]} ${h[1][1].f} ${curveSQ.r} ${v[1][1].r} Z`,
      5: `M ${xs[1]} ${ys[2]} ${curveSQ.f} ${curveQS.f} Z`,
      6: cell(2, 0), 7: cell(0, 2),
      8: `M ${xs[1]} ${ys[2]} ${curveQS.r} ${v[2][1].f} ${h[2][1].r} Z`,
      9: cell(2, 1), 10: cell(1, 2), 11: cell(2, 2),
    },
  };
}

// Vakil pp. 29-30: two commuting squares sharing their middle column.
// The five-column, three-row jigsaw is the common refinement of the two
// three-term complexes and the two adjacent commuting squares.
function cohomologyMapPuzzle() {
  const xs = [12, 58, 128, 174, 244, 290], ys = [16, 58, 140, 184];
  const v = {};
  for (let b = 1; b < xs.length - 1; b++) {
    v[b] = ys.slice(0, -1).map((_, r) => puzzleV(xs[b], ys[r], ys[r + 1], 8));
  }
  const h = {
    1: xs.slice(0, -1).map((_, c) => puzzleH(ys[1], xs[c], xs[c + 1], 8)),
    2: xs.slice(0, -1).map((_, c) => puzzleH(ys[2], xs[c], xs[c + 1], 8)),
  };
  const cell = (c, r) => {
    const top = r === 0 ? `H ${xs[c + 1]}` : h[r][c].f;
    const right = c === xs.length - 2 ? `V ${ys[r + 1]}` : v[c + 1][r].f;
    const bottom = r === ys.length - 2 ? `H ${xs[c]}` : h[r + 1][c].r;
    const left = c === 0 ? `V ${ys[r]}` : v[c][r].r;
    return `M ${xs[c]} ${ys[r]} ${top} ${right} ${bottom} ${left} Z`;
  };
  const lens = (c) => {
    const x1 = xs[c], x2 = xs[c + 1], y1 = ys[1], y2 = ys[2];
    const up = puzzleCubicRightDown(
      [x1, y2], [x1 + 7, y2 - 45], [x2 - 38, y1 + 7], [x2, y1], 8,
    );
    const down = puzzleCubicRightDown(
      [x2, y1], [x2 - 7, y1 + 45], [x1 + 38, y2 - 7], [x1, y2], 8,
    );
    return {
      up: up.f, down: down.f,
      upper: `M ${x1} ${y1} ${h[1][c].f} ${up.r} ${v[c][1].r} Z`,
      middle: `M ${x1} ${y2} ${up.f} ${down.f} Z`,
      lower: `M ${x1} ${y2} ${down.r} ${v[c + 1][1].f} ${h[2][c].r} Z`,
    };
  };
  const left = lens(1), right = lens(3);
  const seams = [
    `M ${xs[0]} ${ys[0]} H ${xs.at(-1)} V ${ys.at(-1)} H ${xs[0]} Z`,
    ...Object.entries(v).map(([b, edges]) =>
      `M ${xs[+b]} ${ys[0]} ${edges.map((edge) => edge.f).join(" ")}`),
    `M ${xs[0]} ${ys[1]} ${h[1].map((edge) => edge.f).join(" ")}`,
    `M ${xs[0]} ${ys[2]} ${h[2].map((edge) => edge.f).join(" ")}`,
    `M ${xs[2]} ${ys[1]} ${left.down}`,
    `M ${xs[1]} ${ys[2]} ${left.up}`,
    `M ${xs[4]} ${ys[1]} ${right.down}`,
    `M ${xs[3]} ${ys[2]} ${right.up}`,
  ];
  return {
    seams,
    shapes: {
      Cm: `M ${xs[0]} ${ys[0]} H ${xs[2]} ${v[2][0].f} ${left.down} ${h[2][0].r} V ${ys[0]} Z`,
      Ci: `M ${xs[1]} ${ys[0]} H ${xs[4]} ${v[4][0].f} ${right.down} ${h[2][2].r} ${h[2][1].r} ${v[1][1].r} ${v[1][0].r} Z`,
      Cp: `M ${xs[3]} ${ys[0]} H ${xs[5]} V ${ys[2]} ${h[2][4].r} ${h[2][3].r} ${v[3][1].r} ${v[3][0].r} Z`,
      Dm: `M ${xs[0]} ${ys[1]} ${h[1][0].f} ${h[1][1].f} ${v[2][1].f} ${v[2][2].f} H ${xs[0]} Z`,
      Di: `M ${xs[1]} ${ys[2]} ${left.up} ${h[1][2].f} ${h[1][3].f} ${v[4][1].f} ${v[4][2].f} H ${xs[1]} ${v[1][2].r} Z`,
      Dp: `M ${xs[3]} ${ys[2]} ${right.up} ${h[1][4].f} V ${ys[3]} H ${xs[3]} ${v[3][2].r} Z`,
    },
    tiles: {
      t0: cell(0, 0), t1: cell(1, 0), t2: cell(2, 0), t3: cell(3, 0), t4: cell(4, 0),
      m0: cell(0, 1), lUpper: left.upper, lLens: left.middle, lLower: left.lower,
      m2: cell(2, 1), rUpper: right.upper, rLens: right.middle, rLower: right.lower,
      m4: cell(4, 1),
      b0: cell(0, 2), b1: cell(1, 2), b2: cell(2, 2), b3: cell(3, 2), b4: cell(4, 2),
    },
  };
}

// Vakil pp. 31-36: a two-step filtration on each term of a complex.
// The visible window alternates a three-layer overlap with a two-layer private
// section.  In an overlap the middle layer is simultaneously a quotient of
// D^i and a subobject of B^{i+1}; these are the teeth that form the LES.
function longExactSequencePuzzle() {
  const xs = [16, 58, 116, 158, 216, 258, 316, 358];
  const yTop = 24, yBottom = 132, degreeShift = 100, span = 142;
  const start = (degree) => xs[0] + degree * degreeShift;
  const end = (degree) => start(degree) + span;
  const lineY = (degree, x) => 100 - ((x - start(degree)) * 48) / span;
  const diagonalDegrees = [-1, 0, 1, 2, 3];
  const verticalSegments = xs.flatMap((x) => {
    const crossings = diagonalDegrees
      .filter((degree) => x >= start(degree) - 0.01 && x <= end(degree) + 0.01)
      .map((degree) => lineY(degree, x))
      .sort((a, b) => a - b);
    const stops = [yTop, ...crossings, yBottom];
    return stops.slice(0, -1).map((y0, index) => {
      const y1 = stops[index + 1];
      return { x, y0, y1, edge: puzzleV(x, y0, y1, 5) };
    });
  });
  const diagonalSegments = diagonalDegrees.flatMap((degree) => {
    const left = Math.max(xs[0], start(degree));
    const right = Math.min(xs.at(-1), end(degree));
    const stops = [left, ...xs.filter((x) => x > left && x < right), right];
    return stops.slice(0, -1).map((x0, index) => {
      const x1 = stops[index + 1];
      return {
        degree, x0, x1,
        edge: puzzleDiagonalDown(
          x0, lineY(degree, x0), x1, lineY(degree, x1), 5,
        ),
      };
    });
  });
  const verticalEdgePath = (from, to) => {
    const downward = to[1] > from[1];
    const low = Math.min(from[1], to[1]), high = Math.max(from[1], to[1]);
    const segments = verticalSegments
      .filter((segment) =>
        Math.abs(segment.x - from[0]) < 0.01
        && segment.y0 >= low - 0.01
        && segment.y1 <= high + 0.01)
      .sort((a, b) => downward ? a.y0 - b.y0 : b.y0 - a.y0);
    if (!segments.length) return `L ${to[0]} ${to[1]}`;
    return `${segments.map((segment) => downward ? segment.edge.f : segment.edge.r).join(" ")} L ${to[0]} ${to[1]}`;
  };
  const diagonalEdgePath = (from, to) => {
    const degree = diagonalDegrees.find((candidate) =>
      Math.abs(from[1] - lineY(candidate, from[0])) < 0.01
      && Math.abs(to[1] - lineY(candidate, to[0])) < 0.01);
    if (degree === undefined) return `L ${to[0]} ${to[1]}`;
    const rightward = to[0] > from[0];
    const left = Math.min(from[0], to[0]), right = Math.max(from[0], to[0]);
    const segments = diagonalSegments
      .filter((segment) =>
        segment.degree === degree
        && segment.x0 >= left - 0.01
        && segment.x1 <= right + 0.01)
      .sort((a, b) => rightward ? a.x0 - b.x0 : b.x0 - a.x0);
    if (!segments.length) return `L ${to[0]} ${to[1]}`;
    return `${segments.map((segment) => rightward ? segment.edge.f : segment.edge.r).join(" ")} L ${to[0]} ${to[1]}`;
  };
  const edgedPath = (points) => {
    const edges = points.map((from, index) => {
      const to = points[(index + 1) % points.length];
      if (Math.abs(from[0] - to[0]) < 0.01) return verticalEdgePath(from, to);
      if (Math.abs(from[1] - to[1]) < 0.01) return `L ${to[0]} ${to[1]}`;
      return diagonalEdgePath(from, to);
    });
    return `M ${points[0][0]} ${points[0][1]} ${edges.join(" ")} Z`;
  };
  const polygon = (points) => ({
    path: edgedPath(points),
    lbl: [
      points.reduce((sum, [x]) => sum + x, 0) / points.length,
      points.reduce((sum, [, y]) => sum + y, 0) / points.length,
    ],
  });
  const overlap = (degree) => {
    const x0 = start(degree), x1 = x0 + 42;
    const upper0 = lineY(degree - 1, x0), upper1 = lineY(degree - 1, x1);
    const lower0 = lineY(degree, x0), lower1 = lineY(degree, x1);
    return {
      top: polygon([[x0, yTop], [x1, yTop], [x1, upper1], [x0, upper0]]),
      middle: polygon([[x0, upper0], [x1, upper1], [x1, lower1], [x0, lower0]]),
      bottom: polygon([[x0, lower0], [x1, lower1], [x1, yBottom], [x0, yBottom]]),
    };
  };
  const privateSection = (degree) => {
    const x0 = start(degree) + 42, x1 = start(degree) + 100;
    const line0 = lineY(degree, x0), line1 = lineY(degree, x1);
    return {
      top: polygon([[x0, yTop], [x1, yTop], [x1, line1], [x0, line0]]),
      bottom: polygon([[x0, line0], [x1, line1], [x1, yBottom], [x0, yBottom]]),
    };
  };
  const overlaps = [0, 1, 2, 3].map(overlap);
  const privateSections = [0, 1, 2].map(privateSection);
  const shapes = {};
  [0, 1, 2].forEach((degree) => {
    const x0 = start(degree), x1 = end(degree);
    shapes[`C${degree + 1}`] = polygon([[x0, yTop], [x1, yTop], [x1, yBottom], [x0, yBottom]]).path;
    shapes[`B${degree + 1}`] = polygon([
      [x0, yTop], [x1, yTop], [x1, lineY(degree, x1)], [x0, lineY(degree, x0)],
    ]).path;
    shapes[`D${degree + 1}`] = polygon([
      [x0, lineY(degree, x0)], [x1, lineY(degree, x1)], [x1, yBottom], [x0, yBottom],
    ]).path;
  });
  return {
    shapes,
    seams: [
      `M 0 ${yTop} H 374`, `M 0 ${yBottom} H 374`,
      ...verticalSegments.map((segment) =>
        `M ${segment.x} ${segment.y0} ${segment.edge.f}`),
      ...diagonalSegments.map((segment) =>
        `M ${segment.x0} ${lineY(segment.degree, segment.x0)} ${segment.edge.f}`),
    ],
    tiles: {
      o0Top: overlaps[0].top, o0Middle: overlaps[0].middle, o0Bottom: overlaps[0].bottom,
      u0Top: privateSections[0].top, u0Bottom: privateSections[0].bottom,
      o1Top: overlaps[1].top, o1Middle: overlaps[1].middle, o1Bottom: overlaps[1].bottom,
      u1Top: privateSections[1].top, u1Bottom: privateSections[1].bottom,
      o2Top: overlaps[2].top, o2Middle: overlaps[2].middle, o2Bottom: overlaps[2].bottom,
      u2Top: privateSections[2].top, u2Bottom: privateSections[2].bottom,
      o3Top: overlaps[3].top, o3Middle: overlaps[3].middle, o3Bottom: overlaps[3].bottom,
    },
  };
}

const MAP_PUZZLE = linearPuzzle([20, 95, 170, 245], 60, 150);
const SES_PUZZLE = linearPuzzle([30, 130, 230], 55, 155);
const ISO3_PUZZLE = linearPuzzle([30, 96, 163, 230], 55, 155);
const TWO_PUZZLE = cornerPuzzle("left");
const TRI_PUZZLE = cornerPuzzle("right");
const SQUARE_PUZZLE = commutingSquarePuzzle();
const COMPLEX_PUZZLE = complexZigzagPuzzle();
const COHOMOLOGY_MAP_PUZZLE = cohomologyMapPuzzle();
const LONG_EXACT_PUZZLE = longExactSequencePuzzle();

// Vakil p. 23: the snake lemma as a 2–3–2 jigsaw package.
const SNAKE_PUZZLE = (() => {
  const xs = [20, 113, 207, 300], ys = [20, 88, 158, 226];
  const v = {
    1: ys.slice(0, -1).map((_, row) => puzzleV(xs[1], ys[row], ys[row + 1], 10)),
    2: ys.slice(0, -1).map((_, row) => puzzleV(xs[2], ys[row], ys[row + 1], 10)),
  };
  const h = {
    1: xs.slice(0, -1).map((_, column) => puzzleH(ys[1], xs[column], xs[column + 1], 10)),
    2: xs.slice(0, -1).map((_, column) => puzzleH(ys[2], xs[column], xs[column + 1], 10)),
  };
  const cell = (column, row) => {
    const top = row === 0 ? `H ${xs[column + 1]}` : h[row][column].f;
    const right = column === 2 ? `V ${ys[row + 1]}` : v[column + 1][row].f;
    const bottom = row === 2 ? `H ${xs[column]}` : h[row + 1][column].r;
    const left = column === 0 ? `V ${ys[row]}` : v[column][row].r;
    return `M ${xs[column]} ${ys[row]} ${top} ${right} ${bottom} ${left} Z`;
  };
  return {
    seams: [
      `M ${xs[0]} ${ys[0]} H ${xs[3]} V ${ys[3]} H ${xs[0]} Z`,
      `M ${xs[1]} ${ys[0]} ${v[1][0].f} ${v[1][1].f}`,
      `M ${xs[2]} ${ys[1]} ${v[2][1].f} ${v[2][2].f}`,
      `M ${xs[0]} ${ys[1]} ${h[1][0].f} ${h[1][1].f} ${h[1][2].f}`,
      `M ${xs[0]} ${ys[2]} ${h[2][0].f} ${h[2][1].f} ${h[2][2].f}`,
    ],
    shapes: {
      B: `M ${xs[0]} ${ys[0]} H ${xs[3]} V ${ys[2]} ${h[2][2].r} ${h[2][1].r} ${h[2][0].r} V ${ys[0]} Z`,
      E: `M ${xs[0]} ${ys[1]} ${h[1][0].f} ${h[1][1].f} ${h[1][2].f} V ${ys[3]} H ${xs[0]} V ${ys[1]} Z`,
      A: `M ${xs[0]} ${ys[0]} H ${xs[1]} ${v[1][0].f} ${v[1][1].f} ${h[2][0].r} V ${ys[0]} Z`,
      F: `M ${xs[2]} ${ys[1]} ${h[1][2].f} V ${ys[3]} H ${xs[2]} ${v[2][2].r} ${v[2][1].r} Z`,
      C: `M ${xs[1]} ${ys[0]} H ${xs[3]} V ${ys[2]} ${h[2][2].r} ${h[2][1].r} ${v[1][1].r} ${v[1][0].r} Z`,
      D: `M ${xs[0]} ${ys[1]} ${h[1][0].f} ${h[1][1].f} ${v[2][1].f} ${v[2][2].f} H ${xs[0]} V ${ys[1]} Z`,
    },
    tiles: {
      1: cell(0, 0),
      2: `M ${xs[1]} ${ys[0]} H ${xs[3]} V ${ys[1]} ${h[1][2].r} ${h[1][1].r} ${v[1][0].r} Z`,
      3: cell(1, 1),
      4: `M ${xs[0]} ${ys[2]} ${h[2][0].f} ${h[2][1].f} ${v[2][2].f} H ${xs[0]} Z`,
      5: cell(2, 2),
      6: cell(0, 1),
      7: cell(2, 1),
    },
  };
})();

// Keep neighboring degrees inside one continuous filtered-complex picture.
// The E_r controls change the terms and differentials on this fixed canvas.
const SPEC_STAGE_CAPS = [
  ["E₀：取递减滤过 C• = F⁰C• ⊃ F¹C• ⊃ F²C• ⊃ F³C• ⊃ F⁴C• = 0。编号长条是 E₀ 的 (p,q) 项 gr_F^p C^{p+q}；当前小格表示竖直 d₀ 的像。",
   "E₀: take a decreasing filtration C• = F⁰C• ⊃ F¹C• ⊃ F²C• ⊃ F³C• ⊃ F⁴C• = 0. A numbered strip is the (p,q)-term gr_F^p C^{p+q} of E₀; the current cells are images of the vertical d₀."],
  ["E₁ = H(E₀,d₀)。它的 (p,q) 项是 H^{p+q}(gr_F^p C•)；d₁ 水平向右。",
   "E₁ = H(E₀,d₀). Its (p,q)-term is H^{p+q}(gr_F^p C•), and d₁ points horizontally to the right."],
  ["E₂ = H(E₁,d₁)。相差少于两层的小格已经被商掉；当前小格表示双次数 (2,−1) 的 d₂。",
   "E₂ = H(E₁,d₁). Cells from earlier differentials have been quotiented out; the current cells represent d₂ of bidegree (2,−1)."],
  ["E₃ = H(E₂,d₂)。此时只剩当前双次数 (3,−2) 的 d₃ 需要处理。",
   "E₃ = H(E₂,d₂). Only the current d₃ of bidegree (3,−2) remains to be handled."],
  ["四步滤过使 E₄ = E∞。中心长方形是 gr_F^p H^m(C•) = F^pH^m(C•) ∕ F^{p+1}H^m(C•)。",
   "For a four-step filtration E₄ = E∞. Each central rectangle is gr_F^p H^m(C•) = F^pH^m(C•) ∕ F^{p+1}H^m(C•)."],
];

const SPEC_DEGREES = [
  { object: "SN2", complex: "Cⁿ⁻²", cohomology: "Hⁿ⁻²", total: "n−2", offset: -2 },
  { object: "SN1", complex: "Cⁿ⁻¹", cohomology: "Hⁿ⁻¹", total: "n−1", offset: -1 },
  { object: "SN0", complex: "Cⁿ", cohomology: "Hⁿ", total: "n", offset: 0 },
  { object: "SP1", complex: "Cⁿ⁺¹", cohomology: "Hⁿ⁺¹", total: "n+1", offset: 1 },
  { object: "SP2", complex: "Cⁿ⁺²", cohomology: "Hⁿ⁺²", total: "n+2", offset: 2 },
];

const SPEC = (() => {
  const regions = [], regionCap = {}, lvlCap = {};
  let id = 0;
  SPEC_DEGREES.forEach((degree, degreeIndex) => {
    for (let level = 1; level <= 4; level++) {
      id++;
      regions.push({
        id, lv: level, degreeIndex, segment: degreeIndex, offset: degree.offset,
        complex: degree.complex, cohomology: degree.cohomology, total: degree.total,
        m: [degree.object, "QL" + level], rects: [], paths: [],
      });
      regionCap[id] = [
        `滤过 ${level}、总次数 ${degree.total} 的谱序列项。`,
        `The spectral-sequence term in filtration ${level} and total degree ${degree.total}.`,
      ];
    }
  });
  for (let level = 1; level <= 4; level++) {
    const p = 4 - level;
    lvlCap["QL" + level] = [
      `这条带的标准滤过次数是 p = ${p}，表示 gr${SUP[p]}_F C• = F${SUP[p]}C• ∕ F${SUP[p + 1]}C•。`,
      `This strip has standard filtration degree p = ${p} and represents gr${SUP[p]}_F C• = F${SUP[p]}C• ∕ F${SUP[p + 1]}C•.`,
    ];
  }
  return { regions, regionCap, lvlCap };
})();

const FIL = (() => {
  // Four successive quotient cells form one continuous, directional jigsaw.
  // The horizontal shift has a perpendicular component equal to stripWidth,
  // so adjacent strips share a boundary exactly: no gap and no overlap.
  const start = [84, 43], end = [279, 173], shift = 68;
  const dx = end[0] - start[0], dy = end[1] - start[1];
  const length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
  const stripWidth = shift * uy;
  const nx = -uy * stripWidth / 2, ny = ux * stripWidth / 2;
  const corners = [0, 1, 2, 3].map((index) => {
    const sx = start[0] + index * shift, sy = start[1];
    const ex = end[0] + index * shift, ey = end[1];
    return {
      a: [sx + nx, sy + ny], b: [ex + nx, ey + ny],
      c: [ex - nx, ey - ny], d: [sx - nx, sy - ny],
    };
  });
  const seams = [0, 1, 2].map((index) => {
    const seamStart = corners[index + 1].a;
    const seamEnd = corners[index].c;
    return puzzleDiagonalRight(...seamStart, ...seamEnd);
  });
  const bands = corners.map((corner, index) => {
    const lowerEdge = index === 0
      ? `L ${corner.b[0]} ${corner.b[1]}`
      : `${seams[index - 1].f} L ${corner.b[0]} ${corner.b[1]}`;
    const upperEdge = index === 3
      ? `L ${corner.d[0]} ${corner.d[1]}`
      : `${seams[index].r} L ${corner.d[0]} ${corner.d[1]}`;
    return `M ${corner.a[0]} ${corner.a[1]} ${lowerEdge} L ${corner.c[0]} ${corner.c[1]} ${upperEdge} Z`;
  });
  const labels = corners.map((corner) => [corner.d[0] + 10, corner.d[1] - 2]);
  const cumulative = (count) => bands.slice(0, count).join(" ");
  return {
    F1: cumulative(1), F2: cumulative(2), F3: cumulative(3), F4: cumulative(4),
    bands, labels,
  };
})();

// ———— the eight pictures (strings are [zh, en]) ————
const MODES = {
  map: {
    title: ["映射", "A map"],
    objects: ["X", "Y"],
    shapes: { X: MAP_PUZZLE.span(0, 2), Y: MAP_PUZZLE.span(1, 3) },
    regions: [
      { id: 1, m: ["X"], rects: [], paths: [MAP_PUZZLE.tiles[0]], lbl: [58, 105] },
      { id: 2, m: ["X", "Y"], rects: [], paths: [MAP_PUZZLE.tiles[1]], lbl: [133, 105] },
      { id: 3, m: ["Y"], rects: [], paths: [MAP_PUZZLE.tiles[2]], lbl: [208, 105] },
    ],
    objLbl: { X: [28, 52], Y: [232, 52] },
    picDeco: { ghosts: [], texts: [], seams: MAP_PUZZLE.seams },
    nodes: { X: [44, 78], Y: [116, 78] },
    nodeR: 16,
    arrows: [{ id: "φ", from: "X", to: "Y", lbl: [80, 62] }],
    regionCap: {
      1: ["① ker φ —— 只属于 X：φ 杀死的一切。",
          "① ker φ — X only: everything φ kills."],
      2: ["② coim φ = X ∕ ker φ ≅ im φ（第一同构定理）。",
          "② coim φ = X ∕ ker φ ≅ im φ (First Isomorphism Theorem)."],
      3: ["③ coker φ = Y ∕ im φ —— 只属于 Y：φ 打不到的地方。",
          "③ coker φ = Y ∕ im φ — Y only: what φ cannot reach."],
    },
    nodeCap: {
      X: ["X 的两块：将死的 ①（ker φ，居左为子）与将活的 ②（coim φ，居右为商）。",
          "Two parts of X: ① will die (ker φ — a sub, on the left); ② will survive (coim φ — a quotient, on the right)."],
      Y: ["Y 的两块：② 是被打到的子对象 im φ，③ 是商 coker φ。注意：不存在对应三块并集的对象——你只被允许谈论 X 与 Y 各自的子与商。",
          "Two parts of Y: ② is the sub im φ, ③ the quotient coker φ. Caution: no object corresponds to the union of all three pieces — only subs and quotients of X and Y may be discussed."],
    },
    arrowCap: {
      "φ": ["φ 杀死 ①，携带 ②。一张图同时给出 ker、im、coker——还有 coim，它藏在哪？（Vakil 的 trick question。）",
            "φ kills ①, carries ②. One picture shows ker, im, coker at once — and coim; where is it hiding? (Vakil's trick question.)"],
    },
    defaultCap: ["两个重叠的方形、3 个区域。重叠区同时是 X 的商与 Y 的子。点按任一区域、对象或箭头。",
                 "Two overlapping shapes, three regions. The overlap is at once a quotient of X and a sub of Y. Tap any region, object, or arrow."],
  },

  ses: {
    title: ["短正合列", "Short exact sequence"],
    layout: "col",
    picVB: "0 0 260 175",
    diagVB: "0 0 300 64",
    objects: ["A", "B", "C"],
    shapes: { A: SES_PUZZLE.span(0, 2), B: SES_PUZZLE.span(0, 1), C: SES_PUZZLE.span(1, 2) },
    regions: [
      { id: 1, m: ["A", "B"], rects: [], paths: [SES_PUZZLE.tiles[0]], lbl: [80, 105] },
      { id: 2, m: ["A", "C"], rects: [], paths: [SES_PUZZLE.tiles[1]], lbl: [180, 105] },
    ],
    objLbl: { A: [240, 48], B: [48, 74], C: [212, 74] },
    picDeco: { ghosts: [], texts: [], seams: SES_PUZZLE.seams },
    nodes: { B: [75, 32], A: [150, 32], C: [225, 32] },
    nodeR: 14,
    arrows: [
      { id: "i", from: "B", to: "A", lbl: [112, 20] },
      { id: "π", from: "A", to: "C", lbl: [188, 20] },
    ],
    deco: {
      texts: [[18, 36, "0"], [282, 36, "0"]],
      arrows: [[27, 32, 57, 32], [243, 32, 273, 32]],
    },
    regionCap: {
      1: ["① B，经 i 与 im i 识别；正合性在 A 处说的正是 im i = ker π。",
          "① B, identified with im i via i; exactness at A says precisely that im i = ker π."],
      2: ["② C ≅ A ∕ im i。把 B 经 i 与 im i 识别后，通常简写为 C ≅ A ∕ B；右侧拼图表示商，并没有选出一个子对象 C ⊆ A。",
          "② C ≅ A ∕ im i. After identifying B with im i, one often writes C ≅ A ∕ B. The right-hand piece represents a quotient; it does not choose a subobject C ⊆ A."],
    },
    nodeCap: {
      B: ["B 经单射 i 与子对象 im i ⊆ A 识别——图中把这个子对象放在左侧。",
          "The monomorphism i identifies B with the subobject im i ⊆ A, drawn on the left."],
      A: ["A 带有两步滤过 0 ⊆ im i ⊆ A；① ≅ B 与 ② ≅ C 是它的两个分次子商。它们如何粘合是扩张资料，这幅图不记录。",
          "A carries the two-step filtration 0 ⊆ im i ⊆ A; ① ≅ B and ② ≅ C are its two graded subquotients. How they are glued is extension data not recorded by the picture."],
      C: ["C 由商 A ∕ im i 表示；它不是 A 中一个字面意义的补集或指定的子对象。",
          "C is represented by the quotient A ∕ im i; it is not a literal complement or a chosen subobject of A."],
    },
    arrowCap: {
      i: ["i 是单射：什么都不杀，把 B 原样嵌进 A 的左侧。",
          "i is injective: it kills nothing, embedding B whole into the left of A."],
      "π": ["π 是满射：杀死 ①（ker π = im i），携带 ② 覆盖整个 C。",
            "π is surjective: it kills ① (ker π = im i) and carries ② onto all of C."],
    },
    defaultCap: ["0 → B → A → C → 0：i 单射、π 满射，且 im i = ker π。拼图记录两个分次子商，但不假设这列分裂。",
                 "0 → B → A → C → 0: i is monic, π is epic, and im i = ker π. The puzzle records the two graded subquotients without assuming that the sequence splits."],
  },

  iso3: {
    title: ["第三同构定理", "Third Isomorphism Theorem"],
    layout: "col",
    objects: ["A", "B", "C"],
    shapes: { A: ISO3_PUZZLE.span(0, 3), B: ISO3_PUZZLE.span(0, 2), C: ISO3_PUZZLE.span(0, 1) },
    regions: [
      { id: 1, m: ["A", "B", "C"], rects: [], paths: [ISO3_PUZZLE.tiles[0]], lbl: [63, 105] },
      { id: 2, m: ["A", "B", "QBC", "QAC"], rects: [], paths: [ISO3_PUZZLE.tiles[1]], lbl: [130, 105] },
      { id: 3, m: ["A", "QAB", "QAC"], rects: [], paths: [ISO3_PUZZLE.tiles[2]], lbl: [197, 105] },
    ],
    objLbl: {
      C: [63, 50], B: [130, 50], A: [218, 50],
      QBC: [130, 172], QAB: [197, 172], QAC: [163, 199],
    },
    objTxt: { A: "A", B: "B", C: "C", QBC: "B∕C", QAB: "A∕B", QAC: "A∕C" },
    picDeco: {
      ghosts: [], texts: [], seams: ISO3_PUZZLE.seams,
      brackets: [[96, 230, 181, "QAC"]],
    },
    nodes: { C: [75, 32], B: [150, 32], A: [225, 32] },
    diagVB: "0 0 300 64",
    nodeR: 14,
    arrows: [],
    deco: {
      texts: [[112.5, 36, "⊆"], [187.5, 36, "⊆"]],
      arrows: [],
    },
    theoremCap: [
      "第三同构定理：A∕B ≅ (A∕C)∕(B∕C)",
      "Third Isomorphism Theorem: A∕B ≅ (A∕C)∕(B∕C)",
    ],
    regionCap: {
      1: ["① C：最深的子，居于最左，也是最里圈。它同时是 B 的子、A 的子。",
          "① C: the deepest sub, leftmost and innermost. A sub of B and of A at once."],
      2: ["② B∕C ⊆ A∕C：中间的一格。作为 B 的商它在 B 里居右；作为 A∕C 的子它在其中居左——同一格，两种身份，定理的前半句。",
          "② B∕C ⊆ A∕C: the middle cell. As a quotient of B it sits at B's right; as a sub of A∕C it sits at its left — one cell, two roles, the first half of the theorem."],
      3: ["③ A∕B ≅ (A∕C)∕(B∕C)。图把两边画成同一个子商：先取 A∕C = ②③，再商去 B∕C = ②，留下 ③；严格的典范同构由第三同构定理给出。",
          "③ A∕B ≅ (A∕C)∕(B∕C). The picture represents both sides by the same subquotient: take A∕C = ②③ and then quotient by B∕C = ②, leaving ③. The rigorous canonical isomorphism is supplied by the Third Isomorphism Theorem."],
    },
    nodeCap: {
      C: ["C = ①：最内圈。", "C = ①: the innermost ring."],
      B: ["B = ①②：中圈，整个含在 A 内。", "B = ①②: the middle ring, contained whole in A."],
      A: ["A = ①②③。可讨论的组合恰是“区间”：C、B、A、B∕C、A∕C、A∕B——六个，而非 2³−1 = 7 个。缺的正是 ①③：C 与 A∕B 的并不是任何允许的子商。这就是 Vakil 说的“which combinations of pieces we can discuss”。",
          "A = ①②③. The combinations we may discuss are exactly the intervals: C, B, A, B∕C, A∕C, A∕B — six, not 2³−1 = 7. The missing one is ①③: the union of C and A∕B is no admissible subquotient. This is Vakil's “which combinations of pieces we can discuss”."],
      QBC: ["B∕C = ②。", "B∕C = ②."],
      QAB: ["A∕B = ③。", "A∕B = ③."],
      QAC: ["A∕C = ②③：商去最深的子之后剩下的一切，自带滤过 0 ⊂ B∕C ⊂ A∕C。",
            "A∕C = ②③: everything left after killing the deepest sub, carrying its own filtration 0 ⊂ B∕C ⊂ A∕C."],
    },
    arrowCap: {
      j1: ["C ↪ B：携带 ①，新增 ② = B∕C。", "C ↪ B: carries ①; the new cell is ② = B∕C."],
      j2: ["B ↪ A：携带 ①②，新增 ③ = A∕B。", "B ↪ A: carries ①②; the new cell is ③ = A∕B."],
    },
    defaultCap: ["C ⊆ B ⊆ A", "C ⊆ B ⊆ A"],
  },

  two: {
    title: ["两个映射", "Two Morphisms"],
    objects: ["A", "B", "C"],
    picVB: "0 0 260 214",
    shapes: TWO_PUZZLE.shapes,
    picDeco: { ghosts: [], texts: [], seams: TWO_PUZZLE.seams },
    regions: [
      { id: 1, m: ["B"], rects: [], paths: [TWO_PUZZLE.tiles[1]], lbl: [184, 80] },
      { id: 2, m: ["A", "B"], rects: [], paths: [TWO_PUZZLE.tiles[2]], lbl: [128, 52] },
      { id: 3, m: ["A", "B", "C"], rects: [], paths: [TWO_PUZZLE.tiles[3]], lbl: [128, 108] },
      { id: 4, m: ["A"], rects: [], paths: [TWO_PUZZLE.tiles[4]], lbl: [72, 52] },
      { id: 5, m: ["A", "C"], rects: [], paths: [TWO_PUZZLE.tiles[5]], lbl: [72, 108] },
      { id: 6, m: ["C"], rects: [], paths: [TWO_PUZZLE.tiles[6]], lbl: [100, 164] },
    ],
    objLbl: { A: [54, 18], B: [202, 18], C: [54, 202] },
    nodes: { A: [126, 34], B: [66, 122], C: [186, 122] },
    diagVB: "0 0 252 156",
    nodeR: 16,
    arrows: [
      { id: "f", from: "A", to: "B", lbl: [78, 70] },
      { id: "g", from: "A", to: "C", lbl: [174, 70] },
    ],
    regionCap: {
      1: ["① coker f = B ∕ im f —— 只属于 B：f 打不到的地方。",
          "① coker f = B ∕ im f — B only: beyond the reach of f."],
      2: ["② f(ker g) ≅ ker g ∕ (ker f ∩ ker g)（经 f 等同）：往 C 的方向死了，却在 B 中活着。",
          "② f(ker g) ≅ ker g ∕ (ker f ∩ ker g), identified via f: dead toward C, alive in B."],
      3: ["③ A ∕ (ker f + ker g)，并典范同构于 im f ∕ f(ker g) 与 im g ∕ g(ker f)。因此同一格可分别读作 A、B、C 的子商。",
          "③ A ∕ (ker f + ker g), canonically isomorphic to im f ∕ f(ker g) and im g ∕ g(ker f). Thus the same cell may be read as a subquotient of A, B, and C."],
      4: ["④ ker f ∩ ker g —— A 的私有顶层：两条路上都死。最深的子居于最高处，水从这里再也流不下去。",
          "④ ker f ∩ ker g — A's private top strip: dead along both routes. The deepest sub sits highest; from here the water never flows down."],
      5: ["⑤ g(ker f) ≅ ker f ∕ (ker f ∩ ker g)：往 B 的方向死了，在 C 中活着。",
          "⑤ g(ker f) ≅ ker f ∕ (ker f ∩ ker g): dead toward B, alive in C."],
      6: ["⑥ coker g = C ∕ im g。", "⑥ coker g = C ∕ im g."],
    },
    nodeCap: {
      A: ["A 中的 ker f 与 ker g 一般没有给定的包含关系；图画出它们共同细化所得的四个子商。若两者可比，某些区域会退化为 0。",
          "The subobjects ker f and ker g of A need not be comparable; the picture shows the four subquotients in their common refinement. If they are comparable, some regions may degenerate to 0."],
      B: ["Vakil 的问题：你能看见 B ∕ im(ker(A→C)→B) 吗？答：ker(A→C) = ④②；它经 f 落进 B 的像是 ②（④ 已先死于 f）；商去之后剩下 ③①。",
          "Vakil's question: can you see B ∕ im(ker(A→C)→B)? Answer: ker(A→C) = ④②; its image in B under f is ② (④ already dies under f); the quotient is ③①."],
      C: ["C = ③⑤⑥：③ 是与 B 共享的子，⑤ 只来自 A，⑥ 是余核。",
          "C = ③⑤⑥: ③ the sub shared with B, ⑤ from A alone, ⑥ the cokernel."],
    },
    arrowCap: {
      f: ["f 杀死 ④⑤（= ker f），携带 ②③（= im f）进入 B。",
          "f kills ④⑤ (= ker f) and carries ②③ (= im f) into B."],
      g: ["g 杀死 ④②（= ker g），携带 ③⑤（= im g）进入 C。",
          "g kills ④② (= ker g) and carries ③⑤ (= im g) into C."],
    },
    defaultCap: ["同一个源头的两支箭 f: A→B 与 g: A→C。图中 B、C 共享的格子都经由 A 得到。这与交换三角有视觉上的镜像关系，但不是范畴论对偶；这种画法也无法比较两条不同的 A→C。点 B 看 Vakil 的问题。",
                 "Two arrows from one source, f: A→B and g: A→C. Every cell shared by B and C is obtained through A. This is a visual mirror of the commuting-triangle picture, not a categorical dual, and the notation cannot compare two distinct maps A→C. Tap B for Vakil's question."],
  },

  tri: {
    title: ["交换三角", "Commuting Triangle"],
    objects: ["A", "B", "C"],
    picVB: "0 0 260 214",
    shapes: TRI_PUZZLE.shapes,
    picDeco: { ghosts: [], texts: [], seams: TRI_PUZZLE.seams },
    regions: [
      { id: 1, m: ["A"], rects: [], paths: [TRI_PUZZLE.tiles[1]], lbl: [72, 80] },
      { id: 2, m: ["A", "B"], rects: [], paths: [TRI_PUZZLE.tiles[2]], lbl: [128, 52] },
      { id: 3, m: ["A", "B", "C"], rects: [], paths: [TRI_PUZZLE.tiles[3]], lbl: [128, 108] },
      { id: 4, m: ["B"], rects: [], paths: [TRI_PUZZLE.tiles[4]], lbl: [184, 52] },
      { id: 5, m: ["B", "C"], rects: [], paths: [TRI_PUZZLE.tiles[5]], lbl: [184, 108] },
      { id: 6, m: ["C"], rects: [], paths: [TRI_PUZZLE.tiles[6]], lbl: [156, 164] },
    ],
    objLbl: { A: [54, 18], B: [202, 18], C: [202, 202] },
    nodes: { A: [34, 34], B: [126, 34], C: [126, 122] },
    nodeR: 16,
    arrows: [
      { id: "f", from: "A", to: "B", lbl: [80, 22] },
      { id: "g", from: "B", to: "C", lbl: [140, 80] },
      { id: "h", from: "A", to: "C", lbl: [62, 92], dash: true },
    ],
    regionCap: {
      1: ["① ker f —— 只属于 A：一进 B 就死了。", "① ker f — A only: dead on arrival in B."],
      2: ["② ker h ∕ ker f ≅ im f ∩ ker g（经 f 等同）。A 与 B 的重叠：来自 A，但将死于 g。",
          "② ker h ∕ ker f ≅ im f ∩ ker g (identified via f). The overlap of A and B: it comes from A, but g will kill it."],
      3: ["③ im h ≅ A ∕ ker h ≅ im f ∕ (im f ∩ ker g)。全图唯一的三重重叠：从 A 一路活到 C。",
          "③ im h ≅ A ∕ ker h ≅ im f ∕ (im f ∩ ker g). The only triple overlap: alive all the way from A to C."],
      4: ["④ ker g ∕ (im f ∩ ker g) —— 只属于 B：不来自 A，也到不了 C。",
          "④ ker g ∕ (im f ∩ ker g) — B only: not from A, and it will never reach C."],
      5: ["⑤ im g ∕ im h ≅ B ∕ (im f + ker g)。B 与 C 的重叠：到得了 C，却不经由 A。",
          "⑤ im g ∕ im h ≅ B ∕ (im f + ker g). The overlap of B and C: it reaches C, but not by way of A."],
      6: ["⑥ coker g = C ∕ im g —— 只属于 C：g 打不到的地方。",
          "⑥ coker g = C ∕ im g — C only: beyond the reach of g."],
    },
    nodeCap: {
      A: ["A 的滤过 0 ⊆ ker f ⊆ ker h ⊆ A：三层 ①②③，自左向右。",
          "The filtration 0 ⊆ ker f ⊆ ker h ⊆ A: three layers ①②③, left to right."],
      B: ["B 被 im f（②③）与 ker g（②④）共同细化；二者一般没有给定的包含关系，所以通用图需要二维。若它们可比，某些区域会退化为 0。",
          "B is jointly refined by im f (②③) and ker g (②④). They need not be comparable, so the general picture is two-dimensional; if they are comparable, some regions may degenerate to 0."],
      C: ["C 的滤过 0 ⊆ im h ⊆ im g ⊆ C：三层 ③⑤⑥。",
          "The filtration 0 ⊆ im h ⊆ im g ⊆ C: three layers ③⑤⑥."],
    },
    arrowCap: {
      h: ["h = g∘f 只携带 ③。由于 h 经 B 分解，图中每个同时属于 A 与 C 的子商也出现在 B 中；缺少第七区是已假设分解关系的图像后果，而不是交换性的判据。",
          "h = g∘f carries only ③. Because h factors through B, every subquotient drawn in both A and C also appears in B. The missing seventh region is a visual consequence of the assumed factorization, not a test for commutativity."],
    },
    defaultCap: ["给定 h = g∘f 的交换三角 A→B→C，图把相应子商画成 6 个区域（而非一般三形状的 7 区）。这是已知分解关系的编码，不是交换性的判据。点按任一区域、对象或箭头。",
                 "Given the commuting triangle with h = g∘f, the relevant subquotients occupy six regions. Three generic shapes would have seven. The six-region layout records the assumed factorization; it is not a test for commutativity. Tap any region, object, or arrow."],
  },

  sq: {
    title: ["交换方块", "Commuting Square"],
    objects: ["B", "D", "A", "C"],
    picVB: "0 0 260 234",
    shapes: SQUARE_PUZZLE.shapes,
    picDeco: { ghosts: [], texts: [], seams: SQUARE_PUZZLE.seams },
    regions: [
      { id: 1, m: ["A"], rects: [], paths: [SQUARE_PUZZLE.tiles[1]], lbl: [65, 50] },
      { id: 2, m: ["A", "D"], rects: [], paths: [SQUARE_PUZZLE.tiles[2]], lbl: [65, 115] },
      { id: 3, m: ["A", "B"], rects: [], paths: [SQUARE_PUZZLE.tiles[3]], lbl: [130, 50] },
      { id: 4, m: ["A", "B", "D"], rects: [], paths: [SQUARE_PUZZLE.tiles[4]], lbl: [111, 97] },
      { id: 5, m: ["A", "B", "C", "D"], rects: [], paths: [SQUARE_PUZZLE.tiles[5]], lbl: [132, 115] },
      { id: 6, m: ["B"], rects: [], paths: [SQUARE_PUZZLE.tiles[6]], lbl: [195, 50] },
      { id: 7, m: ["D"], rects: [], paths: [SQUARE_PUZZLE.tiles[7]], lbl: [65, 180] },
      { id: 8, m: ["B", "C", "D"], rects: [], paths: [SQUARE_PUZZLE.tiles[8]], lbl: [153, 137] },
      { id: 9, m: ["B", "C"], rects: [], paths: [SQUARE_PUZZLE.tiles[9]], lbl: [195, 115] },
      { id: 10, m: ["C", "D"], rects: [], paths: [SQUARE_PUZZLE.tiles[10]], lbl: [130, 180] },
      { id: 11, m: ["C"], rects: [], paths: [SQUARE_PUZZLE.tiles[11]], lbl: [195, 180] },
    ],
    objLbl: { A: [41, 14], B: [219, 14], D: [41, 230], C: [219, 230] },
    nodes: { A: [34, 34], B: [126, 34], D: [34, 122], C: [126, 122] },
    nodeR: 16,
    arrows: [
      { id: "α", from: "A", to: "B", lbl: [80, 22] },
      { id: "β", from: "A", to: "D", lbl: [20, 80] },
      { id: "γ", from: "B", to: "C", lbl: [140, 80] },
      { id: "δ", from: "D", to: "C", lbl: [80, 136] },
      { id: "h", from: "A", to: "C", lbl: [66, 70], dash: true },
    ],
    regionCap: {
      1: ["① ker α ∩ ker β —— 只属于 A：两条路上都活不过第一步。",
          "① ker α ∩ ker β — A only: survives neither first step."],
      2: ["② ker α ∕ (ker α ∩ ker β)：死于 B 一路、却在 D 中幸存。A 与 D 的重叠。",
          "② ker α ∕ (ker α ∩ ker β): dies on the B route, survives in D. The overlap of A and D."],
      3: ["③ ker β ∕ (ker α ∩ ker β)：死于 D 一路、却在 B 中幸存。A 与 B 的重叠。",
          "③ ker β ∕ (ker α ∩ ker β): dies on the D route, survives in B. The overlap of A and B."],
      4: ["④ ker h ∕ (ker α + ker β)：在 B、D 中都幸存，却到不了 C。A、B、D 的三重重叠。",
          "④ ker h ∕ (ker α + ker β): survives in both B and D, yet never reaches C. The triple overlap of A, B, D."],
      5: ["⑤ im h，其中 h = γα = δβ。交换性保证两条复合给出同一个映射，因而有同一个像；图在这里编码这项已知的等式。",
          "⑤ im h, where h = γα = δβ. Commutativity says that the two composites are the same morphism and hence have the same image; the picture encodes this assumed equality here."],
      6: ["⑥ ker γ ∕ (im α ∩ ker γ) —— 右上角只属于 B 的一格。",
          "⑥ ker γ ∕ (im α ∩ ker γ) — the upper-right cell, private to B."],
      7: ["⑦ ker δ ∕ (im β ∩ ker δ) —— 左下角只属于 D 的一格。",
          "⑦ ker δ ∕ (im β ∩ ker δ) — the lower-left cell, private to D."],
      8: ["⑧ (im γ ∩ im δ) ∕ im h：两条路各自都打得到、却并非协同来自 A。B、C、D 的三重重叠。",
          "⑧ (im γ ∩ im δ) ∕ im h: reachable along both routes separately, yet not coherently from A. The triple overlap of B, C, D."],
      9: ["⑨ im γ ∕ (im γ ∩ im δ)：只有经 B 的路到得了。B 与 C 的重叠。",
          "⑨ im γ ∕ (im γ ∩ im δ): reachable only via B. The overlap of B and C."],
      10: ["⑩ im δ ∕ (im γ ∩ im δ)：只有经 D 的路到得了。C 与 D 的重叠。",
           "⑩ im δ ∕ (im γ ∩ im δ): reachable only via D. The overlap of C and D."],
      11: ["⑪ C ∕ (im γ + im δ) —— 只属于 C：两条路都够不着。",
           "⑪ C ∕ (im γ + im δ) — C only: beyond both routes."],
    },
    nodeCap: {
      A: ["A 位于左上；弧线是它在中央格内的右下边界。A 包含 ①②③④⑤。",
          "A occupies the upper left; the arc is its lower-right boundary inside the central cell. Its pieces are ①②③④⑤."],
      B: ["B 是右上的方框，包含 ③④⑤⑥⑧⑨。中央格由 A 与 C 的两条弧线进一步分成三块。",
          "B is the upper-right square, containing ③④⑤⑥⑧⑨. The two arcs from A and C split its central cell into three pieces."],
      C: ["C 位于右下；弧线是它在中央格内的左上边界。C 包含 ⑤⑧⑨⑩⑪。",
          "C occupies the lower right; the arc is its upper-left boundary inside the central cell. Its pieces are ⑤⑧⑨⑩⑪."],
      D: ["D 是左下的方框，包含 ②④⑤⑦⑧⑩。",
          "D is the lower-left square, containing ②④⑤⑦⑧⑩."],
    },
    arrowCap: {
      h: ["h = γα = δβ。在已假设交换的前提下，拼图中的区域关系满足 A∩C ⊆ B∩D ⊆ A∪C，因此十五种可能的非空组合只出现十一种。这些包含关系编码交换性的后果，并不反过来判定两复合相等。",
          "h = γα = δβ. Under the assumed commutativity, the puzzle incidences satisfy A∩C ⊆ B∩D ⊆ A∪C, leaving eleven of the fifteen possible nonempty combinations. These inclusions encode consequences of commutativity; they do not conversely prove that the composites are equal."],
    },
    defaultCap: ["给定交换方块 h = γα = δβ，图用 11 个区域编码四个对象上的相容滤过。区域的相交只是共同子商的图像语言，不反过来证明方块交换。Vakil：“This was quite tricky to think through!”",
                 "Given the commuting square h = γα = δβ, eleven regions encode compatible filtrations on the four objects. Their overlaps are pictorial shorthand for common subquotients and do not conversely prove commutativity. Vakil: “This was quite tricky to think through!”"],
  },

  snake: {
    title: ["蛇引理", "Snake lemma"],
    layout: "col",
    picVB: "0 0 320 248",
    diagVB: "0 0 320 186",
    objects: ["B", "E", "A", "F", "C", "D"],
    shapes: SNAKE_PUZZLE.shapes,
    picDeco: { ghosts: [], texts: [], seams: SNAKE_PUZZLE.seams },
    regions: [
      { id: 1, m: ["A", "B", "ka", "kb"], rects: [], paths: [SNAKE_PUZZLE.tiles[1]], lbl: [66, 54] },
      { id: 2, m: ["B", "C", "kb", "kc"], rects: [], paths: [SNAKE_PUZZLE.tiles[2]], lbl: [207, 54] },
      { id: 3, m: ["B", "C", "D", "E", "kc", "qa"], rects: [], paths: [SNAKE_PUZZLE.tiles[3]], lbl: [160, 123] },
      { id: 4, m: ["D", "E", "qa", "qb"], rects: [], paths: [SNAKE_PUZZLE.tiles[4]], lbl: [113, 193] },
      { id: 5, m: ["E", "F", "qb", "qc"], rects: [], paths: [SNAKE_PUZZLE.tiles[5]], lbl: [254, 193] },
      { id: 6, m: ["A", "B", "D", "E"], rects: [], paths: [SNAKE_PUZZLE.tiles[6]], lbl: [66, 123] },
      { id: 7, m: ["B", "C", "E", "F"], rects: [], paths: [SNAKE_PUZZLE.tiles[7]], lbl: [254, 123] },
    ],
    objLbl: { A: [30, 14], B: [160, 14], C: [290, 14], D: [30, 242], E: [160, 242], F: [290, 242] },
    nodes: {
      ka: [85, 22], kb: [160, 22], kc: [235, 22],
      A: [85, 70], B: [160, 70], C: [235, 70],
      D: [85, 118], E: [160, 118], F: [235, 118],
      qa: [85, 166], qb: [160, 166], qc: [235, 166],
    },
    small: ["ka", "kb", "kc", "qa", "qb", "qc"],
    nodeTxt: { ka: "ker a", kb: "ker b", kc: "ker c", qa: "coker a", qb: "coker b", qc: "coker c" },
    nodeR: 13,
    arrows: [
      { id: "k1", from: "ka", to: "kb", trim: 24 },
      { id: "k2", from: "kb", to: "kc", trim: 24 },
      { id: "q1", from: "qa", to: "qb", trim: 27 },
      { id: "q2", from: "qb", to: "qc", trim: 27 },
      { id: "ja", from: "ka", to: "A", dot: 1, trim: 14 },
      { id: "jb", from: "kb", to: "B", dot: 1, trim: 14 },
      { id: "jc", from: "kc", to: "C", dot: 1, trim: 14 },
      { id: "pa", from: "D", to: "qa", dot: 1, trim: 14 },
      { id: "pb", from: "E", to: "qb", dot: 1, trim: 14 },
      { id: "pc", from: "F", to: "qc", dot: 1, trim: 14 },
      { id: "i", from: "A", to: "B", lbl: [122, 60] },
      { id: "π", from: "B", to: "C", lbl: [197, 60] },
      { id: "i′", from: "D", to: "E", lbl: [122, 108] },
      { id: "π′", from: "E", to: "F", lbl: [197, 108] },
      { id: "a", from: "A", to: "D", lbl: [73, 90] },
      { id: "b", from: "B", to: "E", lbl: [171, 90] },
      { id: "c", from: "C", to: "F", lbl: [247, 86] },
      { id: "∂", from: "kc", to: "qa",
        curve: "M 256,24 C 302,30 310,60 294,82 C 272,99 160,97 80,97 C 30,97 14,120 16,144 C 18,162 38,166 58,166",
        head: "66,166 57,162 57,170",
        lbl: [307, 48], dash: true },
    ],
    deco: {
      texts: [[35, 74, "0"], [285, 74, "0"], [35, 122, "0"], [285, 122, "0"],
              [40, 26, "0"], [284, 170, "0"]],
      arrows: [[44, 70, 64, 70], [252, 70, 272, 70], [44, 118, 64, 118], [252, 118, 272, 118],
               [48, 22, 62, 22], [264, 166, 277, 166]],
    },
    regionCap: {
      1: ["① ker a —— 蛇头。只属于 A 与 B：整条蛇从这里出发。",
          "① ker a — the snake's head. Only in A and B: the sequence departs from here."],
      2: ["② ker ∂ = im(ker b → ker c)，并且 ② ≅ ker b ∕ im(ker a → ker b)。B 与 C 共享的顶层。",
          "② ker ∂ = im(ker b → ker c), and ② ≅ ker b ∕ im(ker a → ker b). The top layer shared by B and C."],
      3: ["③ im ∂ ≅ ker c ∕ im(ker b → ker c)。把 D 通过 i′ 识别为 E 的子对象后，也有 ③ ≅ (im b ∩ i′(D)) ∕ i′(im a)。这是蛇身的像子商；即使它为 0，连接映射 ∂ 仍然存在。Vakil 称它为 “the well-camouflaged piece … the star of the show.”",
          "③ im ∂ ≅ ker c ∕ im(ker b → ker c). After identifying D with i′(D) ⊂ E, also ③ ≅ (im b ∩ i′(D)) ∕ i′(im a). This is the image subquotient of the snake; the connecting map ∂ still exists when it is zero. Vakil calls it “the well-camouflaged piece … the star of the show.”"],
      4: ["④ coker a ∕ im ∂ ≅ ker(coker b → coker c)。D 与 E 共享的底层。",
          "④ coker a ∕ im ∂ ≅ ker(coker b → coker c). The bottom layer shared by D and E."],
      5: ["⑤ coker c ≅ coker b ∕ im(coker a → coker b)——蛇尾，只属于 E 与 F。",
          "⑤ coker c ≅ coker b ∕ im(coker a → coker b) — the snake's tail, only in E and F."],
      6: ["⑥ im a ≅ A ∕ ker a：不入蛇队的平民，随 i、i′ 平行流过 A、B、D、E。",
          "⑥ im a ≅ A ∕ ker a: a civilian outside the snake, flowing in parallel through A, B, D, E."],
      7: ["⑦ im c ≅ C ∕ ker c：另一位平民，流过 B、C、E、F。",
          "⑦ im c ≅ C ∕ ker c: the other civilian, flowing through B, C, E, F."],
    },
    nodeCap: {
      A: ["A 带有滤过 0 ⊂ ker a ⊂ A，逐次商为 ① = ker a 与 ⑥ = coim a ≅ im a。",
          "A has the filtration 0 ⊂ ker a ⊂ A, with successive quotients ① = ker a and ⑥ = coim a ≅ im a."],
      B: ["B 就是整个上半矩形：顶带 ker b = ①②，中带 im b = ⑥③⑦。竖直按 ker b 分层，水平按 A ∣ C 分列——两个滤过不可比。",
          "B is the entire upper rectangle: ①② are the filtration pieces of ker b, while ⑥③⑦ are those of coim b ≅ im b. The vertical filtration by ker b and the horizontal filtration induced by A and C need not be comparable."],
      C: ["C 带有滤过 0 ⊂ ker c ⊂ C；ker c 的逐次块是②③，而 C ∕ ker c = coim c ≅ im c 对应⑦。",
          "C has the filtration 0 ⊂ ker c ⊂ C; the successive pieces of ker c are ②③, while C ∕ ker c = coim c ≅ im c corresponds to ⑦."],
      D: ["D 带有滤过 0 ⊂ im a ⊂ D；子对象 im a 对应⑥，商 coker a 的逐次块是③④。",
          "D has the filtration 0 ⊂ im a ⊂ D; the subobject im a corresponds to ⑥, and the successive pieces of coker a are ③④."],
      E: ["E 是整个下半矩形——B 的 180° 点对称。中带把 B 一侧的 coim b 与 E 中的 im b 典范识别；点对称提示蛇引理在对偶范畴中的对应形式。",
          "E is the entire lower rectangle, the 180° visual counterpart of B. The middle band canonically identifies coim b on the B side with im b in E; the point symmetry suggests the corresponding statement in the opposite category."],
      F: ["F 带有滤过 0 ⊂ im c ⊂ F，逐次商为⑦ = im c 与⑤ = coker c。",
          "F has the filtration 0 ⊂ im c ⊂ F, with successive quotients ⑦ = im c and ⑤ = coker c."],
      ka: ["ker a = ①。左端的 0 说的正是 ker a ↪ ker b 是单射。", "ker a = ①. The initial 0 says precisely that ker a ↪ ker b is injective."],
      kb: ["ker b = ①②：竖直方向死去的顶带。", "ker b = ①②: the top band, killed vertically."],
      kc: ["ker c = ②③。② 来自 ker b；③ 无处可去——只能坠向 coker a。",
           "ker c = ②③. Here ② comes from ker b; ③ has nowhere to go — except down, to coker a."],
      qa: ["coker a = ③④。③ 刚刚从 ker c 落下来。", "coker a = ③④. The piece ③ has just fallen from ker c."],
      qb: ["coker b = ④⑤。", "coker b = ④⑤."],
      qc: ["coker c = ⑤。右端的 0 说 coker b ↠ coker c 是满射。", "coker c = ⑤. The final 0 says coker b ↠ coker c is surjective."],
    },
    arrowCap: {
      "k1": ["ker a ↪ ker b：携带 ①。", "ker a ↪ ker b: carries ①."],
      "k2": ["ker b → ker c：杀死 ①、携带 ②。像只有 ②，不满——余下的 ③ 正是蛇要接走的。",
             "ker b → ker c: kills ①, carries ②. The image is only ② — the leftover ③ is what the snake picks up."],
      "q1": ["coker a → coker b：杀死 ③（它来自 im b）、携带 ④。",
             "coker a → coker b: kills ③ (it came from im b), carries ④."],
      "q2": ["coker b → coker c：杀死 ④、携带 ⑤。", "coker b → coker c: kills ④, carries ⑤."],
      "ja": ["ker a ↪ A：① 作为子对象。", "ker a ↪ A: ① as a subobject."],
      "jb": ["ker b ↪ B：①②。", "ker b ↪ B: ①②."],
      "jc": ["ker c ↪ C：②③。", "ker c ↪ C: ②③."],
      "pa": ["D ↠ coker a：杀死 ⑥ = im a。", "D ↠ coker a: kills ⑥ = im a."],
      "pb": ["E ↠ coker b：杀死 ⑥③⑦ = im b。", "E ↠ coker b: kills ⑥③⑦ = im b."],
      "pc": ["F ↠ coker c：杀死 ⑦ = im c。", "F ↠ coker c: kills ⑦ = im c."],
      "∂": ["∂: ker c → coker a。其核是②，像是③。图显示 ker ∂ 与 im ∂；∂ 本身仍由标准蛇引理构造得到，并须用交换性与两行正合性验证良定义。",
            "∂: ker c → coker a. Its kernel is ② and its image is ③. The picture displays ker ∂ and im ∂; the map itself comes from the standard snake-lemma construction, whose well-definedness uses commutativity and exactness of the rows."],
    },
    defaultCap: ["设在阿贝尔范畴中，两行 0 → A → B → C → 0 与 0 → D → E → F → 0 短正合，且两个方块交换。蛇引理给出 0 → ker a → ker b → ker c → coker a → coker b → coker c → 0。格表示滤过的逐次商；相邻项共享一格表示前一映射的像等于后一映射的核，并不自行定义这些映射。点按 ∂。",
                 "In an abelian category, assume the rows 0 → A → B → C → 0 and 0 → D → E → F → 0 are short exact and both squares commute. The snake lemma gives 0 → ker a → ker b → ker c → coker a → coker b → coker c → 0. Cells denote successive filtration quotients: a shared cell records that one image equals the next kernel; it does not by itself define the maps. Tap ∂."],
  },

  cx: {
    title: ["复形与上同调", "Complex & cohomology"],
    layout: "col",
    picVB: "0 0 280 175",
    diagVB: "0 0 320 116",
    objects: ["Cm", "Ci", "Cp"],
    objTxt: { Cm: "Cⁱ⁻¹", Ci: "Cⁱ", Cp: "Cⁱ⁺¹" },
    shapes: COMPLEX_PUZZLE.shapes,
    picDeco: {
      ghosts: [],
      texts: [[0, 117, "⋯"], [261, 57, "⋯"]],
      seams: COMPLEX_PUZZLE.seams,
    },
    regions: [
      { id: 1, m: ["Cm"], rects: [], paths: [COMPLEX_PUZZLE.tiles[0]], lbl: COMPLEX_PUZZLE.centers[0] },
      { id: 2, m: ["Cm", "Hm"], rects: [], paths: [COMPLEX_PUZZLE.tiles[1]], lbl: COMPLEX_PUZZLE.centers[1] },
      { id: 3, m: ["Cm", "Ci"], rects: [], paths: [COMPLEX_PUZZLE.tiles[2]], lbl: COMPLEX_PUZZLE.centers[2] },
      { id: 4, m: ["Ci", "Hi"], rects: [], paths: [COMPLEX_PUZZLE.tiles[3]], lbl: COMPLEX_PUZZLE.centers[3] },
      { id: 5, m: ["Ci", "Cp"], rects: [], paths: [COMPLEX_PUZZLE.tiles[4]], lbl: COMPLEX_PUZZLE.centers[4] },
      { id: 6, m: ["Cp", "Hp"], rects: [], paths: [COMPLEX_PUZZLE.tiles[5]], lbl: COMPLEX_PUZZLE.centers[5] },
      { id: 7, m: ["Cp"], rects: [], paths: [COMPLEX_PUZZLE.tiles[6]], lbl: COMPLEX_PUZZLE.centers[6] },
    ],
    objLbl: { Cm: [58, 164], Ci: [140, 164], Cp: [222, 164] },
    nodes: { Cm: [70, 35], Ci: [160, 35], Cp: [250, 35], Hm: [70, 92], Hi: [160, 92], Hp: [250, 92] },
    small: ["Cm", "Ci", "Cp", "Hm", "Hi", "Hp"],
    nodeTxt: { Cm: "Cⁱ⁻¹", Ci: "Cⁱ", Cp: "Cⁱ⁺¹", Hm: "Hⁱ⁻¹", Hi: "Hⁱ", Hp: "Hⁱ⁺¹" },
    nodeR: 14,
    arrows: [
      { id: "dm", txt: "dⁱ⁻¹", from: "Cm", to: "Ci", trim: 22, lbl: [115, 24] },
      { id: "dd", txt: "dⁱ", from: "Ci", to: "Cp", trim: 22, lbl: [205, 24] },
    ],
    deco: {
      texts: [[18, 39, "⋯"], [302, 39, "⋯"]],
      arrows: [[28, 35, 44, 35], [276, 35, 292, 35]],
      lines: [[70, 46, 70, 80], [160, 46, 160, 80], [250, 46, 250, 80]],
    },
    regionCap: {
      1: ["① im dⁱ⁻²：与画外的 Cⁱ⁻² 共享的重叠，延向左边的省略号。",
          "① im dⁱ⁻²: the overlap shared with the unseen Cⁱ⁻², trailing into the left ellipsis."],
      2: ["② Hⁱ⁻¹ = ker dⁱ⁻¹ ∕ im dⁱ⁻²：Cⁱ⁻¹ 私有的中缝。",
          "② Hⁱ⁻¹ = ker dⁱ⁻¹ ∕ im dⁱ⁻²: the private middle strip of Cⁱ⁻¹."],
      3: ["③ im dⁱ⁻¹ —— Cⁱ⁻¹ 与 Cⁱ 的重叠。d² = 0 在图上即：Cⁱ⁻¹ 与 Cⁱ⁺¹ 互不接触（交换三角作业的答案）。",
          "③ im dⁱ⁻¹ — the overlap of Cⁱ⁻¹ and Cⁱ. In the picture, d² = 0 says that Cⁱ⁻¹ and Cⁱ⁺¹ never touch."],
      4: ["④ Hⁱ。两条镜像短正合列是 0 → im dⁱ⁻¹ → ker dⁱ → Hⁱ → 0 与 0 → Hⁱ → coker dⁱ⁻¹ → im dⁱ → 0。原复形在 Cⁱ 处正合，当且仅当 Hⁱ = 0。",
          "④ Hⁱ. The two mirror short exact sequences are 0 → im dⁱ⁻¹ → ker dⁱ → Hⁱ → 0 and 0 → Hⁱ → coker dⁱ⁻¹ → im dⁱ → 0. The original complex is exact at Cⁱ exactly when Hⁱ = 0."],
      5: ["⑤ 在 Cⁱ 一侧是 coim dⁱ = Cⁱ ∕ ker dⁱ，在 Cⁱ⁺¹ 一侧是 im dⁱ；在阿贝尔范畴中二者典范同构。",
          "⑤ On the Cⁱ side it is coim dⁱ = Cⁱ ∕ ker dⁱ; on the Cⁱ⁺¹ side it is im dⁱ. These are canonically isomorphic in an abelian category."],
      6: ["⑥ Hⁱ⁺¹：Cⁱ⁺¹ 私有的中缝。", "⑥ Hⁱ⁺¹: the private middle strip of Cⁱ⁺¹."],
      7: ["⑦ im dⁱ⁺¹：与画外的 Cⁱ⁺² 共享，延向右边的省略号。",
          "⑦ im dⁱ⁺¹: shared with the unseen Cⁱ⁺², trailing into the right ellipsis."],
    },
    nodeCap: {
      Cm: ["Cⁱ⁻¹ 的滤过 im dⁱ⁻² ⊂ ker dⁱ⁻¹ ⊂ Cⁱ⁻¹ 的逐次商为①、②、③。",
           "The successive quotients of im dⁱ⁻² ⊂ ker dⁱ⁻¹ ⊂ Cⁱ⁻¹ are ①, ②, and ③."],
      Ci: ["Cⁱ 带有滤过 0 ⊂ im dⁱ⁻¹ ⊂ ker dⁱ ⊂ Cⁱ，逐次商依次为③、④ = Hⁱ、⑤ = coim dⁱ。图中还可读出 0 → ker dⁱ → Cⁱ → im dⁱ → 0 与 0 → im dⁱ⁻¹ → Cⁱ → coker dⁱ⁻¹ → 0；这里不假设任何短正合列分裂。",
          "Cⁱ has the filtration 0 ⊂ im dⁱ⁻¹ ⊂ ker dⁱ ⊂ Cⁱ, with successive quotients ③, ④ = Hⁱ, and ⑤ = coim dⁱ. The picture also shows 0 → ker dⁱ → Cⁱ → im dⁱ → 0 and 0 → im dⁱ⁻¹ → Cⁱ → coker dⁱ⁻¹ → 0; no splitting is assumed."],
      Cp: ["Cⁱ⁺¹ 的滤过 im dⁱ ⊂ ker dⁱ⁺¹ ⊂ Cⁱ⁺¹ 的逐次商为⑤、⑥、⑦。",
           "The successive quotients of im dⁱ ⊂ ker dⁱ⁺¹ ⊂ Cⁱ⁺¹ are ⑤, ⑥, and ⑦."],
      Hm: ["Hⁱ⁻¹ = ②。", "Hⁱ⁻¹ = ②."],
      Hi: ["Hⁱ = ④，被两侧重叠夹出的缝。附赠：ker–coker 正合列 ⋯→ker dⁱ→coker dⁱ⁻¹→ker dⁱ⁺¹→⋯ 在图上读作 ③④→④⑤→⑤⑥——相邻重叠一格，与蛇的机制相同（Vakil：“certainly brightens my day!”）。",
          "Hⁱ = ④, the strip pinched between the two overlaps. Bonus: the kernel–cokernel exact sequence ⋯→ker dⁱ→coker dⁱ⁻¹→ker dⁱ⁺¹→⋯ reads ③④→④⑤→⑤⑥ — consecutive overlaps of one cell, the same mechanism as the snake (Vakil: “certainly brightens my day!”)."],
      Hp: ["Hⁱ⁺¹ = ⑥。", "Hⁱ⁺¹ = ⑥."],
    },
    arrowCap: {
      "dm": ["dⁱ⁻¹ 杀死 ①②（= ker dⁱ⁻¹），携带 ③。", "dⁱ⁻¹ kills ①② (= ker dⁱ⁻¹), carries ③."],
      "dd": ["dⁱ 杀死 ③④（= ker dⁱ）、携带 ⑤。注意 ③ = im dⁱ⁻¹ 确实被杀——这就是 d² = 0。",
             "dⁱ kills ③④ (= ker dⁱ) and carries ⑤. Note ③ = im dⁱ⁻¹ is indeed killed — that is d² = 0."],
    },
    defaultCap: ["设 C• 是阿贝尔范畴中的上链复形。Hⁱ = ker dⁱ ∕ im dⁱ⁻¹；图中的三格是滤过 im dⁱ⁻¹ ⊂ ker dⁱ ⊂ Cⁱ 的逐次商，不是 Cⁱ 的典范直和分解。虚线表示复形在画外继续。",
                 "Let C• be a cochain complex in an abelian category. Hⁱ = ker dⁱ ∕ im dⁱ⁻¹. The three cells are the successive quotients of im dⁱ⁻¹ ⊂ ker dⁱ ⊂ Cⁱ, not a canonical direct-sum decomposition of Cⁱ. Dashed pieces continue off-stage."],
  },

  mapH: {
    title: ["上同调的映射", "A map of cohomology"],
    layout: "col",
    picVB: "0 -12 302 224",
    diagVB: "0 0 300 158",
    objects: ["Cm", "Ci", "Cp", "Dm", "Di", "Dp"],
    objTxt: { Cm: "Cⁿ⁻¹", Ci: "Cⁿ", Cp: "Cⁿ⁺¹", Dm: "Dⁿ⁻¹", Di: "Dⁿ", Dp: "Dⁿ⁺¹", HC: "Hⁿ(C)", HD: "Hⁿ(D)" },
    shapes: COHOMOLOGY_MAP_PUZZLE.shapes,
    picDeco: { ghosts: [], texts: [], seams: COHOMOLOGY_MAP_PUZZLE.seams },
    regions: [
      { id: 1, m: ["Cm"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.t0], lbl: [35, 37] },
      { id: 2, m: ["Cm", "Ci"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.t1], lbl: [93, 37] },
      { id: 3, m: ["Ci", "HC"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.t2], lbl: [151, 37] },
      { id: 4, m: ["Ci", "Cp"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.t3], lbl: [209, 37] },
      { id: 5, m: ["Cp"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.t4], lbl: [267, 37] },
      { id: 6, m: ["Cm", "Dm"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.m0], lbl: [35, 99] },
      { id: 7, m: ["Cm", "Ci", "Dm"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.lUpper], lbl: [76, 76] },
      { id: 8, m: ["Cm", "Ci", "Dm", "Di"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.lLens], lbl: [93, 99] },
      { id: 9, m: ["Ci", "Dm", "Di", "HC"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.lLower], lbl: [113, 122] },
      { id: 10, m: ["Ci", "Di", "HC", "HD"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.m2], lbl: [151, 99] },
      { id: 11, m: ["Ci", "Cp", "Di", "HD"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.rUpper], lbl: [192, 76] },
      { id: 12, m: ["Ci", "Cp", "Di", "Dp"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.rLens], lbl: [209, 99] },
      { id: 13, m: ["Cp", "Di", "Dp"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.rLower], lbl: [229, 122] },
      { id: 14, m: ["Cp", "Dp"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.m4], lbl: [267, 99] },
      { id: 15, m: ["Dm"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.b0], lbl: [35, 162] },
      { id: 16, m: ["Dm", "Di"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.b1], lbl: [93, 162] },
      { id: 17, m: ["Di", "HD"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.b2], lbl: [151, 162] },
      { id: 18, m: ["Di", "Dp"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.b3], lbl: [209, 162] },
      { id: 19, m: ["Dp"], rects: [], paths: [COHOMOLOGY_MAP_PUZZLE.tiles.b4], lbl: [267, 162] },
    ],
    objLbl: {
      Cm: [28, 10], Ci: [151, 10], Cp: [274, 10],
      Dm: [28, 200], Di: [151, 200], Dp: [274, 200],
    },
    nodes: {
      Cm: [70, 28], Ci: [150, 28], Cp: [230, 28],
      Dm: [70, 78], Di: [150, 78], Dp: [230, 78],
      HC: [110, 134], HD: [190, 134],
    },
    small: ["Cm", "Ci", "Cp", "Dm", "Di", "Dp", "HC", "HD"],
    nodeTxt: { Cm: "Cⁿ⁻¹", Ci: "Cⁿ", Cp: "Cⁿ⁺¹", Dm: "Dⁿ⁻¹", Di: "Dⁿ", Dp: "Dⁿ⁺¹", HC: "Hⁿ(C)", HD: "Hⁿ(D)" },
    nodeR: 14,
    arrows: [
      { id: "dC1", txt: "", from: "Cm", to: "Ci", trim: 22 },
      { id: "dC2", txt: "", from: "Ci", to: "Cp", trim: 22 },
      { id: "dD1", txt: "", from: "Dm", to: "Di", trim: 22 },
      { id: "dD2", txt: "", from: "Di", to: "Dp", trim: 22 },
      { id: "f1", txt: "", from: "Cm", to: "Dm", trim: 14 },
      { id: "f2", txt: "f", from: "Ci", to: "Di", trim: 14, lbl: [159, 56] },
      { id: "f3", txt: "", from: "Cp", to: "Dp", trim: 14 },
      { id: "Hf", txt: "", from: "HC", to: "HD", trim: 26 },
    ],
    deco: {
      texts: [[18, 32, "⋯"], [282, 32, "⋯"], [18, 82, "⋯"], [282, 82, "⋯"]],
      arrows: [[26, 28, 42, 28], [258, 28, 274, 28], [26, 78, 42, 78], [258, 78, 274, 78]],
    },
    regionCap: {
      1: ["① 只属于 Cⁿ⁻¹ 的逐次子商。", "① A successive quotient private to Cⁿ⁻¹."],
      2: ["② Cⁿ⁻¹ 与 Cⁿ 共有：im d_Cⁿ⁻¹ 的一个逐次子商。", "② Shared by Cⁿ⁻¹ and Cⁿ: a successive quotient of im d_Cⁿ⁻¹."],
      3: ["③ 只属于 Cⁿ；它是 ker Hⁿ(f) 的第一块。", "③ Private to Cⁿ; the first piece of ker Hⁿ(f)."],
      4: ["④ Cⁿ 与 Cⁿ⁺¹ 共有：im d_Cⁿ 的一个逐次子商。", "④ Shared by Cⁿ and Cⁿ⁺¹: a successive quotient of im d_Cⁿ."],
      5: ["⑤ 只属于 Cⁿ⁺¹ 的逐次子商。", "⑤ A successive quotient private to Cⁿ⁺¹."],
      6: ["⑥ Cⁿ⁻¹ 与 Dⁿ⁻¹ 共有：fⁿ⁻¹ 携带的一块。", "⑥ Shared by Cⁿ⁻¹ and Dⁿ⁻¹: a piece carried by fⁿ⁻¹."],
      7: ["⑦ Cⁿ⁻¹、Cⁿ、Dⁿ⁻¹ 的三重公共子商。", "⑦ A common successive quotient of Cⁿ⁻¹, Cⁿ, and Dⁿ⁻¹."],
      8: ["⑧ 左侧交换方块四项共有的中央子商。", "⑧ The central successive quotient shared by all four objects in the left commuting square."],
      9: ["⑨ Cⁿ、Dⁿ⁻¹、Dⁿ 共有；它是 ker Hⁿ(f) 的第二块。", "⑨ Shared by Cⁿ, Dⁿ⁻¹, and Dⁿ; the second piece of ker Hⁿ(f)."],
      10: ["⑩ coim Hⁿ(f) ≅ im Hⁿ(f)。这是 Hⁿ(C) 与 Hⁿ(D) 唯一共有的一块。", "⑩ coim Hⁿ(f) ≅ im Hⁿ(f), the unique piece shared by Hⁿ(C) and Hⁿ(D)."],
      11: ["⑪ Cⁿ、Cⁿ⁺¹、Dⁿ 共有；它是 coker Hⁿ(f) 的第一块。", "⑪ Shared by Cⁿ, Cⁿ⁺¹, and Dⁿ; the first piece of coker Hⁿ(f)."],
      12: ["⑫ 右侧交换方块四项共有的中央子商。", "⑫ The central successive quotient shared by all four objects in the right commuting square."],
      13: ["⑬ Cⁿ⁺¹、Dⁿ、Dⁿ⁺¹ 的三重公共子商。", "⑬ A common successive quotient of Cⁿ⁺¹, Dⁿ, and Dⁿ⁺¹."],
      14: ["⑭ Cⁿ⁺¹ 与 Dⁿ⁺¹ 共有：fⁿ⁺¹ 携带的一块。", "⑭ Shared by Cⁿ⁺¹ and Dⁿ⁺¹: a piece carried by fⁿ⁺¹."],
      15: ["⑮ 只属于 Dⁿ⁻¹ 的逐次子商。", "⑮ A successive quotient private to Dⁿ⁻¹."],
      16: ["⑯ Dⁿ⁻¹ 与 Dⁿ 共有：im d_Dⁿ⁻¹ 的一个逐次子商。", "⑯ Shared by Dⁿ⁻¹ and Dⁿ: a successive quotient of im d_Dⁿ⁻¹."],
      17: ["⑰ 只属于 Dⁿ；它是 coker Hⁿ(f) 的第二块。", "⑰ Private to Dⁿ; the second piece of coker Hⁿ(f)."],
      18: ["⑱ Dⁿ 与 Dⁿ⁺¹ 共有：im d_Dⁿ 的一个逐次子商。", "⑱ Shared by Dⁿ and Dⁿ⁺¹: a successive quotient of im d_Dⁿ."],
      19: ["⑲ 只属于 Dⁿ⁺¹ 的逐次子商。", "⑲ A successive quotient private to Dⁿ⁺¹."],
    },
    nodeCap: {
      Cm: ["Cⁿ⁻¹ 由①②⑥⑦⑧细化。", "Cⁿ⁻¹ is refined into ①②⑥⑦⑧."],
      Ci: ["Cⁿ 由②③④⑦⑧⑨⑩⑪⑫细化。", "Cⁿ is refined into ②③④⑦⑧⑨⑩⑪⑫."],
      Cp: ["Cⁿ⁺¹ 由④⑤⑪⑫⑬⑭细化。", "Cⁿ⁺¹ is refined into ④⑤⑪⑫⑬⑭."],
      Dm: ["Dⁿ⁻¹ 由⑥⑦⑧⑨⑮⑯细化。", "Dⁿ⁻¹ is refined into ⑥⑦⑧⑨⑮⑯."],
      Di: ["Dⁿ 由⑧⑨⑩⑪⑫⑬⑯⑰⑱细化。", "Dⁿ is refined into ⑧⑨⑩⑪⑫⑬⑯⑰⑱."],
      Dp: ["Dⁿ⁺¹ 由⑫⑬⑭⑱⑲细化。", "Dⁿ⁺¹ is refined into ⑫⑬⑭⑱⑲."],
      HC: ["Hⁿ(C) = ③⑨⑩；其中 ker Hⁿ(f) = ③⑨，coim Hⁿ(f) = ⑩。", "Hⁿ(C) = ③⑨⑩, with ker Hⁿ(f) = ③⑨ and coim Hⁿ(f) = ⑩."],
      HD: ["Hⁿ(D) = ⑩⑪⑰；其中 im Hⁿ(f) = ⑩，coker Hⁿ(f) = ⑪⑰。", "Hⁿ(D) = ⑩⑪⑰, with im Hⁿ(f) = ⑩ and coker Hⁿ(f) = ⑪⑰."],
    },
    arrowCap: {
      dC1: ["d_Cⁿ⁻¹ 携带②⑦⑧。", "d_Cⁿ⁻¹ carries ②⑦⑧."],
      dC2: ["d_Cⁿ 携带④⑪⑫，并杀死 im d_Cⁿ⁻¹ 所在的②⑦⑧。", "d_Cⁿ carries ④⑪⑫ and kills the incoming image pieces ②⑦⑧."],
      dD1: ["d_Dⁿ⁻¹ 携带⑧⑨⑯。", "d_Dⁿ⁻¹ carries ⑧⑨⑯."],
      dD2: ["d_Dⁿ 携带⑫⑬⑱，并杀死 im d_Dⁿ⁻¹ 所在的⑧⑨⑯。", "d_Dⁿ carries ⑫⑬⑱ and kills the incoming image pieces ⑧⑨⑯."],
      f1: ["fⁿ⁻¹ 携带⑥⑦⑧。", "fⁿ⁻¹ carries ⑥⑦⑧."],
      f2: ["fⁿ 携带⑧⑨⑩⑪⑫；左右两个交换方块分别编码 d_Df = fd_C。", "fⁿ carries ⑧⑨⑩⑪⑫; the two adjacent squares encode d_Df = fd_C."],
      f3: ["fⁿ⁺¹ 携带⑫⑬⑭。", "fⁿ⁺¹ carries ⑫⑬⑭."],
      Hf: ["Hⁿ(f): Hⁿ(C) → Hⁿ(D)：ker = ③⑨，coim ≅ im = ⑩，coker = ⑪⑰。", "Hⁿ(f): Hⁿ(C) → Hⁿ(D): ker = ③⑨, coim ≅ im = ⑩, and coker = ⑪⑰."],
    },
    defaultCap: ["这幅图把两个交换方块与两条三项复形叠在一起。Hⁿ(C) = ③⑨⑩，Hⁿ(D) = ⑩⑪⑰，共享格⑩给出 coim Hⁿ(f) ≅ im Hⁿ(f)。拼图接口统一向右、向下。",
                 "The picture overlays two commuting squares and two three-term complexes. Here Hⁿ(C) = ③⑨⑩ and Hⁿ(D) = ⑩⑪⑰; the shared cell ⑩ gives coim Hⁿ(f) ≅ im Hⁿ(f). Puzzle tabs point right and down."],
  },

  les: {
    title: ["长正合列", "Long exact sequence"],
    layout: "col",
    picVB: "0 -6 374 166",
    diagVB: "0 0 340 150",
    diagVB2: "0 0 340 186",
    diagTitle: ["复形的短正合列", "THE SES OF COMPLEXES"],
    diag2Title: ["上同调的长正合列", "THE LES IN COHOMOLOGY"],
    shapeStrokeOpacity: 0,
    objects: ["C1", "C2", "C3", "D1", "D2", "D3", "B1", "B2", "B3"],
    objTxt: { B1: "Bⁿ", B2: "Bⁿ⁺¹", B3: "Bⁿ⁺²", C1: "Cⁿ", C2: "Cⁿ⁺¹", C3: "Cⁿ⁺²", D1: "Dⁿ", D2: "Dⁿ⁺¹", D3: "Dⁿ⁺²" },
    shapes: LONG_EXACT_PUZZLE.shapes,
    picDeco: {
      ghosts: [],
      texts: [[2, 82, "⋯"], [357, 82, "⋯"]],
      seams: LONG_EXACT_PUZZLE.seams,
    },
    regions: [
      { id: 1, m: ["B1", "C1", "HB1"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o0Middle.path], lbl: LONG_EXACT_PUZZLE.tiles.o0Middle.lbl },
      { id: 2, m: ["B1", "C1", "HB1", "HC1"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.u0Top.path], lbl: LONG_EXACT_PUZZLE.tiles.u0Top.lbl },
      { id: 3, m: ["D1", "C1", "HC1", "HD1"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.u0Bottom.path], lbl: LONG_EXACT_PUZZLE.tiles.u0Bottom.lbl },
      { id: 4, m: ["D1", "C1", "B2", "C2", "HD1", "HB2"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o1Middle.path], lbl: LONG_EXACT_PUZZLE.tiles.o1Middle.lbl },
      { id: 5, m: ["B2", "C2", "HB2", "HC2"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.u1Top.path], lbl: LONG_EXACT_PUZZLE.tiles.u1Top.lbl },
      { id: 6, m: ["D2", "C2", "HC2", "HD2"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.u1Bottom.path], lbl: LONG_EXACT_PUZZLE.tiles.u1Bottom.lbl },
      { id: 7, m: ["D2", "C2", "B3", "C3", "HD2", "HB3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o2Middle.path], lbl: LONG_EXACT_PUZZLE.tiles.o2Middle.lbl },
      { id: 8, m: ["B3", "C3", "HB3", "HC3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.u2Top.path], lbl: LONG_EXACT_PUZZLE.tiles.u2Top.lbl },
      { id: 9, m: ["D3", "C3", "HC3", "HD3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.u2Bottom.path], lbl: LONG_EXACT_PUZZLE.tiles.u2Bottom.lbl },
      { id: 10, m: ["D3", "C3", "HD3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o3Middle.path], lbl: LONG_EXACT_PUZZLE.tiles.o3Middle.lbl },
      { id: 11, m: ["B1", "C1"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o0Top.path], lbl: LONG_EXACT_PUZZLE.tiles.o0Top.lbl },
      { id: 12, m: ["D1", "C1"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o0Bottom.path], lbl: LONG_EXACT_PUZZLE.tiles.o0Bottom.lbl },
      { id: 13, m: ["B1", "B2", "C1", "C2"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o1Top.path], lbl: LONG_EXACT_PUZZLE.tiles.o1Top.lbl },
      { id: 14, m: ["D1", "D2", "C1", "C2"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o1Bottom.path], lbl: LONG_EXACT_PUZZLE.tiles.o1Bottom.lbl },
      { id: 15, m: ["B2", "B3", "C2", "C3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o2Top.path], lbl: LONG_EXACT_PUZZLE.tiles.o2Top.lbl },
      { id: 16, m: ["D2", "D3", "C2", "C3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o2Bottom.path], lbl: LONG_EXACT_PUZZLE.tiles.o2Bottom.lbl },
      { id: 17, m: ["B3", "C3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o3Top.path], lbl: LONG_EXACT_PUZZLE.tiles.o3Top.lbl },
      { id: 18, m: ["D3", "C3"], rects: [], paths: [LONG_EXACT_PUZZLE.tiles.o3Bottom.path], lbl: LONG_EXACT_PUZZLE.tiles.o3Bottom.lbl },
    ],
    objLbl: { C1: [87, 150], C2: [187, 14], C3: [287, 150] },
    nodes: {
      B1: [90, 28], B2: [170, 28], B3: [250, 28],
      C1: [90, 73], C2: [170, 73], C3: [250, 73],
      D1: [90, 118], D2: [170, 118], D3: [250, 118],
    },
    nodes2: {
      HB1: [56, 35], HC1: [158, 35], HD1: [260, 35],
      HB2: [56, 100], HC2: [158, 100], HD2: [260, 100],
      HB3: [56, 165], HC3: [158, 165], HD3: [260, 165],
    },
    small: ["B1","B2","B3","C1","C2","C3","D1","D2","D3","HB1","HC1","HD1","HB2","HC2","HD2","HB3","HC3","HD3"],
    nodeTxt: {
      B1: "Bⁿ", B2: "Bⁿ⁺¹", B3: "Bⁿ⁺²",
      C1: "Cⁿ", C2: "Cⁿ⁺¹", C3: "Cⁿ⁺²",
      D1: "Dⁿ", D2: "Dⁿ⁺¹", D3: "Dⁿ⁺²",
      HB1: "Hⁿ(B)", HC1: "Hⁿ(C)", HD1: "Hⁿ(D)",
      HB2: "Hⁿ⁺¹(B)", HC2: "Hⁿ⁺¹(C)", HD2: "Hⁿ⁺¹(D)",
      HB3: "Hⁿ⁺²(B)", HC3: "Hⁿ⁺²(C)", HD3: "Hⁿ⁺²(D)",
    },
    nodeR: 14,
    arrows: [
      { id: "dB1", txt: "", from: "B1", to: "B2", trim: 20 },
      { id: "dB2", txt: "", from: "B2", to: "B3", trim: 20 },
      { id: "dC1", txt: "", from: "C1", to: "C2", trim: 20 },
      { id: "dC2", txt: "", from: "C2", to: "C3", trim: 20 },
      { id: "dD1", txt: "", from: "D1", to: "D2", trim: 20 },
      { id: "dD2", txt: "", from: "D2", to: "D3", trim: 20 },
      { id: "iB1", txt: "", from: "B1", to: "C1", trim: 12 },
      { id: "iB2", txt: "", from: "B2", to: "C2", trim: 12 },
      { id: "iB3", txt: "", from: "B3", to: "C3", trim: 12 },
      { id: "pC1", txt: "", from: "C1", to: "D1", trim: 12 },
      { id: "pC2", txt: "", from: "C2", to: "D2", trim: 12 },
      { id: "pC3", txt: "", from: "C3", to: "D3", trim: 12 },
    ],
    arrows2: [
      { id: "l1", txt: "", from: "HB1", to: "HC1", trim: 28 },
      { id: "l2", txt: "", from: "HC1", to: "HD1", trim: 28 },
      { id: "∂1", txt: "∂ⁿ", from: "HD1", to: "HB2",
        curve: "M 284,38 C 318,44 322,58 306,66 C 278,75 110,68 58,68 C 26,68 12,80 15,90 C 17,97 20,100 24,100",
        head: "32,100 23,96 23,104",
        lbl: [326, 52], dash: true },
      { id: "l3", txt: "", from: "HB2", to: "HC2", trim: 28 },
      { id: "l4", txt: "", from: "HC2", to: "HD2", trim: 28 },
      { id: "∂2", txt: "∂ⁿ⁺¹", from: "HD2", to: "HB3",
        curve: "M 284,103 C 318,109 322,123 306,131 C 278,140 110,133 58,133 C 26,133 12,145 15,155 C 17,162 20,165 24,165",
        head: "32,165 23,161 23,169",
        lbl: [322, 117], dash: true },
      { id: "l5", txt: "", from: "HB3", to: "HC3", trim: 28 },
      { id: "l6", txt: "", from: "HC3", to: "HD3", trim: 28 },
    ],
    deco: {
      texts: [
        [90, 10, "0"], [170, 10, "0"], [250, 10, "0"],
        [90, 145, "0"], [170, 145, "0"], [250, 145, "0"],
        [24, 32, "⋯"], [316, 32, "⋯"],
        [24, 77, "⋯"], [316, 77, "⋯"],
        [24, 122, "⋯"], [316, 122, "⋯"],
      ],
      arrows: [
        [90, 13, 90, 17], [170, 13, 170, 17], [250, 13, 250, 17],
        [90, 128, 90, 133], [170, 128, 170, 133], [250, 128, 250, 133],
        [32, 28, 64, 28], [276, 28, 304, 28],
        [32, 73, 64, 73], [276, 73, 304, 73],
        [32, 118, 64, 118], [276, 118, 304, 118],
      ],
    },
    deco2: {
      texts: [[16, 39, "⋯"], [316, 169, "⋯"]],
      arrows: [[22, 35, 30, 35], [288, 165, 306, 165]],
    },
    regionCap: {
      1: ["① im ∂ⁿ⁻¹：上一颗牙送进 Hⁿ(B) 的，来自画外的 Hⁿ⁻¹(D)。",
          "① im ∂ⁿ⁻¹: delivered into Hⁿ(B) by the previous tooth, from the unseen Hⁿ⁻¹(D)."],
      2: ["② coim(Hⁿ(B) → Hⁿ(C)) ≅ im(Hⁿ(B) → Hⁿ(C))：在前一项是商，在后一项是子对象。",
          "② coim(Hⁿ(B) → Hⁿ(C)) ≅ im(Hⁿ(B) → Hⁿ(C)): a quotient of the preceding term and a subobject of the following term."],
      3: ["③ coim(Hⁿ(C) → Hⁿ(D)) ≅ im(Hⁿ(C) → Hⁿ(D))：长列在此落入下排。",
          "③ coim(Hⁿ(C) → Hⁿ(D)) ≅ im(Hⁿ(C) → Hⁿ(D)): the LES drops to the lower row here."],
      4: ["④ coim ∂ⁿ ≅ im ∂ⁿ：作为 Hⁿ(D) 的商与 Hⁿ⁺¹(B) 的子对象出现。重叠表示典范同构，不是集合论交集。",
          "④ coim ∂ⁿ ≅ im ∂ⁿ: a quotient of Hⁿ(D) and a subobject of Hⁿ⁺¹(B). The overlap denotes the canonical isomorphism, not a set-theoretic intersection."],
      5: ["⑤ coim(Hⁿ⁺¹(B) → Hⁿ⁺¹(C)) ≅ im(Hⁿ⁺¹(B) → Hⁿ⁺¹(C))。",
          "⑤ coim(Hⁿ⁺¹(B) → Hⁿ⁺¹(C)) ≅ im(Hⁿ⁺¹(B) → Hⁿ⁺¹(C))."],
      6: ["⑥ coim(Hⁿ⁺¹(C) → Hⁿ⁺¹(D)) ≅ im(Hⁿ⁺¹(C) → Hⁿ⁺¹(D))。",
          "⑥ coim(Hⁿ⁺¹(C) → Hⁿ⁺¹(D)) ≅ im(Hⁿ⁺¹(C) → Hⁿ⁺¹(D))."],
      7: ["⑦ coim ∂ⁿ⁺¹ ≅ im ∂ⁿ⁺¹：作为 Hⁿ⁺¹(D) 的商与 Hⁿ⁺²(B) 的子对象出现。",
          "⑦ coim ∂ⁿ⁺¹ ≅ im ∂ⁿ⁺¹: a quotient of Hⁿ⁺¹(D) and a subobject of Hⁿ⁺²(B)."],
      8: ["⑧ coim(Hⁿ⁺²(B) → Hⁿ⁺²(C)) ≅ im(Hⁿ⁺²(B) → Hⁿ⁺²(C))。",
          "⑧ coim(Hⁿ⁺²(B) → Hⁿ⁺²(C)) ≅ im(Hⁿ⁺²(B) → Hⁿ⁺²(C))."],
      9: ["⑨ coim(Hⁿ⁺²(C) → Hⁿ⁺²(D)) ≅ im(Hⁿ⁺²(C) → Hⁿ⁺²(D))。",
          "⑨ coim(Hⁿ⁺²(C) → Hⁿ⁺²(D)) ≅ im(Hⁿ⁺²(C) → Hⁿ⁺²(D))."],
      10: ["⑩ im ∂ⁿ⁺²：延向画外的下一颗牙。", "⑩ im ∂ⁿ⁺²: the next tooth, trailing off-stage."],
      11: ["⑪ im d_Bⁿ⁻¹：B 链的接缝，不参与上同调。", "⑪ im d_Bⁿ⁻¹: a seam of the B-chain; no part in cohomology."],
      12: ["⑫ im d_Dⁿ⁻¹：D 链的接缝。", "⑫ im d_Dⁿ⁻¹: a seam of the D-chain."],
      13: ["⑬ im d_Bⁿ：im d_Cⁿ 的顶层。", "⑬ im d_Bⁿ: the top layer of im d_Cⁿ."],
      14: ["⑭ im d_Dⁿ：im d_Cⁿ 的底层——中层正是牙 ④。三层 ⑬④⑭ 与蛇引理的 im b 逐层同构。",
           "⑭ im d_Dⁿ: the bottom layer of im d_Cⁿ — the middle layer is the tooth ④. The three layers ⑬④⑭ are layer-for-layer the im b of the snake lemma."],
      15: ["⑮ im d_Bⁿ⁺¹。", "⑮ im d_Bⁿ⁺¹."],
      16: ["⑯ im d_Dⁿ⁺¹。", "⑯ im d_Dⁿ⁺¹."],
      17: ["⑰ im d_Bⁿ⁺²：延向画外。", "⑰ im d_Bⁿ⁺²: trailing off-stage."],
      18: ["⑱ im d_Dⁿ⁺²：延向画外。", "⑱ im d_Dⁿ⁺²: trailing off-stage."],
    },
    nodeCap: {
      B1: ["Bⁿ = ⑪①②⑬：左下的牙 ① 来自画外的 ∂ⁿ⁻¹。", "Bⁿ = ⑪①②⑬: the fang ① at lower left came from the unseen ∂ⁿ⁻¹."],
      B2: ["Bⁿ⁺¹ = ⑬④⑤⑮：牙 ④ 咬进 Dⁿ 的领地——∂ⁿ 的几何本体。", "Bⁿ⁺¹ = ⑬④⑤⑮: the fang ④ bites into Dⁿ's territory — the geometric body of ∂ⁿ."],
      B3: ["Bⁿ⁺² = ⑮⑦⑧⑰：牙 ⑦。", "Bⁿ⁺² = ⑮⑦⑧⑰: fang ⑦."],
      C1: ["0 → Bⁿ → Cⁿ → Dⁿ → 0 给出滤过 0 ⊂ Bⁿ ⊂ Cⁿ，商为 Dⁿ；另一方面，im d_Cⁿ⁻¹ ⊂ ker d_Cⁿ ⊂ Cⁿ 给出逐次商 im d_Cⁿ⁻¹、Hⁿ(C)、coim d_Cⁿ。两种滤过的相对位置产生长正合列；两者都不要求分裂。",
           "The sequence 0 → Bⁿ → Cⁿ → Dⁿ → 0 gives the filtration 0 ⊂ Bⁿ ⊂ Cⁿ with quotient Dⁿ. Independently, im d_Cⁿ⁻¹ ⊂ ker d_Cⁿ ⊂ Cⁿ has successive quotients im d_Cⁿ⁻¹, Hⁿ(C), and coim d_Cⁿ. The relative position of these two filtrations produces the LES; neither is assumed to split."],
      C2: ["Cⁿ⁺¹：下一级阶梯。逐个点亮三个 C，看它们沿对角线像瓦片一样铺开。",
           "Cⁿ⁺¹: the next stair. Light up the three C's in turn and watch them tile along the diagonal."],
      C3: ["Cⁿ⁺²。", "Cⁿ⁺²."],
      D1: ["Dⁿ = ⑫③④⑭：右端两格 ④⑭ 已与下一列共享。", "Dⁿ = ⑫③④⑭: its right cells ④⑭ are already shared with the next column."],
      D2: ["Dⁿ⁺¹ = ⑭⑥⑦⑯。", "Dⁿ⁺¹ = ⑭⑥⑦⑯."],
      D3: ["Dⁿ⁺² = ⑯⑨⑩⑱。", "Dⁿ⁺² = ⑯⑨⑩⑱."],
      HB1: ["Hⁿ(B) = ①②。", "Hⁿ(B) = ①②."],
      HC1: ["Hⁿ(C) = ②③：与两侧邻项各共享一格。", "Hⁿ(C) = ②③: one cell shared with each neighbor."],
      HD1: ["Hⁿ(D) = ③④——④ 已在 Bⁿ⁺¹ 的牙中。", "Hⁿ(D) = ③④ — with ④ already in the bite of Bⁿ⁺¹."],
      HB2: ["Hⁿ⁺¹(B) = ④⑤：④ 从上一列落下。", "Hⁿ⁺¹(B) = ④⑤: ④ has fallen from the previous column."],
      HC2: ["Hⁿ⁺¹(C) = ⑤⑥。", "Hⁿ⁺¹(C) = ⑤⑥."],
      HD2: ["Hⁿ⁺¹(D) = ⑥⑦。", "Hⁿ⁺¹(D) = ⑥⑦."],
      HB3: ["Hⁿ⁺²(B) = ⑦⑧。", "Hⁿ⁺²(B) = ⑦⑧."],
      HC3: ["Hⁿ⁺²(C) = ⑧⑨。", "Hⁿ⁺²(C) = ⑧⑨."],
      HD3: ["Hⁿ⁺²(D) = ⑨⑩。", "Hⁿ⁺²(D) = ⑨⑩."],
    },
    arrowCap: {
      "dB1": ["d_Bⁿ：杀死 ①②⑪、携带 ⑬。", "d_Bⁿ: kills ①②⑪, carries ⑬."],
      "dB2": ["d_Bⁿ⁺¹：杀死 ④⑤⑬、携带 ⑮。注意牙 ④ 在 B 链的下一步死去——∂ 的像恰好到此为止，这就是 LES 在 Hⁿ⁺¹(B) 处正合的种子。",
              "d_Bⁿ⁺¹: kills ④⑤⑬, carries ⑮. The tooth ④ dies at the very next step of the B-chain — the image of ∂ ends exactly here, the seed of exactness at Hⁿ⁺¹(B)."],
      "dC1": ["d_Cⁿ：杀死 ①②③⑪⑫（= ker d_Cⁿ）、携带 ⑬④⑭——im d_Cⁿ 的三层，与蛇引理的 im b 逐层同构。",
              "d_Cⁿ: kills ①②③⑪⑫ (= ker d_Cⁿ), carries ⑬④⑭ — the three layers of im d_Cⁿ, layer-for-layer the im b of the snake."],
      "dC2": ["d_Cⁿ⁺¹：杀死 ④⑤⑥⑬⑭、携带 ⑦⑮⑯。", "d_Cⁿ⁺¹: kills ④⑤⑥⑬⑭, carries ⑦⑮⑯."],
      "dD1": ["d_Dⁿ：杀死 ③④⑫、携带 ⑭。", "d_Dⁿ: kills ③④⑫, carries ⑭."],
      "dD2": ["d_Dⁿ⁺¹：杀死 ⑥⑦⑭、携带 ⑯。", "d_Dⁿ⁺¹: kills ⑥⑦⑭, carries ⑯."],
      "iB1": ["Bⁿ ↪ Cⁿ：单射，原样嵌入。", "Bⁿ ↪ Cⁿ: injective, embedded whole."],
      "iB2": ["Bⁿ⁺¹ ↪ Cⁿ⁺¹。", "Bⁿ⁺¹ ↪ Cⁿ⁺¹."],
      "iB3": ["Bⁿ⁺² ↪ Cⁿ⁺²。", "Bⁿ⁺² ↪ Cⁿ⁺²."],
      "pC1": ["Cⁿ ↠ Dⁿ：恰好杀死 Bⁿ = ①②⑪⑬——竖列的短正合。",
              "Cⁿ ↠ Dⁿ: kills exactly Bⁿ = ①②⑪⑬ — the column's short exactness."],
      "pC2": ["Cⁿ⁺¹ ↠ Dⁿ⁺¹：杀死 Bⁿ⁺¹。", "Cⁿ⁺¹ ↠ Dⁿ⁺¹: kills Bⁿ⁺¹."],
      "pC3": ["Cⁿ⁺² ↠ Dⁿ⁺²：杀死 Bⁿ⁺²。", "Cⁿ⁺² ↠ Dⁿ⁺²: kills Bⁿ⁺²."],
      "l1": ["Hⁿ(B)→Hⁿ(C)：杀死 ① = im ∂ⁿ⁻¹、携带 ②——正合性在 Hⁿ(B)。",
             "Hⁿ(B)→Hⁿ(C): kills ① = im ∂ⁿ⁻¹, carries ② — exactness at Hⁿ(B)."],
      "l2": ["Hⁿ(C)→Hⁿ(D)：杀死 ②、携带 ③。", "Hⁿ(C)→Hⁿ(D): kills ②, carries ③."],
      "∂1": ["∂ⁿ: Hⁿ(D) → Hⁿ⁺¹(B)：ker = ③，coim ≅ im = ④；正合性给出 im ∂ⁿ = ker(Hⁿ⁺¹(B) → Hⁿ⁺¹(C))。",
             "∂ⁿ: Hⁿ(D) → Hⁿ⁺¹(B): ker = ③ and coim ≅ im = ④; exactness gives im ∂ⁿ = ker(Hⁿ⁺¹(B) → Hⁿ⁺¹(C))."],
      "l3": ["Hⁿ⁺¹(B)→Hⁿ⁺¹(C)：杀死 ④ = im ∂ⁿ、携带 ⑤——∂ 的像恰好在下一步死去。",
             "Hⁿ⁺¹(B)→Hⁿ⁺¹(C): kills ④ = im ∂ⁿ, carries ⑤ — the image of ∂ dies at the very next step."],
      "l4": ["Hⁿ⁺¹(C)→Hⁿ⁺¹(D)：杀死 ⑤、携带 ⑥。", "Hⁿ⁺¹(C)→Hⁿ⁺¹(D): kills ⑤, carries ⑥."],
      "∂2": ["∂ⁿ⁺¹: Hⁿ⁺¹(D) → Hⁿ⁺²(B)：ker = ⑥，coim ≅ im = ⑦；它由下一对相邻次数上的蛇引理构造。",
             "∂ⁿ⁺¹: Hⁿ⁺¹(D) → Hⁿ⁺²(B): ker = ⑥ and coim ≅ im = ⑦; it is constructed by the snake lemma in the next pair of adjacent degrees."],
      "l5": ["Hⁿ⁺²(B)→Hⁿ⁺²(C)：杀死 ⑦、携带 ⑧。", "Hⁿ⁺²(B)→Hⁿ⁺²(C): kills ⑦, carries ⑧."],
      "l6": ["Hⁿ⁺²(C)→Hⁿ⁺²(D)：杀死 ⑧、携带 ⑨。", "Hⁿ⁺²(C)→Hⁿ⁺²(D): kills ⑧, carries ⑨."],
    },
    defaultCap: ["在阿贝尔范畴中，设 0 → B• → C• → D• → 0 是逐次短正合的上链复形列。它诱导 ⋯ → Hⁿ(B) → Hⁿ(C) → Hⁿ(D) → Hⁿ⁺¹(B) → ⋯。共享格表示前一映射的 coim 与后一项中的 im 的典范同构；图不假设短正合列分裂，也不记录连接映射的符号约定。",
                 "In an abelian category, let 0 → B• → C• → D• → 0 be a degreewise short exact sequence of cochain complexes. It induces ⋯ → Hⁿ(B) → Hⁿ(C) → Hⁿ(D) → Hⁿ⁺¹(B) → ⋯. A shared cell records the canonical coimage–image identification; the picture assumes no splitting and does not encode the sign convention for the connecting map."],
  },

  fil: {
    title: ["滤过", "Filtration"],
    layout: "col",
    picVB: "0 0 620 220",
    diagVB: "0 0 330 60",
    shapeStrokeOpacity: 0.5,
    objects: ["F4", "F3", "F2", "F1", "F0"],
    objTxt: { F0: "F⁰", F1: "F¹", F2: "F²", F3: "F³", F4: "F⁴" },
    shapes: { F0: "", F1: FIL.F1, F2: FIL.F2, F3: FIL.F3, F4: FIL.F4 },
    picDeco: { ghosts: [], texts: [], seams: [] },
    regions: [
      { id: 1, m: ["F1", "F2", "F3", "F4"], rects: [], paths: [FIL.bands[0]], lbl: [0, 0] },
      { id: 2, m: ["F2", "F3", "F4"], rects: [], paths: [FIL.bands[1]], lbl: [0, 0] },
      { id: 3, m: ["F3", "F4"], rects: [], paths: [FIL.bands[2]], lbl: [0, 0] },
      { id: 4, m: ["F4"], rects: [], paths: [FIL.bands[3]], lbl: [0, 0] },
    ],
    objLbl: {},
    nodes: { F0: [47, 32], F1: [99, 32], F2: [151, 32], F3: [203, 32], F4: [264, 32] },
    small: ["F0", "F1", "F2", "F3", "F4"],
    nodeTxt: { F0: "F⁰", F1: "F¹", F2: "F²", F3: "F³", F4: "F⁴" },
    nodeR: 14,
    arrows: [
      { id: "j0", txt: "", from: "F0", to: "F1", trim: 16 },
      { id: "j1", txt: "", from: "F1", to: "F2", trim: 16 },
      { id: "j2", txt: "", from: "F2", to: "F3", trim: 16 },
      { id: "j3", txt: "", from: "F3", to: "F4", trim: 16 },
    ],
    deco: {
      texts: [[13, 36, "0"], [302, 36, "= C"]],
      arrows: [[20, 32, 29, 32]],
    },
    regionCap: {
      1: ["① gr¹ C = F¹C ∕ F⁰C ≅ F¹C，因为 F⁰C = 0。", "① gr¹ C = F¹C ∕ F⁰C ≅ F¹C because F⁰C = 0."],
      2: ["② gr² C = F²C ∕ F¹C。", "② gr² C = F²C ∕ F¹C."],
      3: ["③ gr³ C = F³C ∕ F²C。", "③ gr³ C = F³C ∕ F²C."],
      4: ["④ gr⁴ C = F⁴C ∕ F³C。", "④ gr⁴ C = F⁴C ∕ F³C."],
    },
    nodeCap: {
      F0: ["F⁰C = 0，所以它对应拼图开始前的空区域。",
           "F⁰C = 0, so it corresponds to the empty region before the jigsaw begins."],
      F1: ["因为 F⁰C = 0，最左边的第一块就是 gr¹ C ≅ F¹C。",
           "Because F⁰C = 0, the leftmost piece is gr¹ C ≅ F¹C."],
      F2: ["F²C 含 F¹C，且 0→F¹C→F²C→gr² C→0。第二块表示这个逐次商。",
           "F²C contains F¹C, with 0→F¹C→F²C→gr² C→0. The second piece represents this successive quotient."],
      F3: ["F³C 含 F²C，且 0→F²C→F³C→gr³ C→0。第三块表示这个逐次商。",
           "F³C contains F²C, with 0→F²C→F³C→gr³ C→0. The third piece represents this successive quotient."],
      F4: ["F⁴C = C，且 0→F³C→C→gr⁴ C→0。第四块表示这个逐次商。",
           "F⁴C = C, with 0→F³C→C→gr⁴ C→0. The fourth piece represents this successive quotient."],
    },
    arrowCap: {
      j0: ["0 = F⁰C ⊂ F¹C。", "0 = F⁰C ⊂ F¹C."],
      j1: ["0→F¹C→F²C→gr² C→0。", "0→F¹C→F²C→gr² C→0."],
      j2: ["0→F²C→F³C→gr³ C→0。", "0→F²C→F³C→gr³ C→0."],
      j3: ["0→F³C→F⁴C→gr⁴ C→0。", "0→F³C→F⁴C→gr⁴ C→0."],
    },
    defaultCap: ["0 = F⁰C ⊂ F¹C ⊂ ··· ⊂ F⁴C=C。第 i 块表示 grⁱ C = FⁱC ∕ Fⁱ⁻¹C；从左到右加入前 i 块表示 FⁱC。",
                 "0 = F⁰C ⊂ F¹C ⊂ ··· ⊂ F⁴C=C. Piece i represents grⁱ C = FⁱC ∕ Fⁱ⁻¹C; the first i pieces together represent FⁱC."],
  },
  spec: {
    title: ["谱序列", "Spectral sequence"],
    layout: "col",
    objects: SPEC_DEGREES.map((degree) => degree.object),
    objTxt: {
      ...Object.fromEntries(SPEC_DEGREES.map((degree) => [degree.object, degree.complex])),
      QL1: "p = 3", QL2: "p = 2", QL3: "p = 1", QL4: "p = 0",
    },
    shapes: {},
    picDeco: { ghosts: [], texts: [] },
    regions: SPEC.regions,
    objLbl: {},
    nodes: {},
    nodeR: 14,
    arrows: [],
    regionCap: SPEC.regionCap,
    nodeCap: {
      ...Object.fromEntries(SPEC_DEGREES.map((degree) => [degree.object, [
        `总次数 ${degree.total} 的四个项。`,
        `The four terms in total degree ${degree.total}.`,
      ]])),
      ...SPEC.lvlCap,
    },
    arrowCap: {},
    defaultCap: SPEC_STAGE_CAPS[0],
  },
};

const MODE_SUMMARY = {
  map: ["φ: X → Y", "φ: X → Y"],
  ses: ["0 → B → A → C → 0，im i = ker π", "0 → B → A → C → 0, im i = ker π"],
  iso3: ["C ⊆ B ⊆ A", "C ⊆ B ⊆ A"],
  two: ["f: A → B，g: A → C", "f: A → B, g: A → C"],
  tri: ["A → B → C，h = g∘f", "A → B → C, h = g∘f"],
  sq: ["h = γα = δβ", "h = γα = δβ"],
  snake: [
    "0 → ker a → ker b → ker c → coker a → coker b → coker c → 0",
    "0 → ker a → ker b → ker c → coker a → coker b → coker c → 0",
  ],
  cx: ["Hⁱ = ker dⁱ ∕ im dⁱ⁻¹", "Hⁱ = ker dⁱ ∕ im dⁱ⁻¹"],
  mapH: ["Hⁿ(f): Hⁿ(C) → Hⁿ(D)", "Hⁿ(f): Hⁿ(C) → Hⁿ(D)"],
  les: [
    "⋯ → Hⁿ(B) → Hⁿ(C) → Hⁿ(D) → Hⁿ⁺¹(B) → ⋯",
    "⋯ → Hⁿ(B) → Hⁿ(C) → Hⁿ(D) → Hⁿ⁺¹(B) → ⋯",
  ],
  fil: ["单块是 grⁱ C；前 i 块合起来是 FⁱC。", "One piece is grⁱ C; the first i pieces together are FⁱC."],
};

const shiftedDegree = (offset) => offset === 0
  ? "n"
  : `n${offset < 0 ? "−" : "+"}${Math.abs(offset)}`;
const shiftedExponent = (offset) => offset === 0
  ? "ⁿ"
  : `ⁿ${offset < 0 ? "⁻" : "⁺"}${SUP[Math.abs(offset)]}`;
const filtrationExponent = (index) => index < 0
  ? `⁻${SUP[Math.abs(index)]}`
  : SUP[index];
const cochainAt = (offset) => `C${shiftedExponent(offset)}`;
const filteredCAt = (filtration, offset) => `F${filtrationExponent(filtration)}C${shiftedExponent(offset)}`;
const cohomologyAt = (offset) => `H${shiftedExponent(offset)}`;

function spectralTermCap(region, page) {
  const p = 4 - region.lv, m = region.total, marker = N[region.id - 1];
  const q = shiftedDegree(region.offset - p);
  const bidegreeZh = `双次数 (p,q) = (${p},${q})`;
  const bidegreeEn = `bidegree (p,q) = (${p},${q})`;
  if (page === 0) return [
    `${marker} ${bidegreeZh}、总次数 ${m}：E₀ = gr${SUP[p]}_F ${cochainAt(region.offset)} = ${filteredCAt(p, region.offset)} ∕ ${filteredCAt(p + 1, region.offset)}。`,
    `${marker} ${bidegreeEn}, total degree ${m}: E₀ = gr${SUP[p]}_F ${cochainAt(region.offset)} = ${filteredCAt(p, region.offset)} ∕ ${filteredCAt(p + 1, region.offset)}.`,
  ];
  if (page === 1) return [
    `${marker} ${bidegreeZh}、总次数 ${m}：E₁ = ${cohomologyAt(region.offset)}(gr${SUP[p]}_F C•)。`,
    `${marker} ${bidegreeEn}, total degree ${m}: E₁ = ${cohomologyAt(region.offset)}(gr${SUP[p]}_F C•).`,
  ];
  if (page < 4) {
    return [
      `${marker} ${bidegreeZh}、总次数 ${m}：E${SUB[page]} = H(E${SUB[page - 1]}, d${SUB[page - 1]}) 在这个位置留下的项。`,
      `${marker} ${bidegreeEn}, total degree ${m}: the term of E${SUB[page]} = H(E${SUB[page - 1]}, d${SUB[page - 1]}) at this position.`,
    ];
  }
  return [
    `${marker} ${bidegreeZh}、总次数 ${m}：E₄ = E∞ ≅ gr${SUP[p]}_F ${cohomologyAt(region.offset)}(C•) = F${SUP[p]}${cohomologyAt(region.offset)}(C•) ∕ F${SUP[p + 1]}${cohomologyAt(region.offset)}(C•)。`,
    `${marker} ${bidegreeEn}, total degree ${m}: E₄ = E∞ ≅ gr${SUP[p]}_F ${cohomologyAt(region.offset)}(C•) = F${SUP[p]}${cohomologyAt(region.offset)}(C•) ∕ F${SUP[p + 1]}${cohomologyAt(region.offset)}(C•).`,
  ];
}

function spectralOverlapCellCap(cell) {
  const i = cell.sourceLevel, j = cell.targetLevel, r = i - j;
  const targetOffset = cell.targetOffset;
  const sourceTotal = shiftedDegree(targetOffset - 1);
  const targetTotal = shiftedDegree(targetOffset);
  const sourceP = 4 - i, targetP = 4 - j;
  const sourceQ = shiftedDegree(targetOffset - 1 - sourceP);
  const targetQ = shiftedDegree(targetOffset - targetP);
  return [
    `所选小正方形表示 im(d${SUB[r]}) ≅ coim(d${SUB[r]})：从 (p,q) = (${sourceP},${sourceQ}) 到 (${targetP},${targetQ})，总次数 ${sourceTotal} → ${targetTotal}。`,
    `The selected square represents im(d${SUB[r]}) ≅ coim(d${SUB[r]}), from (p,q) = (${sourceP},${sourceQ}) to (${targetP},${targetQ}), total degree ${sourceTotal} → ${targetTotal}.`,
  ];
}

function spectralLimitCellCap(cell, page) {
  const p = 4 - cell.level, offset = cell.offset;
  const m = shiftedDegree(offset);
  const q = shiftedDegree(offset - p);
  const limitFormula = `E∞ ≅ gr${SUP[p]}_F ${cohomologyAt(offset)}(C•) = F${SUP[p]}${cohomologyAt(offset)}(C•) ∕ F${SUP[p + 1]}${cohomologyAt(offset)}(C•)`;
  const statusZh = page === 4
    ? "这是所有微分处理完后留下的中心块。"
    : `这是会穿过 E${SUB[page]} 并最终留到 E∞ 的中心块。`;
  const statusEn = page === 4
    ? "This is the central piece left after all differentials have been taken."
    : `This central piece survives E${SUB[page]} and remains to E∞.`;
  return [
    `双次数 (p,q) = (${p},${q})、总次数 ${m}：所选中心长方形表示 ${limitFormula}。${statusZh}`,
    `Bidegree (p,q) = (${p},${q}), total degree ${m}: the selected central rectangle represents ${limitFormula}. ${statusEn}`,
  ];
}

const CIRCLED_PREFIX = new RegExp(`^[${N.join("")}]\\s*`);
function conciseRegionCap(value) {
  const caption = value.replace(CIRCLED_PREFIX, "").trim();
  const separators = ["。", ". ", " —— ", " — ", "：", ": ", "；", "; ", "，", ", "];
  const cut = separators
    .map((separator) => caption.indexOf(separator))
    .filter((index) => index >= 0)
    .reduce((best, index) => Math.min(best, index), caption.length);
  return caption.slice(0, cut).trim();
}

// ———— KaTeX: bundled formula rendering ————
let katexReady = true;
const katexWaiters = [];

const TXSUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "ⁿ": "n", "ⁱ": "i", "ᵐ": "m", "⁺": "+", "⁻": "-" };
const TXSUB = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "ᵢ": "i", "ⱼ": "j" };
const TXTOK = "(?:(?<![A-Za-z])(?:coker|coim|ker|im|gr)(?![A-Za-z])|(?<![A-Za-z])[A-Za-z](?![A-Za-z])|[0-9]+|[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱᵐ⁺⁻₀₁₂₃₄₅ᵢⱼ]|[φπαβγδΣ]|[∕≅⊆⊂⊇∩∪⊔⊕→↪↠⭣∂∘≠≤≥∅∞×−=+/_′()•⋯∣,])";
const TXRUN = new RegExp(TXTOK + "(?: ?" + TXTOK + ")*", "g");
const txIsMath = (run) => {
  if (/[≅⊆⊂⊇∩∪⊔⊕→↪↠⭣∂∘≠≤≥∅∞×⋯∣φπαβγδΣ⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱᵐ₀₁₂₃₄₅ᵢⱼ]/.test(run)) return true;
  if (/[∕=+/_′•−()]/.test(run)) return /[A-Za-z0-9]/.test(run);
  if (/(?<![A-Za-z])(coker|coim|ker|im|gr)(?![A-Za-z])/.test(run)) return true;
  return /^[A-Z]$/.test(run);
};
function texify(t) {
  let out = "";
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (TXSUP[c] !== undefined) {
      let r2 = "";
      while (i < t.length && TXSUP[t[i]] !== undefined) { r2 += TXSUP[t[i]]; i++; }
      i--; out += "^{" + r2 + "}";
    } else if (TXSUB[c] !== undefined) {
      let r2 = "";
      while (i < t.length && TXSUB[t[i]] !== undefined) { r2 += TXSUB[t[i]]; i++; }
      i--; out += "_{" + r2 + "}";
    } else out += c;
  }
  return out
    .replace(/(?<![A-Za-z])coker(?![A-Za-z])/g, "\\operatorname{coker}")
    .replace(/(?<![A-Za-z])coim(?![A-Za-z])/g, "\\operatorname{coim}")
    .replace(/(?<![A-Za-z])ker(?![A-Za-z])/g, "\\ker ")
    .replace(/(?<![A-Za-z])im(?![A-Za-z])/g, "\\operatorname{im}")
    .replace(/(?<![A-Za-z])gr(?![A-Za-z])/g, "\\operatorname{gr}")
    .replace(/(?<![A-Za-z])Tot(?![A-Za-z])/g, "\\operatorname{Tot}")
    .replace(/∕/g, "/").replace(/≅/g, "\\cong ").replace(/⊆/g, "\\subseteq ")
    .replace(/⊂/g, "\\subset ").replace(/⊇/g, "\\supseteq ")
    .replace(/∩/g, "\\cap ").replace(/∪/g, "\\cup ").replace(/⊔/g, "\\sqcup ")
    .replace(/⊕/g, "\\oplus ").replace(/→/g, "\\to ").replace(/↪/g, "\\hookrightarrow ")
    .replace(/↠/g, "\\twoheadrightarrow ").replace(/⭣/g, "\\downarrow ")
    .replace(/∂/g, "\\partial ").replace(/∘/g, "\\circ ").replace(/≠/g, "\\ne ")
    .replace(/≤/g, "\\le ").replace(/≥/g, "\\ge ").replace(/⋯/g, "\\cdots ")
    .replace(/∣/g, "\\mid ")
    .replace(/∅/g, "\\varnothing ").replace(/∞/g, "\\infty ").replace(/×/g, "\\times ")
    .replace(/−/g, "-").replace(/•/g, "^{\\bullet}").replace(/′/g, "'")
    .replace(/φ/g, "\\varphi ").replace(/π/g, "\\pi ").replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ").replace(/γ/g, "\\gamma ").replace(/δ/g, "\\delta ")
    .replace(/Σ/g, "\\Sigma ");
}
const Mx = ({ raw, kx }) => {
  if (kx) {
    let html;
    try {
      html = katex.renderToString(texify(raw), { throwOnError: false });
    } catch { /* fall through */ }
    if (html) {
      return (
        <span
          style={{ fontSize: "0.96em" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
  }
  return <span style={{ fontStyle: "italic" }}>{raw}</span>;
};
const SvgMath = ({
  raw, x, y, width = 100, height = 28, fontSize = 14,
  color = T.ink, anchor = "middle", cursor, onClick, pointerEvents,
}) => {
  const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  return (
    <>
      <foreignObject
        className="vakil-svg-math-html"
        x={x0} y={y - height / 2} width={width} height={height}
        style={{ overflow: "visible", cursor, pointerEvents }} onClick={onClick}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: anchor === "middle" ? "center" : anchor === "end" ? "flex-end" : "flex-start",
            color, fontSize, lineHeight: 1, whiteSpace: "nowrap",
          }}
        >
          <Mx raw={raw} kx />
        </div>
      </foreignObject>
      <text
        className="vakil-svg-math-native"
        x={x}
        y={y}
        fill={color}
        fontFamily={serif}
        fontSize={fontSize}
        fontStyle="italic"
        textAnchor={anchor}
        dominantBaseline="middle"
        style={{ cursor, pointerEvents }}
        onClick={onClick}
      >
        {raw}
      </text>
    </>
  );
};
const MathCap = ({ s, kx }) => {
  const parts = [];
  let last = 0, k2 = 0, m2;
  const txRun = new RegExp(TXRUN.source, TXRUN.flags);
  while ((m2 = txRun.exec(s)) !== null) {
    const matched = m2[0];
    const leading = matched.match(/^[\s,:]+/)?.[0].length || 0;
    const trimmedStart = matched.slice(leading);
    const trailing = trimmedStart.match(/[\s(:,]+$/)?.[0].length || 0;
    const run = trimmedStart.slice(0, trimmedStart.length - trailing);
    const runStart = m2.index + leading;
    if (!run) continue;
    if (!txIsMath(run)) continue;
    const before = s.slice(0, runStart);
    const after = s.slice(runStart + run.length);
    const sentenceInitialArticle = run === "A"
      && /(?:^|[.!?]\s*)$/.test(before)
      && /^\s+[a-z]/.test(after);
    if (sentenceInitialArticle) continue;
    if (runStart > last) parts.push(<span key={"t" + k2}>{s.slice(last, runStart)}</span>);
    parts.push(<Mx key={"m" + k2} raw={run} kx={kx} />);
    last = runStart + run.length;
    k2++;
  }
  parts.push(<span key="tail">{s.slice(last)}</span>);
  return <>{parts}</>;
};

const Icon = ({ k, s = 50 }) => {
  // Scale the spectral-sequence thumbnail from the page geometry as one unit:
  // band delta 126, lane shift 34, strip width 34 / sqrt(2), family step 109.
  const specMiniScale = 12.4 / 126;
  const specMiniBandDelta = 126 * specMiniScale;
  const specMiniLaneShift = 34 * specMiniScale;
  const specMiniStripWidth = (34 / Math.SQRT2) * specMiniScale;
  const specMiniFamilyStep = 109 * specMiniScale;
  const specMiniFamilies = [T.B, T.ink, T.C].map((color, familyIndex) => {
    const rising = familyIndex % 2 === 0;
    return {
      color,
      x1: 2 + familyIndex * specMiniFamilyStep,
      y1: rising ? 30.2 : 17.8,
      y2: rising ? 17.8 : 30.2,
    };
  });
  const miniComplexRadius = 5.5;
  const miniComplexCells = [
    [6.5, 35], [12, 29.5], [17.5, 24], [23, 29.5],
    [28.5, 35], [34, 29.5], [39.5, 24],
  ].map(([cx, cy]) =>
    `M ${cx - miniComplexRadius} ${cy} L ${cx} ${cy - miniComplexRadius} L ${cx + miniComplexRadius} ${cy} L ${cx} ${cy + miniComplexRadius} Z`);
  const miniComplexMemberships = [
    [T.A], [T.A], [T.A, T.B], [T.B], [T.B, T.C], [T.C], [T.C],
  ];
  const miniV = (x, y0, y1) => {
    return `M ${x} ${y0} V ${y1}`;
  };
  const miniSeams = (key, children) => (
    <g key={key} fill="none" stroke={T.ink} strokeWidth={1.1} strokeOpacity={0.58}
      strokeLinejoin="round" strokeLinecap="round">{children}</g>
  );
  const G = {
    map: [
      <g key="map-fill">
        <rect x={5} y={14} width={26} height={20} fill={T.A} fillOpacity={0.42} />
        <rect x={17} y={14} width={26} height={20} fill={T.B} fillOpacity={0.42} />
      </g>,
      miniSeams("map-seams", <><path d="M 5 14 H 43 V 34 H 5 Z" />
        <path d={miniV(17, 14, 34)} /><path d={miniV(31, 14, 34)} /></>),
    ],
    ses: [
      <g key="ses-fill"><rect x={5} y={13} width={38} height={22} fill={T.A} fillOpacity={0.18} />
        <rect x={5} y={13} width={19} height={22} fill={T.B} fillOpacity={0.46} />
        <rect x={24} y={13} width={19} height={22} fill={T.C} fillOpacity={0.46} /></g>,
      miniSeams("ses-seams", <><path d="M 5 13 H 43 V 35 H 5 Z" />
        <path d={miniV(24, 13, 35)} /></>),
    ],
    iso3: [
      <g key="iso3-fill"><rect x={5} y={13} width={38} height={22} fill={T.A} fillOpacity={0.34} />
        <rect x={5} y={13} width={25.5} height={22} fill={T.B} fillOpacity={0.34} />
        <rect x={5} y={13} width={12.5} height={22} fill={T.C} fillOpacity={0.44} /></g>,
      miniSeams("iso3-seams", <><path d="M 5 13 H 43 V 35 H 5 Z" />
        <path d={miniV(17.5, 13, 35)} /><path d={miniV(30.5, 13, 35)} /></>),
    ],
    two: [
      <g key="two-fill"><path d="M 5 5 H 29 V 29 H 5 Z" fill={T.A} fillOpacity={0.38} />
        <path d="M 17 5 H 41 V 29 H 17 Z" fill={T.B} fillOpacity={0.38} />
        <path d="M 5 17 H 29 V 41 H 5 Z" fill={T.C} fillOpacity={0.38} /></g>,
      miniSeams("two-seams", <><path d="M 5 5 H 41 V 29 H 29 V 41 H 5 Z" />
        <path d="M 17 5 V 29" /><path d="M 29 5 V 29" />
        <path d="M 5 17 H 29" /><path d="M 5 29 H 29" /></>),
    ],
    tri: [
      <g key="tri-fill"><path d="M 5 5 H 29 V 29 H 5 Z" fill={T.A} fillOpacity={0.38} />
        <path d="M 17 5 H 41 V 29 H 17 Z" fill={T.B} fillOpacity={0.38} />
        <path d="M 17 17 H 41 V 41 H 17 Z" fill={T.C} fillOpacity={0.38} /></g>,
      miniSeams("tri-seams", <><path d="M 5 5 H 41 V 41 H 17 V 29 H 5 Z" />
        <path d="M 17 5 V 29" /><path d="M 29 5 V 29" />
        <path d="M 17 17 H 41" /><path d="M 17 29 H 41" /></>),
    ],
    sq: [
      <g key="sq-fill"><path d="M 5 5 H 29 V 29 H 5 Z" fill={T.A} fillOpacity={0.28} />
        <path d="M 17 5 H 43 V 29 H 17 Z" fill={T.B} fillOpacity={0.28} />
        <path d="M 5 17 H 29 V 43 H 5 Z" fill={T.D} fillOpacity={0.28} />
        <path d="M 17 17 H 43 V 43 H 17 Z" fill={T.C} fillOpacity={0.28} /></g>,
      miniSeams("sq-seams", <><path d="M 5 5 H 43 V 43 H 5 Z" />
        <path d="M 17 5 V 43" /><path d="M 30 5 V 43" />
        <path d="M 5 17 H 43" /><path d="M 5 30 H 43" /></>),
      <path key="sq-a" d="M 17 30 C 25 29 29 25 30 17" fill="none"
        stroke={T.A} strokeWidth={1.8} strokeLinecap="round" />,
      <path key="sq-c" d="M 17 30 C 18 22 22 18 30 17" fill="none"
        stroke={T.C} strokeWidth={1.8} strokeLinecap="round" />,
    ],
    snake: [
      <g key="fill" opacity={0.34}>
        <path d="M 5 5 H 18 V 18 H 5 Z" fill={T.A} />
        <path d="M 18 5 H 43 V 18 H 18 Z" fill={T.B} />
        <path d="M 5 18 H 18 V 30 H 5 Z" fill={T.D} />
        <path d="M 18 18 H 31 V 30 H 18 Z" fill={T.E} />
        <path d="M 31 18 H 43 V 30 H 31 Z" fill={T.C} />
        <path d="M 5 30 H 31 V 43 H 5 Z" fill={T.D} />
        <path d="M 31 30 H 43 V 43 H 31 Z" fill={T.F} />
      </g>,
      <g key="seams" fill="none" stroke={T.ink} strokeWidth={1.15}
        strokeOpacity={0.62} strokeLinejoin="round">
        <path d="M 5 5 H 43 V 43 H 5 Z" />
        <path d="M 18 5 V 30" /><path d="M 31 18 V 43" />
        <path d="M 5 18 H 43" /><path d="M 5 30 H 43" />
      </g>],
    cx: [
      <g key="cx-fill">
        {miniComplexCells.flatMap((path, index) =>
          miniComplexMemberships[index].map((color, layer) => (
            <path key={`${index}-${layer}`} d={path} fill={color} fillOpacity={0.24} />
          )))}
      </g>,
      <g key="cx-seams" fill="none" stroke={T.ink} strokeWidth={1.1}
        strokeOpacity={0.58} strokeLinejoin="round" strokeLinecap="round">
        {miniComplexCells.map((path, index) => <path key={index} d={path} />)}
      </g>,
    ],
    mapH: [
      <g key="mapH-fill">
        <path d="M 2 10.7 H 27.65 V 37.3 H 2 Z" fill={T.B} fillOpacity={0.18} />
        <path d="M 20.35 10.7 H 46 V 37.3 H 20.35 Z" fill={T.D} fillOpacity={0.18} />
      </g>,
      <g key="mapH-seams" fill="none" stroke={T.ink} strokeWidth={1.05}
        strokeOpacity={0.6} strokeLinejoin="round" strokeLinecap="round">
        <path d="M 2 10.7 H 27.65 V 37.3 H 2 Z" />
        <path d="M 20.35 10.7 H 46 V 37.3 H 20.35 Z" />
        {[9.28, 20.35, 27.65, 38.72].map((x) =>
          <path key={x} d={`M ${x} 10.7 V 37.3`} />)}
        <path d="M 9.28 30.32 C 10.39 23.2 14.35 18.45 20.35 17.35" />
        <path d="M 20.35 17.35 C 19.25 24.47 15.3 29.21 9.28 30.32" />
        <path d="M 27.65 30.32 C 28.76 23.2 32.72 18.45 38.72 17.35" />
        <path d="M 38.72 17.35 C 37.61 24.47 33.67 29.21 27.65 30.32" />
        <path d="M 2 17.35 H 46 M 2 30.32 H 46" />
      </g>,
    ],
    les: [
      <g key="les-fill" opacity={0.3}>
        {[2, 15, 28].map((x) => (
          <g key={x}>
            <path d={`M ${x} 11 H ${x + 18} V 20 L ${x} 29 Z`} fill={T.B} />
            <path d={`M ${x} 29 L ${x + 18} 20 V 37 H ${x} Z`} fill={T.C} />
          </g>
        ))}
      </g>,
      <g key="les-lines" fill="none" stroke={T.ink} strokeWidth={1.1}
        strokeOpacity={0.62} strokeLinejoin="round">
        <path d="M 2 11 H 46 V 37 H 2 Z" />
        {[8, 15, 21, 28, 34, 41].map((x) => <path key={x} d={`M ${x} 11 V 37`} />)}
        <path d="M 2 29 L 20 20" /><path d="M 15 29 L 33 20" />
        <path d="M 28 29 L 46 20" />
      </g>,
    ],
    fil: [
      <g key="fil-bands">
        {[HUE.F1, HUE.F2, HUE.F3, HUE.F4].map((color, i) => (
          <path key={color} d={bandPath(3.5 + i * 7, 11, 23.5 + i * 7, 37, 5.5)}
            fill={color} fillOpacity={0.18} stroke={T.ink} strokeWidth={0.9}
            strokeOpacity={0.58} />
        ))}
      </g>,
    ],
    spec: [
      <g key="spec-filtered-complex" strokeWidth={0.82}
        strokeOpacity={0.82} strokeLinejoin="miter">
        {specMiniFamilies.flatMap((family, familyIndex) => [0, 1, 2, 3].map((level) => {
          const shift = level * specMiniLaneShift;
          return (
            <path key={`${familyIndex}-${level}`}
              d={bandPath(
                family.x1 + shift, family.y1,
                family.x1 + specMiniBandDelta + shift, family.y2,
                specMiniStripWidth,
              )}
              fill={family.color} fillOpacity={0.08} stroke={family.color} />
          );
        }))}
      </g>,
    ],
  };
  return <svg viewBox="0 0 48 48" width={s} height={s}>{G[k]}</svg>;
};

// The gallery is a dependency graph, rather than a chapter list. Edges record
// only immediate prerequisites: the more advanced pictures are built by
// combining the visual languages of their incoming nodes.
const GALLERY_DAG_EDGES = [
  ["map", "ses"], ["map", "two"],
  ["ses", "iso3"], ["two", "tri"],
  ["iso3", "fil"],
  ["iso3", "cx"], ["tri", "cx"],
  ["tri", "sq"], ["sq", "snake"],
  ["sq", "mapH"], ["cx", "mapH"],
  ["snake", "les"], ["mapH", "les"],
  ["cx", "spec"], ["fil", "spec"],
];

const GALLERY_DAG_LAYOUTS = {
  desktop: {
    width: 1080, height: 500, half: 50, direction: "horizontal",
    nodes: {
      map: [60, 250],
      ses: [250, 120], two: [250, 385],
      iso3: [440, 90], tri: [440, 325],
      fil: [630, 70], cx: [630, 235], sq: [630, 410],
      spec: [820, 100], mapH: [820, 260], snake: [820, 420],
      les: [1020, 350],
    },
  },
  mobile: {
    width: 340, height: 700, half: 38, direction: "vertical",
    nodes: {
      map: [170, 55],
      ses: [100, 150], two: [240, 150],
      iso3: [100, 260], tri: [240, 260],
      fil: [45, 390], cx: [170, 390], sq: [295, 390],
      spec: [45, 515], mapH: [170, 515], snake: [295, 515],
      les: [232, 645],
    },
  },
};

function galleryDagPath(layout, from, to) {
  const [sx, sy] = layout.nodes[from];
  const [tx, ty] = layout.nodes[to];
  const h = layout.half;
  if (layout.direction === "horizontal") {
    const span = Math.max(34, (tx - sx - h * 2) * 0.42);
    return `M ${sx + h} ${sy} C ${sx + h + span} ${sy}, ${tx - h - span} ${ty}, ${tx - h} ${ty}`;
  }
  const span = Math.max(24, (ty - sy - h * 2) * 0.42);
  return `M ${sx} ${sy + h} C ${sx} ${sy + h + span}, ${tx} ${ty - h - span}, ${tx} ${ty - h}`;
}

function GalleryDagEdges({ variant }) {
  const layout = GALLERY_DAG_LAYOUTS[variant];
  const markerId = `gallery-dag-arrow-${variant}`;
  return (
    <svg className={`vakil-dag-edges vakil-dag-edges-${variant}`}
      viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="5.8" refY="3.5"
          orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 7 3.5 L 0 7 Z" fill={T.faint} fillOpacity={0.72} />
        </marker>
      </defs>
      {GALLERY_DAG_EDGES.map(([from, to]) => (
        <path key={`${from}-${to}`} d={galleryDagPath(layout, from, to)}
          fill="none" stroke={T.faint} strokeWidth={1.25} strokeOpacity={0.42}
          strokeLinecap="round" markerEnd={`url(#${markerId})`} />
      ))}
    </svg>
  );
}

export default function App() {
  const requestedGalleryMode = typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("gallery");
  const galleryMode = requestedGalleryMode && MODES[requestedGalleryMode]
    ? requestedGalleryMode
    : null;
  const [mode, setMode] = useState(galleryMode);
  const [sel, setSel] = useState(null);
  const [li, setLi] = useState(1);
  const [page, setPage] = useState(0);
  const [kx, setKx] = useState(katexReady);
  useEffect(() => {
    if (!katexReady) katexWaiters.push(() => setKx(true));
  }, []);
  const KEYS = Object.keys(MODES);
  const hue = (o) => HUE[o] || T.ink;
  const t = (pair) => pair[li];
  const go = (m2) => { setMode(m2); setSel(null); setPage(0); };
  const container = {
    minHeight: "100vh", background: T.paper, color: T.ink,
    padding: "22px 10px 36px", boxSizing: "border-box", position: "relative",
    display: "flex", flexDirection: "column", alignItems: "center",
  };
  const css = (
    <style>{`
      .shape { transition: fill-opacity .25s, stroke-width .2s, opacity .25s; }
      .hl { transition: opacity .25s; pointer-events: none; }
      .spec-cell-target { transition: fill-opacity .16s, stroke .16s, stroke-width .16s; }
      .spec-cell:hover .spec-cell-target,
      .spec-cell:focus-visible .spec-cell-target {
        fill: ${"#C64AA8"}; fill-opacity: .12; stroke: ${"#C64AA8"}; stroke-width: 2.8;
      }
      .tile { transition: transform .18s cubic-bezier(.2,.7,.3,1), background-color .18s, box-shadow .18s; }
      .tile:hover { transform: translateY(-2px) scale(1.035); background-color: #F6F2E7 !important;
        box-shadow: 0 4px 14px rgba(42,38,32,.10); }
      .tile:active { transform: scale(.96); transition-duration: .08s; }
      .lang { background:none; border:none; padding:2px 4px; font-family:${mono};
        font-size:11px; color:${T.faint}; cursor:pointer; }
      .lang.on { color:${T.ink}; font-weight:700; }
      .vakil-svg-math-native { display:none; }
      .vakil-caption { box-sizing:border-box; }
      .vakil-mode-dag {
        position:relative; width:min(340px, calc(100vw - 20px)); height:700px;
        flex:0 0 auto; margin:0 0 8px;
      }
      .vakil-mode-button {
        position:absolute; left:var(--mobile-x); top:var(--mobile-y);
        transform:translate(-50%, -50%); z-index:2;
        padding:0; border:0; background:none; cursor:pointer;
      }
      .vakil-mode-button:hover,
      .vakil-mode-button:focus-visible { z-index:4; }
      .vakil-mode-tile {
        position:relative; display:grid; width:76px; height:76px;
        place-items:center; border-radius:18px; background:#F0EBDE;
      }
      .vakil-mode-tile svg { width:44px; height:44px; }
      .vakil-mode-number {
        position:absolute; top:7px; left:9px; color:${T.faint};
        font-family:${mono}; font-size:8px; letter-spacing:.08em;
      }
      .vakil-mode-tooltip {
        position:absolute; left:50%; top:calc(100% + 7px);
        transform:translate(-50%, -3px); opacity:0;
        padding:4px 8px 5px; border:1px solid ${T.line}; border-radius:7px;
        background:rgba(247,243,234,.97); box-shadow:0 3px 10px rgba(42,38,32,.10);
        color:${T.ink}; font-family:${serif}; font-size:11px; line-height:1.15;
        white-space:nowrap; pointer-events:none;
        transition:opacity .14s ease, transform .14s ease;
      }
      .vakil-mode-button:hover .vakil-mode-tooltip,
      .vakil-mode-button:focus-visible .vakil-mode-tooltip {
        opacity:1; transform:translate(-50%, 0);
      }
      .vakil-dag-edges {
        position:absolute; inset:0; width:100%; height:100%; overflow:visible;
        pointer-events:none; z-index:1;
      }
      .vakil-dag-edges-desktop { display:none; }
      @media (max-width: 600px) {
        .vakil-mode-column .vakil-svg-math-html { display:none; }
        .vakil-mode-column .vakil-svg-math-native { display:inline; }
        .vakil-caption {
          width:calc(100% - 16px) !important;
          padding-right:12px;
          padding-left:12px;
        }
      }
      @media (min-width: 1040px) {
        .vakil-gallery-home { justify-content:flex-start; }
        .vakil-mode-dag {
          width:min(1080px, calc(100vw - 24px)); height:500px; margin:0 0 8px;
        }
        .vakil-mode-button { left:var(--desktop-x); top:var(--desktop-y); }
        .vakil-mode-tile { width:100px; height:100px; border-radius:23px; }
        .vakil-mode-tile svg { width:58px; height:58px; }
        .vakil-mode-number { top:10px; left:13px; font-size:9px; }
        .vakil-dag-edges-mobile { display:none; }
        .vakil-dag-edges-desktop { display:block; }
      }
    `}</style>
  );
  const langBtns = (
    <div style={{ position: "absolute", top: 16, right: 14 }}>
      <button className={"lang" + (li === 0 ? " on" : "")} onClick={() => setLi(0)}>中</button>
      <button className={"lang" + (li === 1 ? " on" : "")} onClick={() => setLi(1)}>EN</button>
    </div>
  );
  const navBtn = {
    background: "#F0EBDE", border: "none", borderRadius: 10,
    minWidth: 34, height: 30, fontFamily: serif, fontSize: 16, color: T.ink,
    cursor: "pointer", marginLeft: 6, padding: "0 6px",
    display: "grid", placeItems: "center",
  };
  if (!mode) {
    return (
      <div className="vakil-gallery-home" style={{ ...container, padding: "48px 10px 46px" }}>
        {css}
        {langBtns}
        <div className="vakil-mode-dag">
          <GalleryDagEdges variant="mobile" />
          <GalleryDagEdges variant="desktop" />
          {KEYS.map((k, idx) => (
            <button
              className="vakil-mode-button"
              type="button"
              aria-label={t(MODES[k].title)}
              key={k}
              onClick={() => go(k)}
              style={{
                "--mobile-x": `${GALLERY_DAG_LAYOUTS.mobile.nodes[k][0] / GALLERY_DAG_LAYOUTS.mobile.width * 100}%`,
                "--mobile-y": `${GALLERY_DAG_LAYOUTS.mobile.nodes[k][1] / GALLERY_DAG_LAYOUTS.mobile.height * 100}%`,
                "--desktop-x": `${GALLERY_DAG_LAYOUTS.desktop.nodes[k][0] / GALLERY_DAG_LAYOUTS.desktop.width * 100}%`,
                "--desktop-y": `${GALLERY_DAG_LAYOUTS.desktop.nodes[k][1] / GALLERY_DAG_LAYOUTS.desktop.height * 100}%`,
              }}
            >
              <div className="tile vakil-mode-tile">
                <span className="vakil-mode-number">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <Icon k={k} />
              </div>
              <span className="vakil-mode-tooltip" aria-hidden="true">
                {t(MODES[k].title)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  const M = MODES[mode];
  const isCol = M.layout === "col";
  const isSpec = mode === "spec";
  const isFil = mode === "fil";
  const spectralStageName = page === 4 ? "E4 = E∞" : `E${page}`;
  const contentMaxWidth = isSpec ? 720 : isFil ? 620 : 520;
  const captionMaxWidth = isSpec ? 660 : isFil ? 560 : 480;
  const ki = KEYS.indexOf(mode);
  const prevK = ki > 0 ? KEYS[ki - 1] : null;
  const nextK = ki < KEYS.length - 1 ? KEYS[ki + 1] : null;
  const keyBtn = {
    width: 58, height: 58, background: "#F0EBDE", border: "none",
    borderRadius: 17, display: "grid", placeItems: "center",
    cursor: "pointer", padding: 0,
  };

  const allArrows = [...M.arrows, ...(M.arrows2 || [])];
  const arrow = sel?.t === "a" ? allArrows.find((a) => a.id === sel.id) : null;
  const carries = arrow
    ? M.regions.filter((r) => r.m.includes(arrow.from) && r.m.includes(arrow.to)).map((r) => r.id) : [];
  const kills = arrow
    ? M.regions.filter((r) => r.m.includes(arrow.from) && !r.m.includes(arrow.to)).map((r) => r.id) : [];
  const selRegion = sel?.t === "r" ? M.regions.find((r) => r.id === sel.id) : null;
  const filtrationMatch = isSpec && sel?.t === "n" ? sel.id.match(/^(?:E|QL)([1-4])$/) : null;
  const isFiltrationNode = !!filtrationMatch;
  const litRegions = sel?.t === "r" ? [sel.id]
    : sel?.t === "n"
      ? (isFiltrationNode
          ? M.regions.filter((r) => r.lv === +filtrationMatch[1] && (r.dr === undefined || r.dr >= page)).map((r) => r.id)
          : M.regions.filter((r) => r.m.includes(sel.id)).map((r) => r.id))
      : carries;
  const litNodes = sel?.t === "n" ? [sel.id] : sel?.t === "r" ? selRegion.m
    : arrow ? [arrow.from, arrow.to] : [];
  const litArrows = sel?.t === "a" ? [sel.id]
    : sel?.t === "r"
      ? allArrows.filter((a) => selRegion.m.includes(a.from) && selRegion.m.includes(a.to)).map((a) => a.id)
      : [];
  const labelFor = (id) => M.nodeTxt?.[id] || M.objTxt?.[id] || id;

  let cap = isSpec ? t(SPEC_STAGE_CAPS[page]) : t(MODE_SUMMARY[mode]);
  if (sel?.t === "r") {
    const regionCaption = isSpec
      ? t(spectralTermCap(selRegion, page))
      : t(M.regionCap[sel.id]);
    cap = isSpec ? regionCaption : conciseRegionCap(regionCaption);
    if (mode === "iso3" && sel.id === 3) cap = t(M.theoremCap);
  }
  if (sel?.t === "n") {
    if (isFiltrationNode) {
      const lvl = +filtrationMatch[1];
      cap = isSpec ? t(M.nodeCap["QL" + lvl]) : `F${SUP[lvl]}`;
    } else if (isFil) {
      cap = sel.id === "F0" ? "F⁰C = 0" : `${labelFor(sel.id)}C`;
    } else if (mode === "iso3" && ["QAB", "QAC"].includes(sel.id)) {
      cap = t(M.theoremCap);
    } else cap = isSpec && M.nodeCap?.[sel.id] ? t(M.nodeCap[sel.id]) : labelFor(sel.id);
  }
  if (sel?.t === "a") {
    const arrowName = arrow.txt === "" ? "" : (arrow.txt ?? arrow.id);
    cap = `${arrowName ? `${arrowName}: ` : ""}${labelFor(arrow.from)} → ${labelFor(arrow.to)}`;
  }
  if (sel?.t === "sc") cap = t(sel.kind === "limit"
    ? spectralLimitCellCap(sel, page)
    : spectralOverlapCellCap(sel));

  const tintOf = () =>
    sel?.t === "n" ? hue(sel.id) : sel?.t === "a" ? hue(arrow.to) : T.ink;

  const showSnake = mode === "snake" &&
    ((sel?.t === "a" && sel.id === "∂") || (sel?.t === "r" && sel.id === 3));

  const filtrationPicture = isFil && (() => {
    return (
      <svg viewBox="0 0 620 220" style={{ width: "100%" }}
        role="img" aria-label={li === 0 ? "四步滤过的拼图表示" : "A jigsaw representation of a four-step filtration"}
        onClick={() => setSel(null)}>
        <title>{li === 0 ? "四步滤过" : "A four-step filtration"}</title>
        <desc>{li === 0
          ? "四条斜带紧密拼合成一个整体；第 i 块是 grⁱ C，前 i 块合起来表示 FⁱC。"
          : "Four sloping strips fit tightly into one form; piece i is grⁱ C, while the first i pieces together represent FⁱC."}</desc>

        {FIL.bands.map((path, index) => {
          const region = M.regions[index];
          const lit = litRegions.includes(region.id);
          const color = hue(`F${index + 1}`);
          return (
            <g key={index} data-filtration-band={index + 1}
              style={{ cursor: "pointer" }}
              onClick={(event) => { event.stopPropagation(); setSel({ t: "r", id: region.id }); }}>
              <path d={path} fill={color} fillOpacity={lit ? 0.22 : 0.045}
                stroke={lit ? color : T.ink} strokeWidth={lit ? 2.2 : 1.45}
                strokeOpacity={lit ? 1 : 0.72} strokeLinejoin="round" />
              <path d={path} fill="transparent" stroke="transparent" strokeWidth={12} />
            </g>
          );
        })}

        {[1, 2, 3, 4].map((level) => {
          const selected = sel?.t === "r" && sel.id === level;
          return (
            <g key={`filtration-label-${level}`} data-filtration-label={level}
              style={{ cursor: "pointer" }}
              onClick={(event) => { event.stopPropagation(); setSel({ t: "r", id: level }); }}>
              <SvgMath raw={`gr${SUP[level]} C`}
                x={FIL.labels[level - 1][0]} y={FIL.labels[level - 1][1]}
                width={60}
                height={20} fontSize={10.5}
                color={selected ? hue(`F${level}`) : T.faint} anchor="start" />
            </g>
          );
        })}
      </svg>
    );
  })();

  const spectralPicture = isSpec && (() => {
    // One filtered complex runs across five neighboring degrees. Each degree
    // is a family of four parallel strips; neighboring families alternate slope.
    const topY = 41, bottomY = 167, laneShift = 34;
    // Equal horizontal and vertical components make the two alternating
    // filtration directions exactly perpendicular (vectors (126, ±126)).
    const bandLength = Math.abs(bottomY - topY);
    const familyStep = bandLength - laneShift / 2;
    // The perpendicular part of one horizontal lane shift is exactly the
    // strip width. Consecutive strips therefore share one boundary; that
    // boundary receives a matching SVG jigsaw tab on both neighboring pieces.
    const stripWidth = laneShift * Math.abs(bottomY - topY)
      / Math.hypot(bandLength, bottomY - topY);
    const familyX = (index) => 10 + index * familyStep;
    const highlight = "#C64AA8";
    const families = [
      { raw: "Cⁿ⁻²", diff: "dⁿ⁻²", color: T.A, object: "SN2", x1: familyX(0), y1: bottomY, x2: familyX(0) + bandLength, y2: topY },
      { raw: "Cⁿ⁻¹", diff: "dⁿ⁻¹", color: T.B, object: "SN1", x1: familyX(1), y1: topY, x2: familyX(1) + bandLength, y2: bottomY },
      { raw: "Cⁿ",   diff: "dⁿ",   color: T.ink, object: "SN0", x1: familyX(2), y1: bottomY, x2: familyX(2) + bandLength, y2: topY },
      { raw: "Cⁿ⁺¹", diff: "dⁿ⁺¹", color: T.C, object: "SP1", x1: familyX(3), y1: topY, x2: familyX(3) + bandLength, y2: bottomY },
      { raw: "Cⁿ⁺²", diff: null,    color: T.D, object: "SP2", x1: familyX(4), y1: bottomY, x2: familyX(4) + bandLength, y2: topY },
    ];
    const lineFor = (familyIndex, level) => {
      const family = families[familyIndex], shift = (level - 1) * laneShift;
      return [[family.x1 + shift, family.y1], [family.x2 + shift, family.y2]];
    };
    const pointAlong = (a, b, t2) => [
      a[0] + (b[0] - a[0]) * t2,
      a[1] + (b[1] - a[1]) * t2,
    ];
    const fullBandPath = (familyIndex, level) => {
      const [a, b] = lineFor(familyIndex, level);
      return bandPath(...a, ...b, stripWidth);
    };
    const fullBandPolygon = (familyIndex, level) => {
      const [a, b] = lineFor(familyIndex, level);
      return bandPolygon(...a, ...b, stripWidth);
    };
    const edgeWithTab = (start, end, tab) => {
      if (!tab) return `L ${end[0]} ${end[1]}`;
      return puzzleEdgeWithTab(
        start[0], start[1], end[0], end[1],
        tab.center[0], tab.center[1], tab.normal[0], tab.normal[1],
      ).f;
    };
    const puzzleBandPath = (familyIndex, level, points, tabs) => {
      const rises = families[familyIndex].y2 < families[familyIndex].y1;
      const previousTab = level > 1 ? tabs[familyIndex][level - 2] : null;
      const nextTab = level < 4 ? tabs[familyIndex][level - 1] : null;
      const plusTab = rises ? nextTab : previousTab;
      const minusTab = rises ? previousTab : nextTab;
      return `M ${points[0][0]} ${points[0][1]} ${edgeWithTab(points[0], points[1], plusTab)} L ${points[2][0]} ${points[2][1]} ${edgeWithTab(points[2], points[3], minusTab)} L ${points[0][0]} ${points[0][1]} Z`;
    };
    const bandCenter = (familyIndex, level) => {
      const [a, b] = lineFor(familyIndex, level);
      return pointAlong(a, b, 0.5);
    };
    const markerPoint = (familyIndex, level) => {
      const [a] = lineFor(familyIndex, level);
      const direction = a[1] === topY ? -1 : 1;
      return [a[0], a[1] + direction * 19];
    };
    const termEntries = families.flatMap((family, familyIndex) =>
      [1, 2, 3, 4].map((level) => {
        const region = M.regions.find((candidate) =>
          candidate.degreeIndex === familyIndex && candidate.lv === level);
        return {
          family, familyIndex, level, region,
          path: fullBandPath(familyIndex, level),
          center: bandCenter(familyIndex, level),
          marker: markerPoint(familyIndex, level),
          markerAnchor: lineFor(familyIndex, level)[0],
        };
      }));
    const overlapCells = [];
    for (let boundary = 0; boundary < families.length - 1; boundary++) {
      for (let sourceLevel = 1; sourceLevel <= 4; sourceLevel++) {
        for (let targetLevel = 1; targetLevel <= sourceLevel; targetLevel++) {
          const points = intersectConvexPolygons(
            fullBandPolygon(boundary, sourceLevel),
            fullBandPolygon(boundary + 1, targetLevel),
          );
          if (points.length < 3 || Math.abs(polygonArea(points)) < 1) continue;
          const targetOffset = SPEC_DEGREES[boundary + 1].offset;
          overlapCells.push({
            id: `G-${boundary}-${sourceLevel}-${targetLevel}`,
            boundary, sourceLevel, targetLevel, targetOffset,
            r: sourceLevel - targetLevel,
            points, path: polygonPath(points), center: polygonCenter(points),
            sourceColor: families[boundary].color,
            targetColor: families[boundary + 1].color,
          });
        }
      }
    }
    const projectOnBand = (familyIndex, level, point) => {
      const [a, b] = lineFor(familyIndex, level);
      const dx = b[0] - a[0], dy = b[1] - a[1];
      return ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy)
        / (dx * dx + dy * dy);
    };
    const connectorEdges = (cell) => {
      const edges = cell.points.map((start, index) => {
        const end = cell.points[(index + 1) % cell.points.length];
        const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
        return {
          index,
          sourceT: projectOnBand(cell.boundary, cell.sourceLevel, midpoint),
          targetT: projectOnBand(cell.boundary + 1, cell.targetLevel, midpoint),
        };
      });
      const sourceEdge = edges.reduce((best, edge) =>
        edge.sourceT < best.sourceT ? edge : best);
      const targetEdge = edges.reduce((best, edge) =>
        edge.targetT > best.targetT ? edge : best);
      return new Set([sourceEdge.index, targetEdge.index]);
    };
    const pageOverlapCells = overlapCells.filter((cell) => cell.r >= page);
    const clickableOverlapCells = page < 4
      ? pageOverlapCells.filter((cell) => cell.r === page)
      : [];
    const clickableConnectorEdges = new Map(clickableOverlapCells.map((cell) => [
      cell.id, connectorEdges(cell),
    ]));
    const clickableOverlapPaths = new Map(clickableOverlapCells.map((cell) => [
      cell.id, puzzleCellPath(cell.points, clickableConnectorEdges.get(cell.id)),
    ]));
    const clickableOverlapErasers = new Map(clickableOverlapCells.map((cell) => [
      cell.id,
      [...clickableConnectorEdges.get(cell.id)].map((edgeIndex) => {
        const start = cell.points[edgeIndex];
        const end = cell.points[(edgeIndex + 1) % cell.points.length];
        return `M ${start[0]} ${start[1]} L ${end[0]} ${end[1]}`;
      }).join(" "),
    ]));
    const termGeometryAtPage = (stage) => termEntries.map((entry) => {
      const removedIncomingPoints = overlapCells
        .filter((cell) =>
          cell.r < stage
          && cell.boundary === entry.familyIndex - 1
          && cell.targetLevel === entry.level)
        .flatMap((cell) => cell.points);
      const removedOutgoingPoints = overlapCells
        .filter((cell) =>
          cell.r < stage
          && cell.boundary === entry.familyIndex
          && cell.sourceLevel === entry.level)
        .flatMap((cell) => cell.points);
      const startT = removedIncomingPoints.length
        ? Math.max(...removedIncomingPoints.map((point) =>
          projectOnBand(entry.familyIndex, entry.level, point)))
        : 0;
      const endT = removedOutgoingPoints.length
        ? Math.min(...removedOutgoingPoints.map((point) =>
          projectOnBand(entry.familyIndex, entry.level, point)))
        : 1;
      const [a, b] = lineFor(entry.familyIndex, entry.level);
      const start = pointAlong(a, b, Math.max(0, Math.min(1, startT)));
      const end = pointAlong(a, b, Math.max(0, Math.min(1, endT)));
      const points = bandPolygon(...start, ...end, stripWidth);
      const markerDirection = a[1] === topY ? -1 : 1;

      return {
        ...entry,
        center: polygonCenter(points),
        marker: [start[0], start[1] + markerDirection * 19],
        markerAnchor: start,
        points,
      };
    });
    const pageTermGeometry = termGeometryAtPage(page);
    const stableTabGeometry = termGeometryAtPage(4);
    // Anchor each tab in the common edge that survives all the way to E∞.
    // Earlier pages contain that edge as a subset, so the teeth stay fixed and
    // matched while the ends of the modules are successively trimmed away.
    const stablePuzzleTabs = families.map((family, familyIndex) => {
      const [lineStart, lineEnd] = lineFor(familyIndex, 1);
      const dx = lineEnd[0] - lineStart[0], dy = lineEnd[1] - lineStart[1];
      const length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
      const normal = [Math.abs(uy) * 7, -Math.sign(uy) * ux * 7];
      const projection = (point) => point[0] * ux + point[1] * uy;
      return [1, 2, 3].map((level) => {
        const current = stableTabGeometry.find((entry) =>
          entry.familyIndex === familyIndex && entry.level === level);
        const next = stableTabGeometry.find((entry) =>
          entry.familyIndex === familyIndex && entry.level === level + 1);
        const currentEdge = dy < 0
          ? [current.points[0], current.points[1]]
          : [current.points[3], current.points[2]];
        const nextEdge = dy < 0
          ? [next.points[3], next.points[2]]
          : [next.points[0], next.points[1]];
        const sharedStart = Math.max(projection(currentEdge[0]), projection(nextEdge[0]));
        const sharedEnd = Math.min(projection(currentEdge[1]), projection(nextEdge[1]));
        if (sharedEnd - sharedStart < 22) return null;
        const centerProjection = (sharedStart + sharedEnd) / 2;
        const edgeStartProjection = projection(currentEdge[0]);
        return {
          center: [
            currentEdge[0][0] + ux * (centerProjection - edgeStartProjection),
            currentEdge[0][1] + uy * (centerProjection - edgeStartProjection),
          ],
          normal,
        };
      });
    });
    const pageTermEntries = pageTermGeometry.map((entry) => ({
      ...entry,
      path: puzzleBandPath(
        entry.familyIndex,
        entry.level,
        entry.points,
        stablePuzzleTabs,
      ),
    }));
    // The ordered key is aligned with the four upper caps of the final family,
    // so the filtration index can be read directly from the staircase.
    const filtrationKey = [1, 2, 3, 4].map((level) => {
      const [, end] = lineFor(families.length - 1, level);
      return { level, p: 4 - level, x: end[0], y: end[1] - 20 };
    });
    const familyCenter = (familyIndex) => {
      const [a, b] = lineFor(familyIndex, 2.5);
      return pointAlong(a, b, 0.5);
    };
    const totalObjectAt = (family) => {
      const degree = shiftedExponent(SPEC_DEGREES.find(
        (candidate) => candidate.object === family.object,
      ).offset);
      if (page === 0) return `C${degree}`;
      if (page === 4) return `gr_F H${degree}(C•)`;
      return `Tot${degree}(E${SUB[page]})`;
    };
    const totalDifferentialAt = (family) => {
      if (page === 0) return family.diff;
      if (page === 4) return null;
      return `d${SUB[page]}`;
    };
    const outputLabels = [
      { level: 1, raw: "F³Hⁿ ∕ F⁴Hⁿ", x: 270, y: 15, sx: 270, sy: 29 },
      { level: 2, raw: "F²Hⁿ ∕ F³Hⁿ", x: 405, y: 15, sx: 405, sy: 29 },
      { level: 3, raw: "F¹Hⁿ ∕ F²Hⁿ", x: 295, y: 199, sx: 295, sy: 185 },
      { level: 4, raw: "F⁰Hⁿ ∕ F¹Hⁿ", x: 445, y: 199, sx: 445, sy: 185 },
    ];
    return (
      <svg viewBox="0 0 720 260" style={{ width: "100%" }}
        role="img" aria-label={li === 0 ? `谱序列 ${spectralStageName} 阶段` : `Spectral-sequence stage ${spectralStageName}`}
        onClick={() => setSel(null)}>
        <title>{li === 0 ? `谱序列 ${spectralStageName} 阶段` : `Spectral-sequence stage ${spectralStageName}`}</title>
        <desc>{li === 0
          ? `五个相邻总次数共用一幅滤过复形图。当前 ${spectralStageName} 显示二十个 module 长方形和 ${pageOverlapCells.length} 个仍存在的交叠正方形；其中最外层的 ${clickableOverlapCells.length} 个正方形可选择。`
          : `Five neighboring total degrees share one filtered-complex picture. ${spectralStageName} shows twenty module rectangles and ${pageOverlapCells.length} surviving intersection squares; only its ${clickableOverlapCells.length} outermost squares are selectable.`}</desc>

        {pageTermEntries.map((entry) => {
          const lit = litRegions.includes(entry.region.id);
          if (!lit) return null;
          return <path key={`selected-${entry.region.id}`} d={entry.path}
            data-spec-selected={entry.region.id}
            fill={entry.family.color} fillOpacity={0.2}
            stroke="none" pointerEvents="none" />;
        })}

        {pageTermEntries.map((entry) => (
          <path key={`family-${entry.familyIndex}-${entry.level}`}
            data-spec-family={`${entry.familyIndex}-${entry.level}`}
            d={entry.path} fill="none"
            stroke={entry.family.color} strokeWidth={2.8}
            strokeOpacity={page > 0 && page < 4 ? 0.58 : 0.94}
            strokeLinejoin="round" pointerEvents="none" />
        ))}

        {pageTermEntries.map((entry) => {
          const p = 4 - entry.level;
          const q = shiftedDegree(entry.region.offset - p);
          const termLabel = li === 0
            ? `${N[entry.region.id - 1]}：${spectralStageName} 的 module，双次数 (p,q) = (${p},${q})，总次数 ${entry.region.total}`
            : `${N[entry.region.id - 1]}: ${spectralStageName} module at (p,q) = (${p},${q}), total degree ${entry.region.total}`;
          const selectTerm = (event) => {
            event.stopPropagation();
            setSel({ t: "r", id: entry.region.id });
          };
          return (
            <g key={`term-${entry.familyIndex}-${entry.level}`}
              data-spec-term={`${entry.level}-${entry.familyIndex}`}
              role="button" tabIndex={0} aria-label={termLabel}
              aria-pressed={sel?.t === "r" && sel.id === entry.region.id}
              style={{ cursor: "pointer" }} onClick={selectTerm}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") selectTerm(event);
              }}>
              <title>{termLabel}</title>
              <path d={entry.path} fill="transparent" stroke="transparent" />
            </g>
          );
        })}

        {clickableOverlapCells.map((cell) => (
          <path key={`erase-${cell.id}`} data-spec-cell-eraser={cell.id}
            d={clickableOverlapErasers.get(cell.id)} fill="none"
            stroke={T.paper} strokeWidth={5} strokeLinecap="round"
            pointerEvents="none" />
        ))}

        {pageOverlapCells.map((cell) => {
          const on = sel?.t === "sc" && sel.kind === "overlap" && sel.id === cell.id;
          const current = clickableOverlapCells.includes(cell);
          const visiblePath = current ? clickableOverlapPaths.get(cell.id) : cell.path;
          const sourceP = 4 - cell.sourceLevel, targetP = 4 - cell.targetLevel;
          const accessibleLabel = li === 0
            ? `d${SUB[cell.r]} 的像，源 p = ${sourceP}，目标 p = ${targetP}`
            : `Image of d${SUB[cell.r]}, source p = ${sourceP}, target p = ${targetP}`;
          const selectCell = (event) => {
            event.stopPropagation();
            setSel({
              t: "sc", kind: "overlap", id: cell.id,
              sourceLevel: cell.sourceLevel, targetLevel: cell.targetLevel,
              targetOffset: cell.targetOffset,
            });
          };
          if (!current) {
            return <path key={cell.id} data-spec-cell={cell.id}
              data-spec-page={cell.r} d={cell.path}
              fill="transparent" stroke="transparent" pointerEvents="none" />;
          }
          return (
            <g key={cell.id} className="spec-cell" data-spec-cell={cell.id}
              data-spec-page={cell.r} role="button" tabIndex={0}
              aria-label={accessibleLabel} aria-pressed={on}
              style={{ cursor: "pointer" }} onClick={selectCell}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") selectCell(event);
              }}>
              <title>{accessibleLabel}</title>
              <path className="spec-cell-target" d={visiblePath}
                fill={highlight} fillOpacity={on ? 0.28 : 0.045}
                stroke={on ? highlight : "#B85A79"}
                strokeWidth={2.8} strokeLinejoin="round"
                strokeLinecap="round" />
            </g>
          );
        })}

        {pageTermEntries.map((entry) => {
          const [x, y] = entry.marker;
          const [anchorX, anchorY] = entry.markerAnchor;
          const connectorY = y < anchorY ? y + 8 : y - 8;
          const on = sel?.t === "r" && sel.id === entry.region.id;
          const p = 4 - entry.level;
          const q = shiftedDegree(entry.region.offset - p);
          const numberLabel = li === 0
            ? `${N[entry.region.id - 1]}：选择 ${spectralStageName} 的 (p,q) = (${p},${q}) 项，总次数 ${entry.region.total}`
            : `${N[entry.region.id - 1]}: select the ${spectralStageName} term at (p,q) = (${p},${q}), total degree ${entry.region.total}`;
          const selectNumber = (event) => {
            event.stopPropagation();
            setSel({ t: "r", id: entry.region.id });
          };
          return (
            <g key={`term-number-${entry.region.id}`} data-spec-number={entry.region.id}
              role="button" tabIndex={0} aria-label={numberLabel} aria-pressed={on}
              style={{ cursor: "pointer" }} onClick={selectNumber}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") selectNumber(event);
              }}>
              <title>{numberLabel}</title>
              <line x1={anchorX} y1={anchorY} x2={x} y2={connectorY}
                stroke={on ? entry.family.color : T.line}
                strokeWidth={on ? 1.15 : 0.7} pointerEvents="none" />
              <rect x={x - 14} y={y - 12} width={28} height={24} rx={12}
                fill="transparent" stroke="none" />
              <rect x={x - 9} y={y - 8} width={18} height={16} rx={8}
                fill={T.paper} fillOpacity={0.94}
                stroke={on ? entry.family.color : T.line}
                strokeWidth={on ? 1.4 : 0.75} />
              <text x={x} y={y + 3.4} textAnchor="middle" fontFamily={mono}
                fontSize="9.5" fontWeight={on ? 500 : 400}
                fill={on ? entry.family.color : T.ink}
                pointerEvents="none">{N[entry.region.id - 1]}</text>
            </g>
          );
        })}

        {clickableOverlapCells.map((cell) => (
          <path key={`hit-${cell.id}`} data-spec-cell-hit={cell.id}
            d={clickableOverlapPaths.get(cell.id)} fill="transparent" stroke="transparent"
            style={{ cursor: "pointer" }} aria-hidden="true"
            onClick={(event) => {
              event.stopPropagation();
              setSel({
                t: "sc", kind: "overlap", id: cell.id,
                sourceLevel: cell.sourceLevel, targetLevel: cell.targetLevel,
                targetOffset: cell.targetOffset,
              });
            }} />
        ))}
        <text x={filtrationKey[0].x - 28} y={filtrationKey[0].y + 4}
          textAnchor="middle" fontFamily={serif} fontSize="11.5"
          fontStyle="italic" fill={T.faint} pointerEvents="none">p =</text>
        {filtrationKey.map(({ level, p, x, y }) => (
            <g key={`filtration-key-${level}`} data-spec-filtration-label={level}
              pointerEvents="none">
              <rect x={x - 11} y={y - 12} width={22} height={22} rx={5}
                fill="transparent" />
              <text x={x} y={y + 4} textAnchor="middle" fontFamily={mono}
                fontSize="10.5" fill={T.ink} pointerEvents="none">{p}</text>
            </g>
        ))}

        {page === 4 && outputLabels.map((label) => {
          const target = pageTermEntries.find((entry) =>
            entry.familyIndex === 2 && entry.level === label.level)?.center
            || bandCenter(2, label.level);
          const endY = label.level <= 2 ? target[1] - 9 : target[1] + 9;
          return (
            <g key={`output-${label.level}`} data-spec-output={label.level}
              pointerEvents="none">
              <path d={`M ${label.sx} ${label.sy} C ${label.sx} ${(label.sy + endY) / 2} ${target[0]} ${(label.sy + endY) / 2} ${target[0]} ${endY}`}
                fill="none" stroke={T.ink} strokeWidth={1.15} strokeLinecap="round" />
              <circle cx={target[0]} cy={endY} r={2.2} fill={T.ink} />
              <SvgMath raw={label.raw} x={label.x} y={label.y}
                width={132} height={24} fontSize={11.5}
                color={T.ink}
                pointerEvents="none" />
            </g>
          );
        })}

        {families.map((family, familyIndex) => {
          const [x] = familyCenter(familyIndex);
          const selected = sel?.t === "n" && sel.id === family.object;
          const totalObject = totalObjectAt(family);
          const objectWidth = page === 0 ? 76 : page === 4 ? 106 : 94;
          const objectFontSize = page === 0 ? 13.5 : page === 4 ? 11 : 12;
          const degreeLabel = li === 0
            ? `选择总次数 ${SPEC_DEGREES[familyIndex].total} 的整列`
            : `Select the full column in total degree ${SPEC_DEGREES[familyIndex].total}`;
          const selectDegree = (event) => {
            event.stopPropagation();
            setSel({ t: "n", id: family.object });
          };
          return (
            <g key={`degree-${familyIndex}`} data-spec-degree={familyIndex}
              role="button" tabIndex={0} aria-label={degreeLabel} aria-pressed={selected}
              style={{ cursor: "pointer" }} onClick={selectDegree}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") selectDegree(event);
              }}>
              <title>{degreeLabel}</title>
              <rect x={x - objectWidth / 2} y={217} width={objectWidth} height={28} rx={6}
                fill="transparent" stroke="none" />
              <SvgMath raw={totalObject} x={x} y={231} width={objectWidth} height={28}
                fontSize={objectFontSize} color={family.color} pointerEvents="none" />
            </g>
          );
        })}

        {page < 4 && families.slice(0, -1).map((family, familyIndex) => {
          const [x1] = familyCenter(familyIndex), [x2] = familyCenter(familyIndex + 1);
          const arrowInset = page === 0 ? 29 : 42;
          const ax = x1 + arrowInset, bx = x2 - arrowInset, y = 231;
          const differential = totalDifferentialAt(family);
          return (
            <g key={`complex-arrow-${familyIndex}`} pointerEvents="none">
              <line x1={ax} y1={y} x2={bx} y2={y}
                stroke={family.color} strokeWidth={1.45} strokeLinecap="round" />
              <polygon points={`${bx},${y} ${bx - 6},${y - 3.5} ${bx - 6},${y + 3.5}`}
                fill={family.color} />
              <SvgMath raw={differential} x={(x1 + x2) / 2} y={212}
                width={58} height={22} fontSize={11.5} color={family.color} />
            </g>
          );
        })}
      </svg>
    );
  })();

  const genericPicture = !isSpec && !isFil && (
    <svg viewBox={M.picVB || "0 0 260 210"}
      style={galleryMode
        ? { width: "100%", height: "auto" }
        : isCol
          ? { width: "100%" }
          : { flex: 1.65, minWidth: 0 }}
      onClick={() => setSel(null)}>
      {M.picDeco?.ghosts.map((g, i) => (
        <path key={i} d={g} fill="none" stroke={T.faint} strokeWidth={1}
          strokeDasharray="5 5" opacity={0.55} />
      ))}
      {M.picDeco?.texts.map(([x, y, s], i) => (
        <SvgMath key={"pt" + i} raw={s} x={x} y={y - 5} width={72}
          height={26} fontSize={14} color={T.faint} anchor="start" />
      ))}
      {M.picDeco?.brackets?.map(([x1, x2, y, o], i) => (
        <path key={"pb" + i} d={`M ${x1} ${y - 5} V ${y} H ${x2} V ${y - 5}`}
          fill="none" stroke={hue(o)} strokeWidth={1} strokeOpacity={0.65}
          style={{ pointerEvents: "none" }} />
      ))}
      {M.objects.map((o) => {
        const on = litNodes.includes(o);
        return (
          <path key={o} className="shape" d={M.shapes[o]}
            fill={hue(o)} fillOpacity={on ? 0.17 : isSpec ? 0.05 : 0.08}
            stroke={hue(o)} strokeOpacity={M.shapeStrokeOpacity ?? 1}
            strokeWidth={sel?.t === "n" && sel.id === o ? 2.4 : 1.4} />
        );
      })}
      {M.picDeco?.seams?.map((d, i) => (
        <path key={"ps" + i} d={d} fill="none" stroke={T.ink}
          strokeWidth={1.05} strokeOpacity={0.48} strokeLinejoin="round"
          style={{ pointerEvents: "none" }} />
      ))}
      {isSpec && M.regions.map((r) => {
        const R = r.rects[0];
        const removed = r.dr !== undefined && r.dr < page;
        const dying = r.dr === page;
        const pendingLimit = r.side === "H" && page < 4;
        const settledLimit = r.side === "H" && page === 4;
        return (
          <rect key={"cb" + r.id} className="shape"
            x={R[0] + 2} y={R[1] + 2} width={R[2] - 4} height={R[3] - 4} rx={5}
            fill={removed ? T.paper : dying ? T.A : settledLimit ? T.C : "none"}
            fillOpacity={removed ? 0.9 : dying ? 0.24 : settledLimit ? 0.24 : 0}
            stroke={removed ? T.faint : dying ? T.A : settledLimit ? T.C : "#B9B19D"}
            strokeOpacity={removed ? 0.7 : dying ? 0.6 : pendingLimit ? 0.38 : 0.5}
            strokeWidth={removed ? 1 : settledLimit ? 1.2 : 0.8}
            strokeDasharray={removed ? "3 3" : pendingLimit ? "2 3" : "none"} />
        );
      })}
      {M.regions.map((r) => {
        const lit = litRegions.includes(r.id);
        const killed = sel?.t === "a" && kills.includes(r.id);
        if (!lit && !killed) return null;
        return (
          <g key={"hl" + r.id} className="hl">
            {r.rects.map((R, i) => (
              <rect key={i} x={R[0] + 1} y={R[1] + 1} width={R[2] - 2} height={R[3] - 2} rx={6}
                fill={killed ? T.faint : tintOf()}
                fillOpacity={killed ? 0.15 : 0.3}
                stroke={killed ? T.faint : "none"}
                strokeWidth={1} strokeDasharray={killed ? "4 3" : "none"} />
            ))}
            {r.paths?.map((d, i) => (
              <path key={"p" + i} d={d}
                fill={killed ? T.faint : tintOf()}
                fillOpacity={killed ? 0.15 : 0.3}
                stroke={killed ? T.faint : "none"}
                strokeWidth={1} strokeDasharray={killed ? "4 3" : "none"} />
            ))}
          </g>
        );
      })}
      {showSnake && (
        <g style={{ pointerEvents: "none" }} opacity={0.85}>
          <path d="M 85 48 L 235 48 L 160 120 L 85 193 L 243 193"
            fill="none" stroke={T.C} strokeWidth={2.2} strokeDasharray="6 5"
            strokeLinejoin="round" />
          <polygon points="251,193 242,189 242,197" fill={T.C} />
        </g>
      )}
      {M.regions.map((r) => {
        const rem = isSpec && r.dr !== undefined && r.dr < page;
        const pendingLimit = isSpec && r.side === "H" && page < 4;
        return (
          <g key={r.id}>
            <text x={r.lbl[0]} y={r.lbl[1] + 5} textAnchor="middle"
              fontFamily={mono} fontSize={13}
              fill={sel?.t === "r" && sel.id === r.id ? T.ink : rem ? "#C6BFAC" : pendingLimit ? T.faint : "#5A554B"}
              fontWeight={sel?.t === "r" && sel.id === r.id ? 700 : 400}
              style={{ pointerEvents: "none" }}>
              {N[r.id - 1]}
            </text>
            {r.rects.map((R, i) => (
              <rect key={i} x={R[0]} y={R[1]} width={R[2]} height={R[3]}
                fill="transparent" style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setSel({ t: "r", id: r.id }); }} />
            ))}
            {r.paths?.map((d, i) => (
              <path key={"p" + i} d={d} fill="transparent" style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setSel({ t: "r", id: r.id }); }} />
            ))}
          </g>
        );
      })}
      {Object.entries(M.objLbl).map(([o, [x, y]]) => (
        <SvgMath key={o} raw={M.objTxt?.[o] || o} x={x} y={y - 5}
          width={100} height={28} fontSize={14} color={hue(o)} cursor="pointer"
          onClick={(e) => { e.stopPropagation(); setSel({ t: "n", id: o }); }} />
      ))}
    </svg>
  );

  const picture = isSpec ? spectralPicture : isFil ? filtrationPicture : genericPicture;

  if (galleryMode) {
    return (
      <div style={{
        ...container,
        minHeight: "100vh",
        justifyContent: "center",
        overflow: "hidden",
        padding: "4.5% 7%",
      }}>
        {css}
        <div style={{ width: "100%", maxWidth: 760 }}>
          {picture}
        </div>
      </div>
    );
  }

  const renderDiag = (nodes, arrows, deco, vb, keyp) => (
    <svg key={keyp} viewBox={vb}
      style={isCol ? { width: "94%", marginTop: 2 } : { flex: 1, minWidth: 0 }}
      onClick={() => setSel(null)}>
      {deco?.texts.map(([x, y, s], i) => (
        <SvgMath key={i} raw={s} x={x} y={y - 4} width={80}
          height={24} fontSize={13} color={T.faint} />
      ))}
      {deco?.arrows.map(([x1, y1, x2, y2], i) => {
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
        const ux = dx / L, uy = dy / L;
        return (
          <g key={"da" + i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.line} strokeWidth={1} />
            <polygon points={`${x2 + ux * 4},${y2 + uy * 4}
              ${x2 - uy * 3},${y2 + ux * 3} ${x2 + uy * 3},${y2 - ux * 3}`} fill={T.line} />
          </g>
        );
      })}
      {deco?.lines?.map(([x1, y1, x2, y2], i) => (
        <line key={"dl" + i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={T.line} strokeWidth={1} strokeDasharray="2 3" />
      ))}
      {arrows.map((a) => {
        const on = litArrows.includes(a.id);
        const col = on ? T.ink : T.faint;
        const label = a.txt !== undefined ? a.txt : a.id;
        if (a.curve) {
          return (
            <g key={a.id} style={{ cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); setSel({ t: "a", id: a.id }); }}>
              <path d={a.curve} fill="none" stroke="transparent" strokeWidth={20} />
              <path d={a.curve} fill="none" stroke={col}
                strokeWidth={on ? 2.2 : 1.2} strokeDasharray={a.dash ? "5 4" : "none"} />
              <polygon points={a.head} fill={col} />
              {a.lbl && label && (
                <SvgMath raw={label} x={a.lbl[0]} y={a.lbl[1] - 4} width={84}
                  height={24} fontSize={13} color={on ? T.ink : T.faint} />
              )}
            </g>
          );
        }
        const [x1, y1] = nodes[a.from], [x2, y2] = nodes[a.to];
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
        const ux = dx / L, uy = dy / L, tr = a.trim || M.nodeR + 1;
        const p1 = [x1 + ux * tr, y1 + uy * tr], p2 = [x2 - ux * tr, y2 - uy * tr];
        return (
          <g key={a.id} style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); setSel({ t: "a", id: a.id }); }}>
            <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
              stroke="transparent" strokeWidth={20} />
            <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
              stroke={col} strokeWidth={on ? 2.2 : 1.2}
              strokeDasharray={a.dash ? "5 4" : a.dot ? "2 3" : "none"} />
            <polygon points={`${p2[0]},${p2[1]}
              ${p2[0] - ux * 6 - uy * 4},${p2[1] - uy * 6 + ux * 4}
              ${p2[0] - ux * 6 + uy * 4},${p2[1] - uy * 6 - ux * 4}`} fill={col} />
            {a.lbl && label && (
              <SvgMath raw={label} x={a.lbl[0]} y={a.lbl[1] - 4} width={84}
                height={24} fontSize={13} color={on ? T.ink : T.faint} />
            )}
          </g>
        );
      })}
      {Object.entries(nodes).map(([o, [x, y]]) => {
        const on = litNodes.includes(o);
        const small = M.small?.includes(o);
        return (
          <g key={o} style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); setSel({ t: "n", id: o }); }}>
            {small ? (
              <>
                <circle cx={x} cy={y} r={18} fill="transparent" />
                <SvgMath raw={M.nodeTxt[o]} x={x} y={y} width={84}
                  height={24} fontSize={11.5} color={on ? hue(o) : T.faint}
                  pointerEvents="none" />
              </>
            ) : (
              <>
                <circle cx={x} cy={y} r={M.nodeR} fill={hue(o)} fillOpacity={on ? 0.2 : 0.07} />
                <SvgMath raw={o} x={x} y={y} width={70}
                  height={28} fontSize={17} color={on ? hue(o) : T.ink}
                  pointerEvents="none" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );

  const specFolio = isSpec && (
    <div style={{ display: "flex", gap: 10, margin: "6px 0 0", alignItems: "center" }}>
      {[0, 1, 2, 3, 4].map((p) => (
        <button key={p} onClick={() => { setPage(p); setSel(null); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: serif, fontStyle: "italic", fontSize: 15, padding: "2px 4px",
            color: p === page ? T.ink : T.faint,
            borderBottom: p === page ? `1.5px solid ${T.ink}` : "1.5px solid transparent",
          }}>
          <Mx raw={p === 4 ? "E₄ = E∞" : `E${SUB[p]}`} kx={kx} />
        </button>
      ))}
    </div>
  );

  const spectralLattice = isSpec && (() => {
    // Standard cohomological convention: p is the horizontal filtration degree,
    // q increases upward, total degree is p + q, and d_r has bidegree (r, 1-r).
    const columns = 4, minQOffset = -5, maxQOffset = 2;
    const qOffsets = Array.from(
      { length: maxQOffset - minQOffset + 1 },
      (_, index) => minQOffset + index,
    );
    const rows = qOffsets.length;
    const originX = 105, originY = 24, dx = 42, dy = 42;
    const bottomY = originY + (rows - 1) * dy;
    const point = (p, qOffset) => [
      originX + p * dx,
      bottomY - (qOffset - minQOffset) * dy,
    ];
    const differential = page < 4 ? page : null;
    const latticeArrows = [];
    if (differential !== null) {
      for (let degree = 0; degree < SPEC_DEGREES.length - 1; degree++) {
        for (let sourceP = 0; sourceP < columns; sourceP++) {
          const sourceQOffset = SPEC_DEGREES[degree].offset - sourceP;
          const targetP = sourceP + differential;
          const targetQOffset = sourceQOffset + 1 - differential;
          if (targetP >= columns
            || targetQOffset < minQOffset || targetQOffset > maxQOffset) continue;
          latticeArrows.push({ degree, sourceP, targetP, sourceQOffset, targetQOffset });
        }
      }
    }
    const trimmedArrow = ({ sourceP, targetP, sourceQOffset, targetQOffset }) => {
      const source = point(sourceP, sourceQOffset);
      const target = point(targetP, targetQOffset);
      const vx = target[0] - source[0], vy = target[1] - source[1];
      const length = Math.hypot(vx, vy), ux = vx / length, uy = vy / length;
      return {
        x1: source[0] + ux * 6, y1: source[1] + uy * 6,
        x2: target[0] - ux * 7, y2: target[1] - uy * 7,
      };
    };
    const markerId = `spectral-grid-arrow-${page}`;
    const lastX = point(columns - 1, minQOffset)[0];
    const lastY = bottomY;
    const axisY = lastY + 18;
    const axisX = originX - 32;
    return (
      <svg viewBox="0 0 360 366" style={{ width: "min(94%, 460px)", margin: "14px auto 4px" }}
        role="img"
        aria-label={li === 0
          ? `谱序列 ${spectralStageName} 的标准 (p,q) 格点与微分`
          : `Standard (p,q) lattice and differential at ${spectralStageName}`}>
        <title>{li === 0 ? "谱序列格点" : "Spectral-sequence lattice"}</title>
        <desc>{li === 0
          ? differential === null
            ? "E4 等于 E 无穷；格点之间不再有可能非零的微分。"
            : differential === 0
              ? "d0 的双次数为 (0,1)：p 保持不变，q 增加 1。"
              : `d${differential} 的双次数为 (${differential},${1 - differential})：p 增加 ${differential}，q 改变 ${1 - differential}。`
          : differential === null
            ? "E4 equals E infinity; no potentially nonzero differentials remain between the lattice points."
            : differential === 0
              ? "d0 has bidegree (0,1): p is preserved while q increases by 1."
              : `d${differential} has bidegree (${differential},${1 - differential}): p increases by ${differential} and q changes by ${1 - differential}.`}</desc>
        <defs>
          <marker id={markerId} markerWidth="6" markerHeight="6" refX="5.2" refY="3"
            orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#B85A79" />
          </marker>
          <marker id={`${markerId}-selected`} markerWidth="6" markerHeight="6" refX="5.2" refY="3"
            orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#C64AA8" />
          </marker>
        </defs>
        <line x1={axisX} y1={axisY} x2={lastX + 30}
          y2={axisY} stroke={T.faint} strokeWidth="1.1" />
        <polygon points={`${lastX + 30},${axisY} ${lastX + 23},${axisY - 4} ${lastX + 23},${axisY + 4}`}
          fill={T.faint} />
        <line x1={axisX} y1={axisY} x2={axisX}
          y2={originY - 16} stroke={T.faint} strokeWidth="1.1" />
        <polygon points={`${axisX},${originY - 16} ${axisX - 4},${originY - 9} ${axisX + 4},${originY - 9}`}
          fill={T.faint} />

        {latticeArrows.map((arrow) => {
          const line = trimmedArrow(arrow);
          const sourceLevel = 4 - arrow.sourceP;
          const targetLevel = 4 - arrow.targetP;
          const represented = arrow.degree < SPEC_DEGREES.length - 1;
          const cellId = `G-${arrow.degree}-${sourceLevel}-${targetLevel}`;
          const selected = represented
            && sel?.t === "sc" && sel.kind === "overlap" && sel.id === cellId;
          const arrowLabel = represented && (li === 0
            ? `选择 d${SUB[differential]}：从 (p,q) = (${arrow.sourceP},${shiftedDegree(arrow.sourceQOffset)}) 到 (${arrow.targetP},${shiftedDegree(arrow.targetQOffset)})`
            : `Select d${SUB[differential]} from (p,q) = (${arrow.sourceP},${shiftedDegree(arrow.sourceQOffset)}) to (${arrow.targetP},${shiftedDegree(arrow.targetQOffset)})`);
          const selectDifferential = (event) => {
            if (!represented) return;
            event.stopPropagation();
            setSel({
              t: "sc", kind: "overlap", id: cellId,
              sourceLevel, targetLevel,
              targetOffset: SPEC_DEGREES[arrow.degree + 1].offset,
            });
          };
          return (
            <g key={`d-${arrow.degree}-${arrow.sourceP}`}
              data-spec-lattice-arrow={`${arrow.degree}-${sourceLevel}-${targetLevel}`}
              data-spec-lattice-arrow-selected={selected ? "true" : "false"}
              role={represented ? "button" : undefined}
              tabIndex={represented ? 0 : undefined}
              aria-label={arrowLabel || undefined}
              aria-pressed={represented ? !!selected : undefined}
              style={represented ? { cursor: "pointer" } : undefined}
              onClick={selectDifferential}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") selectDifferential(event);
              }}>
              {represented && (
                <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke="transparent" strokeWidth="12" />
              )}
              <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke={selected ? "#C64AA8" : "#B85A79"}
                strokeWidth={selected ? 2.5 : 1.45}
                strokeOpacity={selected ? 1 : 0.78}
                markerEnd={`url(#${selected ? `${markerId}-selected` : markerId})`} />
            </g>
          );
        })}

        {Array.from({ length: columns }, (_, p) =>
          qOffsets.map((qOffset) => {
            const [x, y] = point(p, qOffset);
            const level = 4 - p;
            const totalOffset = p + qOffset;
            const degreeIndex = SPEC_DEGREES.findIndex((degree) => degree.offset === totalOffset);
            const region = degreeIndex < 0 ? null : M.regions.find((candidate) =>
              candidate.degreeIndex === degreeIndex && candidate.lv === level);
            if (!region) return null;
            const selected = region && litRegions.includes(region.id);
            const termLabel = region && (li === 0
              ? `选择 ${spectralStageName} 的 (p,q) = (${p},${shiftedDegree(qOffset)}) 项，总次数 ${region.total}`
              : `Select the ${spectralStageName} term at (p,q) = (${p},${shiftedDegree(qOffset)}), total degree ${region.total}`);
            const selectTerm = (event) => {
              if (!region) return;
              event.stopPropagation();
              setSel({ t: "r", id: region.id });
            };
            return (
              <g key={`${p}-${qOffset}`}
                className={region ? "spec-lattice-term" : undefined}
                data-spec-lattice-term={region
                  ? `${region.degreeIndex}-${level}`
                  : `p${p}-q${qOffset}`}
                data-spec-lattice-selected={selected ? "true" : "false"}
                role={region ? "button" : undefined}
                tabIndex={region ? 0 : undefined}
                aria-label={termLabel || undefined}
                aria-pressed={region ? !!selected : undefined}
                style={region ? { cursor: "pointer" } : undefined}
                onClick={selectTerm}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") selectTerm(event);
                }}>
                {region && (
                  <circle className="spec-lattice-hit" cx={x} cy={y} r="10"
                    fill="transparent" stroke="transparent" />
                )}
                {selected && (
                  <circle cx={x} cy={y} r="8.5" fill="#C64AA8" fillOpacity="0.14"
                    stroke="#C64AA8" strokeWidth="1.4" />
                )}
                {region && (
                  <circle cx={x} cy={y} r={selected ? 4.8 : 3.7}
                    fill={selected ? "#C64AA8" : page === 4 ? T.C : T.ink}
                    stroke={T.paper} strokeWidth="1.4" />
                )}
              </g>
            );
          }))}

        {Array.from({ length: columns }, (_, p) => {
          const [x] = point(p, minQOffset);
          return <text key={`p-${p}`} x={x} y={axisY + 20} textAnchor="middle"
            fontFamily={mono} fontSize="9.5" fill={T.faint}>{p}</text>;
        })}
        {qOffsets.map((qOffset) => {
          const [, y] = point(0, qOffset);
          return <text key={`q-${qOffset}`} x={axisX - 15} y={y + 3.5} textAnchor="middle"
            fontFamily={serif} fontSize="9.5" fontStyle="italic" fill={T.faint}>{shiftedDegree(qOffset)}</text>;
        })}
        <text x={lastX + 39} y={axisY + 4}
          fontFamily={serif} fontSize="13" fontStyle="italic" fill={T.ink}>p</text>
        <text x={axisX - 5} y={originY - 22}
          fontFamily={serif} fontSize="13" fontStyle="italic" fill={T.ink}>q</text>
        <SvgMath raw={page === 4 ? "E₄ = E∞" : `d${SUB[differential]}`}
          x={310} y={24} width={80} height={26} fontSize={13.5}
          color={page === 4 ? T.C : "#B85A79"} />
      </svg>
    );
  })();

  const diagLabel = (pair) => pair && (
    <div style={{
      fontFamily: mono, fontSize: 8.5, letterSpacing: ".22em",
      color: T.faint, margin: "10px 0 0",
    }}>
      {t(pair)}
    </div>
  );

  return (
    <div className={`vakil-mode-page${isCol ? " vakil-mode-column" : ""}`} style={container}>
      {css}
      {langBtns}

      <div style={{
        display: "flex", alignItems: "center", width: "100%", maxWidth: contentMaxWidth,
        margin: "0 0 12px", paddingRight: 56, boxSizing: "border-box",
      }}>
        <button className="tile" onClick={() => { setMode(null); setScopeOpen(false); }} style={{ ...navBtn, marginLeft: 0 }}>
          <svg viewBox="0 0 20 20" width={14} height={14}>
            {[3, 10, 17].map((gx) => [3, 10, 17].map((gy) => (
              <circle key={gx + "-" + gy} cx={gx} cy={gy} r={1.9} fill={T.ink} />
            )))}
          </svg>
        </button>
        <div style={{
          flex: 1, textAlign: "center", fontFamily: serif, fontSize: 15,
          letterSpacing: li === 0 ? ".16em" : ".03em",
        }}>
          {t(M.title)}
        </div>
        <div style={{ width: 34 }} />
      </div>

      <div style={{
        display: "flex", width: "100%", maxWidth: contentMaxWidth, gap: 2,
        marginTop: isSpec ? 0 : "auto",
        flexDirection: isCol ? "column" : "row", alignItems: "center",
      }}>
        {specFolio}
        {picture}
        {spectralLattice}
        {isFil && (
          <svg viewBox="0 0 620 42" style={{ width: "96%", marginTop: 10 }}
            role="group" aria-label="Interactive filtration chain from zero equals F zero C through F four C equals C"
            onClick={() => setSel(null)}>
            <title>{li === 0 ? "点击滤过子对象以高亮对应的前缀" : "Select a filtered subobject to highlight its prefix"}</title>
            <SvgMath raw="0" x={50} y={21} width={24} height={34} fontSize={13} color={T.faint} />
            {[
              { raw: "=", x: 80 },
              { raw: "⊂", x: 162 },
              { raw: "⊂", x: 246 },
              { raw: "⊂", x: 330 },
              { raw: "⊂", x: 414 },
            ].map((relation, index) => (
              <SvgMath key={`filtration-relation-${index}`} raw={relation.raw} x={relation.x} y={21}
                width={24} height={34} fontSize={13} color={T.faint} />
            ))}
            {[
              { id: "F0", raw: "F⁰C", x: 120, width: 60 },
              { id: "F1", raw: "F¹C", x: 204, width: 60 },
              { id: "F2", raw: "F²C", x: 288, width: 60 },
              { id: "F3", raw: "F³C", x: 372, width: 60 },
              { id: "F4", raw: "F⁴C = C", x: 500, width: 132 },
            ].map((term) => {
              const selected = sel?.t === "n" && sel.id === term.id;
              return (
                <g key={term.id} data-filtration-chain-term={term.id}
                  style={{ cursor: "pointer" }}
                  onClick={(event) => { event.stopPropagation(); setSel({ t: "n", id: term.id }); }}>
                  <rect x={term.x - term.width / 2} y={4} width={term.width} height={34}
                    rx={5} fill="transparent" />
                  <SvgMath raw={term.raw} x={term.x} y={21} width={term.width} height={34}
                    fontSize={13} color={selected ? hue(term.id) : T.faint} pointerEvents="none" />
                </g>
              );
            })}
          </svg>
        )}
        {!isSpec && !isFil && (
          <>
            {M.diagTitle && diagLabel(M.diagTitle)}
            {renderDiag(M.nodes, M.arrows, M.deco, M.diagVB || "0 0 160 156", "d1")}
            {M.nodes2 && diagLabel(M.diag2Title)}
            {M.nodes2 && renderDiag(M.nodes2, M.arrows2, M.deco2, M.diagVB2, "d2")}
          </>
        )}
      </div>

      <div className="vakil-caption" style={{
        marginTop: 12, width: "100%", maxWidth: captionMaxWidth, minHeight: 48,
        borderTop: `1px solid ${T.line}`, paddingTop: 10,
        fontFamily: serif, fontSize: li === 0 ? 14 : 13.5, lineHeight: 1.6,
      }}>
        <MathCap s={cap} kx={kx} />
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        width: "100%", maxWidth: contentMaxWidth, marginTop: "auto", paddingTop: 18,
      }}>
        {prevK ? (
          <button className="tile" onClick={() => go(prevK)} style={keyBtn}><Icon k={prevK} s={36} /></button>
        ) : <div style={{ width: 58 }} />}
        {nextK ? (
          <button className="tile" onClick={() => go(nextK)} style={keyBtn}><Icon k={nextK} s={36} /></button>
        ) : <div style={{ width: 58 }} />}
      </div>
    </div>
  );
}
