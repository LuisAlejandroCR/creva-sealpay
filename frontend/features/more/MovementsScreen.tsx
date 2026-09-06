// MovementsScreen.tsx: mobile port of creva_finance's app/movements/page.tsx — card transactions
// plus statement entries, merged, bucketed by day, filterable, with a detail modal that lets a
// statement entry's category be corrected and the movement shared as plain text (no account data).
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { statements, transactions, type BusinessClassification, type StatementEntry, type Transaction } from "../../lib/api";
import { formatLongDay, formatMoment, toLocalDate } from "../../lib/format-date";
import { formatMoney } from "../../lib/format-money";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";
import { SegmentedField, SelectField } from "../profile/components/FormField";

export interface MovementsScreenProps {
  onBack: () => void;
}

type Filter = "all" | "income" | "expense";

const STATEMENTS_READ = 6;

const CLASS_OPTIONS: { value: BusinessClassification; label: string }[] = [
  { value: "business", label: "Negocio" },
  { value: "personal", label: "Personal" },
  { value: "mixed", label: "Mixto" },
  { value: "unclassified", label: "Sin clasificar" },
];

const CLASS_LABEL: Record<string, string> = {
  business: "Negocio",
  personal: "Personal",
  mixed: "Mixto",
  unclassified: "Sin clasificar",
};

interface Movement {
  key: string;
  description: string;
  amount: string;
  isCharge: boolean;
  occurredAt: string;
  classification: string;
  origin: "card" | "statement";
  entryId?: string;
}

function fromTransaction(tx: Transaction): Movement {
  return {
    key: `tx-${tx.id}`,
    description: tx.merchantName,
    amount: tx.amount,
    isCharge: tx.transactionType === "charge",
    occurredAt: tx.occurredAt,
    classification: tx.businessClassification,
    origin: "card",
  };
}

function fromEntry(entry: StatementEntry): Movement {
  return {
    key: `entry-${entry.id}`,
    description: entry.description,
    amount: entry.amount,
    isCharge: entry.direction === "debit",
    occurredAt: entry.occurredAt,
    classification: entry.businessClassification,
    origin: "statement",
    entryId: entry.id,
  };
}

const DAY = 86_400_000;

function bucketOf(iso: string, now: number): string {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = toLocalDate(iso).getTime();
  if (day >= start.getTime()) return "Hoy";
  if (day >= start.getTime() - DAY) return "Ayer";
  if (day >= start.getTime() - 7 * DAY) return "Esta semana";
  return "Antes";
}

const BUCKET_ORDER = ["Hoy", "Ayer", "Esta semana", "Antes"];
const DAY_IN_HEADING = new Set(["Hoy", "Ayer"]);

const ORIGIN_LABEL: Record<Movement["origin"], string> = {
  card: "Tarjeta Creva",
  statement: "Estado de cuenta",
};

function metaOf(movement: Movement, bucket: string): string {
  const moment = formatMoment(movement.occurredAt, { withDay: !DAY_IN_HEADING.has(bucket) });
  const origin = ORIGIN_LABEL[movement.origin];
  return moment ? `${moment} · ${origin}` : origin;
}

function whenOf(movement: Movement): string {
  const time = formatMoment(movement.occurredAt, { withDay: false });
  const day = formatLongDay(movement.occurredAt);
  return time ? `${day}, ${time}` : day;
}

function shareTextOf(movement: Movement): string {
  const amount = formatMoney(movement.amount);
  const sign = movement.isCharge ? "−" : "+";
  return [
    movement.description,
    amount ? `${sign}${amount}` : "Monto no disponible",
    `${whenOf(movement)} · ${ORIGIN_LABEL[movement.origin]}`,
    "Compartido desde Creva",
  ].join("\n");
}

function MovementRow({ movement, bucket, onOpen }: { movement: Movement; bucket: string; onOpen: () => void }) {
  return (
    <Pressable
      onPress={onOpen}
      className="flex-row items-center justify-between border-b border-text/5 py-3"
      testID={`movement-row-${movement.key}`}
    >
      <View className="flex-1 gap-0.5 pr-3">
        <Text className="text-sm font-semibold text-text">{movement.description}</Text>
        <Text className="text-xs text-text/50">{metaOf(movement, bucket)}</Text>
      </View>
      <Text
        className={`text-sm font-bold ${movement.isCharge ? "text-crimson" : "text-success"}`}
      >
        {movement.isCharge ? "-" : "+"}
        {formatMoney(movement.amount) || "—"}
      </Text>
    </Pressable>
  );
}

export function MovementsScreen({ onBack }: MovementsScreenProps) {
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [txResult, listResult] = await Promise.allSettled([
      transactions.list({ limit: 100 }),
      statements.list(),
    ]);

    const fromCard = txResult.status === "fulfilled" ? txResult.value.map(fromTransaction) : [];

    let fromStatements: Movement[] = [];
    if (listResult.status === "fulfilled") {
      const entryResults = await Promise.allSettled(
        listResult.value.slice(0, STATEMENTS_READ).map((item) => statements.entries(item.id)),
      );
      fromStatements = entryResults
        .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
        .map(fromEntry);
    }

    setMovements(
      [...fromCard, ...fromStatements].sort(
        (a, b) => toLocalDate(b.occurredAt).getTime() - toLocalDate(a.occurredAt).getTime(),
      ),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeCategory(movement: Movement, value: string) {
    if (!movement.entryId) return;
    setSaving(movement.key);
    const previous = movements;
    setMovements((list) => (list ?? []).map((item) => (item.key === movement.key ? { ...item, classification: value } : item)));
    try {
      await statements.reclassify(movement.entryId, value as BusinessClassification);
    } catch {
      setMovements(previous);
    } finally {
      setSaving(null);
    }
  }

  const visible = (movements ?? []).filter((movement) =>
    filter === "all" ? true : filter === "income" ? !movement.isCharge : movement.isCharge,
  );

  const selected = (movements ?? []).find((movement) => movement.key === openKey) ?? null;

  const now = Date.now();
  const groups = useMemo(
    () =>
      BUCKET_ORDER.map((bucket) => ({
        bucket,
        items: visible.filter((movement) => bucketOf(movement.occurredAt, now) === bucket),
      })).filter((group) => group.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible],
  );

  async function handleShare(movement: Movement) {
    try {
      await Share.share({ message: shareTextOf(movement) });
    } catch {
      // Share sheet dismissed or unavailable — nothing to recover from here.
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="movements-screen">
      <View className="flex-1 px-6 pb-4 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Movimientos</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">
          Lo de tu tarjeta y lo de tus estados de cuenta, en una sola lista.
        </Text>

        <SegmentedField
          label="Filtrar"
          value={filter}
          onChange={(value) => setFilter(value as Filter)}
          options={[
            { value: "all", label: "Todos" },
            { value: "income", label: "Ingresos" },
            { value: "expense", label: "Gastos" },
          ]}
          testID="movements-filter"
        />

        {movements === null ? (
          <View className="items-center py-6" testID="movements-loading">
            <ActivityIndicator />
          </View>
        ) : groups.length === 0 ? (
          <Card testID="movements-empty">
            <Text className="text-sm font-semibold text-text">Nada que mostrar todavía</Text>
            <Text className="mt-1 text-sm leading-5 text-text/60">
              Cuando uses tu tarjeta o subas un estado de cuenta, cada movimiento aparece aquí con
              su categoría.
            </Text>
          </Card>
        ) : (
          <View>
            {groups.map((group) => (
              <Section key={group.bucket} title={group.bucket}>
                {group.items.map((movement) => (
                  <MovementRow
                    key={movement.key}
                    movement={movement}
                    bucket={group.bucket}
                    onOpen={() => setOpenKey(movement.key)}
                  />
                ))}
              </Section>
            ))}
            <Text className="text-xs leading-4 text-text/50">
              La categoría se corrige en los movimientos que vienen de tus estados de cuenta, y eso
              cambia tu proporción de gasto de negocio. Los de la tarjeta los clasifica Creva sola.
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setOpenKey(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-bg px-6 pb-10 pt-6" testID="movement-detail-sheet">
            {selected ? (
              <View className="gap-4">
                <View className="items-center">
                  <Text className="text-xs font-semibold uppercase text-text/50">
                    {ORIGIN_LABEL[selected.origin]}
                  </Text>
                  <Text
                    className={`mt-1 text-3xl font-bold ${selected.isCharge ? "text-text" : "text-success"}`}
                  >
                    {selected.isCharge ? "−" : "+"}
                    {formatMoney(selected.amount) || "—"}
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-text">{selected.description}</Text>
                </View>

                <Card>
                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-text/60">Cuándo</Text>
                      <Text className="text-sm font-semibold text-text">{whenOf(selected)}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-text/60">De dónde viene</Text>
                      <Text className="text-sm font-semibold text-text">{ORIGIN_LABEL[selected.origin]}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-text/60">Categoría</Text>
                      <Text className="text-sm font-semibold text-text">{CLASS_LABEL[selected.classification]}</Text>
                    </View>
                  </View>
                </Card>

                {selected.entryId ? (
                  <SelectField
                    label="Corregir la categoría"
                    value={selected.classification}
                    onChange={(value) => changeCategory(selected, value)}
                    options={CLASS_OPTIONS}
                    testID="movement-category-select"
                  />
                ) : (
                  <Text className="text-xs leading-4 text-text/50">
                    Los movimientos de tu tarjeta los clasifica Creva sola, así que esta categoría
                    no se edita. La de un estado de cuenta sí.
                  </Text>
                )}

                <Pressable
                  className="rounded-xl bg-crimson px-5 py-3"
                  onPress={() => handleShare(selected)}
                  testID="movement-share-cta"
                >
                  <Text className="text-center font-semibold text-white">Compartir</Text>
                </Pressable>

                <Pressable onPress={() => setOpenKey(null)} testID="movement-detail-close">
                  <Text className="text-center text-sm font-semibold text-text/60">Cerrar</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
