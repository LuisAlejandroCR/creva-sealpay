// DashboardScreen.tsx: mobile port of creva_finance's dashboard/page.tsx — the panorama hub
// screen (score first, one next action, balance, cards, recent activity). Visual-only port:
// data here is mock/local state, matching the pattern QueryScreen already established for
// this worktree. Not wired into App.tsx navigation yet (see docs/plan.md / docs/memoria.md).
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatMoney } from "../../lib/format-money";
import { buildReminders, pendingCount } from "../../lib/reminders";
import { Card, Section } from "../query/components/VisualPrimitives";
import { ScoreGauge } from "../query/components/ScoreGauge";
import {
  ActionCard,
  EmptyState,
  Metric,
  NotificationBell,
  TransactionRow,
} from "./components/DashboardPrimitives";

export interface DashboardScreenProps {
  onOpenScore?: () => void;
  onOpenCredit?: () => void;
  onOpenCard?: () => void;
  onOpenNotifications?: () => void;
  userName?: string;
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
  userName = "Ana",
}: DashboardScreenProps) {
  // Mock state standing in for the API calls the Next.js reference makes (auth.me, score.get,
  // collateral.get, credit.eligibility, statements.*). Wiring those is out of this task's scope.
  const [cardReady] = useState(false);
  const [scoreValue] = useState(74);
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
        <View className="mb-6 flex-row items-start justify-between">
          <View>
            <Text className="text-3xl font-bold text-text">Hola, {userName}</Text>
            <Text className="mt-1 text-base text-text/70">Tu panorama financiero</Text>
          </View>
          <NotificationBell pending={pending} onPress={onOpenNotifications} />
        </View>

        <Section title="Tu score">
          <Card>
            <View className="gap-5">
              <ScoreGauge value={scoreValue} max={100} band={scoreValue >= 70 ? "success" : "warning"} />
              <View className="gap-3 border-t border-text/10 pt-4">
                <Text className="text-sm leading-5 text-text/70">{mainAction.body}</Text>
                <ActionCard
                  title={mainAction.cta}
                  body=""
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
              cta="Ver opciones"
              onPress={onOpenCredit}
              testID="dashboard-financing-action"
            />
          </Section>
        )}

        <Section>
          <Card>
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
