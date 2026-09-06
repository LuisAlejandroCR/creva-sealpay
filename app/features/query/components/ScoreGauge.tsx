// ScoreGauge.tsx: the score as a gauge, ported from creva_finance/frontend/components/ui/
// ScoreGauge.tsx (+ lib/score-display.ts's scoreArcPath). `arc` is the summary on a card
// (dashboard), `ring` is the hero of the score screen. Colour rides the arc and the chip, never
// the number. Rendered with react-native-svg; the number uses the system bold face (the web uses
// Playfair, which the app does not bundle).
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { Text, View } from "react-native";

import { scoreArcPath } from "../../../lib/score-display";

type BandTone = "success" | "warning" | "danger" | "neutral";

// Light-theme values of creva_finance/frontend/app/globals.css --cr-success / --cr-warning-text /
// --cr-danger-text and their -bg pairs (score-display.ts's BANDS), plus the app labels.
const BAND: Record<BandTone, { color: string; bg: string; label: string }> = {
  success: { color: "#2E6A48", bg: "rgba(46, 106, 72, 0.15)", label: "Bueno" },
  warning: { color: "#8A5A00", bg: "rgba(232, 160, 32, 0.10)", label: "Por revisar" },
  danger: { color: "#C41E3A", bg: "rgba(196, 30, 58, 0.12)", label: "Falta evidencia" },
  neutral: { color: "rgba(26, 22, 19, 0.60)", bg: "rgba(26, 22, 19, 0.06)", label: "Informativo" },
};

const TRACK = "rgba(26, 22, 19, 0.10)"; // --cr-border
const SUBTLE = "rgba(26, 22, 19, 0.60)"; // --cr-text-subtle

const RING_RADIUS = 72;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function Chip({ band, marginTop, size }: { band: (typeof BAND)[BandTone]; marginTop: number; size: "sm" | "md" }) {
  return (
    <Text
      style={{
        marginTop,
        fontSize: size === "md" ? 13 : 11,
        fontWeight: "700",
        color: band.color,
        backgroundColor: band.bg,
        borderRadius: 20,
        overflow: "hidden",
        paddingVertical: size === "md" ? 6 : 3,
        paddingHorizontal: size === "md" ? 14 : 10,
      }}
    >
      {band.label}
    </Text>
  );
}

export function ScoreGauge({
  value,
  max,
  band = "success",
  shape = "arc",
  min = 0,
}: {
  value: number;
  max: number;
  band?: BandTone;
  shape?: "arc" | "ring";
  min?: number;
  /** Kept for call-site compatibility; the web gauge shows no title. */
  title?: string;
}) {
  const b = BAND[band];

  if (shape === "ring") {
    const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    return (
      <View className="items-center">
        <View style={{ width: 208, height: 208, position: "relative" }}>
          <Svg width={208} height={208}>
            <G rotation={-90} origin="104, 104">
              <Circle cx={104} cy={104} r={RING_RADIUS} fill="none" stroke={TRACK} strokeWidth={14} />
              {value > 0 ? (
                <Circle
                  cx={104}
                  cy={104}
                  r={RING_RADIUS}
                  fill="none"
                  stroke={b.color}
                  strokeWidth={14}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - ratio)}
                />
              ) : null}
            </G>
          </Svg>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 60, fontWeight: "700", color: "#1A1613", lineHeight: 60, letterSpacing: -1.8 }}>
              {value}
            </Text>
            <Text style={{ fontSize: 12, color: SUBTLE, marginTop: 6 }}>de {max}</Text>
          </View>
        </View>
        <Chip band={b} marginTop={16} size="md" />
      </View>
    );
  }

  // arc — 160×92 viewBox, drawn at 210 wide (web max-width 210).
  const W = 210;
  const H = (W * 92) / 160;
  return (
    <View className="items-center">
      <View style={{ width: W, height: H, position: "relative" }}>
        <Svg width={W} height={H} viewBox="0 0 160 92">
          <Path d="M 8 80 A 72 72 0 0 1 152 80" fill="none" stroke={TRACK} strokeWidth={11} strokeLinecap="round" />
          {value > 0 ? (
            <Path d={scoreArcPath(value, max)} fill="none" stroke={b.color} strokeWidth={11} strokeLinecap="round" />
          ) : null}
          <SvgText x={8} y={92} fontSize={9} fill={SUBTLE}>
            {String(min)}
          </SvgText>
          <SvgText x={152} y={92} textAnchor="end" fontSize={9} fill={SUBTLE}>
            {String(max)}
          </SvgText>
        </Svg>
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 22, alignItems: "center" }}>
          <Text style={{ fontSize: 46, fontWeight: "700", color: "#1A1613", lineHeight: 46, letterSpacing: -1.4 }}>
            {value}
          </Text>
          <Chip band={b} marginTop={6} size="sm" />
        </View>
      </View>
    </View>
  );
}
