// VerifyScreen.tsx: shows the verified sealed report — five verdicts plus what the seal does NOT certify.
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VerifyReportCard } from "./components/VerifyReportCard";
import { SealedReport, fetchSealedReport, verifySealSignature } from "./sealClient";
import { BackButton } from "../shared/BackButton";

export function VerifyScreen({ folio, onBack }: { folio: string; onBack?: () => void }) {
  const [report, setReport] = useState<SealedReport | null>(null);
  const [signatureValid, setSignatureValid] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [fetchedReport, signature] = await Promise.all([
        fetchSealedReport(folio),
        verifySealSignature(folio),
      ]);
      if (cancelled) return;

      setReport(fetchedReport);
      setSignatureValid(signature.valid);

      if (signature.valid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [folio]);

  if (!report || signatureValid === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg" edges={["top", "bottom"]}>
        <ActivityIndicator testID="verify-loading" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6" testID="verify-screen">
        {onBack ? <BackButton onPress={onBack} /> : null}
        <View className="mb-8">
          <Text className="text-xs font-bold uppercase text-text/60">Verificación pública</Text>
          <Text className="mt-2 text-3xl font-bold text-text">Comprobar un reporte</Text>
          <Text className="mt-2 text-base leading-6 text-text/70">
            Cinco veredictos, un folio legible y los límites de lo que el sello puede acreditar.
          </Text>
        </View>

        <VerifyReportCard report={report} signatureValid={signatureValid} />
      </ScrollView>
    </SafeAreaView>
  );
}
