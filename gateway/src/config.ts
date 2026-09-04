// config.ts: environment-driven gateway settings, read once at startup.
export const config = {
  port: Number(process.env.PORT ?? 8787),
  crevaApiUrl: process.env.CREVA_API_URL ?? "https://creva-backend-c7as7id5jq-pv.a.run.app",
  facilitatorUrl: process.env.FACILITATOR_URL ?? "http://localhost:4020",
  payToAddress: process.env.PAY_TO_ADDRESS ?? "0.0.0000000",
  network: process.env.HEDERA_NETWORK ?? "hedera-testnet",
  asset: process.env.PAYMENT_ASSET ?? "HBAR",
  reportPriceAtomic: process.env.REPORT_PRICE_ATOMIC ?? "10000000",
  verifyPriceAtomic: process.env.VERIFY_PRICE_ATOMIC ?? "5000000",
};
