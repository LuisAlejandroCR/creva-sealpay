// clerk-expo-web-stub.js: web-only stand-in for @clerk/clerk-expo, used only by the UI smoke-test
// audit (audit-ui-smoke-test worktree). The worktree is a clean checkout with no app/.env, so
// there is no real EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY; the real ClerkProvider then loads clerk-js,
// gets a 400 ("unable to attribute this request to an instance"), and never flips useAuth().isLoaded
// to true, leaving the whole app stuck on App.tsx's null-step loading gauge.
//
// This shim reports a LOADED, SIGNED-OUT session so the audit can walk every screen's shell and
// empty/error states (which is all a layout / icon / copy audit needs). Sign-in "succeeds" locally
// so the onboarding -> dashboard -> tab-bar flow is reachable; no network, no real auth. Native
// bundles never see this file (metro.config.js only swaps it in for platform === "web").

const noopAsync = async () => {};

function ClerkProvider(props) {
  return props.children;
}

function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    orgId: null,
    getToken: async () => null,
    signOut: noopAsync,
  };
}

function useUser() {
  return { isLoaded: true, isSignedIn: false, user: null };
}

function useClerk() {
  return { signOut: noopAsync, openSignIn: () => {}, openUserProfile: () => {} };
}

function useSignIn() {
  return {
    isLoaded: true,
    setActive: noopAsync,
    signIn: {
      create: async () => ({ status: "complete", createdSessionId: "audit-session" }),
    },
  };
}

function useSignUp() {
  return {
    isLoaded: true,
    setActive: noopAsync,
    signUp: {
      create: async () => ({ status: "complete", createdSessionId: "audit-session" }),
    },
  };
}

function useSSO() {
  return { startSSOFlow: async () => ({ createdSessionId: null, setActive: noopAsync }) };
}

// @clerk/clerk-expo/token-cache also resolves here; expose tokenCache alongside the hooks.
const tokenCache = {
  getToken: async () => null,
  saveToken: noopAsync,
  clearToken: noopAsync,
};

module.exports = {
  ClerkProvider,
  useAuth,
  useUser,
  useClerk,
  useSignIn,
  useSignUp,
  useSSO,
  tokenCache,
};
