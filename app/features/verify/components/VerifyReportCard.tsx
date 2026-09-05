// VerifyReportCard.tsx: five-verdict report display adapted from creva_finance for mobile.
// It keeps the seal limits visible because the product promise depends on them.
import { Text, View } from "react-native";

import { Badge, Card, Section } from "../../query/components/VisualPrimitives";
import { SealedReport, Verdict } from "../sealClient";

const STATUS_LABEL: Record<Verdict["status"], string> = {
  verified: "Encontrado",
  unverified: "No comprobado",
  not_found: "No encontrado",
};

const STATUS_TONE: Record<Verdict["status"], "success" | "warning" | "danger"> = {
  verified: "success",
  unverified: "warning",
  not_found: "danger",
};

function VerdictRow({ verdict }: { verdict: Verdict }) {
  return (
    <View className="border-b border-slate-100 py-3">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-bold text-slate-950">{verdict.label}</Text>
        <Badge tone={STATUS_TONE[verdict.status]}>{STATUS_LABEL[verdict.status]}</Badge>
      </View>
      <Text className="mt-1 text-sm leading-5 text-slate-500">{verdict.detail}</Text>
    </View>
  );
}

export function VerifyReportCard({
  report,
  signatureValid,
}: {
  report: SealedReport;
  signatureValid: boolean;
}) {
  return (
    <>
      <Section>
        <Card>
          <View className="gap-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase text-slate-400">Reporte Creva</Text>
                <Text className="mt-1 text-2xl font-bold text-slate-950">
                  {signatureValid ? "Reporte auténtico" : "No se puede acreditar"}
                </Text>
              </View>
              <Badge tone={signatureValid ? "success" : "danger"}>
                {signatureValid ? "Ed25519 válido" : "Firma inválida"}
              </Badge>
            </View>
            <Text className="text-sm leading-5 text-slate-600" testID="signature-status">
              {signatureValid
                ? "La firma del sello es válida y el folio puede viajar con el reporte."
                : "La firma no coincide con el sello que recibiste."}
            </Text>
            <View className="rounded-xl bg-slate-50 p-3">
              <Text className="text-xs font-bold uppercase text-slate-400">Folio</Text>
              <Text className="mt-1 text-sm font-semibold tabular-nums text-slate-950">{report.folio}</Text>
            </View>
          </View>
        </Card>
      </Section>

      <Section
        title="Cinco veredictos"
        lead="Cada línea dice qué fuente se pudo sostener y cuál quedó fuera del sello."
      >
        <Card testID="verdict-list">
          {report.verdicts.map((verdict) => (
            <VerdictRow key={verdict.label} verdict={verdict} />
          ))}
        </Card>
      </Section>

      <Section title="Qué este sello NO certifica">
        <Card>
          <View className="gap-2">
            {report.doesNotCertify.map((item) => (
              <View key={item} className="flex-row gap-2">
                <Text className="text-slate-400">•</Text>
                <Text className="flex-1 text-sm leading-5 text-slate-600">{item}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>
    </>
  );
}
