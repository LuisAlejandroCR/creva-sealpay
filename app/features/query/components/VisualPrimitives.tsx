// VisualPrimitives.tsx: React Native equivalents of Creva's small UI surfaces.
// Query and verify compose these pieces to keep the port visual-only and leave app/lib untouched.
import { ReactNode } from "react";
import { Text, View } from "react-native";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const BADGE_CLASS: Record<Tone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/10 text-warning-text",
  danger: "bg-crimson/10 text-crimson",
  info: "bg-info/10 text-info",
  neutral: "bg-inactive text-text-secondary",
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
      {title ? <Text className="mb-1 text-base font-semibold text-text">{title}</Text> : null}
      {lead ? <Text className="mb-3 text-sm leading-5 text-text/70">{lead}</Text> : null}
      {children}
    </View>
  );
}

export function Card({
  children,
  dashed = false,
  tone = "default",
  testID,
}: {
  children: ReactNode;
  dashed?: boolean;
  tone?: "default" | "highlight";
  testID?: string;
}) {
  return (
    <View
      className={`rounded-2xl p-4 ${tone === "highlight" ? "bg-surface-2" : "bg-surface-1"} ${dashed ? "border-2 border-dashed" : "border"} border-text/10`}
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
          {label ? <Text className="text-sm text-text/70">{label}</Text> : <View />}
          {valueLabel ? <Text className="text-sm font-bold tabular-nums text-text">{valueLabel}</Text> : null}
        </View>
      )}
      <View className="h-2 overflow-hidden rounded-full bg-inactive">
        <View className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export function EvidenceLink({ href, label = "Ver documento oficial" }: { href: string; label?: string }) {
  return (
    <Text className="mt-1 text-sm font-semibold text-crimson underline">
      {label}: {href}
    </Text>
  );
}
