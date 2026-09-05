// App.tsx: wires all seven feature screens (sign-in -> onboarding -> home/dashboard <-> profile ->
// help, plus paid query -> sealed verify) into one flow, mounted under ClerkAppProvider since
// SelfieCheckScreen, ProfileScreen and SignInScreen all need Clerk context. A minimal bottom tab
// bar (Inicio/Perfil) covers only the post-auth core screens (home, profile, help) — query, verify,
// onboarding and sign-in stay full-screen, matching how they already behaved before this wiring.
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

import "./global.css";
import { ClerkAppProvider } from "./features/auth/ClerkAppProvider";
import { SignInScreen } from "./features/auth/SignInScreen";
import { SelfieCheckScreen } from "./features/onboarding/SelfieCheckScreen";
import { QueryScreen } from "./features/query/QueryScreen";
import { VerifyScreen } from "./features/verify/VerifyScreen";
import { DashboardScreen } from "./features/dashboard/DashboardScreen";
import { ProfileScreen } from "./features/profile/ProfileScreen";
import { HelpScreen } from "./features/help/HelpScreen";

type Step = "sign-in" | "onboarding" | "home" | "query" | "verify" | "profile" | "help";

const TAB_STEPS: Step[] = ["home", "profile", "help"];

function TabBar({ step, onChange }: { step: Step; onChange: (step: "home" | "profile") => void }) {
  return (
    <SafeAreaView edges={["bottom"]} className="border-t border-[#1A1613]/10 bg-white">
      <View className="flex-row">
        <Pressable
          onPress={() => onChange("home")}
          testID="tab-home"
          className="flex-1 items-center gap-1 py-3"
        >
          <Text className="text-lg">🏠</Text>
          <Text className={`text-xs font-semibold ${step === "home" ? "text-[#C41E3A]" : "text-[#1A1613]/50"}`}>
            Inicio
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange("profile")}
          testID="tab-profile"
          className="flex-1 items-center gap-1 py-3"
        >
          <Text className="text-lg">👤</Text>
          <Text className={`text-xs font-semibold ${step === "profile" || step === "help" ? "text-[#C41E3A]" : "text-[#1A1613]/50"}`}>
            Perfil
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function AppFlow() {
  const [step, setStep] = useState<Step>("sign-in");

  let screen: React.ReactNode;
  if (step === "sign-in") {
    screen = <SignInScreen onSignedIn={() => setStep("onboarding")} />;
  } else if (step === "onboarding") {
    screen = (
      <SelfieCheckScreen onVerified={() => setStep("home")} onSkipped={() => setStep("home")} />
    );
  } else if (step === "home") {
    screen = <DashboardScreen onOpenScore={() => setStep("query")} />;
  } else if (step === "query") {
    screen = <QueryScreen onVerify={() => setStep("verify")} />;
  } else if (step === "verify") {
    screen = <VerifyScreen folio="mock-folio" />;
  } else if (step === "profile") {
    screen = (
      <ProfileScreen onOpenHelp={() => setStep("help")} onSignedOut={() => setStep("sign-in")} />
    );
  } else {
    screen = <HelpScreen />;
  }

  return (
    <View className="flex-1">
      <View className="flex-1">{screen}</View>
      {TAB_STEPS.includes(step) && (
        <TabBar step={step} onChange={(next) => setStep(next)} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ClerkAppProvider>
        <View className="flex-1 bg-white">
          <AppFlow />
          <StatusBar style="auto" />
        </View>
      </ClerkAppProvider>
    </SafeAreaProvider>
  );
}
