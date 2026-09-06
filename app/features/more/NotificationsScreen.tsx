// NotificationsScreen.tsx: mobile port of creva_finance's app/notifications/page.tsx — the "Avisos"
// list built from real score, credit-eligibility and statement signals via app/lib/reminders, plus
// the "coming soon" rewards block. Reminder rows are read-only here (the app has no deep-link
// router to follow reminder.href); partner tiles use Creva tokens, not the reference brand hex.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { credit, score as scoreApi, statements } from "../../lib/api";
import { buildReminders, pendingCount, type Reminder, type ReminderTone } from "../../lib/reminders";
import { BackButton } from "../shared/BackButton";
import { Badge, Card, Section } from "../query/components/VisualPrimitives";

export interface NotificationsScreenProps {
  onBack: () => void;
}

const LOYALTY_PARTNERS = [
  { name: "Rappi", abbr: "Ra" },
  { name: "Nu Puntos", abbr: "Nu" },
  { name: "Tu Plus+", abbr: "T+" },
  { name: "Puntos Colombia", abbr: "PC" },
];

const TONE: Record<ReminderTone, { tile: string; border: string; label: string; text: string }> = {
  action: { tile: "bg-danger-bg", border: "border-danger-border", label: "Pendiente", text: "text-crimson" },
  info: { tile: "bg-warning-bg", border: "border-warning-border", label: "En espera", text: "text-warning-text" },
  done: { tile: "bg-success-bg", border: "border-success-border", label: "Listo", text: "text-success-text" },
};

function subtitleFor(reminders: Reminder[] | null): string {
  if (reminders === null) return "Revisando qué te falta…";
  const pending = pendingCount(reminders);
  if (pending === 0) return "Estás al corriente. Aquí te avisamos cuando haya algo que hacer.";
  if (pending === 1) return "Tienes 1 cosa pendiente para sacarle más a Creva.";
  return `Tienes ${pending} cosas pendientes para sacarle más a Creva.`;
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const tone = TONE[reminder.tone];
  return (
    <View className="mb-3" testID="notification-reminder">
      <Card>
        <View className="flex-row gap-3.5">
          <View className={`h-10 w-10 rounded-xl border ${tone.tile} ${tone.border}`} />
          <View className="flex-1 gap-1">
            <Text className={`text-xs font-bold uppercase ${tone.text}`}>{tone.label}</Text>
            <Text className="text-[15px] font-bold text-text">{reminder.title}</Text>
            <Text className="text-sm leading-5 text-text/60">{reminder.body}</Text>
            <Text className="mt-1 text-sm font-semibold text-crimson">{reminder.cta}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [reminders, setReminders] = useState<Reminder[] | null>(null);

  const load = useCallback(async () => {
    const [scoreResult, eligibilityResult, listResult, summaryResult] = await Promise.allSettled([
      scoreApi.get(),
      credit.eligibility(),
      statements.list(),
      statements.summary(),
    ]);

    setReminders(
      buildReminders({
        scoreStatus: scoreResult.status === "fulfilled" ? scoreResult.value.status : null,
        scoreValue: scoreResult.status === "fulfilled" ? scoreResult.value.score : null,
        creditEligible: eligibilityResult.status === "fulfilled" ? eligibilityResult.value.eligible : null,
        creditMissing: eligibilityResult.status === "fulfilled" ? eligibilityResult.value.missing : [],
        statementCount: listResult.status === "fulfilled" ? listResult.value.length : null,
        statementEntryCount: summaryResult.status === "fulfilled" ? summaryResult.value.entryCount : null,
      }),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="notifications-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Avisos</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">{subtitleFor(reminders)}</Text>

        <Section>
          {reminders === null ? (
            <View className="items-center py-6" testID="notifications-loading">
              <ActivityIndicator />
            </View>
          ) : reminders.length === 0 ? (
            <Card testID="notifications-empty">
              <Text className="text-sm font-semibold text-text">Nada pendiente por ahora</Text>
              <Text className="mt-1 text-sm leading-5 text-text/60">
                Cuando tu recomendación de crédito esté lista o falte algún documento para tu score,
                te avisamos aquí.
              </Text>
            </Card>
          ) : (
            <View>
              {reminders.map((reminder) => (
                <ReminderCard key={reminder.id} reminder={reminder} />
              ))}
            </View>
          )}
        </Section>

        <Section title="Beneficios y recompensas">
          <View testID="rewards-section">
            <Badge tone="danger">Próximamente</Badge>
            <Card>
              <View className="gap-4">
                <Text className="text-sm leading-5 text-text/60">
                  Pronto podrás ganar puntos y canjear beneficios con tus marcas favoritas.
                </Text>
                <View className="flex-row flex-wrap justify-center gap-3">
                  {LOYALTY_PARTNERS.map((partner) => (
                    <View key={partner.abbr} className="w-16 items-center gap-1.5">
                      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
                        <Text className="text-[15px] font-extrabold text-crimson">{partner.abbr}</Text>
                      </View>
                      <Text className="text-center text-[10px] text-text/50">{partner.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
