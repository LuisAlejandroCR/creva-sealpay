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

const VERDICT_LABELS: Record<string, string> = {
  "DOF registry": "Registro DOF",
  "CNBV registry": "Registro CNBV",
  "SAT tax status": "Estado fiscal SAT",
  "Address match": "Coincidencia de domicilio",
  "Beneficial owner": "Beneficiario final",
};

const VERDICT_DETAILS: Record<string, string> = {
  "Business found, active": "Negocio encontrado, activo",
  "No sanctions on record": "Sin sanciones en los registros consultados",
  "Active RFC": "RFC activo",
  "Could not cross-reference": "No se pudo cruzar con otra fuente",
  "Not in queried sources": "No aparece en las fuentes consultadas",
};

const LIMIT_LABELS: Record<string, string> = {
  "Creditworthiness or probability of default": "Solvencia crediticia o probabilidad de incumplimiento",
  "Legal authorization to operate": "Autorización legal para operar",
  "Tax compliance beyond the checked registries": "Cumplimiento fiscal fuera de los registros consultados",
  "Future business performance": "Desempeño futuro del negocio",
};

function VerdictRow({ verdict }: { verdict: Verdict }) {
  return (
    <View className="border-b border-text/10 py-3">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-bold text-text">{VERDICT_LABELS[verdict.label] ?? verdict.label}</Text>
        <Badge tone={STATUS_TONE[verdict.status]}>{STATUS_LABEL[verdict.status]}</Badge>
      </View>
      <Text className="mt-1 text-sm leading-5 text-text/70">
        {VERDICT_DETAILS[verdict.detail] ?? verdict.detail}
      </Text>
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
                <Text className="text-xs font-bold uppercase text-text/60">Reporte Creva</Text>
                <Text className="mt-1 text-2xl font-bold text-text">
                  {signatureValid ? "Reporte auténtico" : "No se puede acreditar"}
                </Text>
              </View>
              <Badge tone={signatureValid ? "success" : "danger"}>
                {signatureValid ? "Ed25519 válido" : "Firma inválida"}
              </Badge>
            </View>
            <Text className="text-sm leading-5 text-text/70" testID="signature-status">
              {signatureValid
                ? "La firma del sello es válida y el folio puede viajar con el reporte."
                : "La firma no coincide con el sello que recibiste."}
            </Text>
            <View className="rounded-xl bg-surface-2 p-3">
              <Text className="text-xs font-bold uppercase text-text/60">Folio</Text>
              <Text className="mt-1 text-sm font-semibold tabular-nums text-text">{report.folio}</Text>
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
                <Text className="text-crimson">•</Text>
                <Text className="flex-1 text-sm leading-5 text-text/70">{LIMIT_LABELS[item] ?? item}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>
    </>
  );
}
