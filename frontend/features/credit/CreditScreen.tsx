// CreditScreen.tsx: mobile port of creva_finance/frontend/app/credit/page.tsx — the whole credit
// path: the contact-verification gate, the four-step request (CreditRequestForm), the explained
// matches with every criterion shown, and the optional KYC hand-off after a choice.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  auth,
  credit,
  isBackendUnlinked,
  profiles,
  type CreditEligibility,
  type CreditMatch,
  type CreditProfile,
  type CreditRecommendationResult,
  type CreditRequest,
} from "../../lib/api";
import { formatMoneyRounded } from "../../lib/format-money";
import { formatPercent } from "../../lib/format-percent";
import { BackButton } from "../shared/BackButton";
import { BackendPendingState } from "../shared/BackendPendingState";
import { Card, Section } from "../query/components/VisualPrimitives";
import { TextField } from "../profile/components/FormField";
import { CreditRequestForm } from "./CreditRequestForm";

export interface CreditScreenProps {
  onOpenVerify: () => void;
  onOpenKyc: () => void;
  onOpenStatements: () => void;
}

type Step = "loading" | "backend_pending" | "blocked" | "form" | "submitting" | "results";

const FACTOR_LABELS: Record<string, string> = {
  score: "Score Creva",
  monthly_income: "Ingreso mensual estimado",
  spend_volatility: "Estabilidad de tu gasto",
  savings_rate: "Tasa de ahorro",
  account_age_days: "Antigüedad de tu actividad",
  amount_range: "Monto solicitado",
};

const INCOME_SOURCE_LABEL: Record<string, string> = {
  bank_statements: "Calculado con tus estados de cuenta",
  declared: "Con las cifras que declaraste — sube tus estados de cuenta para respaldarlas",
  collateral_proxy: "Estimado con tu colateral — sube tus estados de cuenta para afinarlo",
  none: "Sin datos de ingreso todavía",
};

const KYC_MESSAGE =
  "Se hace una sola vez. La institución financiera podrá validar quién eres, y Creva la reutiliza cuando pidas tu tarjeta.";

function formatFactorValue(name: string, raw: string): string {
  if (name === "score") return Math.round(parseFloat(raw)).toString();
  if (name === "account_age_days") return `${Math.round(parseFloat(raw))} días`;
  if (name === "monthly_income") return formatMoneyRounded(raw) || "—";
  if (name === "spend_volatility" || name === "savings_rate") return formatPercent(raw) || "—";
  if (name === "amount_range" && raw.includes("–")) {
    const [min, max] = raw.split("–");
    return `${formatMoneyRounded(min)} – ${formatMoneyRounded(max)}`;
  }
  return formatMoneyRounded(raw) || raw;
}

function normalizePhone(value: string): string {
  return value.startsWith("+") ? value.replace(/[^\d+]/g, "") : `+52${value.replace(/\D/g, "")}`;
}

function GateCard({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <Card>
      <View className="gap-2">
        <Text className="text-base font-bold text-text">{title}</Text>
        <Text className="text-sm leading-5 text-text/70">{body}</Text>
        {children}
      </View>
    </Card>
  );
}

function PhoneVerification({ onVerified }: { onVerified: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    profiles
      .get()
      .then((me) => setPhone((current) => current || me.phone || ""))
      .catch(() => {});
  }, []);

  async function handle() {
    setError("");
    setBusy(true);
    try {
      if (codeSent) {
        await auth.verifyPhoneCode(normalizePhone(phone), code);
        onVerified();
      } else {
        await auth.sendPhoneCode(normalizePhone(phone));
        setCodeSent(true);
      }
    } catch (err) {
      const detail = (err as { body?: { message?: string } })?.body?.message;
      setError(detail ?? (codeSent ? "El código no es válido o ya expiró." : "No pudimos enviar el código."));
    } finally {
      setBusy(false);
    }
  }

  const disabled =
    busy || (codeSent ? code.length < 4 : phone.replace(/\D/g, "").length < 10);

  return (
    <View className="gap-3">
      <TextField
        label="Número de teléfono"
        value={phone}
        onChangeText={setPhone}
        placeholder="+52 55 1234 5678"
        keyboardType="phone-pad"
        editable={!codeSent}
      />
      {codeSent ? (
        <TextField
          label="Código de verificación"
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, "").slice(0, 10))}
          placeholder="Código de 6 dígitos"
          keyboardType="number-pad"
        />
      ) : null}
      {error ? <Text className="text-sm text-crimson">{error}</Text> : null}
      <Pressable
        className={`rounded-xl bg-crimson px-5 py-3 ${disabled ? "opacity-50" : ""}`}
        disabled={disabled}
        onPress={handle}
        testID="credit-phone-cta"
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-center font-semibold text-white">
            {codeSent ? "Confirmar código" : "Enviarme un código"}
          </Text>
        )}
      </Pressable>
      {codeSent ? (
        <Pressable
          onPress={() => {
            setCodeSent(false);
            setCode("");
            setError("");
          }}
        >
          <Text className="text-center text-sm font-semibold text-text/60">Cambiar el número</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProfileSummary({ profile }: { profile: CreditProfile }) {
  const rows = [
    { label: "Score Creva", value: profile.score === null ? "—" : `${profile.score}/100` },
    { label: "Ingreso mensual estimado", value: formatMoneyRounded(profile.estimatedMonthlyIncome) || "—" },
    { label: "Gasto mensual promedio", value: formatMoneyRounded(profile.averageMonthlySpend) || "—" },
    { label: "Antigüedad de tu actividad", value: `${profile.observedDays} días` },
  ];
  return (
    <Card>
      <View className="gap-2.5">
        <Text className="text-sm font-bold text-text">Con lo que Creva ve de ti</Text>
        {rows.map((row) => (
          <View key={row.label} className="flex-row justify-between gap-3">
            <Text className="text-sm text-text/60">{row.label}</Text>
            <Text className="text-sm font-semibold text-text">{row.value}</Text>
          </View>
        ))}
        <Text className="text-xs text-text/50">
          {INCOME_SOURCE_LABEL[profile.incomeSource] ?? ""}
          {profile.statementEntryCount > 0
            ? ` · ${profile.statementEntryCount} movimientos de tus estados de cuenta`
            : ""}
        </Text>
      </View>
    </Card>
  );
}

function MatchCard({ match, onSelect, busy }: { match: CreditMatch; onSelect: () => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <View className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-text">{match.productType}</Text>
            <Text className="text-xs text-text/50">{match.lenderName}</Text>
          </View>
          <Text className="rounded-full bg-crimson/10 px-2.5 py-1 text-xs font-bold text-crimson">
            {match.fitScore}% afinidad
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase text-text/50">Monto sugerido</Text>
          <Text className="text-xl font-bold text-text">{formatMoneyRounded(match.amountSuggested) || "—"}</Text>
          <Text className="text-xs text-text/60">
            Tasa desde {match.interestRateFrom}% · hasta {match.termMonthsMax} meses
          </Text>
        </View>

        <Pressable
          className={`rounded-xl bg-crimson px-5 py-3 ${busy ? "opacity-50" : ""}`}
          disabled={busy}
          onPress={onSelect}
          testID={`credit-select-${match.productId}`}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">Continuar con este crédito</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setOpen((v) => !v)} testID={`credit-why-${match.productId}`}>
          <Text className="text-center text-sm font-semibold text-crimson">
            {open ? "Ocultar el porqué" : "¿Por qué me aparece esto?"}
          </Text>
        </Pressable>

        {open ? (
          <View className="gap-2.5">
            <Text className="text-sm leading-5 text-text/70">{match.messageEs}</Text>
            {match.matchFactors.map((factor) => (
              <View key={factor.name} className="flex-row items-center gap-2.5">
                <View
                  className={`h-4 w-4 items-center justify-center rounded-full ${
                    factor.passed ? "bg-success-bg" : "bg-warning-bg"
                  }`}
                >
                  <Text className={`text-[10px] font-bold ${factor.passed ? "text-success" : "text-warning-text"}`}>
                    {factor.passed ? "✓" : "!"}
                  </Text>
                </View>
                <Text className="flex-1 text-xs text-text/70">
                  {FACTOR_LABELS[factor.name] ?? factor.name}
                  {factor.name === "spend_volatility" ? " · Menor es mejor" : ""}
                </Text>
                <Text className="text-xs font-semibold text-text">
                  {formatFactorValue(factor.name, factor.observed)}
                </Text>
              </View>
            ))}
            <Text className="text-xs text-text/50">
              Requisito del producto:{" "}
              {match.matchFactors
                .filter((f) => f.name !== "amount_range")
                .map((f) => `${FACTOR_LABELS[f.name] ?? f.name} ${formatFactorValue(f.name, f.threshold)}`)
                .join(" · ")}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-2xl border border-warning-border bg-warning-bg p-4">
      <Text className="text-sm leading-5 text-text/80">{children}</Text>
    </View>
  );
}

export function CreditScreen({ onOpenVerify, onOpenKyc, onOpenStatements }: CreditScreenProps) {
  const [step, setStep] = useState<Step>("loading");
  const [eligibility, setEligibility] = useState<CreditEligibility | null>(null);
  const [result, setResult] = useState<CreditRecommendationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [request, setRequest] = useState<CreditRequest | null>(null);
  const [selected, setSelected] = useState<CreditMatch | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [skippedKyc, setSkippedKyc] = useState(false);

  const loadEligibility = useCallback(() => {
    setStep("loading");
    return credit
      .eligibility()
      .then((data) => {
        setEligibility(data);
        setStep(data.eligible ? "form" : "blocked");
      })
      .catch((err) => {
        if (isBackendUnlinked(err)) {
          setStep("backend_pending");
          return;
        }
        setErrorMsg("No pudimos verificar tus datos de contacto. Intenta de nuevo en un minuto.");
        setStep("blocked");
      });
  }, []);

  useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  async function runRecommendation(next: CreditRequest) {
    setRequest(next);
    setErrorMsg("");
    setStep("submitting");
    try {
      const data = await credit.recommend(next);
      setResult(data);
      setSelected(null);
      setSkippedKyc(false);
      setStep("results");
    } catch {
      setErrorMsg("No pudimos calcular tu recomendación. Intenta de nuevo.");
      setStep("form");
    }
  }

  async function handleSelect(match: CreditMatch) {
    if (!request) return;
    setSelecting(match.productId);
    setSaveFailed(false);
    try {
      const saved = await credit.select({ productId: match.productId, ...request });
      setSelectionId(saved.id);
    } catch {
      setSaveFailed(true);
      setSelectionId(null);
    } finally {
      setSelecting(null);
      setSelected(match);
    }
  }

  function markSelection(status: "kyc_started" | "abandoned") {
    if (!selectionId) return Promise.resolve();
    return credit.updateSelection(selectionId, status).catch(() => {});
  }

  function backToOptions() {
    void markSelection("abandoned");
    setSelected(null);
    setSkippedKyc(false);
    setSelectionId(null);
    setSaveFailed(false);
  }

  async function handleSendEmailLink() {
    try {
      const me = await auth.me();
      await auth.forgotPassword(me.email);
      setLinkSent(true);
    } catch {
      setErrorMsg("No se pudo enviar el enlace. Intenta en un minuto.");
    }
  }

  if (step === "form" || step === "submitting") {
    return (
      <CreditRequestForm
        onSubmit={(next) => void runRecommendation(next)}
        submitting={step === "submitting"}
        error={errorMsg || null}
        onBack={() => setStep(eligibility?.eligible ? "results" : "blocked")}
        initialRequest={request ?? undefined}
      />
    );
  }

  const showingResults = step === "results" && result !== null && selected === null;
  const showingChoice = step === "results" && result !== null && selected !== null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="credit-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        {showingChoice ? <BackButton onPress={backToOptions} /> : null}
        {showingResults ? <BackButton onPress={() => setStep("form")} /> : null}

        <Text className="text-3xl font-bold text-text">
          {showingChoice ? "Tu elección" : showingResults ? "Tus opciones" : step === "blocked" ? "Confirma tu contacto" : "Recomendación de crédito"}
        </Text>
        <Text className="mb-6 mt-1 text-sm leading-5 text-text/60">
          {showingChoice
            ? "Confirma el crédito que elegiste y decide si quieres verificar tu identidad ahora."
            : showingResults
              ? "Cada producto muestra por qué te aparece y qué criterios cumpliste."
              : step === "blocked"
                ? "Solo necesitamos tus datos de contacto. La verificación de identidad no hace falta todavía."
                : "Cuéntanos qué necesitas y te decimos a qué productos calificas con tu actividad en Creva."}
        </Text>

        {step === "loading" ? (
          <View className="items-center py-10" testID="credit-loading">
            <ActivityIndicator />
          </View>
        ) : null}

        {step === "backend_pending" ? <BackendPendingState /> : null}

        {step === "blocked" ? (
          <View className="gap-3.5" testID="credit-blocked">
            {errorMsg ? <Text className="text-sm text-crimson">{errorMsg}</Text> : null}
            {eligibility?.missing.includes("email_not_verified") ? (
              <GateCard
                title="Confirma tu correo"
                body="Es el canal por el que te entregamos la recomendación y su seguimiento."
              >
                {linkSent ? (
                  <Text className="text-sm font-semibold text-success-text">
                    Te enviamos un enlace a tu correo. Ábrelo y vuelve aquí.
                  </Text>
                ) : (
                  <Pressable
                    className="rounded-xl bg-crimson px-5 py-3"
                    onPress={handleSendEmailLink}
                    testID="credit-email-cta"
                  >
                    <Text className="text-center font-semibold text-white">
                      Enviarme un enlace a mi correo
                    </Text>
                  </Pressable>
                )}
              </GateCard>
            ) : null}
            {eligibility?.missing.includes("phone_not_verified") ? (
              <GateCard
                title="Confirma tu teléfono"
                body="Te mandamos un código para avisarte del avance de tu solicitud."
              >
                <PhoneVerification onVerified={loadEligibility} />
              </GateCard>
            ) : null}
          </View>
        ) : null}

        {showingChoice && selected && result ? (
          <View className="gap-4">
            <Notice>
              Este paso está en construcción. Guardamos tu elección para tenerla lista, pero todavía
              no hay una solicitud que enviar a la institución: el catálogo es de referencia.
            </Notice>
            <Card>
              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase text-text/50">Elegiste</Text>
                <Text className="text-xl font-bold text-text">
                  {formatMoneyRounded(selected.amountSuggested) || "—"}
                </Text>
                <Text className="text-sm font-bold text-text">{selected.productType}</Text>
                <Text className="text-xs text-text/60">
                  Tasa desde {selected.interestRateFrom}% · hasta {selected.termMonthsMax} meses
                </Text>
              </View>
            </Card>
            {saveFailed ? (
              <Notice>No pudimos guardar tu selección, pero puedes continuar.</Notice>
            ) : null}
            {result.eligibility.kycCompleted ? (
              <GateCard
                title="Tu identidad ya está verificada"
                body="Creva la reutiliza para esta solicitud y para tu tarjeta. No tienes que repetirla."
              />
            ) : skippedKyc ? (
              <GateCard
                title="Seguimos sin verificar tu identidad"
                body="Mientras el catálogo sea de referencia no hay una solicitud real que enviar. Cuando quieras puedes verificarte."
              >
                <Pressable onPress={onOpenKyc} testID="credit-kyc-later-cta">
                  <Text className="text-sm font-semibold text-crimson">
                    Verificar mi identidad ahora →
                  </Text>
                </Pressable>
              </GateCard>
            ) : (
              <GateCard title="Verifica tu identidad (opcional)" body={KYC_MESSAGE}>
                <View className="gap-2">
                  <Pressable
                    className="rounded-xl bg-crimson px-5 py-3"
                    onPress={async () => {
                      await markSelection("kyc_started");
                      onOpenKyc();
                    }}
                    testID="credit-kyc-cta"
                  >
                    <Text className="text-center font-semibold text-white">Verificar mi identidad</Text>
                  </Pressable>
                  <Pressable onPress={() => setSkippedKyc(true)} testID="credit-kyc-skip">
                    <Text className="text-center text-sm font-semibold text-text/60">
                      Continuar sin verificar
                    </Text>
                  </Pressable>
                </View>
              </GateCard>
            )}
          </View>
        ) : null}

        {showingResults && result ? (
          <View className="gap-4">
            <Notice>
              Catálogo de referencia: ejemplos para mostrarte cómo funciona el match, todavía no son
              ofertas reales de un prestamista.
            </Notice>
            {result.profile ? <ProfileSummary profile={result.profile} /> : null}

            {result.status === "ok" ? (
              <View className="gap-4">
                <Text className="text-sm text-text/70">
                  {result.matches.length === 1
                    ? "Encontramos 1 producto compatible con tu perfil."
                    : `Encontramos ${result.matches.length} productos compatibles con tu perfil.`}
                </Text>
                {result.matches.map((match) => (
                  <MatchCard
                    key={match.productId}
                    match={match}
                    busy={selecting === match.productId}
                    onSelect={() => handleSelect(match)}
                  />
                ))}
                <Pressable onPress={() => setStep("form")}>
                  <Text className="text-center text-sm font-semibold text-crimson">
                    Cambiar mi solicitud
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {result.status === "insufficient_data" ? (
              <Card testID="credit-insufficient">
                <View className="gap-3">
                  <Text className="text-sm font-bold text-text">Todavía no hay suficiente actividad</Text>
                  <Text className="text-sm leading-5 text-text/70">
                    Guardamos lo que declaraste, pero aún no alcanza para leer tu perfil. Sube tus
                    estados de cuenta y volvemos a intentarlo con cifras respaldadas.
                  </Text>
                  <Pressable
                    className="rounded-xl bg-crimson px-5 py-3"
                    onPress={onOpenStatements}
                    testID="credit-statements-cta"
                  >
                    <Text className="text-center font-semibold text-white">
                      Subir mis estados de cuenta
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setStep("form")}>
                    <Text className="text-center text-sm font-semibold text-text/60">
                      Revisar mi solicitud
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ) : null}

            {result.status === "no_match" ? (
              <Card testID="credit-no-match">
                <View className="gap-3">
                  <Text className="text-sm font-bold text-text">Ningún producto encaja todavía</Text>
                  <Text className="text-sm leading-5 text-text/70">
                    Con el monto y el plazo que pediste, tu perfil aún no alcanza los requisitos.
                    Prueba con un monto menor o un plazo más corto.
                  </Text>
                  <Pressable onPress={() => setStep("form")}>
                    <Text className="text-center text-sm font-semibold text-crimson">
                      Cambiar mi solicitud
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ) : null}

            {result.status === "not_eligible" ? (
              <Card testID="credit-not-eligible">
                <View className="gap-3">
                  <Text className="text-sm font-bold text-text">
                    Falta confirmar tus datos de contacto
                  </Text>
                  <Text className="text-sm leading-5 text-text/70">
                    Necesitamos tu correo y tu teléfono confirmados para entregarte la recomendación.
                  </Text>
                  <Pressable onPress={loadEligibility}>
                    <Text className="text-center text-sm font-semibold text-crimson">
                      Revisar mis datos
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ) : null}
          </View>
        ) : null}

        {step === "blocked" || showingResults ? (
          <Section>
            <Pressable onPress={onOpenVerify} testID="credit-open-verify" className="mt-6">
              <Card>
                <Text className="text-center text-sm font-semibold text-crimson">
                  Comprobar un reporte sellado →
                </Text>
              </Card>
            </Pressable>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
