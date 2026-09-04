// VerifyScreen.tsx: shows the verified sealed report — five verdicts plus what the seal does NOT certify.
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { SealedReport, fetchSealedReport, verifySealSignature } from "./sealClient";

const STATUS_LABEL: Record<string, string> = {
  verified: "Verified",
  unverified: "Unverified",
  not_found: "Not found",
};

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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator testID="verify-loading" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12" testID="verify-screen">
      <Text className="text-xl font-bold text-slate-900">Sealed report — folio {report.folio}</Text>
      <Text
        className={signatureValid ? "mt-1 text-emerald-700" : "mt-1 text-red-700"}
        testID="signature-status"
      >
        {signatureValid ? "Signature valid (Ed25519)" : "Signature invalid"}
      </Text>

      <Text className="mt-6 font-semibold text-slate-900">Verdicts</Text>
      {report.verdicts.map((verdict) => (
        <View key={verdict.label} className="mt-2 border-b border-slate-200 pb-2">
          <Text className="text-slate-900">
            {verdict.label} — {STATUS_LABEL[verdict.status]}
          </Text>
          <Text className="text-slate-500 text-sm">{verdict.detail}</Text>
        </View>
      ))}

      <Text className="mt-6 font-semibold text-slate-900">This seal does NOT certify</Text>
      {report.doesNotCertify.map((item) => (
        <Text key={item} className="mt-1 text-slate-600 text-sm">
          • {item}
        </Text>
      ))}
    </ScrollView>
  );
}
