/**
 * Pókhálóábra (radar) hat területről, 1–10-es skálán (Idegrendszer-térkép, illetve a régi Életmód-térkép).
 * Tiszta SVG, a paletta színeivel; világos és sötét módban is olvasható.
 */
export function LifestyleRadar({
  values,
  className = "",
}: {
  values: { name: string; value: number }[];
  className?: string;
}) {
  const w = 400;
  const h = 300;
  const c = w / 2;
  const cy = h / 2;
  const r = 92;
  const n = values.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number) => {
    const a = angle(i);
    const d = (v / 10) * r;
    return [c + d * Math.cos(a), cy + d * Math.sin(a)] as const;
  };
  const ring = (v: number) => values.map((_, i) => pt(i, v).join(",")).join(" ");
  const shape = values.map((p, i) => pt(i, p.value).join(",")).join(" ");
  const label = values.map(({ name }, i) => [name, ...pt(i, 12.4)] as const);
  const summary = values.map((p) => `${p.name}: ${p.value.toLocaleString("hu-HU")}`).join(", ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label={`Az eredményed, 1-től 10-ig: ${summary}`}
    >
      {[2.5, 5, 7.5, 10].map((v) => (
        <polygon key={v} points={ring(v)} fill="none" className="stroke-line" strokeWidth={v === 10 ? 1.2 : 0.8} />
      ))}
      {values.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={c} y1={cy} x2={x} y2={y} className="stroke-line" strokeWidth={0.8} />;
      })}
      <polygon points={shape} className="fill-gold/25 stroke-gold" strokeWidth={2} strokeLinejoin="round" />
      {values.map((p, i) => {
        const [x, y] = pt(i, p.value);
        return <circle key={p.name} cx={x} cy={y} r={3.5} className="fill-forest" />;
      })}
      {label.map(([name, x, y], i) => {
        const anchor = Math.abs(x - c) < 4 ? "middle" : x > c ? "start" : "end";
        return (
          <text
            key={name}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-ink-soft text-[13px]"
          >
            {name}
            <tspan className="fill-forest font-semibold"> {values[i].value.toLocaleString("hu-HU")}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
