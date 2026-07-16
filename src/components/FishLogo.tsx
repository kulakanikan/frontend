import React from "react";
import Svg, { Path, Circle } from "react-native-svg";

interface LogoProps {
  width?: number;
  height?: number;
  color?: string;
  variant?: "solid" | "outline";
}

export default function FishLogo({
  width = 100,
  height = 100,
  color = "#25518b",
}: LogoProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      {/* Fish Body Outline */}
      <Path
        d="M20 50 C 35 30, 75 30, 85 50 C 75 65, 45 65, 25 55 L 15 65 L 20 50 Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Fish Eye */}
      <Circle cx="72" cy="46" r="2.5" fill={color} opacity="0.6" />

      {/* Wave Underneath */}
      <Path
        d="M25 70 C 35 60, 50 75, 65 70 C 75 66, 80 66, 85 68"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M35 75 C 45 70, 55 80, 65 75"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
