import { createHarveyBallGeometry, type HarveyBallConfig } from "@/lib/harvey-ball-svg";

interface HarveyBallPreviewProps {
  config: HarveyBallConfig;
  className?: string;
}

export function HarveyBallPreview({ config, className }: HarveyBallPreviewProps) {
  const geometry = createHarveyBallGeometry(config);

  return (
    <svg
      viewBox={geometry.viewBox}
      className={className}
      role="img"
      aria-label={`Harvey ball preview at ${config.percentage} percent`}
    >
      <circle
        cx={geometry.backgroundCircle.cx}
        cy={geometry.backgroundCircle.cy}
        r={geometry.backgroundCircle.r}
        fill={config.backgroundColor}
        stroke={config.outlineColor}
        strokeWidth={config.outlineWidth}
      />
      {geometry.fillPath ? <path d={geometry.fillPath} fill={config.fillColor} /> : null}
    </svg>
  );
}
