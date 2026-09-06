// App.tsx: wires every feature screen into one flow (sign-in -> onboarding -> home) plus the
// restructured bottom nav: Inicio, Score, Tarjeta, Crédito, Más. "Más" opens
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
import { KycFormScreen } from "./features/onboarding/KycFormScreen";
import { QueryScreen } from "./features/query/QueryScreen";
import { VerifyScreen } from "./features/verify/VerifyScreen";
import { DashboardScreen } from "./features/dashboard/DashboardScreen";
import { ProfileScreen } from "./features/profile/ProfileScreen";
import { DeleteAccountScreen } from "./features/profile/DeleteAccountScreen";
import { PersonalDataScreen } from "./features/profile/PersonalDataScreen";
import { FiscalInfoScreen } from "./features/profile/FiscalInfoScreen";
import { SecurityScreen } from "./features/profile/SecurityScreen";
import { MovementsScreen } from "./features/more/MovementsScreen";
import { StatementsScreen } from "./features/more/StatementsScreen";
import { NotificationsScreen } from "./features/more/NotificationsScreen";
import { RegulatoryScreen } from "./features/more/RegulatoryScreen";
import { ReportScreen } from "./features/more/ReportScreen";
import { CollateralScreen } from "./features/more/CollateralScreen";
import { BusinessVerificationScreen } from "./features/more/BusinessVerificationScreen";
import { CalculatorScreen } from "./features/more/CalculatorScreen";
import { PrivacyScreen } from "./features/more/PrivacyScreen";
import { HelpScreen } from "./features/help/HelpScreen";
import { HelpCategoryScreen } from "./features/help/HelpCategoryScreen";
import { HelpArticleScreen } from "./features/help/HelpArticleScreen";
import { ScoreScreen } from "./features/score/ScoreScreen";
import { CreditScreen } from "./features/credit/CreditScreen";
import { CardScreen } from "./features/card/CardScreen";
import { CardCreateScreen } from "./features/card/CardCreateScreen";
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
  | "kyc"
  | "home"
  | "score"
  | "credit"
  | "card-info"
  | "card-create"
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
const TAB_STEPS: Step[] = ["home", "score", "card-info", "credit", "profile", "help", "more"];

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
  { key: "card", label: "Tarjeta", icon: "card", step: "card-info" },
  { key: "credit", label: "Crédito", icon: "credit", step: "credit" },
  { key: "more", label: "Más", icon: "more", step: "more" },
];

function isTabActive(tabKey: TabDef["key"], step: Step): boolean {
  if (tabKey === "home") return step === "home";
  if (tabKey === "score") return step === "score" || step === "query";
  if (tabKey === "card") return step === "card-info" || step === "card-create";
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
            // Active state reproduces all three signals from creva_finance/frontend/app/globals.css
            // lines 176-199 (.cr-nav-item / [aria-current='page']): the top edge indicator
            // (border-top: 3px solid transparent -> var(--cr-crimson)), the weight jump
            // (font-weight 600 -> 800), and the icon's own fill/stroke switch to crimson
            // (BottomNav.tsx icon functions take `active` and swap fill/stroke, not just color).
            <Pressable
              key={tab.key}
              onPress={() => !tab.disabled && tab.step && onNavigate(tab.step)}
              disabled={tab.disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: tab.disabled, selected: active }}
              accessibilityLabel={tab.disabled ? `${tab.label} — aún no disponible` : tab.label}
              testID={`tab-${tab.key}`}
              className={`flex-1 items-center gap-[3px] border-t-[3px] py-[9px] ${
                active ? "border-crimson" : "border-transparent"
              }`}
            >
              <Icon name={tab.icon} size={22} color={active ? "crimson" : "text-secondary"} filled={active} />
              <Text
                className={`text-[10px] ${active ? "font-extrabold text-crimson" : "font-semibold text-text-secondary"}`}
              >
                {tab.label}
              </Text>
              {tab.disabled ? (
                <Text className="text-[8px] font-bold tracking-[0.04em] text-text-subtle">PRONTO</Text>
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
  const [sealedReport, setSealedReport] = useState<import("./features/verify/sealClient").SealedReport | null>(null);
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

  // A help article's `resolvedBy.href` is a web route — map it to this app's step machine so the
  // "Cada respuesta termina en la pantalla que la resuelve" promise holds on native too.
  const HELP_RESOLVE_STUBS: Partial<Record<string, StubTopicKey>> = {
    "/collateral": "collateral",
    "/statements": "statements",
    "/movements": "movements",
    "/report": "report",
    "/business-verification": "business-verification",
    "/regulatory": "regulatory",
    "/privacy": "privacy",
  };
  const HELP_RESOLVE_STEPS: Partial<Record<string, Step>> = {
    "/login": "sign-in",
    "/credit": "credit",
    "/score": "score",
    "/cards": "card-info",
    "/profile/security": "profile-security",
    "/profile/details": "profile-details",
    "/profile/delete-account": "profile-delete-account",
  };
  function openHelpResolve(href: string) {
    const stub = HELP_RESOLVE_STUBS[href];
    if (stub) return openStub(stub, "help-article");
    const next = HELP_RESOLVE_STEPS[href];
    if (next) setStep(next);
  }

  let screen: React.ReactNode;
  if (step === "sign-in") {
    screen = <SignInScreen onSignedIn={() => setStep("onboarding")} />;
  } else if (step === "onboarding") {
    screen = (
      <SelfieCheckScreen
        onVerified={() => setStep("kyc")}
        onSkipped={() => setStep("kyc")}
        onBack={() => setStep("home")}
      />
    );
  } else if (step === "kyc") {
    screen = <KycFormScreen onDone={() => setStep("home")} />;
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
    screen = (
      <ScoreScreen
        onOpenQuery={() => setStep("query")}
        onBack={() => setStep("home")}
        onOpenHelp={() => openHelpArticle("/help/score/como-se-calcula")}
      />
    );
  } else if (step === "credit") {
    screen = (
      <CreditScreen
        onOpenVerify={() => setStep("verify")}
        onOpenKyc={() => setStep("kyc")}
        onOpenStatements={() => openStub("statements", "credit")}
      />
    );
  } else if (step === "card-info") {
    screen = (
      <CardScreen
        onBack={() => setStep("home")}
        onOpenCreate={() => setStep("card-create")}
        onOpenKyc={() => setStep("kyc")}
      />
    );
  } else if (step === "card-create") {
    screen = (
      <CardCreateScreen
        onBack={() => setStep("card-info")}
        onDone={() => setStep("card-info")}
        onOpenKyc={() => setStep("kyc")}
      />
    );
  } else if (step === "query") {
    screen = (
      <QueryScreen
        onVerify={(result) => {
          if (result.status === 200) setSealedReport(result.report);
          setStep("verify");
        }}
        onBack={() => setStep("home")}
      />
    );
  } else if (step === "verify") {
    screen = <VerifyScreen sealedReport={sealedReport} onBack={() => setStep("credit")} />;
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
    screen = <PersonalDataScreen onBack={() => setStep("profile")} />;
  } else if (step === "profile-fiscal") {
    screen = <FiscalInfoScreen onBack={() => setStep("profile")} />;
  } else if (step === "profile-security") {
    screen = <SecurityScreen onBack={() => setStep("profile")} />;
  } else if (step === "profile-delete-account") {
    screen = (
      <DeleteAccountScreen
        onBack={() => setStep("profile")}
        onOpenPrivacy={() => openStub("privacy", "profile-delete-account")}
      />
    );
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
        onOpenArticle={openHelpArticle}
        onBack={() => setStep("help")}
      />
    );
  } else if (step === "help-article" && activeCategory && activeArticle) {
    screen = (
      <HelpArticleScreen
        category={activeCategory}
        article={activeArticle}
        onBack={() => setStep(activeCategory ? "help-category" : "help")}
        onOpenArticle={(other) => {
          setActiveArticle(other);
          setStep("help-article");
        }}
        onResolve={openHelpResolve}
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
  } else if (step === "stub" && activeStub === "movements") {
    screen = <MovementsScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "statements") {
    screen = <StatementsScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "notifications") {
    screen = <NotificationsScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "regulatory") {
    screen = <RegulatoryScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "report") {
    screen = <ReportScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "collateral") {
    screen = <CollateralScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "business-verification") {
    screen = <BusinessVerificationScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "calculator") {
    screen = <CalculatorScreen onBack={() => setStep(previousStep)} />;
  } else if (step === "stub" && activeStub === "privacy") {
    screen = <PrivacyScreen onBack={() => setStep(previousStep)} />;
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
