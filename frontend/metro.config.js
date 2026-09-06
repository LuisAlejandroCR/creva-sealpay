// metro.config.js: Expo Metro config wrapped with NativeWind to process global.css.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// UI smoke-test audit only (audit-ui-smoke-test worktree): on the web bundle, redirect
// @hashgraph/sdk (drags in @grpc/grpc-js, crashes the Metro web runtime with
// "Class extends value undefined") and @clerk/clerk-expo (no app/.env in the worktree, so the
// real provider never flips useAuth().isLoaded and the app stays on the loading gauge) to
// throwing / signed-out stubs. Native bundles are untouched.
const hashgraphWebStub = path.resolve(__dirname, "web-shims/hashgraph-sdk-web-stub.js");
const clerkWebStub = path.resolve(__dirname, "web-shims/clerk-expo-web-stub.js");
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "@hashgraph/sdk") {
    return { type: "sourceFile", filePath: hashgraphWebStub };
  }
  if (
    platform === "web" &&
    (moduleName === "@clerk/clerk-expo" || moduleName === "@clerk/clerk-expo/token-cache")
  ) {
    return { type: "sourceFile", filePath: clerkWebStub };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
