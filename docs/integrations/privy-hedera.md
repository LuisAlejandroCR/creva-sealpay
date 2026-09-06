<!-- docs/integrations/privy-hedera.md: guía de la integración de Privy como wallet ADITIVA para el
     pago x402 sobre Hedera (chain 296). Se distingue de docs/integrations/bazantic-recipes.md (esa
     es el MCP de datos de negocio, no pagos) y de brainstorming.md §10.5 (ahí está el porqué de
     elegir Privy; aquí está el cómo y qué falta). Slice C de docs/plan.md §10.4. -->

# Privy — wallet aditiva para el pago x402 (Hedera chain 296)

## Qué cubre

Una sola integración para las dos pistas de Privy ($5,000):

- **B2B financial product ($2.5k)** — el dueño de la PYME conecta su wallet Privy una vez y define
  una **política de gasto** (tope mensual + tope por pago). A partir de ahí su agente paga cada
  reto x402 de `/creva-score/report` y `/creva-score/verify` sin volver a firmar, mientras el
  monto quepa en la política. La política se evalúa **antes** de construir cualquier header
  (`app/features/wallet/spendingPolicy.ts` → `assertWithinPolicy`).
- **Best financial flow ($2.5k)** — ese mismo flujo (402 → elegir wallet → política → firma →
  respuesta pagada) es el flujo financiero funcional de punta a punta.

## Regla dura: el demo signer no se toca

`app/features/query/hederaPayment.ts` (`buildSignedPaymentHeader`, `readDemoCredentialsFromEnv`)
es el signer que **ya liquida en cadena** y sigue siendo el default. Privy entra como opción
**adicional**: el usuario elige en el selector de `QueryScreen` / `VerifyScreen`. Sin
configuración de Privy el selector ni aparece y el flujo es bit-idéntico al de hoy. Un test
invariante (`app/test/invariant/wallet/demo-flow-unchanged.invariant.spec.ts`) falla si
`hederaPayment.ts` cambia respecto a `origin/main`.

## `defineChain(296)` — verificado contra el Relay real

Privy no trae Hedera preconfigurada. `app/features/wallet/privyChain.ts` define la chain con viem:

```ts
defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 }, // el Relay reporta weibar (10^-18)
  rpcUrls: { default: { http: ['https://testnet.hashio.io/api'] } },
  testnet: true,
})
```

Lectura on-chain real por esa config (2026-09-06, `node app/features/wallet/smoke-read-chain.mjs`):

```json
{
  "rpcUrl": "https://testnet.hashio.io/api",
  "chainId": 296,
  "blockNumber": "40171461",
  "address": "0x0000000000000000000000000000000000000002",
  "balanceWei": "33896519248405508330000000000"
}
OK: defineChain(296) resolves a live Hedera testnet relay
```

Endpoint alternativo (Hedera oficial / Hiero): configurable con `EXPO_PUBLIC_HEDERA_JSON_RPC_URL`.
El público de Hashio no pide API key; el de mirror node / otros proveedores puede pedirla.

## Env vars que el humano debe crear

Se ponen en `app/.env` (`EXPO_PUBLIC_*` porque las lee el cliente Expo). Ninguna se pega en el chat.

| Var | Obligatoria para modo privy | De dónde sale |
|---|---|---|
| `EXPO_PUBLIC_PRIVY_APP_ID` | sí | Dashboard de Privy → app nueva |
| `EXPO_PUBLIC_PRIVY_CLIENT_ID` | sí (Expo/native) | Dashboard de Privy → app settings → clients |
| `EXPO_PUBLIC_PRIVY_MONTHLY_CAP_TINYBAR` | sí | Decisión de negocio (ej. `500000000` = 5 HBAR/mes) |
| `EXPO_PUBLIC_PRIVY_PER_PAYMENT_CAP_TINYBAR` | sí | Decisión de negocio (ej. `50000000` = 0.5 HBAR/pago) |
| `EXPO_PUBLIC_HEDERA_JSON_RPC_URL` | no (default Hashio) | Proveedor de JSON-RPC Relay |

`PRIVY_APP_SECRET` es server-side (auth de tokens en el backend). Este slice **no** agrega ningún
flujo server-auth, así que no se usa todavía; irá en `gateway/.env` cuando se cablee.

## Qué falta (bloqueado sin cuenta Privy real)

1. Crear la app en el dashboard de Privy y llenar las env vars de arriba.
2. Instalar el SDK en `app/`:
   ```
   npx expo install @privy-io/expo @privy-io/expo-native-extensions expo-crypto expo-linking \
     expo-clipboard expo-application expo-apple-authentication react-native-passkeys \
     react-native-qrcode-styled
   npm i permissionless
   ```
   (Se dejó fuera del `package.json` a propósito: ese set de peers nativos no debe arriesgar el
   `npm install` del path congelado de Hedera hasta que se vaya a usar de verdad.)
3. Envolver la app con `PrivyProvider` de `@privy-io/expo` pasando
   `supportedChains={privySupportedChains}` (exportado desde
   `app/features/wallet/privyEmbeddedWallet.ts`).
4. Cablear `makePrivySigner` en ese mismo archivo: obtener/provisionar la embedded wallet para
   chain 296, construir el mismo payload x402 "exact" que `hederaPayment.ts` (mismos campos
   `accepted.*`, `accepted.extra` byte-for-byte con las requirements), y firmarlo con el provider
   EIP-1193 de la wallet. Hoy lanza `privy_embedded_wallet_signing_not_wired`.

## Smoke / verificación

```
# lectura on-chain por defineChain(296) — no necesita Privy
node app/features/wallet/smoke-read-chain.mjs

# lo mismo como test jest (opt-in, red)
cd app && RUN_HEDERA_RELAY_TEST=1 npx jest hedera-relay-read

# toda la capa wallet (política, modos, invariantes) — sin red
cd app && npx jest wallet
```
