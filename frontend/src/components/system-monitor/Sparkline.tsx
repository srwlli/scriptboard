"use client";

import { useMemo } from "react";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  showArea?: boolean;
  className?: string;
}

/**
 * A reusable mini SVG line chart for displaying resource history.
 * Renders a smooth line chart with optional filled area below.
 */
export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "currentColor",
  fillOpacity = 0.1,
  showArea = true,
  className = "",
}: SparklineProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (!data || data.length === 0) {
      return { linePath: "", areaPath: "" };
    }

    // Normalize data to fit in the SVG
    const maxValue = Math.max(...data, 1); // Avoid division by zero
    const padding = 1;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    // Create points
    const points = data.map((value, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * effectiveWidth;
      const y = padding + effectiveHeight - (value / maxValue) * effectiveHeight;
      return { x, y };
    });

    // Build SVG path with smooth curve
    if (points.length === 1) {
      // Single point - draw a small horizontal line
      return {
        linePath: `M ${points[0].x - 2} ${points[0].y} L ${points[0].x + 2} ${points[0].y}`,
        areaPath: "",
      };
    }

    // Create line path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Create area path (filled below the line)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { linePath, areaPath };
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className={className}>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.3}
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className={className}>
      {showArea && areaPath && (
        <path d={areaPath} fill={color} fillOpacity={fillOpacity} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
