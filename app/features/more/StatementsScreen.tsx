// StatementsScreen.tsx: mobile port of creva_finance's app/statements/page.tsx — upload bank
// statements (expo-document-picker replaces the reference's <input type="file">), review the
// business-spend classification, and correct individual entries.
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  statements,
  type BusinessClassification,
  type IdentityMatchStatus,
  type StatementClassificationSummary,
  type StatementEntry,
  type StatementSummary,
  type StatementUploadResult,
} from "../../lib/api";
import { formatDayWithYear } from "../../lib/format-date";
import { formatMoney } from "../../lib/format-money";
import { formatPercent } from "../../lib/format-percent";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";
import { SelectField } from "../profile/components/FormField";

export interface StatementsScreenProps {
  onBack: () => void;
}

const TERMS_ACCEPTED_KEY = "creva_statement_terms_accepted";

type ChipTone = "success" | "warning" | "danger";

const CHIP_CLASS: Record<ChipTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/10 text-warning-text",
  danger: "bg-danger-bg text-crimson",
};

function Chip({ label, tone }: { label: string; tone: ChipTone }) {
  return (
    <Text className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${CHIP_CLASS[tone]}`}>
      {label}
    </Text>
  );
}

function identityChip(status: IdentityMatchStatus | null): { label: string; tone: ChipTone } | null {
  if (status === "matched") return { label: "Coincide con tu perfil", tone: "success" };
  if (status === "mismatch") return { label: "No coincide con tu perfil", tone: "warning" };
  return null;
}

function statusChip(status: string): { label: string; tone: ChipTone } {
  if (status === "failed") return { label: "No se pudo leer", tone: "danger" };
  if (status === "partial") return { label: "Leído con avisos", tone: "warning" };
  return { label: "Leído", tone: "success" };
}

const CLASS_OPTIONS: { value: BusinessClassification; label: string }[] = [
  { value: "business", label: "Negocio" },
  { value: "personal", label: "Personal" },
  { value: "mixed", label: "Mixto" },
  { value: "unclassified", label: "Sin clasificar" },
];

function ClassificationSummary({ summary }: { summary: StatementClassificationSummary }) {
  const unclassifiedRatio = parseFloat(summary.unclassifiedRatio);
  const segments = [
    { label: "Negocio", value: parseFloat(summary.business), colorClass: "bg-crimson" },
    { label: "Mixto", value: parseFloat(summary.mixed), colorClass: "bg-rosa" },
    { label: "Personal", value: parseFloat(summary.personal), colorClass: "bg-text-subtle" },
  ];
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  return (
    <Card>
      <Text className="text-xs font-semibold uppercase text-text/60">Tu gasto de negocio</Text>
      <Text className="mt-1 text-3xl font-bold text-text">{formatPercent(summary.businessRatio)}</Text>
      <Text className="text-xs text-text/50">de {summary.entryCount} movimientos</Text>

      <View className="mt-4 h-2.5 flex-row overflow-hidden rounded-full bg-surface-2">
        {segments.map((segment) => (
          <View
            key={segment.label}
            className={segment.colorClass}
            style={{ flex: total > 0 ? Math.max(0, segment.value) / total : 0 }}
          />
        ))}
      </View>

      <Text className="mt-3 text-xs leading-4 text-text/50">
        Calculado sobre lo que sí se pudo clasificar. Este porcentaje entra en tu recomendación de
        crédito.
      </Text>
      {unclassifiedRatio > 0 ? (
        <Text className="mt-1 text-xs leading-4 text-warning-text">
          {formatPercent(summary.unclassifiedRatio)} de tu gasto quedó sin clasificar (
          {formatMoney(summary.unclassified)}). Revísalo abajo para que cuente.
        </Text>
      ) : null}
    </Card>
  );
}

function EntryList({ statementId }: { statementId: string; onChanged: () => void }) {
  const [entries, setEntries] = useState<StatementEntry[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    statements
      .entries(statementId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [statementId]);

  async function change(entry: StatementEntry, value: BusinessClassification) {
    setSaving(entry.id);
    const previous = entries;
    setEntries((list) => (list ?? []).map((e) => (e.id === entry.id ? { ...e, businessClassification: value, isManual: true } : e)));
    try {
      await statements.reclassify(entry.id, value);
    } catch {
      setEntries(previous);
    } finally {
      setSaving(null);
    }
  }

  if (entries === null) {
    return (
      <View className="items-center py-4" testID="statement-entries-loading">
        <ActivityIndicator />
      </View>
    );
  }

  if (entries.length === 0) {
    return <Text className="text-sm text-text/50">No hay movimientos guardados de este archivo.</Text>;
  }

  return (
    <View className="gap-3 pt-2">
      {entries.map((entry) => (
        <View key={entry.id} className="gap-2">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-sm text-text" numberOfLines={1}>
              {entry.description}
            </Text>
            <Text className={`text-sm font-semibold ${entry.direction === "credit" ? "text-success" : "text-text"}`}>
              {entry.direction === "debit" ? "−" : ""}
              {formatMoney(entry.amount) || "—"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-text/50">{formatDayWithYear(entry.occurredAt)}</Text>
            {entry.isManual ? <Text className="text-xs text-text/50">· editado</Text> : null}
          </View>
          <View className="flex-1">
            <SelectField
              label=""
              value={entry.businessClassification}
              onChange={(value) => change(entry, value as BusinessClassification)}
              options={CLASS_OPTIONS}
              testID={`statement-entry-${entry.id}-classification`}
            />
          </View>
        </View>
      ))}
      <Text className="text-xs leading-4 text-text/50">
        Lo que marques aquí cambia tu proporción de gasto de negocio, que a su vez afecta tu
        recomendación de crédito.
      </Text>
    </View>
  );
}

function TermsGate({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);

  const points = [
    {
      lead: "Confirmas que la información es real.",
      body: "Bajo tu propio criterio, que estos archivos no han sido alterados. Creva confía en lo que subes y no verifica la autenticidad del documento.",
    },
    {
      lead: "Guardamos tus movimientos.",
      body: "Fecha, concepto y monto, para calcular tu perfil de crédito — igual que con tu tarjeta Creva.",
    },
    {
      lead: "Nunca guardamos tus datos personales.",
      body: "Si el documento trae tu nombre, RFC o domicilio, los leemos una vez para confirmar que el estado de cuenta es tuyo y los descartamos.",
    },
  ];

  return (
    <Card>
      <Text className="mb-3 text-base font-bold text-text">Antes de subir tus estados de cuenta</Text>
      <View className="gap-3">
        {points.map((point) => (
          <View key={point.lead} className="flex-row gap-2.5">
            <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-crimson" />
            <Text className="flex-1 text-sm leading-5 text-text/70">
              <Text className="font-semibold text-text">{point.lead}</Text> {point.body}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        className="mt-4 flex-row items-center gap-2.5"
        onPress={() => setChecked((v) => !v)}
        testID="statement-terms-checkbox"
      >
        <View className={`h-5 w-5 rounded border ${checked ? "border-crimson bg-crimson" : "border-text/30"}`} />
        <Text className="text-sm text-text">Entiendo y acepto lo anterior.</Text>
      </Pressable>

      <Pressable
        className={`mt-4 rounded-xl px-5 py-3 ${checked ? "bg-crimson" : "bg-text/10"}`}
        disabled={!checked}
        onPress={onAccept}
        testID="statement-terms-continue"
      >
        <Text className={`text-center font-semibold ${checked ? "text-white" : "text-text/40"}`}>Continuar</Text>
      </Pressable>
    </Card>
  );
}

export function StatementsScreen({ onBack }: StatementsScreenProps) {
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<StatementUploadResult[]>([]);
  const [history, setHistory] = useState<StatementSummary[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [summary, setSummary] = useState<StatementClassificationSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(TERMS_ACCEPTED_KEY).then((value) => setTermsAccepted(value === "1"));
  }, []);

  function acceptTerms() {
    AsyncStorage.setItem(TERMS_ACCEPTED_KEY, "1");
    setTermsAccepted(true);
  }

  function loadHistory() {
    statements
      .list()
      .then(setHistory)
      .catch(() => setHistory([]));
  }

  function loadSummary() {
    statements
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }

  useEffect(() => {
    loadHistory();
    loadSummary();
  }, []);

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/pdf"],
      multiple: true,
    });
    if (result.canceled) return;
    setSelected((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...result.assets.filter((f) => !names.has(f.name))];
    });
    setError("");
  }

  async function handleUpload() {
    if (selected.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const response = await statements.uploadNative(
        selected.map((file) => ({ uri: file.uri, name: file.name, mimeType: file.mimeType ?? "application/octet-stream" })),
      );
      setResults(response.results);
      setSelected([]);
      loadHistory();
      loadSummary();
    } catch {
      setError("No pudimos subir los archivos. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setConfirmRemove(null);
    if (expanded === id) setExpanded(null);
    try {
      await statements.remove(id);
    } catch {
      setError("No se pudo eliminar el archivo. Intenta de nuevo.");
    }
    loadHistory();
    loadSummary();
  }

  const hasSummary = summary !== null && summary.entryCount > 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="statements-screen">
      <View className="flex-1 px-6 pb-4 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Estados de cuenta</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">
          Sube tus estados en CSV, Excel o PDF. Mientras más meses, mejor lee Creva tu negocio.
        </Text>

        {termsAccepted === null ? (
          <View className="items-center py-6" testID="statements-loading">
            <ActivityIndicator />
          </View>
        ) : !termsAccepted ? (
          <TermsGate onAccept={acceptTerms} />
        ) : (
          <View className="gap-6">
            {hasSummary && summary ? <ClassificationSummary summary={summary} /> : null}

            <Card dashed testID="statements-picker">
              <View className="items-center gap-2">
                <Text className="text-base font-bold text-text">
                  {hasSummary ? "Agregar más meses" : "Elige tus archivos"}
                </Text>
                <Text className="text-xs text-text/50">CSV, Excel (.xlsx) o PDF · uno o varios</Text>
                <Pressable className="mt-2 rounded-xl border border-crimson px-5 py-2.5" onPress={handlePick} testID="statements-pick-cta">
                  <Text className="text-sm font-semibold text-crimson">Seleccionar archivos</Text>
                </Pressable>
              </View>
            </Card>

            {selected.length > 0 ? (
              <View className="gap-3">
                {selected.map((file) => (
                  <View key={file.name} className="flex-row items-center gap-3">
                    <Text className="flex-1 text-sm text-text" numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Pressable onPress={() => setSelected((prev) => prev.filter((f) => f.name !== file.name))}>
                      <Text className="text-sm font-semibold text-text/50">Quitar</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  className="rounded-xl bg-crimson px-5 py-3"
                  onPress={handleUpload}
                  disabled={uploading}
                  testID="statements-upload-cta"
                >
                  <Text className="text-center font-semibold text-white">
                    {uploading ? "Leyendo…" : `Subir ${selected.length} ${selected.length === 1 ? "archivo" : "archivos"}`}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {error ? (
              <Text className="text-sm text-danger" testID="statements-error">
                {error}
              </Text>
            ) : null}

            {results.length > 0 ? (
              <Section title="Resultado">
                <View className="gap-2.5">
                  {results.map((result) => {
                    const chip = statusChip(result.status);
                    const idChip = identityChip(result.identityMatchStatus);
                    return (
                      <Card key={result.fileName}>
                        <View className="flex-row items-start justify-between gap-2">
                          <Text className="flex-1 text-sm font-semibold text-text" numberOfLines={1}>
                            {result.fileName}
                          </Text>
                          <View className="flex-row gap-1.5">
                            {idChip ? <Chip label={idChip.label} tone={idChip.tone} /> : null}
                            <Chip label={chip.label} tone={chip.tone} />
                          </View>
                        </View>
                        {result.status !== "failed" ? (
                          <Text className="mt-1 text-xs text-text/50">
                            {result.entryCount} movimientos · {formatDayWithYear(result.periodStart) || "—"} a{" "}
                            {formatDayWithYear(result.periodEnd) || "—"}
                          </Text>
                        ) : null}
                        {result.warnings.map((warning) => (
                          <Text key={warning} className="mt-1 text-xs text-text/50">
                            {warning}
                          </Text>
                        ))}
                      </Card>
                    );
                  })}
                </View>
              </Section>
            ) : null}

            <Section title="Archivos subidos">
              {history === null ? (
                <View className="items-center py-4" testID="statements-history-loading">
                  <ActivityIndicator />
                </View>
              ) : history.length === 0 ? (
                <Text className="text-sm text-text/50">
                  Todavía no has subido ningún estado de cuenta. Elige tus archivos aquí arriba y
                  Creva lee tu negocio con ellos.
                </Text>
              ) : (
                <View className="gap-4">
                  {history.map((item) => {
                    const idChip = identityChip(item.identityMatchStatus);
                    const isConfirming = confirmRemove === item.id;
                    return (
                      <View key={item.id} className="gap-2.5">
                        <View className="flex-row items-center gap-3">
                          <View className="flex-1 gap-0.5">
                            <Text className="text-sm font-semibold text-text" numberOfLines={1}>
                              {item.fileName}
                            </Text>
                            <Text className="text-xs text-text/50">
                              {item.entryCount} movimientos · {formatDayWithYear(item.periodStart) || "—"} a{" "}
                              {formatDayWithYear(item.periodEnd) || "—"}
                            </Text>
                            {idChip ? <Chip label={idChip.label} tone={idChip.tone} /> : null}
                          </View>
                          <Pressable onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
                            <Text className="text-sm font-semibold text-crimson">{expanded === item.id ? "Ocultar" : "Revisar"}</Text>
                          </Pressable>
                          <Pressable onPress={() => setConfirmRemove(isConfirming ? null : item.id)}>
                            <Text className="text-sm font-semibold text-text/50">Quitar</Text>
                          </Pressable>
                        </View>

                        {isConfirming ? (
                          <Card tone="highlight">
                            <Text className="text-sm text-text">
                              Se borrarán sus {item.entryCount} movimientos y tu proporción de gasto de
                              negocio se recalculará.
                            </Text>
                            <View className="mt-3 flex-row gap-3">
                              <Pressable onPress={() => setConfirmRemove(null)}>
                                <Text className="text-sm font-semibold text-text/60">Cancelar</Text>
                              </Pressable>
                              <Pressable onPress={() => handleDelete(item.id)} testID={`statement-confirm-remove-${item.id}`}>
                                <Text className="text-sm font-semibold text-crimson">Sí, quitar</Text>
                              </Pressable>
                            </View>
                          </Card>
                        ) : null}

                        {expanded === item.id ? <EntryList statementId={item.id} onChanged={loadSummary} /> : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </Section>

            <Text className="text-xs leading-4 text-text/50">
              Esto es temporal: cuando la portabilidad financiera de LATAM esté disponible, Creva
              podrá conectarse a tu banco directamente y ya no tendrás que subir archivos.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
