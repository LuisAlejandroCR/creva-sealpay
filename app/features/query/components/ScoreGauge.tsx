// ScoreGauge.tsx: mobile score ring inspired by creva_finance's gauge.
// It uses NativeWind views instead of SVG so the UI port needs no new native dependency.
import { Text, View } from "react-native";

type BandTone = "success" | "warning" | "danger" | "neutral";

const BAND_CLASS: Record<BandTone, { chip: string; fill: string; label: string }> = {
  success: { chip: "bg-success/15 text-success", fill: "bg-success", label: "Bueno" },
  warning: { chip: "bg-warning/10 text-warning-text", fill: "bg-warning", label: "Por revisar" },
  danger: { chip: "bg-crimson/10 text-crimson", fill: "bg-crimson", label: "Falta evidencia" },
  neutral: { chip: "bg-inactive text-text-secondary", fill: "bg-text-secondary", label: "Informativo" },
};

export function ScoreGauge({
  value,
  max,
  band = "success",
  title = "Score Creva",
}: {
  value: number;
  max: number;
  band?: BandTone;
  title?: string;
}) {
  const pct = max > 0 ? Math.round(Math.max(0, Math.min(1, value / max)) * 100) : 0;
  const bandStyle = BAND_CLASS[band];

  return (
    <View className="items-center">
      <View className="h-52 w-52 items-center justify-center rounded-full bg-surface-2 p-4">
        <View className="h-full w-full items-center justify-center rounded-full border-[14px] border-inactive bg-surface-1">
          <Text className="text-xs font-semibold uppercase text-text/60">{title}</Text>
          <Text className="mt-1 text-6xl font-bold tabular-nums text-text">{value}</Text>
          <Text className="mt-1 text-xs tabular-nums text-text/60">de {max}</Text>
        </View>
      </View>
      <View className="mt-4 h-2 w-44 overflow-hidden rounded-full bg-inactive">
        <View className={`h-2 rounded-full ${bandStyle.fill}`} style={{ width: `${pct}%` }} />
      </View>
      <Text className={`mt-3 rounded-full px-3 py-1 text-xs font-bold ${bandStyle.chip}`}>
        {bandStyle.label}
      </Text>
    </View>
  );
}
