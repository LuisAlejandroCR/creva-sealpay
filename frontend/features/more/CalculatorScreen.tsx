// CalculatorScreen.tsx: mobile port of creva_finance's app/calculator/page.tsx — what came in, what
// went out, and the split the API suggests for the rest. Every figure and every share is read from
// the response; the split percentages are backend business logic and are never recomputed here.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculator, type CalculatorData } from "../../lib/api";
import { formatDay } from "../../lib/format-date";
import { formatMoneyRounded } from "../../lib/format-money";
import { formatPercent, formatShare, splitPercent } from "../../lib/format-percent";
import { BackButton } from "../shared/BackButton";
import { Card, Progress, Section } from "../query/components/VisualPrimitives";
import { TextField } from "../profile/components/FormField";

export interface CalculatorScreenProps {
  onBack: () => void;
}

const SPLIT_COLOR_CLASS = ["bg-crimson", "bg-warning-text", "bg-success-text"];

function num(value: string | null | undefined): number {
  const parsed = parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

function Row({ term, description }: { term: string; description: string }) {
  return (
    <View className="gap-0.5 border-b border-text/5 pb-2">
      <Text className="text-sm font-semibold text-text">{term}</Text>
      <Text className="text-sm leading-5 text-text/60">{description}</Text>
    </View>
  );
}

export function CalculatorScreen({ onBack }: CalculatorScreenProps) {
  const [data, setData] = useState<CalculatorData | null>(null);
  const [income, setIncome] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (override?: string) => {
    setIsLoading(true);
    try {
      setData(await calculator.get(override || undefined));
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parts = data
    ? [
        { label: "Salario", amount: num(data.suggestedSalary) },
        { label: "Ahorro", amount: num(data.suggestedSavings) },
        { label: "Reinversión", amount: num(data.suggestedReinvestment) },
      ]
    : [];
  const shares = splitPercent(parts.map((part) => part.amount));

  const incomeValue = data ? num(data.income) : 0;
  const expensesValue = data ? num(data.expenses) : 0;
  const total = incomeValue + expensesValue;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="calculator-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Calculadora</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">
          Qué entró, qué salió y qué te conviene hacer con lo que queda.
        </Text>

        {isLoading && !data ? (
          <View className="items-center py-6" testID="calculator-loading">
            <ActivityIndicator />
          </View>
        ) : !data ? (
          <Card testID="calculator-error">
            <View className="gap-3">
              <Text className="text-sm font-bold text-text">No pudimos calcularlo</Text>
              <Text className="text-sm text-text/60">Vuelve a intentarlo en un momento.</Text>
              <Pressable
                className="rounded-xl bg-crimson px-5 py-3"
                onPress={() => load(income)}
                testID="calculator-retry-cta"
              >
                <Text className="text-center font-semibold text-white">Reintentar</Text>
              </Pressable>
            </View>
          </Card>
        ) : (
          <View>
            <Section>
              <Card>
                <View className="gap-4">
                  <View className="gap-1">
                    <Text className="text-xs font-semibold uppercase text-text/50">
                      Utilidad del periodo
                    </Text>
                    <Text className="text-3xl font-bold text-text">
                      {formatMoneyRounded(data.netProfit) || "—"}
                    </Text>
                    <Text className="text-xs text-text/50">
                      Del {formatDay(data.periodStart)} al {formatDay(data.periodEnd)}
                    </Text>
                  </View>
                  <View className="gap-1.5">
                    <View className="h-3 flex-row overflow-hidden rounded-full bg-inactive">
                      <View
                        className="bg-success-text"
                        style={{ flex: total > 0 ? incomeValue / total : 1 }}
                      />
                      <View
                        className="bg-crimson"
                        style={{ flex: total > 0 ? expensesValue / total : 0 }}
                      />
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-text/60">
                        Ingresos {formatMoneyRounded(data.income) || "—"}
                      </Text>
                      <Text className="text-xs text-text/60">
                        Gastos {formatMoneyRounded(data.expenses) || "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Section>

            <Section
              title="Qué hacer con lo que queda"
              lead="Tres partes sugeridas sobre tu utilidad del periodo."
            >
              <Card>
                <View className="gap-4">
                  {parts.map((part, i) => (
                    <Progress
                      key={part.label}
                      value={shares[i]}
                      max={100}
                      colorClass={SPLIT_COLOR_CLASS[i]}
                      label={`${part.label} (${formatShare(shares[i])})`}
                      valueLabel={formatMoneyRounded(part.amount)}
                    />
                  ))}
                </View>
              </Card>
            </Section>

            <Section title="Prueba otro ingreso" lead="Cambia la cifra y vuelve a calcular. No se guarda nada.">
              <TextField
                label="Ingreso del periodo"
                value={income}
                onChangeText={(text) => setIncome(digitsOnly(text))}
                placeholder={String(Math.round(num(data.income)))}
                keyboardType="numeric"
                testID="calculator-income-input"
              />
              <Pressable
                className={`rounded-xl bg-crimson px-5 py-3 ${isLoading ? "opacity-60" : ""}`}
                onPress={() => load(income)}
                disabled={isLoading}
                testID="calculator-calc-cta"
              >
                <Text className="text-center font-semibold text-white">
                  {isLoading ? "Calculando…" : "Calcular"}
                </Text>
              </Pressable>
              {income ? (
                <Pressable
                  className="mt-2"
                  onPress={() => {
                    setIncome("");
                    load();
                  }}
                  testID="calculator-reset-cta"
                >
                  <Text className="text-center text-sm font-semibold text-text/60">
                    Volver a mis cifras reales
                  </Text>
                </Pressable>
              ) : null}
            </Section>

            <Section title="De dónde sale cada cifra">
              <Card>
                <View className="gap-3">
                  <Row
                    term="Ingresos"
                    description={`${formatMoneyRounded(data.income) || "—"} · depósitos a tu garantía ${
                      formatMoneyRounded(data.incomeSources.reapCredits) || "—"
                    } y capturados ${formatMoneyRounded(data.incomeSources.manualIncome) || "—"}`}
                  />
                  <Row
                    term="Gastos"
                    description={`${formatMoneyRounded(data.expenses) || "—"} · lo que salió en el periodo`}
                  />
                  <Row
                    term="Margen mensual"
                    description={formatPercent(data.monthlyMargin) || "Todavía no se puede estimar"}
                  />
                  <Text className="text-xs text-text/50">
                    Fuente: Creva · periodo del {formatDay(data.periodStart)} al{" "}
                    {formatDay(data.periodEnd)}
                  </Text>
                </View>
              </Card>
            </Section>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
