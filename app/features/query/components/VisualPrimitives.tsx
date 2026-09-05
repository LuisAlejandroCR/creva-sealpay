// VisualPrimitives.tsx: React Native equivalents of Creva's small UI surfaces.
// Query and verify compose these pieces to keep the port visual-only and leave app/lib untouched.
import { ReactNode } from "react";
import { Text, View } from "react-native";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const BADGE_CLASS: Record<Tone, string> = {
  success: "bg-[#2E6A48]/15 text-[#2E6A48]",
  warning: "bg-[#E8A020]/10 text-[#8A5A00]",
  danger: "bg-[#C41E3A]/10 text-[#C41E3A]",
  info: "bg-[#3A5FD8]/10 text-[#3A5FD8]",
  neutral: "bg-[#DED7C8] text-[#6F675C]",
};

export function Section({
  title,
  lead,
  children,
}: {
  title?: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-7">
      {title ? <Text className="mb-1 text-base font-semibold text-[#1A1613]">{title}</Text> : null}
      {lead ? <Text className="mb-3 text-sm leading-5 text-[#1A1613]/70">{lead}</Text> : null}
      {children}
    </View>
  );
}

export function Card({ children, dashed = false, testID }: { children: ReactNode; dashed?: boolean; testID?: string }) {
  return (
    <View
      className={`rounded-2xl bg-white p-4 ${dashed ? "border-2 border-dashed" : "border"} border-[#1A1613]/10`}
      testID={testID}
    >
      {children}
    </View>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <Text className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${BADGE_CLASS[tone]}`}>
      {children}
    </Text>
  );
}

export function Progress({
  value,
  max,
  colorClass = "bg-rose-700",
  label,
  valueLabel,
}: {
  value: number;
  max: number;
  colorClass?: string;
  label?: string;
  valueLabel?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <View>
      {(label || valueLabel) && (
        <View className="mb-2 flex-row items-baseline justify-between gap-3">
          {label ? <Text className="text-sm text-[#1A1613]/70">{label}</Text> : <View />}
          {valueLabel ? <Text className="text-sm font-bold tabular-nums text-[#1A1613]">{valueLabel}</Text> : null}
        </View>
      )}
      <View className="h-2 overflow-hidden rounded-full bg-[#DED7C8]">
        <View className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export function EvidenceLink({ href, label = "Ver documento oficial" }: { href: string; label?: string }) {
  return (
    <Text className="mt-1 text-sm font-semibold text-[#C41E3A] underline">
      {label}: {href}
    </Text>
  );
}
