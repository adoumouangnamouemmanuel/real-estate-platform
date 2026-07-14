interface SparklineProps {
  /** Chronological values, oldest first. */
  data: number[];
  className?: string;
  strokeWidth?: number;
  /** Omit for a purely decorative sparkline sitting next to a text value. */
  ariaLabel?: string;
}

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 30;

function buildPoints(data: number[]): string {
  if (data.length === 1) {
    return `0,${VIEWBOX_HEIGHT / 2} ${VIEWBOX_WIDTH},${VIEWBOX_HEIGHT / 2}`;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const step = VIEWBOX_WIDTH / (data.length - 1);

  return data
    .map((value, index) => {
      const x = index * step;
      // A flat series (range === 0) still draws a flat mid-height line, not a divide-by-zero NaN.
      const y =
        range === 0
          ? VIEWBOX_HEIGHT / 2
          : VIEWBOX_HEIGHT - ((value - min) / range) * VIEWBOX_HEIGHT;
      return `${x},${y}`;
    })
    .join(" ");
}

/** Simple trend line — no axes, no tooltip. Color comes from the consumer via `className` (currentColor). */
export function Sparkline({
  data,
  className,
  strokeWidth = 2,
  ariaLabel,
}: SparklineProps) {
  if (data.length === 0) return null;

  const points = buildPoints(data);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
