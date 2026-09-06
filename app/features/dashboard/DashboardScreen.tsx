// DashboardScreen.tsx: mobile port of creva_finance's dashboard/page.tsx — the panorama hub
// (score, one next action, balance, cards, recent activity). Score, spending capacity, the
// reminder inputs and recent activity are all read from the real core API with the Clerk session;
// only the active-card preview stays "activate" because the core has no GET /cards yet (plan.md).
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";

import { formatMoney } from "../../lib/format-money";
import { formatDayWithYear } from "../../lib/format-date";
import { buildReminders, pendingCount } from "../../lib/reminders";
import {
  collateral,
  credit,
  score as scoreApi,
  statements,
  transactions,
  type CreditEligibilityGap,
  type ScoreData,
  type Transaction,
} from "../../lib/api";
import { Card, Section } from "../query/components/VisualPrimitives";
import { ScoreGauge } from "../query/components/ScoreGauge";
import {
  ActionCard,
  EmptyState,
  Metric,
  NotificationBell,
  PrimaryButton,
  TransactionRow,
} from "./components/DashboardPrimitives";

export interface DashboardScreenProps {
  onOpenScore?: () => void;
  onOpenCredit?: () => void;
  onOpenCard?: () => void;
  onOpenNotifications?: () => void;
}

export function DashboardScreen({
  onOpenScore,
  onOpenCredit,
  onOpenCard,
  onOpenNotifications,
}: DashboardScreenProps) {
  const { user } = useUser();
  const userName = user?.firstName || "";

  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);
  const [scoreError, setScoreError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setScoreLoading(true);
    setScoreError(null);
    scoreApi
      .get()
      .then((data) => {
        if (!cancelled) setScoreData(data);
      })
      .catch(() => {
        if (!cancelled) setScoreError("No pudimos cargar tu score. Intenta de nuevo más tarde.");
      })
      .finally(() => {
        if (!cancelled) setScoreLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scoreValue = scoreData?.score ?? null;

  const [spendingCapacity, setSpendingCapacity] = useState<string | null>(null);
  const [creditEligible, setCreditEligible] = useState<boolean | null>(null);
  const [creditMissing, setCreditMissing] = useState<CreditEligibilityGap[]>([]);
  const [statementCount, setStatementCount] = useState<number | null>(null);
  const [statementEntryCount, setStatementEntryCount] = useState<number | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);

  // Stays false until the core exposes GET /cards (it only has issue / :id / freeze), so an
  // issued card cannot be listed here yet — see the docs/plan.md open block.
  const [cardReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      credit.eligibility(),
      statements.list(),
      statements.summary(),
      collateral.get(),
      transactions.list({ limit: 3 }),
    ]).then(([elig, list, summary, coll, tx]) => {
      if (cancelled) return;
      setCreditEligible(elig.status === "fulfilled" ? elig.value.eligible : null);
      setCreditMissing(elig.status === "fulfilled" ? elig.value.missing : []);
      setStatementCount(list.status === "fulfilled" ? list.value.length : null);
      setStatementEntryCount(summary.status === "fulfilled" ? summary.value.entryCount : null);
      if (coll.status === "fulfilled") setSpendingCapacity(coll.value.spendingCapacity);
      if (tx.status === "fulfilled") setRecentTx(tx.value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const reminders = useMemo(
    () =>
      buildReminders({
        scoreStatus: scoreData?.status ?? null,
        scoreValue,
        creditEligible,
        creditMissing,
        statementCount,
        statementEntryCount,
      }),
    [scoreData?.status, scoreValue, creditEligible, creditMissing, statementCount, statementEntryCount],
  );
  const pending = pendingCount(reminders);
  const topReminder = reminders.find((item) => item.pending) ?? null;

  const mainAction = cardReady
    ? { body: "Deposita por SPEI a tu CLABE Creva y tu saldo se actualiza solo.", cta: "Agregar fondos" }
    : topReminder
      ? { body: topReminder.body, cta: topReminder.cta }
      : { body: "Mira qué mueve tu score y qué lo mejoraría.", cta: "Ver por qué" };

  const showFinancing = topReminder?.href !== "/credit" || !cardReady;
  const balanceDisplay = spendingCapacity ? formatMoney(spendingCapacity) || "—" : "—";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <View className="mb-5 flex-row items-center justify-between">
          <View className="min-w-0 flex-1">
            <Text className="text-2xl font-semibold text-text">Hola,{userName ? ` ${userName}` : ""}</Text>
            <Text className="mt-1 text-[13px] leading-[1.5] text-text-muted">Tu panorama financiero</Text>
          </View>
          <NotificationBell pending={pending} onPress={onOpenNotifications} />
        </View>

        <Section title="Tu score" action={onOpenScore ? { label: "Ver por qué", onPress: onOpenScore } : undefined}>
          <Card size="lg">
            <View className="gap-[18px]">
              {scoreLoading ? (
                <View className="items-center py-6" testID="dashboard-score-loading">
                  <ActivityIndicator />
                </View>
              ) : scoreError || scoreValue === null ? (
                <Text className="text-sm text-danger" testID="dashboard-score-error">
                  {scoreError ?? "No pudimos cargar tu score."}
                </Text>
              ) : (
                <ScoreGauge value={scoreValue} max={100} band={scoreValue >= 70 ? "success" : "warning"} />
              )}
              <View className="gap-3 border-t border-border pt-[18px]">
                <Text className="text-sm leading-5 text-text/70">{mainAction.body}</Text>
                <PrimaryButton
                  label={mainAction.cta}
                  onPress={onOpenScore}
                  testID="dashboard-score-action"
                />
              </View>
            </View>
          </Card>
        </Section>

        {showFinancing && (
          <Section>
            <ActionCard
              title="Encuentra tu mejor opción"
              body="Compara créditos con tu actividad real."
              icon="financing"
              onPress={onOpenCredit}
              testID="dashboard-financing-action"
            />
          </Section>
        )}

        <Section>
          <Card size="md">
            <Metric
              label="Saldo disponible"
              unit="MXN"
              value={balanceDisplay}
              caption={cardReady ? undefined : "Tu saldo se activa cuando emitas tu tarjeta Creva."}
            />
          </Card>
        </Section>

        <Section title="Mis tarjetas">
          {cardReady ? (
            <Card testID="dashboard-card-preview">
              <Text className="text-sm font-semibold text-text">•••• 4821</Text>
            </Card>
          ) : (
            <ActionCard
              title="Activar mi tarjeta Creva"
              body="Respaldada por tu garantía."
              tone="dashed"
              dashed
              icon="card"
              onPress={onOpenCard}
              testID="dashboard-activate-card"
            />
          )}
        </Section>

        <Section title="Actividad reciente">
          {recentTx.length === 0 ? (
            <EmptyState
              title="Aún no hay movimientos"
              body="Cuando uses tu tarjeta Creva, tus movimientos aparecen aquí automáticamente."
            />
          ) : (
            <View>
              {recentTx.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  merchant={tx.merchantName}
                  meta={formatDayWithYear(tx.occurredAt)}
                  amount={formatMoney(tx.amount) || "—"}
                  isCharge={tx.transactionType === "charge"}
                />
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
