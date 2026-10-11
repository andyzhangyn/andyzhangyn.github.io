import Image from "next/image";
import katex from "katex";
import "katex/dist/katex.min.css";

function Formula({ tex }: { tex: string }) {
  return <div dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { displayMode: true, throwOnError: true }) }} />;
}

// Projection of the (2,3) torus knot. At each double point, the
// branch with z = sin(3t) > 0 passes over the branch with z < 0.
const point = (t: number) => ({
  x: 845 + 26 * (2 + Math.cos(3 * t)) * Math.cos(2 * t),
  y: 160 - 26 * (2 + Math.cos(3 * t)) * Math.sin(2 * t),
});
function curve(start: number, end: number, steps: number) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = point(start + (end - start) * i / steps);
    return `${i === 0 ? "M" : "L"}${p.x} ${p.y}`;
  }).join(" ");
}
// Leave a short gap only on the undercrossing branch. This lets the
// painted background show through without painting over its texture.
const undercrossings = [Math.PI / 2, 7 * Math.PI / 6, 11 * Math.PI / 6];
const knotPaths = undercrossings.map((t, i) => curve(
  t + .085,
  (undercrossings[(i + 1) % 3] + (i === 2 ? 2 * Math.PI : 0)) - .085,
  220,
));

export function HabiroDiagram() {
  return (
    <figure className="habiro-frieze" aria-label="A hand-painted ceramic mathematical frieze: twelve roots of unity, the definition of the Habiro ring, and a trefoil knot">
      <Image src="/seminars/habiro-ceramic.png" alt="" width={2172} height={724} priority className="habiro-frieze-painting" />
      <svg className="habiro-frieze-inlay" viewBox="0 0 1000 333.333" role="img" aria-label="Twelve equally spaced roots of unity on a circle, and a trefoil with three crossings">
        <g transform="translate(-21 -1)">
        <g fill="none" stroke="#324f61">
          <circle cx="192" cy="157" r="77" strokeWidth="1.4" />
          <path d="M107 157H277M192 72V242" strokeWidth=".6" opacity=".6" />
          {Array.from({ length: 12 }, (_, k) => {
            const angle = 2 * Math.PI * k / 12;
            return <circle key={k} cx={192 + 77 * Math.cos(angle)} cy={157 - 77 * Math.sin(angle)} r="3" fill={k === 0 ? "#a35435" : "#324f61"} stroke="none" />;
          })}
        </g>
        <g fill="#294858" fontFamily="Georgia, serif" fontSize="12">
          <text x="277" y="153">1</text><text x="198" y="75">i</text>
          <text x="97" y="153">−1</text><text x="198" y="246">−i</text>
        </g>
        </g>
        <g transform="translate(7 -4)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {knotPaths.map((d, i) => (
            <g key={i}>
              <path d={d} stroke="#354c59" strokeWidth="10" />
              <path d={d} stroke="#ebdfc6" strokeWidth="6" />
            </g>
          ))}
        </g>
      </svg>
      <div className="habiro-frieze-definition">
        <Formula tex={String.raw`\mathcal H=\varprojlim_{N\ge1}\frac{\mathbb Z[q]}{((q;q)_N)}`} />
        <Formula tex={String.raw`(q;q)_N=\prod_{j=1}^{N}(1-q^j)`} />
      </div>
    </figure>
  );
}
