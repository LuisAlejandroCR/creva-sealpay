// CollateralScreen.tsx: mobile port of creva_finance's app/collateral/page.tsx — the SPEI deposit
// CLABE and how much of the collateral backs the card limit. No KYC gate wrapper (mobile has no
// KycGate component); the CLABE is handed over via the native Share sheet instead of a clipboard copy.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { collateral } from "../../lib/api";
import { formatMoney } from "../../lib/format-money";
import { BackButton } from "../shared/BackButton";
import { Card } from "../query/components/VisualPrimitives";

export interface CollateralScreenProps {
  onBack: () => void;
}

type CollateralData = Awaited<ReturnType<typeof collateral.get>>;

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  pending_authorization: "Pendiente de autorización",
  pending_identity: "Verificación en proceso",
  inactive: "Inactivo",
};

function formatClabe(clabe: string): string {
  return clabe.replace(/(\d{3})(\d{3})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4 $5");
}

function Metric({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <View className="gap-1">
      <Text className="text-xs font-semibold uppercase text-text/50">{label}</Text>
      <Text className="text-xl font-bold text-text">{value}</Text>
      {caption ? <Text className="text-xs text-text/50">{caption}</Text> : null}
    </View>
  );
}

export function CollateralScreen({ onBack }: CollateralScreenProps) {
  const [data, setData] = useState<CollateralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setData(await collateral.get());
    } catch {
      setErrorMsg("No se pudo cargar la información de tu garantía");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isActive = data?.status === "active";
  const statusLabel = data ? STATUS_LABELS[data.status] ?? data.status : "—";

  async function shareClabe() {
    if (!data?.deposit_account) return;
    try {
      await Share.share({ message: data.deposit_account });
    } catch {
      // Share sheet dismissed or unavailable — nothing to recover from here.
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="collateral-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Tu garantía</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">Tu respaldo para el límite de la tarjeta</Text>

        {errorMsg ? (
          <View className="mb-5 rounded-2xl border border-danger-border bg-danger-bg p-4" testID="collateral-error">
            <Text className="text-sm text-crimson">{errorMsg}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View className="items-center py-6" testID="collateral-loading">
            <ActivityIndicator />
          </View>
        ) : data ? (
          <View className="gap-4">
            <Card>
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold uppercase text-text/50">Estado de tu garantía</Text>
                  <Text className={`text-xs font-bold ${isActive ? "text-success-text" : "text-warning-text"}`}>
                    ● {statusLabel}
                  </Text>
                </View>
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Metric label="Monto confirmado" value={formatMoney(data.confirmed_amount) || "—"} />
                  </View>
                  <View className="flex-1">
                    <Metric label="Pendiente" value={formatMoney(data.pending_amount) || "—"} />
                  </View>
                </View>
              </View>
            </Card>

            <Card tone="highlight">
              <Metric
                label="Capacidad de gasto"
                value={formatMoney(data.spendingCapacity) || "—"}
                caption="Límite disponible en tu tarjeta"
              />
            </Card>

            {data.deposit_account ? (
              <Card testID="collateral-clabe">
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-text">Cuenta CLABE para depósito</Text>
                    <Pressable onPress={shareClabe} testID="collateral-share-cta">
                      <Text className="text-sm font-semibold text-crimson">Compartir</Text>
                    </Pressable>
                  </View>

                  <Text className="text-lg font-bold tracking-wider text-text">
                    {formatClabe(data.deposit_account)}
                  </Text>

                  <View className="gap-2">
                    {[
                      ["Método", "Transferencia SPEI"],
                      ["Moneda", "MXN (Pesos mexicanos)"],
                      ["Tiempo", "Minutos (SPEI inmediato)"],
                    ].map(([term, description]) => (
                      <View key={term} className="flex-row justify-between border-b border-text/5 pb-2">
                        <Text className="text-sm text-text/60">{term}</Text>
                        <Text className="text-sm font-semibold text-text">{description}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="rounded-xl border border-warning-border bg-warning-bg p-3">
                    <Text className="text-sm leading-5 text-text/70">
                      Deposita pesos mexicanos (MXN) vía SPEI a esta CLABE. Tu depósito se refleja en
                      minutos y aumenta el límite de tu tarjeta.
                    </Text>
                  </View>
                </View>
              </Card>
            ) : (
              <Card testID="collateral-empty">
                <View className="gap-3">
                  <Text className="text-sm font-bold text-text">Activa tu cuenta de depósito</Text>
                  <Text className="text-sm leading-5 text-text/70">
                    Completa la verificación para recibir tu CLABE exclusiva donde podrás depositar y
                    aumentar tu límite.
                  </Text>
                  {data.authorization_url ? (
                    <Pressable
                      className="rounded-xl bg-crimson px-5 py-3"
                      onPress={() => data.authorization_url && Linking.openURL(data.authorization_url)}
                      testID="collateral-authorize-cta"
                    >
                      <Text className="text-center font-semibold text-white">Completar verificación</Text>
                    </Pressable>
                  ) : (
                    <Text className="text-xs leading-4 text-text/50">
                      Inicia la verificación de identidad desde el inicio de la app para recibir tu
                      CLABE.
                    </Text>
                  )}
                </View>
              </Card>
            )}

            <Pressable onPress={load} testID="collateral-refresh-cta">
              <Text className="text-center text-sm font-semibold text-text/60">Actualizar estado</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
