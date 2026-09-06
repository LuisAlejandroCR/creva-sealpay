// hashgraph-sdk-web-stub.js: web-only stand-in for @hashgraph/sdk, used only by the UI smoke-test
// audit (audit-ui-smoke-test worktree). The real SDK pulls @grpc/grpc-js, which references Node's
// `events` module and throws "Class extends value undefined is not a constructor or null" in the
// Metro web bundle, blanking the app. The audited screens never reach the signing path on web
// (readDemoCredentialsFromEnv() returns undefined without EXPO_PUBLIC_HEDERA_DEMO_* env vars), so a
// throwing placeholder is enough and keeps the failure visible if that path is ever reached.
const notAvailable = () => {
  throw new Error('@hashgraph/sdk is stubbed on web for the UI smoke-test audit');
};

class Stub {
  constructor() {
    notAvailable();
  }
}

module.exports = {
  AccountId: { fromString: notAvailable },
  Hbar: Stub,
  PrivateKey: { fromString: notAvailable, fromStringECDSA: notAvailable, fromStringED25519: notAvailable },
  TransactionId: { generate: notAvailable },
  TransferTransaction: Stub,
};
