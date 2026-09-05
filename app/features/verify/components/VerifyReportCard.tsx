// VerifyReportCard.tsx: renders the real CertificateVerification returned by
// POST /creva-score/verify (frontend/lib/api.ts:711-718: content/signature verdicts, digests,
// folio) plus the "what this seal does NOT certify" block from the sealed report itself
// (certificate.does_not_prove + report.disclosure.does_not_estimate, mirrored from
// frontend/components/report/ReportPaper.tsx:18/108-115). No five-verdict shape is invented here —
// the real gateway only ever answers with one content verdict and one signature verdict.
import { Text, View } from "react-native";

import { Badge, Card, Section } from "../../query/components/VisualPrimitives";
import type { CertificateVerification, SealedReport } from "../../../lib/api";

const CONTENT_LABEL: Record<CertificateVerification["content"], string> = {
  intact: "Contenido íntegro",
  altered: "Contenido alterado",
};

const SIGNATURE_LABEL: Record<CertificateVerification["signature"], string> = {
  valid: "Firma válida",
  invalid: "Firma inválida",
  missing: "Sin firma",
  unsigned: "No firmado",
  no_key: "Llave no disponible",
};

const SIGNATURE_TONE: Record<CertificateVerification["signature"], "success" | "warning" | "danger"> = {
  valid: "success",
  invalid: "danger",
  missing: "warning",
  unsigned: "warning",
  no_key: "warning",
};

export function VerifyReportCard({
  verification,
  sealed,
}: {
  verification: CertificateVerification;
  sealed: SealedReport;
}) {
  const contentOk = verification.content === "intact";
  const limits = [...sealed.certificate.does_not_prove, ...sealed.report.disclosure.does_not_estimate];

  return (
    <>
      <Section>
        <Card>
          <View className="gap-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase text-text/60">Reporte Creva</Text>
                <Text className="mt-1 text-2xl font-bold text-text">
                  {contentOk ? "Reporte auténtico" : "No se puede acreditar"}
                </Text>
              </View>
              <Badge tone={contentOk ? "success" : "danger"}>{CONTENT_LABEL[verification.content]}</Badge>
            </View>
            <View className="rounded-xl bg-surface-2 p-3">
              <Text className="text-xs font-bold uppercase text-text/60">Folio</Text>
              <Text className="mt-1 text-sm font-semibold tabular-nums text-text">{verification.folio}</Text>
            </View>
          </View>
        </Card>
      </Section>

      <Section
        title="Veredictos"
        lead="Uno cubre el contenido del reporte, el otro la firma que lo sella."
      >
        <Card testID="verdict-list">
          <View className="border-b border-text/10 py-3">
            <View className="flex-row items-start justify-between gap-3">
              <Text className="flex-1 font-bold text-text">Contenido</Text>
              <Badge tone={contentOk ? "success" : "danger"}>{CONTENT_LABEL[verification.content]}</Badge>
            </View>
            <Text className="mt-1 text-sm leading-5 text-text/70">
              Huella esperada {verification.expected_digest.slice(0, 12)}… · encontrada{" "}
              {verification.found_digest.slice(0, 12)}…
            </Text>
          </View>
          <View className="py-3">
            <View className="flex-row items-start justify-between gap-3">
              <Text className="flex-1 font-bold text-text">Firma</Text>
              <Badge tone={SIGNATURE_TONE[verification.signature]}>{SIGNATURE_LABEL[verification.signature]}</Badge>
            </View>
            <Text className="mt-1 text-sm leading-5 text-text/70">{verification.signature_detail}</Text>
          </View>
        </Card>
      </Section>

      <Section title="Qué este sello NO certifica">
        <Card>
          <View className="gap-2">
            {limits.map((item) => (
              <View key={item} className="flex-row gap-2">
                <Text className="text-crimson">•</Text>
                <Text className="flex-1 text-sm leading-5 text-text/70">{item}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>
    </>
  );
}
