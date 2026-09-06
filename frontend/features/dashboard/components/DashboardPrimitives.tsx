// DashboardPrimitives.tsx: dashboard-only visual pieces ported from creva_finance's
// dashboard page (notification bell, metric tile, action card) — kept local because
// nothing else in app/features/ needs them yet.
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Icon, type IconName } from "../../shared/icons/Icon";

// NotificationBell parity: creva_finance/frontend/app/dashboard/page.tsx:26-55 — 44×44, radius 14,
// 1px --cr-border, bell stroke --cr-text-muted, badge 11px/700 white with 2px --cr-bg ring.
export function NotificationBell({ pending, onPress }: { pending: number; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={pending > 0 ? `Avisos — ${pending} pendientes` : "Avisos"}
      className="relative h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-surface-1"
      testID="notification-bell"
    >
      <Icon name="bell" size={20} color="text-muted" />
      {pending > 0 && (
        <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-bg bg-crimson px-1">
          <Text className="text-[11px] font-bold text-white">{pending}</Text>
        </View>
      )}
    </Pressable>
  );
}

// PrimaryButton parity: creva_finance/frontend/app/globals.css .btn-primary (line 351) — full
// width, min-height 52, radius 14, 16px/600 --cr-on-brand. The web fill is --cr-gradient
// (linear-gradient 135deg #D62E52→#9E1329); RN has no gradient primitive wired, so this uses the
// solid --cr-crimson (#C41E3A, between the two stops) as an approximation.
export function PrimaryButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      className="min-h-[52px] items-center justify-center rounded-[14px] bg-crimson px-4"
    >
      <Text className="text-base font-semibold text-white">{label}</Text>
    </Pressable>
  );
}

// Metric parity: creva_finance/frontend/components/ui/Metric.tsx — label 12px uppercase 0.08em
// --cr-text-subtle (mb 6); unit sits BEFORE the value, top-aligned, 12px --cr-text-muted; value
// 26px/700 (size md); caption 13px --cr-text-muted (mt 10).
export function Metric({
  label,
  value,
  unit,
  caption,
}: {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
}) {
  return (
    <View>
      <Text className="mb-1.5 text-xs uppercase tracking-[0.08em] text-text-subtle">{label}</Text>
      <View className="flex-row items-baseline gap-2">
        {unit ? <Text className="mt-2.5 self-start text-xs text-text-muted">{unit}</Text> : null}
        <Text className="text-[26px] font-bold leading-[1.1] tabular-nums text-text">{value}</Text>
      </View>
      {caption ? <Text className="mt-2.5 text-[13px] leading-[1.5] text-text-muted">{caption}</Text> : null}
    </View>
  );
}

// ActionCard parity: creva_finance/frontend/components/ui/ActionCard.tsx — a whole card that is
// one link: optional 46×46 icon box, title, one body line, a trailing chevron (never a "cta"
// text). `brand` carries white copy on --cr-gradient (radius 22, padding 20); other tones sit on
// --cr-surface-1 (radius 16, padding 18/20) with a crimson title. The brand fill is the solid
// --cr-crimson here (no RN gradient primitive wired).
export function ActionCard({
  title,
  body,
  icon,
  tone = "brand",
  dashed = false,
  onPress,
  testID,
}: {
  title: string;
  body: string;
  icon?: IconName;
  tone?: "brand" | "warning" | "danger" | "dashed";
  dashed?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const isBrand = tone === "brand";
  const surfaceClass = isBrand
    ? "rounded-[22px] bg-crimson p-5"
    : tone === "warning"
      ? "rounded-2xl border-[1.5px] border-warning-border bg-surface-1 px-5 py-[18px]"
      : dashed
        ? "rounded-2xl border-2 border-dashed border-border bg-surface-1 px-5 py-[18px]"
        : "rounded-2xl border-[1.5px] border-danger-border bg-surface-1 px-5 py-[18px]";

  const titleClass = isBrand ? "text-white" : tone === "warning" ? "text-warning-text" : "text-crimson";
  const bodyClass = isBrand ? "text-white" : "text-text-muted";
  const iconColor: "white" | "crimson" = isBrand ? "white" : "crimson";

  return (
    <Pressable onPress={onPress} testID={testID} className={surfaceClass}>
      <View className="flex-row items-center gap-[14px]">
        {icon ? (
          <View
            className={`h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[14px] ${
              isBrand ? "bg-white/20" : "bg-danger-bg"
            }`}
          >
            <Icon name={icon} size={22} color={iconColor} />
          </View>
        ) : null}
        <View className="min-w-0 flex-1 gap-1">
          <Text className={`text-base font-bold tracking-[-0.01em] ${titleClass}`}>{title}</Text>
          <Text className={`text-[13px] leading-[1.5] ${bodyClass}`}>{body}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={isBrand ? "white" : "text-subtle"} />
      </View>
    </Pressable>
  );
}

// EmptyState parity: creva_finance/frontend/components/ui/EmptyState.tsx (compact) — plain centred
// text, no border or surface: title .cr-title 18px/600, body 14px --cr-text-muted, max-width 300.
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View className="items-center gap-2 px-5 py-7">
      <Text className="text-lg font-semibold text-text">{title}</Text>
      <Text className="max-w-[300px] text-center text-sm leading-[1.6] text-text-muted">{body}</Text>
    </View>
  );
}

export function TransactionRow({
  merchant,
  meta,
  amount,
  isCharge,
}: {
  merchant: string;
  meta: string;
  amount: string;
  isCharge: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-text/5 py-3">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-text">{merchant}</Text>
        <Text className="text-xs text-text/50">{meta}</Text>
      </View>
      <Text className={`text-sm font-bold tabular-nums ${isCharge ? "text-crimson" : "text-success"}`}>
        {isCharge ? "-" : "+"}
        {amount}
      </Text>
    </View>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View className="gap-3">{children}</View>;
}
