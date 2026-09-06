// CreditRequestForm.tsx: mobile port of creva_finance/frontend/components/credit/RequestForm.tsx —
// the four steps that open /credit (the business, three months in, three months out, the request).
// Saves the fiscal profile + the declaration before handing the CreditRequest to the caller.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  declarations,
  profiles,
  type CreditPurpose,
  type CreditRequest,
  type DeclaredMonth,
  type FinancingPurpose,
  type YearsOperating,
} from "../../lib/api";
import { formatMonth } from "../../lib/format-date";
import { formatMoneyRounded } from "../../lib/format-money";
import { MX_STATES } from "../../lib/mx-states";
import { BackButton } from "../shared/BackButton";
import { Card } from "../query/components/VisualPrimitives";
import { SelectField, TextField } from "../profile/components/FormField";

export interface CreditRequestFormProps {
  onSubmit: (request: CreditRequest) => void;
  submitting: boolean;
  error?: string | null;
  onBack: () => void;
  initialRequest?: CreditRequest;
}

const TAX_REGIMES = [
  "Régimen Simplificado de Confianza",
  "Personas Físicas con Actividad Empresarial",
  "Incorporación Fiscal",
  "Arrendamiento",
  "Salarios y Honorarios",
  "Plataformas Tecnológicas",
  "Régimen General de Ley de Personas Morales",
];

const YEARS: { value: YearsOperating; label: string }[] = [
  { value: "lt_1", label: "Menos de 1 año" },
  { value: "1_3", label: "1 a 3 años" },
  { value: "4_5", label: "4 a 5 años" },
  { value: "gt_5", label: "Más de 5 años" },
];

const PURPOSES: { value: CreditPurpose; label: string }[] = [
  { value: "capital_trabajo", label: "Capital de trabajo" },
  { value: "inventario", label: "Inventario" },
  { value: "equipo", label: "Equipo o maquinaria" },
  { value: "expansion", label: "Expansión" },
  { value: "imprevistos", label: "Imprevistos" },
];

const CREDIT_PURPOSE_TO_DECLARED: Record<CreditPurpose, FinancingPurpose> = {
  capital_trabajo: "working_capital",
  inventario: "inventory",
  equipo: "equipment",
  expansion: "expansion",
  imprevistos: "other",
};

const DECLARED_PURPOSE_TO_CREDIT: Partial<Record<FinancingPurpose, CreditPurpose>> = {
  working_capital: "capital_trabajo",
  inventory: "inventario",
  equipment: "equipo",
  expansion: "expansion",
};

const TERMS = [6, 12, 24, 36];
const AMOUNT_SHORTCUTS = [10000, 25000, 50000, 100000];
const TITLES = ["Tu negocio", "Tus ingresos", "Tus gastos", "Tu solicitud"];
const SUBTITLES = [
  "Con esto buscamos tu negocio en el directorio oficial y leemos tu perfil.",
  "Aproximado está bien. Puedes revisarlo en tus estados de cuenta.",
  "Aproximado está bien. Puedes revisarlo en tus estados de cuenta.",
  "Con esto buscamos los productos que encajan con lo que necesitas.",
];
const STATE_OPTIONS = MX_STATES.map((state) => ({ value: String(state.code), label: state.label }));
const REGIME_OPTIONS = TAX_REGIMES.map((regime) => ({ value: regime, label: regime }));

function lastThreeMonths(today = new Date()): string[] {
  const months: string[] = [];
  for (let back = 3; back >= 1; back--) {
    const date = new Date(today.getFullYear(), today.getMonth() - back, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length === 0 ? whole : `${whole}.${rest.join("").slice(0, 2)}`;
}

const digitsOnly = (raw: string) => raw.replace(/\D/g, "");

function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
  testID,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  testID?: string;
}) {
  return (
    <View className="flex-row flex-wrap gap-2" testID={testID}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 ${
              active ? "border-crimson bg-crimson" : "border-text/15 bg-surface-1"
            }`}
          >
            <Text className={`text-sm font-semibold ${active ? "text-white" : "text-text"}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AmountRows({
  months,
  values,
  onChange,
}: {
  months: string[];
  values: Record<string, string>;
  onChange: (month: string, next: string) => void;
}) {
  return (
    <View className="gap-3">
      {months.map((month) => (
        <TextField
          key={month}
          label={formatMonth(month)}
          value={values[month] ?? ""}
          onChangeText={(text) => onChange(month, sanitizeAmount(text))}
          placeholder="0"
          keyboardType="decimal-pad"
        />
      ))}
    </View>
  );
}

export function CreditRequestForm({
  onSubmit,
  submitting,
  error,
  onBack,
  initialRequest,
}: CreditRequestFormProps) {
  const months = useMemo(() => lastThreeMonths(), []);
  const returning = initialRequest !== undefined;

  const [step, setStep] = useState(1);
  const [ready, setReady] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [rfc, setRfc] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [yearsOperating, setYearsOperating] = useState<YearsOperating | null>(null);
  const [income, setIncome] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [amount, setAmount] = useState(initialRequest?.amount ?? "25000");
  const [purpose, setPurpose] = useState<CreditPurpose>(initialRequest?.purpose ?? "capital_trabajo");
  const [termMonths, setTermMonths] = useState(initialRequest?.termMonths ?? 12);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([profiles.getFiscal(), declarations.latest()]).then(([fiscal, previous]) => {
      if (cancelled) return;
      if (fiscal.status === "fulfilled" && fiscal.value) {
        setBusinessName(fiscal.value.businessName ?? "");
        setRfc(fiscal.value.rfc ?? "");
        setTaxRegime(fiscal.value.taxRegime ?? "");
        setStateCode(fiscal.value.stateCode === null ? "" : String(fiscal.value.stateCode));
      }
      if (previous.status === "fulfilled" && previous.value) {
        const declaration = previous.value;
        setYearsOperating(declaration.yearsOperating);
        setIncome(Object.fromEntries(declaration.months.map((m) => [m.month, m.income])));
        setExpenses(Object.fromEntries(declaration.months.map((m) => [m.month, m.expenses])));
        const saved = declaration.financingPurpose
          ? DECLARED_PURPOSE_TO_CREDIT[declaration.financingPurpose]
          : undefined;
        if (!returning && saved) setPurpose(saved);
        const current = months.every((month) =>
          declaration.months.some((declared) => declared.month === month),
        );
        if (current) {
          setAccepted(true);
          setStep(4);
        }
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [months, returning]);

  const canContinue =
    step === 1
      ? businessName.trim().length > 1 && stateCode !== "" && yearsOperating !== null
      : step === 2
        ? months.every((month) => (income[month] ?? "") !== "")
        : step === 3
          ? months.every((month) => (expenses[month] ?? "") !== "")
          : amount !== "" && accepted;

  const handleFinish = useCallback(async () => {
    if (!yearsOperating) return;
    setIsSaving(true);
    setErrorMsg(null);
    const declaredMonths: DeclaredMonth[] = months.map((month) => ({
      month,
      income: income[month] ?? "0",
      expenses: expenses[month] ?? "0",
    }));
    try {
      await profiles.updateFiscal({
        businessName,
        rfc: rfc || undefined,
        taxRegime: taxRegime || undefined,
        stateCode: stateCode === "" ? undefined : Number(stateCode),
      });
      await declarations.create({
        yearsOperating,
        months: declaredMonths,
        seekingFinancing: "yes",
        financingPurpose: CREDIT_PURPOSE_TO_DECLARED[purpose],
        acceptedTerms: true,
      });
    } catch {
      setErrorMsg("No pudimos guardar tus datos. Revisa tu conexión e inténtalo de nuevo.");
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    onSubmit({ amount: `${parseInt(amount || "0", 10)}`, purpose, termMonths });
  }, [amount, businessName, expenses, income, months, onSubmit, purpose, rfc, stateCode, taxRegime, termMonths, yearsOperating]);

  const amountLabel = formatMoneyRounded(parseInt(amount || "0", 10));

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="credit-request-form">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={step === 1 ? onBack : () => setStep((s) => s - 1)} />
        <Text className="text-2xl font-bold text-text">{TITLES[step - 1]}</Text>
        <Text className="mb-1 mt-1 text-sm leading-5 text-text/60">{SUBTITLES[step - 1]}</Text>
        <Text className="mb-6 text-xs font-semibold text-text/40">Paso {step} de 6</Text>

        {step === 1 ? (
          <View>
            <TextField
              label="Nombre comercial"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Café Majo"
              note="El nombre con el que te conocen tus clientes."
            />
            <TextField
              label="RFC (opcional)"
              value={rfc}
              onChangeText={(text) => setRfc(text.toUpperCase())}
              placeholder="XAXX010101000"
              autoCapitalize="characters"
              maxLength={13}
              note="Solo lo usamos para confirmar el sello de tu negocio."
            />
            <SelectField
              label="Régimen fiscal (opcional)"
              value={taxRegime}
              options={REGIME_OPTIONS}
              onChange={setTaxRegime}
            />
            <SelectField
              label="Estado donde opera"
              value={stateCode}
              options={STATE_OPTIONS}
              onChange={setStateCode}
              placeholder="Selecciona tu estado"
            />
            <Text className="mb-2 mt-2 text-xs text-text/60">¿Cuántos años lleva operando?</Text>
            <ChipRow
              options={YEARS}
              value={yearsOperating}
              onChange={setYearsOperating}
              testID="credit-years"
            />
          </View>
        ) : step === 2 ? (
          <View className="gap-3">
            <Text className="text-sm leading-5 text-text/80">
              Cuánto recibió tu negocio por ventas o servicios en cada mes.
            </Text>
            <AmountRows
              months={months}
              values={income}
              onChange={(month, next) => setIncome((c) => ({ ...c, [month]: next }))}
            />
          </View>
        ) : step === 3 ? (
          <View className="gap-3">
            <Text className="text-sm leading-5 text-text/80">
              Los gastos necesarios para operar: proveedores, renta, nómina, servicios, insumos,
              transporte o publicidad.
            </Text>
            <AmountRows
              months={months}
              values={expenses}
              onChange={(month, next) => setExpenses((c) => ({ ...c, [month]: next }))}
            />
          </View>
        ) : (
          <View className="gap-5">
            <View>
              <Text className="mb-2 text-xs text-text/60">¿Cuánto necesitas?</Text>
              <TextField
                label=""
                value={amount}
                onChangeText={(text) => setAmount(digitsOnly(text))}
                placeholder="25000"
                keyboardType="numeric"
                testID="credit-amount"
              />
              <Text className="mb-2 text-xs text-text/50">{amountLabel} MXN</Text>
              <ChipRow
                options={AMOUNT_SHORTCUTS.map((v) => ({ value: String(v), label: formatMoneyRounded(v) }))}
                value={amount}
                onChange={setAmount}
              />
            </View>

            <View>
              <Text className="mb-2 text-xs text-text/60">¿Para qué lo vas a usar?</Text>
              <ChipRow options={PURPOSES} value={purpose} onChange={setPurpose} testID="credit-purpose" />
            </View>

            <View>
              <Text className="mb-2 text-xs text-text/60">¿En cuánto tiempo lo pagarías?</Text>
              <ChipRow
                options={TERMS.map((v) => ({ value: v, label: `${v} meses` }))}
                value={termMonths}
                onChange={setTermMonths}
                testID="credit-term"
              />
            </View>

            <Card tone="highlight">
              <View className="gap-1.5">
                <Text className="text-xs font-bold uppercase text-text">Ten en cuenta</Text>
                <Text className="text-sm leading-5 text-text/80">
                  Las cifras de tu negocio las declaras tú, así que Creva las marca como declaradas.
                  Al subir tus estados de cuenta dejan de ser un dicho y pasan a estar respaldadas.
                </Text>
              </View>
            </Card>

            <Pressable
              className="flex-row items-start gap-3"
              onPress={() => setAccepted((a) => !a)}
              testID="credit-consent"
            >
              <View
                className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                  accepted ? "border-crimson bg-crimson" : "border-text/30"
                }`}
              >
                {accepted ? <Text className="text-xs font-bold text-white">✓</Text> : null}
              </View>
              <Text className="flex-1 text-sm leading-5 text-text/80">
                Acepto que Creva use la información que proporcioné para generar mi diagnóstico
                financiero y recomendarme opciones acordes con mi perfil.
              </Text>
            </Pressable>

            {ready ? (
              <Pressable onPress={() => setStep(1)}>
                <Text className="text-sm font-semibold text-crimson">
                  Revisar los datos de mi negocio
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {errorMsg ?? error ? (
          <View className="mt-4 rounded-2xl border border-danger-border bg-danger-bg p-4" testID="credit-form-error">
            <Text className="text-sm text-crimson">{errorMsg ?? error}</Text>
          </View>
        ) : null}

        <Pressable
          className={`mt-6 rounded-xl bg-crimson px-5 py-3 ${
            !canContinue || isSaving || submitting ? "opacity-50" : ""
          }`}
          disabled={!canContinue || isSaving || submitting}
          onPress={() => (step === 4 ? handleFinish() : setStep((s) => s + 1))}
          testID="credit-form-next"
        >
          {isSaving || submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">
              {step === 4 ? "Ver mis opciones" : "Continuar"}
            </Text>
          )}
        </Pressable>

        {step === 4 ? (
          <Text className="mt-3 text-center text-xs text-text/50">
            Esta consulta no afecta tu historial crediticio.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
