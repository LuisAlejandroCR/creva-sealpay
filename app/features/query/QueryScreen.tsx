// QueryScreen.tsx: closes the agent loop UI — trigger a paid signal query and watch the 402 -> payment -> response cycle.
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { PaymentRequired, QueryResult, requestSignal } from "./gatewayClient";

type Phase = "idle" | "payment_required" | "paying" | "paid";

export function QueryScreen({ onVerify }: { onVerify: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pendingPayment, setPendingPayment] = useState<PaymentRequired | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  async function triggerQuery() {
    const res = await requestSignal("Panaderia La Espiga");
    if (res.status === 402) {
      setPendingPayment(res);
      setPhase("payment_required");
    }
  }

  async function pay() {
    if (!pendingPayment) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("paying");
    const res = await requestSignal("Panaderia La Espiga", pendingPayment);
    setResult(res);
    setPhase("paid");
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
      <Text className="text-xl font-bold text-slate-900">Paid signal query</Text>

      {phase === "idle" && (
        <Pressable
          className="rounded-lg bg-slate-900 px-6 py-3"
          onPress={triggerQuery}
          testID="trigger-query"
        >
          <Text className="font-semibold text-white">Query business signals</Text>
        </Pressable>
      )}

      {phase === "payment_required" && pendingPayment && (
        <View className="items-center gap-3">
          <Text className="text-amber-700" testID="payment-required">
            402 Payment Required — {pendingPayment.accepts[0].maxAmountRequired}{" "}
            {pendingPayment.accepts[0].asset} on {pendingPayment.accepts[0].network}
          </Text>
          <Pressable className="rounded-lg bg-emerald-700 px-6 py-3" onPress={pay} testID="pay-button">
            <Text className="font-semibold text-white">Pay and continue</Text>
          </Pressable>
        </View>
      )}

      {phase === "paying" && <ActivityIndicator testID="paying-spinner" />}

      {phase === "paid" && result?.status === 200 && (
        <View className="items-center gap-2" testID="query-result">
          <Text className="text-slate-900">{String(result.signal.businessName)}</Text>
          <Text className="text-slate-600">{String(result.signal.signalsFound)} signals found</Text>
          <Text className="text-slate-500 text-xs">tx {result.settlement.transaction}</Text>
          <Pressable className="mt-4 rounded-lg bg-slate-900 px-6 py-3" onPress={onVerify}>
            <Text className="font-semibold text-white">View sealed report</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
