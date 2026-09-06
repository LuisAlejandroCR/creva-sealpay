<!-- docs/integrations/ledger-keyring.md: cómo el gateway usa el Ledger Key Ring
     (`wallet-cli ring`) como backend de los secretos que hoy son env vars planas.
     Se distingue de docs/plan.md (ahí vive el checklist de aceptación del bloque
     Ledger) y de brainstorming.md §8.1/§10.4 (ahí vive el porqué y la regla dura
     de no competir con la wallet del facilitador Hedera). -->

# Ledger Key Ring — backend de secretos del gateway

## Qué es

`gateway/src/key-ring.ts` resuelve los secretos sensibles del gateway a través del
**Ledger Key Ring** (LKRP, `wallet-cli ring`) cuando `KEY_RING_ENABLED=true`, y cae
a `process.env` cuando no. El adaptador es aditivo y no cambia la lógica de firma,
sellado ni el eje de pagos x402.

- API: `resolveSecret(name): Promise<string | undefined>` y `requireSecret(name)`.
- Orden de resolución: backend de test (solo en tests) → Key Ring (si habilitado) →
  `process.env`. Un valor ausente o vacío devuelve `undefined`, nunca `""`.
- `gateway/src/config.ts` llama `hydrateSecrets()` en la carga del módulo: resuelve
  cada secreto y lo aplica tanto a `config` como a `process.env`, para que los
  consumidores congelados que leen `process.env` directo (`arc-anchor.ts`,
  `hedera-signer.ts`) también tomen el valor del Key Ring. Con la flag ausente es
  un no-op y el comportamiento es idéntico al de hoy.

## Versión del CLI

- Paquete: `@ledgerhq/wallet-cli`
- Versión instalada y registrada: **2.1.0** (`npm i -g @ledgerhq/wallet-cli`)
- Subcomandos usados: `wallet-cli ring init | encrypt | decrypt | keys`

## Llaves migradas

`SECRET_ENV_KEYS` en `config.ts`:

| Env var | Consumidor |
|---|---|
| `CREVA_SERVICE_REFRESH_TOKEN` | `creva-auth.ts` |
| `FACILITATOR_AUTH_TOKEN` | `facilitator.ts` |
| `HEDERA_PAYER_PRIVATE_KEY` | `hedera-signer.ts` (lee `process.env` directo) |
| `WORLD_API_KEY` | `world-verify.ts` |
| `ARC_SIGNER_PRIVATE_KEY` | `arc-anchor.ts` (lee `process.env` directo) |

Los no-secretos (URLs, IDs de cuenta, flags, precios) se quedan en `process.env` sin
cambios.

## Rol de firma dedicado (regla dura §8.1)

El Key Ring **no** aloja una segunda wallet que compita con la wallet del facilitador
Hedera x402. Su rol es de **custodia de secretos en reposo**: cifra las private keys
que ya existen (incluida `ARC_SIGNER_PRIVATE_KEY`, el lado Arc/on-chain del respaldo,
que ya es un rol de firma distinto del pago). No introduce una firma nueva ni una
cuenta decorativa — reemplaza el `.env` plano por un blob cifrado recuperable desde
la seed del Ledger.

## Cómo se genera / importa la cuenta de firma

La cuenta de firma Arc (`ARC_SIGNER_ADDRESS` / `ARC_SIGNER_PRIVATE_KEY`) ya existe y
se generó fuera de este track (bloque Arc). Aquí **no se crea** ninguna cuenta: solo
se toma la private key existente y se guarda cifrada en el Key Ring. El humano nunca
pega la key en el chat ni en este repo en claro.

## Comando exacto para poblar el Key Ring

En la máquina del agente que firma (requiere el dispositivo Ledger físico):

```bash
# 1. Instalar el CLI (una vez)
npm i -g @ledgerhq/wallet-cli            # v2.1.0

# 2. Enrolar la máquina en el trustchain (requiere el dispositivo Ledger)
export WALLET_PASS='<password del Key Ring>'
wallet-cli ring init --name creva-sealpay-gateway

# 3. Escribir el archivo de secretos en claro (formato dotenv), fuera del repo
cat > /tmp/creva-secrets.env <<'EOF'
CREVA_SERVICE_REFRESH_TOKEN=...
FACILITATOR_AUTH_TOKEN=...
HEDERA_PAYER_PRIVATE_KEY=...
WORLD_API_KEY=...
ARC_SIGNER_PRIVATE_KEY=...
EOF

# 4. Cifrar bajo la key con nombre 'creva-sealpay' -> blob que sí va al repo/host
wallet-cli ring encrypt --key creva-sealpay -i /tmp/creva-secrets.env -o gateway/secrets.env.enc
shred -u /tmp/creva-secrets.env

# 5. Arrancar el gateway con el backend activo
KEY_RING_ENABLED=true npm --prefix gateway start
```

Variables opcionales: `KEY_RING_CLI` (default `wallet-cli`), `KEY_RING_KEY_NAME`
(default `creva-sealpay`), `KEY_RING_SECRETS_FILE` (default `secrets.env.enc`).

## Estado de verificación

- CLI instalado y versión registrada: **sí** (2.1.0).
- `key-ring.ts` + `config.ts` + tests unit/fuzz/invariant: **verde** (21 suites / 62
  tests en `gateway`, sin regresión).
- Lectura real de una llave desde el Key Ring usada por el gateway: **BLOCKED** —
  `wallet-cli ring init` exige un dispositivo Ledger físico (`"device required"`);
  toda operación `ring` (`init`, `encrypt`, `decrypt`, `keys`) falla con
  `"Ledger Key Ring not initialized"` sin él. El adaptador invoca los comandos
  reales; falta correr el paso end-to-end en una máquina con el dispositivo.
