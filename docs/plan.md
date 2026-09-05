<!-- docs/plan.md: bloques de trabajo con criterio de aceptación, abiertos vs cerrados, para la
     preparación de ETHOnline 2026. No es la bitácora (docs/memoria.md tiene el qué-se-hizo/qué-no-
     se-verificó) ni el brainstorming (brainstorming.md tiene el análisis; aquí solo el checklist
     accionable). Se actualiza en el mismo lote que cualquier cambio de estado. -->

# Plan — ETHOnline 2026

> **Regla dura de todo agente — ver [`AGENTS.md`](../AGENTS.md):** revisar el repo y la rama `main`
> antes de tocar nada, y cerrar siempre documentando qué se hizo, qué no se verificó y por qué —
> es el contexto que usan los demás agentes.

**Última actualización:** 2026-09-04

Ver [`brainstorming.md`](../brainstorming.md) §8 y §9 para el análisis completo. Detalle de
qué-se-hizo/qué-no-se-verificó por sesión: [`docs/memoria.md`](memoria.md). Esta tabla es solo el
checklist.

## Abiertos

- [ ] **`negocio.creva.eth`: bloqueado por migración a ENSv2 en Sepolia.** `creva.eth` confirmado
  no registrado. La dirección de `ETHRegistrarController` que documentan ENS Labs para Sepolia
  (`0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968`) **no está autorizada** hoy en el
  `BaseRegistrarImplementation` real (`controllers() == false`, verificado on-chain) — Sepolia ya
  corre ENSv2, cuyas direcciones reales no se confirmaron contra dos fuentes independientes en
  esta sesión (ver `docs/memoria.md` 2026-09-05 para el detalle completo de la investigación).
  Falta: confirmar direcciones ENSv2 reales, reescribir `scripts/ens/register-subname.mjs` contra
  ellas, y solo entonces registrar `creva.eth` + crear el subname + escribir el folio sellado en
  el resolver. Wallet en `.env` ya fondeado (0.05 ETH Sepolia, gastados ~0.00009 ETH en un
  `commit()` de prueba).

- [ ] **Decidir qué parte de `docs/` se vuelve pública.** Ya se pusheó `docs/` completo (más allá
  de lo que exige SDD), revisado por secretos — limpio. Falta decisión formal de mantenerlo así.

- [ ] **Responder los dos check-ins de la semana del 09/07** en el hacker dashboard — el stake se
  devuelve solo si se responde y se entrega proyecto.

- [ ] **Asistir a las sesiones de feedback.** Martes 09/08 2–4 PM ET, jueves 09/10 9–11 AM ET.

- [ ] **Confirmar en el dashboard de ETHGlobal quién entra al equipo**, con stake propio cada
  quien — decisión de equipo ya tomada, falta el trámite.

- [ ] **Haptics en dispositivo físico.** Código ya en `QueryScreen.tsx`/`VerifyScreen.tsx`
  (`expo-haptics`, 3 estados), `tsc`/`jest` pasan. Falta sentirlos en Expo Go real — sin
  dispositivo disponible hasta ahora.

- [ ] **Safe-area insets: código listo, falta confirmar en Expo Go real.** Bug reportado desde
  Expo Go en iPhone físico: el status bar (reloj/señal/batería) se solapaba con el header y los
  títulos de sección en `SelfieCheckScreen.tsx`, `QueryScreen.tsx` y `VerifyScreen.tsx` porque
  ninguna pantalla usaba `SafeAreaView`/`useSafeAreaInsets`. `App.tsx` ahora envuelve todo en
  `SafeAreaProvider`, y las tres pantallas envuelven su contenedor raíz (todas las ramas de
  estado, incluida `identity_unavailable`) en `SafeAreaView` con `edges={['top','bottom']}`.
  `react-native-safe-area-context` ya era dependencia (`~5.7.0`), no hizo falta instalar nada.
  `tsc`/`jest` pasan (98/98, una suite falla por un `EPERM` de caché de Jest preexistente y no
  relacionado). No se encontró en el código ningún botón flotante de engranaje/ajustes — si existe,
  vive en una rama o worktree que no llegó a este branch. **Falta:** confirmar visualmente en Expo
  Go sobre el iPhone físico donde se vio el bug — no hay simulador/dispositivo disponible desde esta
  sesión de agente.

- [ ] **Selfie Check: verificación server-side real agregada, falta confirmar el payload v4 contra
  sandbox real.** `gateway/src/world-verify.ts` llama a la Developer Portal API de World con
  `WORLD_API_KEY`; el WebView ya no decide `verified` por su cuenta. Bloqueo preciso: la API v4
  espera un `nonce` que el flujo de redirect WebView no produce — el mapeo a `protocol_version:
  "3.0"` es mejor esfuerzo, sin ejercer contra sandbox real (mismo criterio que Hedera: no gastar
  cuota real sin confirmar con el humano). Falta también Expo Go real en dispositivo físico.
  **Actualización `2026-09-05`:** enrollment al World ID Sandbox solicitado para
  `bankingluisalejandro@gmail.com`, iOS (TestFlight) y Android (Google Play internal test) — ambas
  solicitudes en estado "pending", aprobación por correo de Tools for Humanity todavía no llega.
  Primer intento de contacto rebotó (`sandbox.access@toolsforhumanity.org` no resuelve; dominio
  real es `toolsforhumanity.com`), reenviado a la dirección correcta. Bloquea este bloque y el de
  "Riesgo Expo Go" de abajo hasta que llegue la aprobación — nada más que avanzar aquí mientras se
  espera.

- [ ] **Publicación en App Store / Play Store — después del evento.** Decisión escogida: la
  revisión de iOS consumiría la ventana que queda. Se demuestra con Expo Go + video durante el
  evento. `eas submit` corre después del 2026-09-16.

- [ ] **Riesgo Expo Go: módulo nativo no soportado.** Si hace falta uno que Expo Go no trae, pasar
  a Dev Client (`eas build --profile development`) — medio día presupuestado, descubrirlo temprano.

- [ ] **Video demo: cronometrar y grabar.** Guion listo en
  [`docs/video-script.md`](video-script.md) (framework Pitch Deck, ≤3 min). Falta cronometrar,
  verificar la sección de Hedera contra el estado real el día de grabar, y grabar.

- [ ] **`slides.html` — outline listo, falta construir el artefacto.** Ver
  [`docs/slides-outline.md`](slides-outline.md), mapeado 1:1 contra `video-script.md`.

- [ ] **Instalar el CLI de Codex, si se va a usar.** `engram setup codex` ya dejó la config MCP
  lista en `%APPDATA%\codex\`; falta el plugin/hooks, que requiere el CLI real.

## Cerrados

- [x] `2026-09-04` — **Scaffold monorepo + 4 ramas feature + integración + roles v2.** `app/`
  (Expo/NativeWind) y `gateway/` (Node/Express) creados, mergeados a `main`; las 4 ramas
  (`feature-gateway-x402`, `feature-selfie-check`, `feature-agent-loop`, `feature-logic-port`)
  reconciliadas por el Solver en `integration-solver` y mergeadas a `main`. Modelo de roles
  actualizado a v2 (Main instruye, Solver mergea/pushea él mismo, Auditor revisa después) —
  `AGENTS.md` §Colaboración. Detalle completo: `docs/memoria.md`.

- [x] `2026-09-04` — **Estructura de tests `unit`+`fuzz`+`invariant` en `app/` y `gateway/`.**
  Aplicada a las 4 ramas y a `feature-agent-loop`'s tests movidos de `__tests__/` legacy. Estado
  final: `app/` 20 suites/104 tests, `gateway/` 7 suites/18 tests.

- [x] `2026-09-04` — **Puerto de la capa de lógica de `creva_finance` a `app/lib/`.** 9 archivos
  puros portados byte a byte, `lib/api.ts` adaptado a Expo. Un `TypeError` real encontrado por
  fuzz y corregido. 88/85 tests verdes.

- [x] `2026-09-04` — **UI visual de query/verify portada de `creva_finance`.** `QueryScreen`/
  `VerifyScreen` con secciones, score gauge, preview de reporte sellado y disclosure de qué NO
  certifica. Mock de gateway sigue mockeado; Expo Go físico pendiente aparte.

- [x] `2026-09-04` — **Gateway hardening: body cap, rate limit, helmet, replay protection.**
  `express.json` a 100kb, `helmet()`, `express-rate-limit` (120/min), replay de `X-PAYMENT` vía
  hash SHA-256 en memoria (limitación conocida: no distribuido, suficiente para una instancia).

- [x] `2026-09-05` — **Gateway x402/Hedera: pago real liquidado en testnet — criterio de la pista
  cumplido.** Cuatro intentos reales hasta cerrar: (1) `facilitator_verify_http_500` — hipótesis
  `TransactionId`=fee-payer descartada (coincide con `@x402/hedera` oficial); (2) mismo 500 tras
  agregar `dotenv`/corregir defaults de `config.ts` (`hedera-testnet`→`hedera:testnet`,
  `HBAR`→`0.0.0`) — tampoco era la causa; causa real: `paymentPayload` con forma v1 pero
  `x402Version: 2`, corregido en `hedera-signer.ts`/`facilitator.ts` con el campo `accepted` que
  exige el schema v2 real de `@x402/core`; (3) ya sin 500, nuevo error
  `invalid_exact_hedera_payload_amount_mismatch` probando autopago (`payTo`=mismo payer) — causa
  confirmada en el propio código de `@x402/hedera`: el autopago cancela a neto 0, matemáticamente
  incompatible con el chequeo `netToPayTo`, no un bug nuestro; (4) creada una segunda cuenta real
  de testnet (`0.0.10374017`) fondeada por el payer vía `AccountCreateTransaction`
  (`gateway/test/integration/create-payto-account.spec.ts`), usada como `PAY_TO_ADDRESS` —
  **liquidación real exitosa**. Tx: `0.0.7162784-1788585962-768194628`, `result: SUCCESS`
  confirmado en el mirror node de Hedera testnet, transferencia exacta
  `0.0.10119469 → 0.0.10374017` por `10000000` tinybars (`REPORT_PRICE_ATOMIC`). HashScan:
  https://hashscan.io/testnet/transaction/0.0.7162784-1788585962-768194628. Detalle completo de
  los cuatro intentos: `docs/memoria.md`.

- [x] `2026-09-04` — **Repo público + README reescrito.** `README.md` describe el producto de
  submission, no la carpeta de preparación.

- [x] `2026-09-04` — **`codegraph init` corrido contra el repo real.** 59 archivos indexados,
  telemetría apagada, `.codegraph/` en `.gitignore`.

- [x] `2026-09-04` — **Corrección de higiene de commits post-merge.** Dos merge commits con
  mensaje multi-línea (auto-generado por Git en conflicto) detectados por el Auditor — deuda
  documentada, no revertida (no es problema funcional).

- [x] `2026-09-04` — **Mapa de estado regenerado con `archify`.**
  [`docs/estado.html`](estado.html) refleja el estado actual (roles v2, 4 ramas mergeadas, Hedera/
  Selfie Check/Expo Go pendientes por credenciales/hardware, no por trabajo faltante).
  **Regenerado de nuevo `2026-09-05`** (worktree `docs-estado-audit`) tras auditar `docs/plan.md`
  y el repo real: el bloqueo de Selfie Check pasó de "faltan credenciales" genérico a la razón
  precisa — enrollment al World ID Sandbox pendiente de aprobación de Tools for Humanity. Cierres
  internos de esta tanda (gateway hardening, `codegraph init`, higiene de commits) no se muestran
  en el mapa por ser deuda de herramientas sin cambio visible para el lector del mapa. `archify
  validate` y `visual-check`: 0 errores.

- [x] `2026-09-01` — Aplicación a Continuity enviada, con ENS incluido.
- [x] `2026-09-03` — Stake de 0.025 ETH pagado.
- [x] `2026-09-01` — Spec OpenAPI pública desplegada (`/api/docs`, `/api/docs-json`).
- [x] `2026-09-04` — Reglas de finalista, checkpoints y regla de SDD incorporadas a `brainstorming.md` §9.
- [x] `2026-09-04` — `engram` instalado y wireado (Claude Code + opencode; Codex solo config MCP).
- [x] `2026-09-04` — Decisión: "start from scratch" no aplica a Continuity — `LEARNINGS.md` §3.
- [x] `2026-09-04` — `README.md` de esta carpeta privada traducido a inglés.
- [x] `2026-09-04` — Acceso a Bazantic confirmado, crédito de prueba ~0.30 USDC.
- [x] `2026-09-04` — Decisión: equipo humano + agentes de IA, no solo — falta trámite de dashboard (ver bloque abierto).

## Verify

1. Todo bloque cerrado tiene fecha y aparece también, si aplica, como decisión en `brainstorming.md`.
2. Ningún bloque abierto describe una acción que ya se hizo.
3. Cada criterio de aceptación es verificable por alguien que no escribió el bloque.
