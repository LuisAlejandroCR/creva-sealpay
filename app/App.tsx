// App.tsx: wires every feature screen into one flow (sign-in -> onboarding -> home) plus the
// restructured bottom nav: Inicio, Score, Tarjeta (disabled/PRONTO), Crédito, Más. "Más" opens
// MoreSheet ("Todo lo demás"), which routes Mi perfil/Ayuda to the existing ProfileScreen/
// HelpScreen and everything else to minimal stub screens (StubScreen). Every onPress the UI audit
// found as a no-op (Dashboard's score/credit/card/notifications, Profile's five menu rows, Help's
// article/category rows) now navigates somewhere real. Navigation stays the same plain step-state
// machine the app already used — no router library was added for this pass.
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
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
import { DeleteAccountScreen } from "./features/profile/DeleteAccountScreen";
import { HelpScreen } from "./features/help/HelpScreen";
import { HelpCategoryScreen } from "./features/help/HelpCategoryScreen";
import { HelpArticleScreen } from "./features/help/HelpArticleScreen";
import { ScoreScreen } from "./features/score/ScoreScreen";
import { CreditScreen } from "./features/credit/CreditScreen";
import { CardScreen } from "./features/card/CardScreen";
import { MoreSheet } from "./features/more/MoreSheet";
import { StubScreen } from "./features/shared/StubScreen";
import { findStubTopic, type StubTopicKey } from "./features/more/stub-topics";
import { findArticle, findCategory, type HelpArticle, type HelpCategory } from "./lib/help-content";
import { Icon, type IconName } from "./features/shared/icons/Icon";
import { useClerkSessionSource } from "./features/auth/session-source";
import { setSessionSource } from "./lib/api";

type Step =
  | "sign-in"
  | "onboarding"
  | "home"
  | "score"
  | "credit"
  | "card-info"
  | "query"
  | "verify"
  | "profile"
  | "profile-details"
  | "profile-fiscal"
  | "profile-security"
  | "profile-delete-account"
  | "help"
  | "help-category"
  | "help-article"
  | "more"
  | "stub";

/** Steps the tab bar highlights as one of its five destinations. */
const TAB_STEPS: Step[] = ["home", "score", "credit", "profile", "help", "more"];

interface TabDef {
  key: "home" | "score" | "card" | "credit" | "more";
  label: string;
  icon: IconName;
  step: Step | null;
  disabled?: boolean;
}

const TABS: TabDef[] = [
  { key: "home", label: "Inicio", icon: "home", step: "home" },
  { key: "score", label: "Score", icon: "score", step: "score" },
  { key: "card", label: "Tarjeta", icon: "card", step: null, disabled: true },
  { key: "credit", label: "Crédito", icon: "credit", step: "credit" },
  { key: "more", label: "Más", icon: "more", step: "more" },
];

function isTabActive(tabKey: TabDef["key"], step: Step): boolean {
  if (tabKey === "home") return step === "home";
  if (tabKey === "score") return step === "score" || step === "query";
  if (tabKey === "credit") return step === "credit" || step === "verify";
  if (tabKey === "more") {
    return (
      step === "more" ||
      step === "profile" ||
      step === "profile-details" ||
      step === "profile-fiscal" ||
      step === "profile-security" ||
      step === "profile-delete-account" ||
      step === "help" ||
      step === "help-category" ||
      step === "help-article" ||
      step === "stub"
    );
  }
  return false;
}

function TabBar({ step, onNavigate }: { step: Step; onNavigate: (step: Step) => void }) {
  return (
    <SafeAreaView edges={["bottom"]} className="border-t border-border bg-surface-1">
      <View className="flex-row">
        {TABS.map((tab) => {
          const active = isTabActive(tab.key, step);
          return (
            <Pressable
              key={tab.key}
              onPress={() => !tab.disabled && tab.step && onNavigate(tab.step)}
              disabled={tab.disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: tab.disabled, selected: active }}
              accessibilityLabel={tab.disabled ? `${tab.label} — aún no disponible` : tab.label}
              testID={`tab-${tab.key}`}
              className={`flex-1 items-center gap-1 py-3 ${tab.disabled ? "opacity-40" : ""}`}
            >
              <Icon name={tab.icon} size={20} color={active ? "crimson" : "text-secondary"} />
              <Text className={`text-xs font-semibold ${active ? "text-crimson" : "text-text-secondary"}`}>
                {tab.label}
              </Text>
              {tab.disabled ? (
                <View className="absolute -top-1 right-2 rounded-full bg-inactive px-1.5 py-0.5">
                  <Text className="text-[9px] font-bold text-text-secondary">PRONTO</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function AppFlow() {
  const { isLoaded, isSignedIn } = useAuth();
  const sessionSource = useClerkSessionSource();
  const [step, setStep] = useState<Step | null>(null);
  const [previousStep, setPreviousStep] = useState<Step>("more");
  const [activeStub, setActiveStub] = useState<StubTopicKey | null>(null);
  const [activeCategory, setActiveCategory] = useState<HelpCategory | null>(null);
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);

  // Register (or clear) app/lib/api.ts's session source with the real Clerk session on every
  // sign-in-state change. Previously nothing ever called setSessionSource() outside tests, so
  // every real API call (score.get, crevaScore.*) went out unauthenticated and would 401 in
  // practice. This is the one place that must run regardless of which screen is mounted.
  useEffect(() => {
    setSessionSource(isSignedIn ? sessionSource : null);
  }, [isSignedIn, sessionSource]);

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
        <Icon name="score" size={28} color="crimson" />
      </View>
    );
  }

  function openStub(key: StubTopicKey, from: Step) {
    setActiveStub(key);
    setPreviousStep(from);
    setStep("stub");
  }

  function openHelpCategory(href: string) {
    const slug = href.split("/")[2];
    const category = findCategory(slug ?? "");
    if (!category) return;
    setActiveCategory(category);
    setStep("help-category");
  }

  function openHelpArticle(href: string) {
    const parts = href.split("/");
    const categorySlug = parts[2];
    const articleSlug = parts[3];
    const found = findArticle(categorySlug ?? "", articleSlug ?? "");
    if (!found) return;
    setActiveCategory(found.category);
    setActiveArticle(found.article);
    setStep("help-article");
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
    screen = (
      <DashboardScreen
        onOpenScore={() => setStep("query")}
        onOpenCredit={() => setStep("credit")}
        onOpenCard={() => setStep("card-info")}
        onOpenNotifications={() => openStub("notifications", "home")}
      />
    );
  } else if (step === "score") {
    screen = <ScoreScreen onOpenQuery={() => setStep("query")} />;
  } else if (step === "credit") {
    screen = <CreditScreen onOpenVerify={() => setStep("verify")} />;
  } else if (step === "card-info") {
    screen = <CardScreen onBack={() => setStep("home")} />;
  } else if (step === "query") {
    screen = <QueryScreen onVerify={() => setStep("verify")} onBack={() => setStep("home")} />;
  } else if (step === "verify") {
    screen = <VerifyScreen folio="mock-folio" onBack={() => setStep("credit")} />;
  } else if (step === "profile") {
    screen = (
      <ProfileScreen
        onOpenHelp={() => setStep("help")}
        onSignedOut={() => setStep("sign-in")}
        onOpenDetails={() => setStep("profile-details")}
        onOpenFiscal={() => setStep("profile-fiscal")}
        onOpenSecurity={() => setStep("profile-security")}
        onOpenNotifications={() => openStub("notifications", "profile")}
        onOpenDeleteAccount={() => setStep("profile-delete-account")}
      />
    );
  } else if (step === "profile-details") {
    screen = (
      <StubScreen
        title="Datos personales"
        icon="profile"
        body={findArticle("datos", "cambiar-mis-datos")?.article.answer}
        onBack={() => setStep("profile")}
      />
    );
  } else if (step === "profile-fiscal") {
    screen = <StubScreen title="Información fiscal" icon="statement" onBack={() => setStep("profile")} />;
  } else if (step === "profile-security") {
    screen = (
      <StubScreen
        title="Seguridad"
        icon="shield"
        body={findArticle("entrar", "cambiar-contrasena")?.article.answer}
        onBack={() => setStep("profile")}
      />
    );
  } else if (step === "profile-delete-account") {
    screen = <DeleteAccountScreen onBack={() => setStep("profile")} />;
  } else if (step === "help") {
    screen = (
      <HelpScreen
        onOpenArticle={openHelpArticle}
        onOpenCategory={openHelpCategory}
      />
    );
  } else if (step === "help-category" && activeCategory) {
    screen = (
      <HelpCategoryScreen
        category={activeCategory}
        onOpenArticle={(article) => {
          setActiveArticle(article);
          setStep("help-article");
        }}
        onBack={() => setStep("help")}
      />
    );
  } else if (step === "help-article" && activeCategory && activeArticle) {
    screen = (
      <HelpArticleScreen
        category={activeCategory}
        article={activeArticle}
        onBack={() => setStep(activeCategory ? "help-category" : "help")}
      />
    );
  } else if (step === "more") {
    screen = (
      <MoreSheet
        onOpenStub={(key) => openStub(key, "more")}
        onOpenProfile={() => setStep("profile")}
        onOpenHelp={() => setStep("help")}
      />
    );
  } else if (step === "stub" && activeStub) {
    const topic = findStubTopic(activeStub);
    screen = (
      <StubScreen
        title={topic.label}
        icon={topic.icon}
        body={topic.body}
        onBack={() => setStep(previousStep)}
      />
    );
  } else {
    screen = <MoreSheet onOpenStub={(key) => openStub(key, "more")} onOpenProfile={() => setStep("profile")} onOpenHelp={() => setStep("help")} />;
  }

  return (
    <View className="flex-1">
      <View className="flex-1">{screen}</View>
      {TAB_STEPS.includes(step) && <TabBar step={step} onNavigate={(next) => setStep(next)} />}
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
