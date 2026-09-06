// CardCreateScreen.tsx: mobile port of creva_finance's app/card-create/page.tsx — issues the card
// via cards.issue and shows one full-screen state (kyc-pending / creating / ready / error), each
// with the same way out. Issuance runs on mount once KYC is confirmed approved.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cards, kyc } from "../../lib/api";
import { BackButton } from "../shared/BackButton";
import { VirtualCard } from "./VirtualCard";

export interface CardCreateScreenProps {
  onBack: () => void;
  onDone: () => void;
  onOpenKyc: () => void;
}

type Step = "checking" | "kyc-pending" | "creating" | "ready" | "error";

export function CardCreateScreen({ onBack, onDone, onOpenKyc }: CardCreateScreenProps) {
  const [step, setStep] = useState<Step>("checking");
  const [errorDetail, setErrorDetail] = useState("");

  const issueCard = useCallback(async () => {
    setStep("creating");
    try {
      await cards.issue({});
      setStep("ready");
    } catch (err) {
      const error = err as { status?: number; body?: { message?: string } };
      if (error.status === 409) {
        setStep("ready");
      } else if (error.status === 400) {
        setErrorDetail(error.body?.message ?? "Verifica tu identidad y tu garantía");
        setStep("error");
      } else {
        setErrorDetail("El servicio de tarjetas no está disponible. Intenta más tarde.");
        setStep("error");
      }
    }
  }, []);

  useEffect(() => {
    kyc
      .status()
      .then((result) => {
        if (result.kyc?.status === "approved") void issueCard();
        else setStep("kyc-pending");
      })
      .catch(() => setStep("kyc-pending"));
  }, [issueCard]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="card-create-screen">
      <ScrollView className="flex-1" contentContainerClassName="flex-grow px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />

        {step === "checking" || step === "creating" ? (
          <View className="flex-1 items-center justify-center gap-4" testID="card-create-working">
            <ActivityIndicator />
            <Text className="text-center text-base text-text/70">
              {step === "creating"
                ? "Estamos preparando tu tarjeta virtual Creva."
                : "Revisando tu verificación…"}
            </Text>
          </View>
        ) : step === "kyc-pending" ? (
          <View className="flex-1 justify-center gap-4">
            <Text className="text-2xl font-bold text-text">Completa tu KYC primero</Text>
            <Text className="text-sm leading-5 text-text/70">
              La activación de tu tarjeta Creva está disponible después de terminar la verificación
              de identidad.
            </Text>
            <Pressable className="rounded-xl bg-crimson px-5 py-3" onPress={onOpenKyc} testID="card-create-kyc-cta">
              <Text className="text-center font-semibold text-white">Ir a KYC</Text>
            </Pressable>
          </View>
        ) : step === "error" ? (
          <View className="flex-1 justify-center gap-4" testID="card-create-error">
            <Text className="text-2xl font-bold text-crimson">No se pudo crear la tarjeta</Text>
            <Text className="text-sm leading-5 text-text/70">
              {errorDetail || "Hubo un problema al activar tu tarjeta. Verifica tu garantía e intenta de nuevo."}
            </Text>
            <Pressable className="rounded-xl bg-crimson px-5 py-3" onPress={() => void issueCard()} testID="card-create-retry">
              <Text className="text-center font-semibold text-white">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 justify-center gap-6" testID="card-create-ready">
            <Text className="text-2xl font-bold text-success-text">¡Tu tarjeta está lista!</Text>
            <Text className="text-sm leading-5 text-text/70">
              Tu tarjeta virtual Creva ha sido activada con tu garantía como respaldo.
            </Text>
            <VirtualCard />
            <Pressable className="rounded-xl bg-crimson px-5 py-3" onPress={onDone} testID="card-create-done">
              <Text className="text-center font-semibold text-white">Ver mis tarjetas</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
