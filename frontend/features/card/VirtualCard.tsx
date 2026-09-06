// VirtualCard.tsx: the Creva card face — brand, masked number, holder, expiry, live or frozen.
// Native equivalent of creva_finance/frontend/components/VirtualCard.tsx (a CSS-gradient div);
// the gradient is flattened to the bg-crimson token since NativeWind has no linear-gradient.
import { Text, View } from "react-native";

export interface VirtualCardProps {
  masked?: string;
  cardHolder?: string;
  expiry?: string;
  frozen?: boolean;
}

export function VirtualCard({
  masked = "••••",
  cardHolder = "Tarjeta Creva",
  expiry = "08/28",
  frozen = false,
}: VirtualCardProps) {
  return (
    <View
      className={`h-48 w-full justify-between overflow-hidden rounded-2xl p-6 ${
        frozen ? "bg-text/70" : "bg-crimson"
      }`}
      testID="virtual-card"
    >
      <View className="flex-row items-start justify-between">
        <Text className="text-2xl font-bold tracking-wide text-white">creva</Text>
        <Text className="text-2xl font-black italic text-white">VISA</Text>
      </View>

      {frozen ? (
        <Text className="text-center text-xs font-semibold uppercase tracking-widest text-white/85">
          Congelada
        </Text>
      ) : null}

      <View>
        <Text className="mb-2 text-base tracking-[4px] text-white">•••• •••• •••• {masked}</Text>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-[9px] uppercase tracking-wider text-white/80">Titular</Text>
            <Text className="text-sm font-medium text-white">{cardHolder}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] uppercase tracking-wider text-white/80">Vence</Text>
            <Text className="text-sm font-medium text-white">{expiry}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
