// BusinessVerificationScreen.tsx: mobile port of creva_finance's app/business-verification/page.tsx
// — the official-directory badge. It never moves the score. Like the reference it searches on open
// when the fiscal profile already holds the name and state, and shows the fields only when it cannot.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { crevaScore, profiles, type BusinessVerificationResult } from "../../lib/api";
import { MX_STATES, stateLabel } from "../../lib/mx-states";
import { formatLongDay } from "../../lib/format-date";
import { BackButton } from "../shared/BackButton";
import { Card } from "../query/components/VisualPrimitives";
import { SelectField, TextField } from "../profile/components/FormField";

export interface BusinessVerificationScreenProps {
  onBack: () => void;
}

const STATE_OPTIONS = MX_STATES.map((state) => ({ value: String(state.code), label: state.label }));

const STATUS_COPY: Record<
  BusinessVerificationResult["status"],
  { title: string; detail: string; tone: "success" | "info" | "warning" }
> = {
  verified: {
    title: "Tu negocio aparece en el directorio oficial",
    detail:
      "Encontramos tu negocio en el directorio de establecimientos. Aquí está de dónde salió y de cuándo es.",
    tone: "success",
  },
  not_listed: {
    title: "Tu negocio no está en el directorio",
    detail:
      "Estar en el directorio es voluntario, así que no aparecer no dice nada de tu negocio y no te resta nada.",
    tone: "info",
  },
  ambiguous: {
    title: "Encontramos varios negocios con nombre parecido",
    detail:
      "No pudimos distinguir cuál es el tuyo, y preferimos no darte un sello que no sea tuyo. No es lo mismo que no estar registrado: prueba acotando el estado.",
    tone: "warning",
  },
  unavailable: {
    title: "No pudimos consultar el directorio",
    detail:
      "La consulta no respondió en este momento. Esto no dice nada de tu negocio: vuelve a intentar más tarde.",
    tone: "warning",
  },
};

const TONE_CLASS: Record<"success" | "info" | "warning", string> = {
  success: "border-success-border bg-success-bg",
  info: "border-info-border bg-info-bg",
  warning: "border-warning-border bg-warning-bg",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-text/60">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-text">{value}</Text>
    </View>
  );
}

export function BusinessVerificationScreen({ onBack }: BusinessVerificationScreenProps) {
  const [businessName, setBusinessName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [result, setResult] = useState<BusinessVerificationResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askingAgain, setAskingAgain] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const search = useCallback(async (name: string, code: string) => {
    setIsSearching(true);
    setError(null);
    try {
      setResult(
        await crevaScore.verify({
          businessName: name.trim() || undefined,
          stateCode: code === "" ? undefined : Number(code),
        }),
      );
    } catch {
      setError("No pudimos hacer la consulta ahora. Intenta de nuevo en un momento.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    profiles
      .getFiscal()
      .then((fiscal) => {
        if (cancelled) return;
        const name = fiscal.businessName ?? "";
        const code = fiscal.stateCode === null ? "" : String(fiscal.stateCode);
        setBusinessName(name);
        setStateCode(code);
        setLoadingProfile(false);
        if (name.trim().length > 1 && code !== "") void search(name, code);
        else setAskingAgain(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingProfile(false);
        setAskingAgain(true);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  const copy = result ? STATUS_COPY[result.status] : null;
  const searched = [businessName, stateLabel(Number(stateCode))].filter(Boolean).join(" · ");

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="business-verification-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Sello de tu negocio</Text>
        <Text className="mb-6 mt-1 text-sm leading-5 text-text/60">
          Buscamos tu negocio en el directorio oficial de establecimientos. Si está, emitimos un
          sello con su fuente y su fecha.
        </Text>

        <View className="mb-4 rounded-2xl border border-info-border bg-info-bg p-4">
          <Text className="text-sm leading-5 text-text/70">
            Tu puntaje no depende de esto. Con sello o sin él, tu score es exactamente el mismo. El
            directorio cubre mucho mejor a unos estados que a otros, y darle puntos premiaría dónde
            vives.
          </Text>
        </View>

        {loadingProfile || isSearching ? (
          <View className="items-center py-6" testID="bv-loading">
            <ActivityIndicator />
          </View>
        ) : null}

        {!loadingProfile && !askingAgain && !isSearching ? (
          <Card>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-0.5">
                <Text className="text-xs text-text/50">Buscamos con lo que ya nos diste</Text>
                <Text className="text-sm font-semibold text-text">{searched}</Text>
              </View>
              <Pressable onPress={() => setAskingAgain(true)} testID="bv-change-cta">
                <Text className="text-sm font-semibold text-crimson">Cambiar</Text>
              </Pressable>
            </View>
          </Card>
        ) : null}

        {askingAgain ? (
          <View testID="bv-fields">
            <TextField
              label="Nombre de tu negocio"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Como aparece en tu registro"
              testID="bv-name-input"
            />
            <SelectField
              label="Estado"
              value={stateCode}
              options={STATE_OPTIONS}
              onChange={setStateCode}
              placeholder="Selecciona tu estado"
              testID="bv-state-select"
            />
            <Text className="mb-4 text-xs leading-4 text-text/50">
              Sin estado, un nombre común devuelve miles de coincidencias y no se emite ningún sello.
            </Text>
            <Pressable
              className={`rounded-xl bg-crimson px-5 py-3 ${
                isSearching || businessName.trim().length < 2 ? "opacity-60" : ""
              }`}
              onPress={() => void search(businessName, stateCode)}
              disabled={isSearching || businessName.trim().length < 2}
              testID="bv-search-cta"
            >
              <Text className="text-center font-semibold text-white">
                {isSearching ? "Buscando…" : "Buscar mi negocio"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <View className="mt-4 rounded-2xl border border-danger-border bg-danger-bg p-4" testID="bv-error">
            <Text className="text-sm text-crimson">{error}</Text>
          </View>
        ) : null}

        {result && copy ? (
          <View className="mt-4 gap-3.5" testID="bv-result">
            <View className={`rounded-2xl border p-4 ${TONE_CLASS[copy.tone]}`}>
              <Text className="mb-1.5 text-sm font-bold text-text">{copy.title}</Text>
              <Text className="text-sm leading-5 text-text/70">{copy.detail}</Text>
            </View>

            {result.badge ? (
              <Card>
                <View className="gap-3">
                  <View className="gap-0.5">
                    <Text className="text-xs text-text/50">Nombre registrado</Text>
                    <Text className="text-sm font-semibold text-text">
                      {result.badge.commercial_name ?? "—"}
                    </Text>
                  </View>
                  <View className="h-px bg-text/10" />
                  <View className="gap-2">
                    <Row label="Estado" value={result.badge.state ?? stateLabel(result.stateCode) ?? "—"} />
                    <Row label="Fuente" value="Directorio oficial (SIEM)" />
                    <Row label="Consultado el" value={formatLongDay(result.badge.checked_at) || "—"} />
                    <Row
                      label="Confirmado con tu RFC"
                      value={result.badge.confirmed_by_rfc ? "Sí" : "No, solo por nombre"}
                    />
                  </View>
                </View>
              </Card>
            ) : null}

            {result.matchedBy === "holder" ? (
              <Text className="text-sm leading-5 text-text/60">
                Coincidió con tu nombre, no con el del negocio. Es lo normal cuando estás dada de alta
                como persona física: el registro va a tu nombre.
              </Text>
            ) : null}

            {result.searchedAs.length > 0 ? (
              <Text className="text-xs text-text/50">Buscamos como: {result.searchedAs.join(" · ")}</Text>
            ) : null}

            {result.rfcNote ? (
              <Text className="text-xs text-text/50">Sobre tu RFC: {result.rfcNote}</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
