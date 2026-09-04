// App.tsx: wires the three feature screens (onboarding -> paid query -> sealed verify) into one
// flow, mounted under ClerkAppProvider since SelfieCheckScreen and session-source.ts both need
// useAuth() in context. Assembled here by the Solver — each screen was built in its own worktree
// (feature-selfie-check, feature-agent-loop) without touching App.tsx, by design.
import { useState } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import "./global.css";
import { ClerkAppProvider } from "./features/auth/ClerkAppProvider";
import { SelfieCheckScreen } from "./features/onboarding/SelfieCheckScreen";
import { QueryScreen } from "./features/query/QueryScreen";
import { VerifyScreen } from "./features/verify/VerifyScreen";

type Step = "onboarding" | "query" | "verify";

function AppFlow() {
  const [step, setStep] = useState<Step>("onboarding");

  if (step === "onboarding") {
    return (
      <SelfieCheckScreen
        onVerified={() => setStep("query")}
        onSkipped={() => setStep("query")}
      />
    );
  }

  if (step === "query") {
    return <QueryScreen onVerify={() => setStep("verify")} />;
  }

  return <VerifyScreen folio="mock-folio" />;
}

export default function App() {
  return (
    <ClerkAppProvider>
      <View className="flex-1 bg-white">
        <AppFlow />
        <StatusBar style="auto" />
      </View>
    </ClerkAppProvider>
  );
}
