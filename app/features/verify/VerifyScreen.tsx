// VerifyScreen.tsx: shows the verified sealed report — five verdicts plus what the seal does NOT certify.
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { VerifyReportCard } from "./components/VerifyReportCard";
import { SealedReport, fetchSealedReport, verifySealSignature } from "./sealClient";

export function VerifyScreen({ folio }: { folio: string }) {
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
      <View className="flex-1 items-center justify-center bg-[#F6F1E7]">
        <ActivityIndicator testID="verify-loading" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F6F1E7]" contentContainerClassName="px-6 pb-10 pt-12" testID="verify-screen">
      <View className="mb-8">
        <Text className="text-xs font-bold uppercase text-[#1A1613]/60">Verificación pública</Text>
        <Text className="mt-2 text-3xl font-bold text-[#1A1613]">Comprobar un reporte</Text>
        <Text className="mt-2 text-base leading-6 text-[#1A1613]/70">
          Cinco veredictos, un folio legible y los límites de lo que el sello puede acreditar.
        </Text>
      </View>

      <VerifyReportCard report={report} signatureValid={signatureValid} />
    </ScrollView>
  );
}
