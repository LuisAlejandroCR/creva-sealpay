// auth-gate.spec.ts: regression test for the App.tsx auth-reload bug — AppFlow used to default
// to useState<Step>("sign-in") without consulting Clerk's real session, so a reload with an
// active session re-showed SignInScreen and then signIn.create() threw "You're already signed
// in". This renders the real App tree with @clerk/clerk-expo mocked into a signed-in state and
// asserts SignInScreen never mounts — it must land on DashboardScreen (home) instead. Written as
// a real render test (not source-regex, unlike the other test/unit/**/*.spec.ts files in this
// repo) because this is a behavioral bug, not a structural one; React.createElement is used
// instead of JSX so the file can stay a plain .ts and match jest.config.js's testMatch.
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react-native";

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  useUser: () => ({ user: { firstName: "Ana", primaryEmailAddress: { emailAddress: "ana@example.com" } } }),
  useClerk: () => ({ signOut: jest.fn() }),
  useSignIn: () => ({ signIn: {}, setActive: jest.fn(), isLoaded: true }),
  useSignUp: () => ({ signUp: {}, setActive: jest.fn(), isLoaded: true }),
  useSSO: () => ({ startSSOFlow: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@clerk/clerk-expo/token-cache", () => ({ tokenCache: {} }));

// global.css is a Tailwind directive file, only meaningful to the Metro/NativeWind bundler —
// Jest has no CSS transform configured (nor does it need one) so it's stubbed out here.
jest.mock("../../../global.css", () => ({}), { virtual: true });

// SelfieCheckScreen pulls in react-native-webview, out of scope for this test and irrelevant to
// the auth gate — App only reaches it after sign-in, which this test never lets happen.
jest.mock("react-native-webview", () => ({ __esModule: true, default: () => null }));

// The real SafeAreaProvider renders nothing until a native onLayout measures its frame, which
// never fires under the test renderer — the library ships a jest mock with fixed metrics for
// exactly this, but it's a default export while App.tsx uses named imports, so it's re-exported
// here to match.
jest.mock("react-native-safe-area-context", () => {
  const mock = jest.requireActual("react-native-safe-area-context/jest/mock").default;
  return { ...mock };
});

// Import statements hoist above any top-level statement, so App.tsx (which reads
// EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY at module-eval time via ClerkAppProvider.tsx) has to be
// require()'d after the env var is set, not import()'d.
describe("App auth gating on reload", () => {
  it("never renders SignInScreen when Clerk reports an active session", async () => {
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_placeholder";
    const App = require("../../../App").default;

    render(createElement(App));

    await waitFor(() => {
      expect(screen.queryByTestId("auth-submit")).toBeNull();
    });

    expect(screen.queryByTestId("google-oauth-button")).toBeNull();
    expect(screen.getByTestId("dashboard-score-action")).toBeTruthy();
  });
});
