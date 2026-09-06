// DashboardScreen.tsx: mobile port of creva_finance's dashboard/page.tsx — the panorama hub
// screen (score first, one next action, balance, cards, recent activity). Score comes from the
// real GET /score (app/lib/api.ts's score.get()) with loading/error states; username comes from
// the real Clerk session (useUser().firstName) — neither is hardcoded. Transactions/balance/card
// are still mock (no statements/collateral/card endpoint wiring in this pass, see docs/plan.md).
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";

import { formatMoney } from "../../lib/format-money";
import { buildReminders, pendingCount } from "../../lib/reminders";
import { score as scoreApi, type ScoreData } from "../../lib/api";
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

const MOCK_TRANSACTIONS = [
  { id: "1", merchant: "Distribuidora Hidalgo", meta: "Hoy", amount: "1,240.00", isCharge: true },
  { id: "2", merchant: "Depósito SPEI", meta: "Ayer", amount: "5,000.00", isCharge: false },
  { id: "3", merchant: "Papelería del Centro", meta: "Hace 3 días", amount: "312.50", isCharge: true },
];

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

  // Mock state standing in for the API calls the Next.js reference makes for card/collateral/
  // credit/statements. Wiring those beyond score is out of this pass — see docs/plan.md.
  const [cardReady] = useState(false);
  const scoreValue = scoreData?.score ?? null;
  const [spendingCapacity] = useState<string | null>(null);

  const reminders = useMemo(
    () =>
      buildReminders({
        scoreStatus: "ok",
        scoreValue,
        creditEligible: true,
        creditMissing: [],
        statementCount: 2,
        statementEntryCount: 48,
      }),
    [scoreValue],
  );
  const pending = pendingCount(reminders);
  const topReminder = reminders.find((item) => item.pending) ?? null;

  const mainAction = cardReady
    ? { body: "Deposita por SPEI a tu CLABE Creva y tu saldo se actualiza solo.", cta: "Agregar fondos" }
    : topReminder
      ? { body: topReminder.body, cta: topReminder.cta }
      : { body: "Mira qué mueve tu score y qué lo mejoraría.", cta: "Ver por qué" };

  const showFinancing = topReminder?.href !== "/credit" || !cardReady;
  const balanceDisplay = cardReady ? formatMoney(spendingCapacity) || "—" : "—";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <View className="mb-5 flex-row items-center justify-between">
          <View className="min-w-0 flex-1">
            <Text className="text-2xl font-semibold text-text">Hola{userName ? `, ${userName}` : ""}</Text>
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
          {!cardReady ? (
            <EmptyState
              title="Aún no hay movimientos"
              body="Cuando uses tu tarjeta Creva, tus movimientos aparecen aquí automáticamente."
            />
          ) : (
            <View>
              {MOCK_TRANSACTIONS.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  merchant={tx.merchant}
                  meta={tx.meta}
                  amount={tx.amount}
                  isCharge={tx.isCharge}
                />
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
