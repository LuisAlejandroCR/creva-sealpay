// KycFormScreen.tsx: mobile port of creva_finance/frontend/app/kyc/page.tsx — the identity-data
// form (name, CURP, email, phone) that hands off to the provider via kyc.apply. Onboarding step 2,
// after World Selfie Check; World Selfie Check is a separate personhood check and is untouched here.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useUser } from "@clerk/clerk-expo";

import { kyc, profiles } from "../../lib/api";
import { isValidCurp, formatMxPhone } from "./kyc-format";
import { BackButton } from "../shared/BackButton";
import { Card } from "../query/components/VisualPrimitives";
import { TextField } from "../profile/components/FormField";

// Onboarding step: a skip is allowed (World Selfie Check already ran), so onDone ends the step.
export interface KycFormScreenProps {
  onDone: () => void;
}

type Step = "loading" | "form" | "processing" | "pending" | "verified" | "unavailable";

function StatusCard({
  title,
  body,
  tone,
  children,
}: {
  title: string;
  body: string;
  tone: "warning" | "success" | "default";
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === "success" ? "text-success-text" : tone === "warning" ? "text-warning-text" : "text-text";
  return (
    <Card>
      <View className="gap-3">
        <Text className={`text-base font-bold ${toneClass}`}>{title}</Text>
        <Text className="text-sm leading-5 text-text/70">{body}</Text>
        {children}
      </View>
    </Card>
  );
}

export function KycFormScreen({ onDone }: KycFormScreenProps) {
  const { user } = useUser();
  const [step, setStep] = useState<Step>("loading");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [curp, setCurp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    kyc
      .status()
      .then((result) => {
        if (!result) return setStep("form");
        if (result.kyc?.status === "approved") return setStep("verified");
        if (result.availability && (!result.availability.identity || !result.availability.onramp)) {
          return setStep("unavailable");
        }
        if (result.kyc != null) {
          setAuthUrl(result.collateral?.authorization_url ?? null);
          return setStep("pending");
        }
        setStep("form");
      })
      .catch(() => setStep("form"));
  }, []);

  useEffect(() => {
    setEmail((current) => current || user?.primaryEmailAddress?.emailAddress || "");
    setFirstName((current) => current || user?.firstName || "");
    setLastName((current) => current || user?.lastName || "");
    profiles
      .get()
      .then((me) => {
        setFirstName((current) => current || me.firstName || "");
        setLastName((current) => current || me.lastName || "");
        setEmail((current) => current || me.email || "");
        setPhone((current) => current || me.phone || "");
      })
      .catch(() => {
        /* the Clerk session above is the fallback */
      });
  }, [user]);

  const checkVerification = useCallback(() => {
    kyc
      .status()
      .then((result) => {
        if (result.kyc?.status === "approved") setStep("verified");
      })
      .catch(() => {
        /* leave the user on the pending screen */
      });
  }, []);

  async function handleSubmit() {
    setErrorMsg(null);
    if (!isValidCurp(curp)) {
      setErrorMsg("El CURP no tiene un formato válido. Revisa que sean 18 caracteres.");
      return;
    }
    setStep("processing");
    setIsLoading(true);
    try {
      const formattedPhone = formatMxPhone(phone);
      const result = await kyc.apply({
        firstName,
        lastName,
        email,
        curp,
        phone: formattedPhone || undefined,
      });
      if (result.authorization_url) {
        await WebBrowser.openBrowserAsync(result.authorization_url);
        setAuthUrl(result.authorization_url);
      }
      setStep("pending");
    } catch (err) {
      const message =
        (err as { body?: { message?: string } })?.body?.message ??
        "No se pudo iniciar la verificación. Verifica tus datos e intenta de nuevo.";
      setErrorMsg(message);
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="kyc-form-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onDone} />

        {step === "loading" ? (
          <View className="items-center py-10" testID="kyc-loading">
            <ActivityIndicator />
          </View>
        ) : step === "unavailable" ? (
          <StatusCard
            title="En cambio de proveedor"
            body="Estamos cambiando la forma en que verificamos tu identidad, así que la tarjeta Creva no se puede activar por ahora. No perdiste nada: cuando esté lista, seguimos justo donde te quedaste."
            tone="default"
          >
            <Pressable className="rounded-xl bg-crimson px-5 py-3" onPress={onDone} testID="kyc-panel-cta">
              <Text className="text-center font-semibold text-white">Ir al panel</Text>
            </Pressable>
          </StatusCard>
        ) : step === "processing" ? (
          <View className="items-center gap-4 py-10" testID="kyc-processing">
            <ActivityIndicator />
            <Text className="text-center text-base text-text/70">
              Te redirigiremos para completar tu verificación de identidad.
            </Text>
          </View>
        ) : step === "pending" ? (
          <StatusCard
            title="Verificación en proceso"
            body="Tu identidad está en revisión. Este proceso puede tomar unos minutos. Cuando sea aprobada, podrás crear tu tarjeta y depositar."
            tone="warning"
          >
            {authUrl ? (
              <Pressable
                className="rounded-xl bg-crimson px-5 py-3"
                onPress={() => authUrl && WebBrowser.openBrowserAsync(authUrl)}
                testID="kyc-continue-cta"
              >
                <Text className="text-center font-semibold text-white">Continuar con la verificación</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={checkVerification} testID="kyc-recheck-cta">
              <Text className="text-center text-sm font-semibold text-text/60">Verificar estado</Text>
            </Pressable>
            <Pressable onPress={onDone} testID="kyc-panel-cta">
              <Text className="text-center text-sm font-semibold text-text/60">Ir al panel</Text>
            </Pressable>
          </StatusCard>
        ) : step === "verified" ? (
          <StatusCard
            title="¡Verificación exitosa!"
            body="Tu identidad ha sido verificada. Ya puedes depositar y crear tu tarjeta Creva."
            tone="success"
          >
            <Pressable className="rounded-xl bg-crimson px-5 py-3" onPress={onDone} testID="kyc-panel-cta">
              <Text className="text-center font-semibold text-white">Ir al panel</Text>
            </Pressable>
          </StatusCard>
        ) : (
          <View>
            <Text className="text-3xl font-bold text-text">Verifica tu identidad</Text>
            <Text className="mb-6 mt-1 text-sm leading-5 text-text/60">
              Traemos tus datos de tu perfil. Revisa que estén bien y agrega tu CURP.
            </Text>

            {errorMsg ? (
              <View className="mb-4 rounded-2xl border border-danger-border bg-danger-bg p-4" testID="kyc-error">
                <Text className="text-sm text-crimson">{errorMsg}</Text>
              </View>
            ) : null}

            <TextField label="Nombre(s) *" value={firstName} onChangeText={setFirstName} placeholder="Tu nombre" testID="kyc-first-name" />
            <TextField label="Apellido *" value={lastName} onChangeText={setLastName} placeholder="Tu apellido" testID="kyc-last-name" />
            <TextField
              label="CURP *"
              value={curp}
              onChangeText={(text) => setCurp(text.toUpperCase())}
              placeholder="AAAA000000AAAAAA00"
              autoCapitalize="characters"
              maxLength={18}
              testID="kyc-curp"
            />
            <TextField
              label="Correo electrónico *"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              testID="kyc-email"
            />
            <TextField
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="+52 55 1234 5678"
              keyboardType="phone-pad"
              testID="kyc-phone"
            />

            <Text className="mb-4 text-center text-xs text-text/50">
              Te llevaremos a completar la verificación de forma segura.
            </Text>

            <Pressable
              className={`rounded-xl bg-crimson px-5 py-3 ${isLoading ? "opacity-60" : ""}`}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="kyc-submit-cta"
            >
              <Text className="text-center font-semibold text-white">
                {isLoading ? "Enviando…" : "Verificar identidad"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
