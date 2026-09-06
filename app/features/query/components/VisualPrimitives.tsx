// VisualPrimitives.tsx: React Native equivalents of Creva's small UI surfaces.
// Query and verify compose these pieces to keep the port visual-only and leave app/lib untouched.
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const BADGE_CLASS: Record<Tone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/10 text-warning-text",
  danger: "bg-crimson/10 text-crimson",
  info: "bg-info/10 text-info",
  neutral: "bg-inactive text-text-secondary",
};

// Section parity: creva_finance/frontend/components/ui/Section.tsx + SectionHeader.tsx — the
// header is a space-between row (h2 16px/600 + an optional right-aligned "see all" link styled
// like .btn-quiet: 13px/600 --cr-crimson), 14px above the body. With `lead` the header sits only
// 4px above the lead line.
export function Section({
  title,
  action,
  lead,
  children,
}: {
  title?: string;
  action?: { label: string; onPress: () => void };
  lead?: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-7">
      {title ? (
        <View className={`flex-row items-center justify-between ${lead ? "mb-1" : "mb-[14px]"}`}>
          <Text className="text-base font-semibold text-text">{title}</Text>
          {action ? (
            <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={8}>
              <Text className="text-[13px] font-semibold text-crimson">{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {lead ? <Text className="mb-3 text-sm leading-5 text-text/70">{lead}</Text> : null}
      {children}
    </View>
  );
}

// Card parity: creva_finance/frontend/components/ui/Card.tsx — default radius 16 / padding 16;
// `size` bumps both to match the dashboard's score card (radius 24, padding 24) and metric card
// (radius 20, padding 20). Border is 1px --cr-border (2px dashed when `dashed`).
export function Card({
  children,
  dashed = false,
  size = "sm",
  testID,
}: {
  children: ReactNode;
  dashed?: boolean;
  size?: "sm" | "md" | "lg";
  testID?: string;
}) {
  const sizeClass = size === "lg" ? "rounded-[24px] p-6" : size === "md" ? "rounded-[20px] p-5" : "rounded-2xl p-4";
  return (
    <View
      className={`${sizeClass} bg-surface-1 ${dashed ? "border-2 border-dashed" : "border"} border-border`}
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
