// config.ts: environment-driven gateway settings, read once at startup.
import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8787),
  crevaApiUrl: process.env.CREVA_API_URL ?? "https://creva-backend-c7as7id5jq-pv.a.run.app",
  crevaServiceRefreshToken: process.env.CREVA_SERVICE_REFRESH_TOKEN,
  facilitatorUrl: process.env.FACILITATOR_URL ?? "http://localhost:4020",
  facilitatorAuthToken: process.env.FACILITATOR_AUTH_TOKEN,
  facilitatorFeePayer: process.env.FACILITATOR_FEE_PAYER,
  x402Version: Number(process.env.X402_VERSION ?? 1),
  payToAddress: process.env.PAY_TO_ADDRESS ?? "0.0.0000000",
  network: process.env.HEDERA_NETWORK ?? "hedera:testnet",
  asset: process.env.PAYMENT_ASSET ?? "0.0.0",
  reportPriceAtomic: process.env.REPORT_PRICE_ATOMIC ?? "10000000",
  verifyPriceAtomic: process.env.VERIFY_PRICE_ATOMIC ?? "5000000",
  worldApiKey: process.env.WORLD_API_KEY,
  worldAppId: process.env.WORLD_APP_ID,
  worldVerifyUrl: process.env.WORLD_VERIFY_URL ?? "https://developer.world.org/api/v4/verify",
  arcRpcUrl: process.env.ARC_RPC_URL,
  arcNetwork: process.env.ARC_NETWORK ?? "arc:testnet",
  arcSignerAddress: process.env.ARC_SIGNER_ADDRESS,
  arcSignerPrivateKey: process.env.ARC_SIGNER_PRIVATE_KEY,
  registryAddress: process.env.REGISTRY_ADDRESS,
  subgraphUrl: process.env.SUBGRAPH_URL,
};
