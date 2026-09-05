// DashboardPrimitives.tsx: dashboard-only visual pieces ported from creva_finance's
// dashboard page (notification bell, metric tile, action card) — kept local because
// nothing else in app/features/ needs them yet.
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export function NotificationBell({ pending, onPress }: { pending: number; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={pending > 0 ? `Avisos — ${pending} pendientes` : "Avisos"}
      className="relative h-11 w-11 items-center justify-center rounded-2xl border border-[#1A1613]/10 bg-white"
      testID="notification-bell"
    >
      <Text className="text-lg">🔔</Text>
      {pending > 0 && (
        <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[#F6F1E7] bg-[#C41E3A] px-1">
          <Text className="text-[11px] font-bold text-white">{pending}</Text>
        </View>
      )}
    </Pressable>
  );
}

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
    <View className="gap-1">
      <Text className="text-sm text-[#1A1613]/60">{label}</Text>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-3xl font-bold tabular-nums text-[#1A1613]">{value}</Text>
        {unit ? <Text className="text-sm font-semibold text-[#1A1613]/50">{unit}</Text> : null}
      </View>
      {caption ? <Text className="text-xs leading-4 text-[#1A1613]/50">{caption}</Text> : null}
    </View>
  );
}

export function ActionCard({
  title,
  body,
  cta,
  tone = "brand",
  dashed = false,
  onPress,
  testID,
}: {
  title: string;
  body: string;
  cta?: string;
  tone?: "brand" | "warning" | "danger" | "dashed";
  dashed?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const toneClass =
    tone === "warning"
      ? "bg-[#E8A020]/10 border-[#E8A020]/30"
      : tone === "danger"
        ? "bg-[#C41E3A]/10 border-[#C41E3A]/30"
        : tone === "dashed"
          ? "bg-white border-[#1A1613]/15"
          : "bg-[#1A1613] border-[#1A1613]";

  const titleClass = tone === "brand" ? "text-white" : "text-[#1A1613]";
  const bodyClass = tone === "brand" ? "text-white/70" : "text-[#1A1613]/70";

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className={`rounded-2xl border p-4 ${dashed ? "border-2 border-dashed" : ""} ${toneClass}`}
    >
      <View className="gap-2">
        <Text className={`text-base font-bold ${titleClass}`}>{title}</Text>
        <Text className={`text-sm leading-5 ${bodyClass}`}>{body}</Text>
        {cta ? <Text className={`mt-1 text-sm font-semibold ${titleClass}`}>{cta} →</Text> : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View className="items-center gap-1 rounded-2xl border border-dashed border-[#1A1613]/15 bg-white p-6">
      <Text className="text-sm font-semibold text-[#1A1613]">{title}</Text>
      <Text className="text-center text-xs leading-4 text-[#1A1613]/60">{body}</Text>
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
    <View className="flex-row items-center justify-between border-b border-[#1A1613]/5 py-3">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-[#1A1613]">{merchant}</Text>
        <Text className="text-xs text-[#1A1613]/50">{meta}</Text>
      </View>
      <Text className={`text-sm font-bold tabular-nums ${isCharge ? "text-[#C41E3A]" : "text-[#2E6A48]"}`}>
        {isCharge ? "-" : "+"}
        {amount}
      </Text>
    </View>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View className="gap-3">{children}</View>;
}
