// QueryScreen.tsx: closes the agent loop UI — trigger a paid signal query and watch the 402 -> payment -> response cycle.
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { Card, Progress, Section } from "./components/VisualPrimitives";
import { ReportPreviewCard } from "./components/ReportPreviewCard";
import { ScoreGauge } from "./components/ScoreGauge";
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
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="px-6 pb-10 pt-12">
      <View className="mb-8">
        <Text className="text-xs font-bold uppercase text-slate-400">Creva SealPay</Text>
        <Text className="mt-2 text-3xl font-bold text-slate-950">Paid signal query</Text>
        <Text className="mt-2 text-base leading-6 text-slate-600">
          Query public-business evidence, settle the x402 challenge, then hand over a sealed report.
        </Text>
      </View>

      <Section>
        <Card>
          <View className="gap-5">
            <ScoreGauge value={phase === "paid" ? 82 : phase === "idle" ? 0 : 41} max={100} band={phase === "paid" ? "success" : "warning"} />
            <Progress
              value={phase === "idle" ? 1 : phase === "payment_required" ? 2 : phase === "paying" ? 3 : 4}
              max={4}
              label="402 -> payment -> response"
              valueLabel={`${phase === "paid" ? 4 : phase === "paying" ? 3 : phase === "payment_required" ? 2 : 1}/4`}
              colorClass={phase === "paid" ? "bg-emerald-600" : "bg-amber-500"}
            />
          </View>
        </Card>
      </Section>

      {phase === "idle" && (
        <Section title="Consulta">
          <Card dashed>
            <View className="gap-4">
              <Text className="text-base font-bold text-slate-950">Panaderia La Espiga</Text>
              <Text className="text-sm leading-5 text-slate-600">
                The first request should return the payment requirement instead of a report.
              </Text>
              <Pressable className="rounded-xl bg-slate-950 px-5 py-3" onPress={triggerQuery} testID="trigger-query">
                <Text className="text-center font-semibold text-white">Query business signals</Text>
              </Pressable>
            </View>
          </Card>
        </Section>
      )}

      {phase === "payment_required" && pendingPayment && (
        <Section title="Payment required" lead="The challenge is explicit, priced and tied to the report endpoint.">
          <Card testID="payment-required">
            <View className="gap-4">
              <View className="rounded-xl bg-amber-50 p-3">
                <Text className="font-bold text-amber-800">402 Payment Required</Text>
                <Text className="mt-1 text-sm leading-5 text-amber-700">
                  {pendingPayment.accepts[0].maxAmountRequired} {pendingPayment.accepts[0].asset} on{" "}
                  {pendingPayment.accepts[0].network}
                </Text>
              </View>
              <Text className="text-sm leading-5 text-slate-600">{pendingPayment.accepts[0].description}</Text>
              <Pressable className="rounded-xl bg-emerald-700 px-5 py-3" onPress={pay} testID="pay-button">
                <Text className="text-center font-semibold text-white">Pay and continue</Text>
              </Pressable>
            </View>
          </Card>
        </Section>
      )}

      {phase === "paying" && (
        <Section title="Settling">
          <Card>
            <View className="items-center gap-3 py-3">
              <ActivityIndicator testID="paying-spinner" />
              <Text className="text-sm text-slate-500">Waiting for the paid response...</Text>
            </View>
          </Card>
        </Section>
      )}

      {phase === "paid" && result?.status === 200 && (
        <Section title="Reporte sellado" lead="The receiver can verify the seal without opening an account.">
          <ReportPreviewCard result={result} />
          <Pressable className="mt-4 rounded-xl bg-slate-950 px-5 py-3" onPress={onVerify}>
            <Text className="text-center font-semibold text-white">View sealed report</Text>
          </Pressable>
        </Section>
      )}
    </ScrollView>
  );
}
