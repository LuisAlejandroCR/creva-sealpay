// App.tsx: wires all seven feature screens (sign-in -> onboarding -> home/dashboard <-> profile ->
// help, plus paid query -> sealed verify) into one flow, mounted under ClerkAppProvider since
// SelfieCheckScreen, ProfileScreen and SignInScreen all need Clerk context. A minimal bottom tab
// bar (Inicio/Perfil) covers only the post-auth core screens (home, profile, help) — query, verify,
// onboarding and sign-in stay full-screen, matching how they already behaved before this wiring.
// The initial screen is gated on Clerk's real useAuth() (isLoaded/isSignedIn), not a hardcoded
// default, so a reload with an active session lands on home directly instead of re-showing sign-in.
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";

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
    <SafeAreaView edges={["bottom"]} className="border-t border-border bg-surface-1">
      <View className="flex-row">
        <Pressable
          onPress={() => onChange("home")}
          testID="tab-home"
          className="flex-1 items-center gap-1 py-3"
        >
          <Text className="text-lg">🏠</Text>
          <Text className={`text-xs font-semibold ${step === "home" ? "text-crimson" : "text-text-secondary"}`}>
            Inicio
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange("profile")}
          testID="tab-profile"
          className="flex-1 items-center gap-1 py-3"
        >
          <Text className="text-lg">👤</Text>
          <Text className={`text-xs font-semibold ${step === "profile" || step === "help" ? "text-crimson" : "text-text-secondary"}`}>
            Perfil
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function AppFlow() {
  const { isLoaded, isSignedIn } = useAuth();
  const [step, setStep] = useState<Step | null>(null);

  // Gate the initial screen on Clerk's real session state instead of defaulting to "sign-in":
  // a reload with an active session must land on home directly, never re-show sign-in (which
  // would then call signIn.create() against an already-active session and throw).
  useEffect(() => {
    if (!isLoaded || step !== null) return;
    setStep(isSignedIn ? "home" : "sign-in");
  }, [isLoaded, isSignedIn, step]);

  if (step === null) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#C41E3A" />
      </View>
    );
  }

  let screen: React.ReactNode;
  if (step === "sign-in") {
    screen = <SignInScreen onSignedIn={() => setStep("onboarding")} />;
  } else if (step === "onboarding") {
    screen = (
      <SelfieCheckScreen
        onVerified={() => setStep("home")}
        onSkipped={() => setStep("home")}
        onBack={() => setStep("home")}
      />
    );
  } else if (step === "home") {
    screen = <DashboardScreen onOpenScore={() => setStep("query")} />;
  } else if (step === "query") {
    screen = <QueryScreen onVerify={() => setStep("verify")} onBack={() => setStep("home")} />;
  } else if (step === "verify") {
    screen = <VerifyScreen folio="mock-folio" onBack={() => setStep("query")} />;
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
        <View className="flex-1 bg-bg">
          <AppFlow />
          <StatusBar style="auto" />
        </View>
      </ClerkAppProvider>
    </SafeAreaProvider>
  );
}
