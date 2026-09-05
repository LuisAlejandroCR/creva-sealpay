// ScoreGauge.tsx: mobile score ring inspired by creva_finance's gauge.
// It uses NativeWind views instead of SVG so the UI port needs no new native dependency.
import { Text, View } from "react-native";

type BandTone = "success" | "warning" | "danger" | "neutral";

const BAND_CLASS: Record<BandTone, { chip: string; fill: string; label: string }> = {
  success: { chip: "bg-emerald-50 text-emerald-700", fill: "bg-emerald-600", label: "Encontrado" },
  warning: { chip: "bg-amber-50 text-amber-700", fill: "bg-amber-500", label: "Por revisar" },
  danger: { chip: "bg-red-50 text-red-700", fill: "bg-red-600", label: "Falta evidencia" },
  neutral: { chip: "bg-slate-100 text-slate-600", fill: "bg-slate-500", label: "Informativo" },
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
      <View className="h-52 w-52 items-center justify-center rounded-full bg-slate-100 p-4">
        <View className="h-full w-full items-center justify-center rounded-full border-[14px] border-slate-200 bg-white">
          <Text className="text-xs font-semibold uppercase text-slate-400">{title}</Text>
          <Text className="mt-1 text-6xl font-bold tabular-nums text-slate-950">{value}</Text>
          <Text className="mt-1 text-xs tabular-nums text-slate-500">de {max}</Text>
        </View>
      </View>
      <View className="mt-4 h-2 w-44 overflow-hidden rounded-full bg-slate-100">
        <View className={`h-2 rounded-full ${bandStyle.fill}`} style={{ width: `${pct}%` }} />
      </View>
      <Text className={`mt-3 rounded-full px-3 py-1 text-xs font-bold ${bandStyle.chip}`}>
        {bandStyle.label}
      </Text>
    </View>
  );
}
