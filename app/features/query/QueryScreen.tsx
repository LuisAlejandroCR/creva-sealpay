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
    <ScrollView className="flex-1 bg-[#F6F1E7]" contentContainerClassName="px-6 pb-10 pt-12">
      <View className="mb-8">
        <Text className="text-xs font-bold uppercase text-[#1A1613]/60">Creva SealPay</Text>
        <Text className="mt-2 text-3xl font-bold text-[#1A1613]">Consulta pagada</Text>
        <Text className="mt-2 text-base leading-6 text-[#1A1613]/70">
          Consulta señales públicas del negocio, liquida el reto x402 y entrega un reporte sellado.
        </Text>
      </View>

      <Section>
        <Card>
          <View className="gap-5">
            <ScoreGauge value={phase === "paid" ? 82 : phase === "idle" ? 0 : 41} max={100} band={phase === "paid" ? "success" : "warning"} />
            <Progress
              value={phase === "idle" ? 1 : phase === "payment_required" ? 2 : phase === "paying" ? 3 : 4}
              max={4}
              label="402 -> pago -> respuesta"
              valueLabel={`${phase === "paid" ? 4 : phase === "paying" ? 3 : phase === "payment_required" ? 2 : 1}/4`}
              colorClass={phase === "paid" ? "bg-[#2E6A48]" : "bg-[#C41E3A]"}
            />
          </View>
        </Card>
      </Section>

      {phase === "idle" && (
        <Section title="Consulta">
          <Card dashed>
            <View className="gap-4">
              <Text className="text-base font-bold text-[#1A1613]">Panadería La Espiga</Text>
              <Text className="text-sm leading-5 text-[#1A1613]/70">
                La primera petición devuelve el requisito de pago antes de liberar el reporte.
              </Text>
              <Pressable className="rounded-xl bg-[#C41E3A] px-5 py-3" onPress={triggerQuery} testID="trigger-query">
                <Text className="text-center font-semibold text-white">Consultar señales del negocio</Text>
              </Pressable>
            </View>
          </Card>
        </Section>
      )}

      {phase === "payment_required" && pendingPayment && (
        <Section title="Pago requerido" lead="El reto es explícito, tiene precio y queda ligado al endpoint del reporte.">
          <Card testID="payment-required">
            <View className="gap-4">
              <View className="rounded-xl bg-[#E8A020]/10 p-3">
                <Text className="font-bold text-[#8A5A00]">402 Pago requerido</Text>
                <Text className="mt-1 text-sm leading-5 text-[#8A5A00]">
                  {pendingPayment.accepts[0].maxAmountRequired} {pendingPayment.accepts[0].asset} en{" "}
                  {pendingPayment.accepts[0].network}
                </Text>
              </View>
              <Text className="text-sm leading-5 text-[#1A1613]/70">Reporte de señales Creva</Text>
              <Pressable className="rounded-xl bg-[#C41E3A] px-5 py-3" onPress={pay} testID="pay-button">
                <Text className="text-center font-semibold text-white">Pagar y continuar</Text>
              </Pressable>
            </View>
          </Card>
        </Section>
      )}

      {phase === "paying" && (
        <Section title="Liquidando">
          <Card>
            <View className="items-center gap-3 py-3">
              <ActivityIndicator testID="paying-spinner" />
              <Text className="text-sm text-[#1A1613]/70">Esperando la respuesta pagada...</Text>
            </View>
          </Card>
        </Section>
      )}

      {phase === "paid" && result?.status === 200 && (
        <Section title="Reporte sellado" lead="Quien lo recibe puede verificar el sello sin abrir una cuenta.">
          <ReportPreviewCard result={result} />
          <Pressable className="mt-4 rounded-xl bg-[#C41E3A] px-5 py-3" onPress={onVerify}>
            <Text className="text-center font-semibold text-white">Ver reporte sellado</Text>
          </Pressable>
        </Section>
      )}
    </ScrollView>
  );
}
