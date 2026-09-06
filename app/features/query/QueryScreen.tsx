// QueryScreen.tsx: closes the agent loop UI — trigger a paid signal query against the real
// x402-gated gateway route and watch the 402 -> payment -> response cycle. "Pagar y continuar"
// signs a real X-PAYMENT header with the demo-scoped testnet signer (hederaPayment.ts) and
// retries the gateway with it; without EXPO_PUBLIC_HEDERA_DEMO_* configured it surfaces that
// real gap instead of a fabricated paid report.
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Progress, Section } from "./components/VisualPrimitives";
import { ReportPreviewCard } from "./components/ReportPreviewCard";
import { PaymentRequired, QueryResult, requestSignal } from "./gatewayClient";
import { buildSignedPaymentHeader, readDemoCredentialsFromEnv } from "./hederaPayment";
import { STATE_OPTIONS, buildSignalInput, isValidBusinessName } from "./business-input";
import { SelectField, TextField } from "../profile/components/FormField";
import { profiles } from "../../lib/api";
import { BackButton } from "../shared/BackButton";

type Phase = "idle" | "loading" | "payment_required" | "paying" | "paid" | "error";

export function QueryScreen({ onVerify, onBack }: { onVerify: (result: QueryResult) => void; onBack?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pendingPayment, setPendingPayment] = useState<PaymentRequired | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The query is "verify THIS business" — the name and state come from the user, prefilled from
  // the fiscal profile the same way business-verification/page.tsx does (page.tsx:63-72).
  const [businessName, setBusinessName] = useState("");
  const [stateCode, setStateCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    profiles
      .getFiscal()
      .then((fiscal) => {
        if (cancelled || !fiscal) return;
        setBusinessName((current) => current || fiscal.businessName || "");
        setStateCode((current) => current || (fiscal.stateCode === null ? "" : String(fiscal.stateCode)));
      })
      .catch(() => {
        /* manual entry is the fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signalInput = () => buildSignalInput(businessName, stateCode);

  async function triggerQuery() {
    setPhase("loading");
    setErrorMessage(null);
    try {
      const res = await requestSignal(signalInput());
      if (res.status === 402) {
        setPendingPayment(res);
        setPhase("payment_required");
        return;
      }
      setResult(res);
      setPhase("paid");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "No se pudo consultar el reporte.");
      setPhase("error");
    }
  }

  async function pay() {
    if (!pendingPayment) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("paying");
    setErrorMessage(null);
    try {
      const credentials = readDemoCredentialsFromEnv();
      if (!credentials) {
        setErrorMessage("No hay una billetera Hedera de demo configurada (EXPO_PUBLIC_HEDERA_DEMO_*).");
        setPhase("payment_required");
        return;
      }
      const paymentHeader = await buildSignedPaymentHeader(pendingPayment.accepts[0], credentials);
      const res = await requestSignal(signalInput(), paymentHeader);
      if (res.status === 402) {
        setPendingPayment(res);
        setErrorMessage(res.error ?? "El gateway rechazó el pago.");
        setPhase("payment_required");
        return;
      }
      setResult(res);
      setPhase("paid");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "No se pudo liquidar el pago.");
      setPhase("error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
      {onBack ? <BackButton onPress={onBack} /> : null}
      <View className="mb-8">
        <Text className="text-xs font-bold uppercase text-text/60">Creva</Text>
        <Text className="mt-2 text-3xl font-bold text-text">Consulta pagada</Text>
        <Text className="mt-2 text-base leading-6 text-text/70">
          Consulta señales públicas del negocio, liquida el reto x402 y entrega un reporte sellado.
        </Text>
      </View>

      <Section>
        <Card>
          <View className="gap-5">
            <Progress
              value={phase === "idle" ? 1 : phase === "payment_required" ? 2 : phase === "paying" || phase === "loading" ? 3 : phase === "paid" ? 4 : 1}
              max={4}
              label="402 -> pago -> respuesta"
              valueLabel={`${phase === "paid" ? 4 : phase === "paying" ? 3 : phase === "payment_required" ? 2 : 1}/4`}
              colorClass={phase === "paid" ? "bg-success" : phase === "error" ? "bg-crimson" : "bg-crimson"}
            />
          </View>
        </Card>
      </Section>

      {phase === "idle" && (
        <Section title="Consulta">
          <Card dashed>
            <View className="gap-4">
              <TextField
                label="Nombre de tu negocio"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Como aparece en tu registro"
                testID="business-name-input"
              />
              <SelectField
                label="Estado"
                value={stateCode}
                options={STATE_OPTIONS}
                onChange={setStateCode}
                placeholder="Selecciona tu estado"
                testID="business-state-select"
              />
              <Text className="text-xs leading-4 text-text/50">
                Sin estado, un nombre común devuelve miles de coincidencias y no se emite ningún
                sello. La primera petición devuelve el requisito de pago antes de liberar el reporte.
              </Text>
              <Pressable
                className={`rounded-xl bg-crimson px-5 py-3 ${isValidBusinessName(businessName) ? "" : "opacity-50"}`}
                disabled={!isValidBusinessName(businessName)}
                onPress={triggerQuery}
                testID="trigger-query"
              >
                <Text className="text-center font-semibold text-white">Consultar señales del negocio</Text>
              </Pressable>
            </View>
          </Card>
        </Section>
      )}

      {phase === "loading" && (
        <Section title="Consultando">
          <Card>
            <View className="items-center gap-3 py-3">
              <ActivityIndicator testID="query-loading" />
              <Text className="text-sm text-text/70">Consultando el gateway...</Text>
            </View>
          </Card>
        </Section>
      )}

      {phase === "payment_required" && pendingPayment && (
        <Section title="Pago requerido" lead="El reto es explícito, tiene precio y queda ligado al endpoint del reporte.">
          <Card testID="payment-required">
            <View className="gap-4">
              <View className="rounded-xl bg-warning/10 p-3">
                <Text className="font-bold text-warning-text">402 Pago requerido</Text>
                <Text className="mt-1 text-sm leading-5 text-warning-text">
                  {pendingPayment.accepts[0].maxAmountRequired} {pendingPayment.accepts[0].asset} en{" "}
                  {pendingPayment.accepts[0].network}
                </Text>
              </View>
              <Text className="text-sm leading-5 text-text/70">Reporte de señales Creva</Text>
              {errorMessage ? (
                <Text className="text-sm leading-5 text-crimson" testID="payment-error">
                  {errorMessage}
                </Text>
              ) : null}
              <Pressable className="rounded-xl bg-crimson px-5 py-3" onPress={pay} testID="pay-button">
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
              <Text className="text-sm text-text/70">Esperando la respuesta pagada...</Text>
            </View>
          </Card>
        </Section>
      )}

      {phase === "error" && (
        <Section title="No se pudo completar">
          <Card testID="query-error">
            <Text className="text-sm leading-5 text-crimson">{errorMessage ?? "Ocurrió un error inesperado."}</Text>
            <Pressable className="mt-4 rounded-xl bg-crimson px-5 py-3" onPress={triggerQuery}>
              <Text className="text-center font-semibold text-white">Reintentar</Text>
            </Pressable>
          </Card>
        </Section>
      )}

      {phase === "paid" && result?.status === 200 && (
        <Section title="Reporte sellado" lead="Quien lo recibe puede verificar el sello sin abrir una cuenta.">
          <ReportPreviewCard result={result} />
          <Pressable className="mt-4 rounded-xl bg-crimson px-5 py-3" onPress={() => onVerify(result)}>
            <Text className="text-center font-semibold text-white">Ver reporte sellado</Text>
          </Pressable>
        </Section>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}
