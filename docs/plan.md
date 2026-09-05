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

- [ ] **Arc (Circle) — idea 8, "el respaldo nace on-chain".** $10k, apuesta B
  (`brainstorming.md` §4, fila 8: encaje 4, carga 5, riesgo 5 — greenfield real, no integración
  pegada). **Criterio de aceptación:** el reporte sellado de Creva emite un evento on-chain en Arc
  testnet (compromiso al mismo hash canónico que ya firma Ed25519 hoy) que representa el respaldo
  del negocio; si se borra la pieza de Arc, el respaldo deja de tener rastro on-chain — con eso
  cumple el descalificador #2 de `sponsor_track_rules.md`. Circle Agent Stack como wallet/firma del
  lado del facilitador, reutilizando el mismo rol de "quien paga el gas" que ya tiene el
  facilitador de Hedera en x402. **Secuencia:** después de que World ID Sandbox responda (o venza
  el plazo razonable de espera) — no antes, para no partir el foco de dos bloqueos externos a la
  vez.

- [ ] **Uniswap Foundation — contribución al stack + `FEEDBACK.md`.** $5k, lift bajo: no exige
  producto nuevo, exige una contribución real (código o documentación) al stack de Uniswap más un
  `FEEDBACK.md` describiendo la experiencia de integrarlo. **Criterio de aceptación:** PR o commit
  mergeable en un repo del stack de Uniswap (a definir cuál según lo que Creva realmente toca, si
  es que toca algo — si no hay superficie de contacto real, esta pista se descarta en vez de
  forzarla) + `FEEDBACK.md` en este repo. **Secuencia:** en paralelo a Arc, es la más barata de
  ejecutar mientras se espera World ID.

- [ ] **The Graph y 1inch — evaluar después de cerrar Hedera + World + ENS + Arc + Uniswap.**
  Ninguna de las dos tiene hoy una forma de producto *load-bearing* en Creva (`brainstorming.md`
  §1 y §4 no las mapea a ninguna idea con encaje ≥3) — no se agregan sin antes construir esa forma,
  para no violar el descalificador #2. Formas candidatas a validar con el humano antes de tocar
  código:
  - **The Graph ($15k, pista Continuity $5k):** un subgraph que indexe los eventos on-chain que
    Creva ya emite (registro `negocio.creva.eth` en ENSv2/Sepolia del bloque 28dbcde, y el evento
    de respaldo de Arc de arriba si ese bloque cierra primero), y que el score-agent consulte en
    vivo como una señal más del radar regulatorio — ej. "cuántas verificaciones externas ha tenido
    este folio" vía `report-verification.controller.ts`. Se vuelve load-bearing solo si el score
    real cambia cuando ese dato cambia, no si es un panel decorativo.
  - **1inch ($7k):** el facilitador de x402 (Hedera) liquida hoy en la moneda que ya tiene; si en
    algún punto necesita convertir (ej. USDC recibido → moneda nativa para gas), esa conversión es
    candidata a ejecutarse vía Aqua/SwapVM de 1inch en vivo durante la demo. Solo tiene sentido si
    existe esa necesidad real de conversión — si el facilitador nunca convierte, no hay pista que
    integrar y se descarta.
  Ninguna de las dos entra al roadmap como bloque de trabajo hasta que una de estas formas se
  confirme con el humano como real (no hipotética) y se re-puntúe en `brainstorming.md` §4.

- [ ] **Bazantic — $3,000, 3 pistas.** Prerrequisito: cuenta/acceso a Bazantic (gateway x402/MPP +
  servidor MCP + Recipes) — hoy no indexado públicamente, confirmar que el signup existe antes de
  prometer nada (`brainstorming.md` §1, fila Bazantic; §"Bazantic — el hallazgo de la rev. 5").
  Integración: envolver el servidor MCP que ya existe (`creva-score`: `creva_regulatory_radar`,
  `creva_verify_business`, `creva_report`) con Recipes de Bazantic — cero plomería nueva. **Si esto
  no se resuelve, no podemos avanzar:** sin cuenta de Bazantic confirmada, este bloque completo
  (las 3 pistas, $3k) se descarta del roadmap — no hay integración parcial posible.

- [ ] **Ledger — $5,000, 2 pistas (AI Agents x Ledger $3.5k + Continuity $1.5k).** Prerrequisito:
  **Ledger Key Ring CLI** (`wallet-cli ring`) del Ledger Agent Stack, publicado 2026-09-03 en
  developers.ledger.com/ethonline — instalar y generar/importar una cuenta de firma dedicada a este
  track. Regla dura ya anotada: el Key Ring **no puede competir** con la wallet del facilitador de
  Hedera x402 (`brainstorming.md` línea 443) — necesita un rol de firma distinto y real (ej. firmar
  el lado Arc/on-chain del respaldo), no una segunda wallet decorativa. **Si esto no se resuelve
  (CLI instalado + rol de firma no-conflictivo definido), no podemos avanzar** con este bloque —
  se descarta antes que forzar una integración pegada que viole el descalificador #2.

- [ ] **Privy — $5,000, 2 pistas (B2B financial product $2.5k + Best financial flow $2.5k).**
  Prerrequisito: cuenta Privy + `defineChain` de viem con chain ID **296** (Hedera) y su JSON-RPC
  Relay, porque Privy no trae Hedera preconfigurada (`brainstorming.md` línea 336-337). Depende de
  que el bloque Arc/wallet-layer de arriba exista primero — no tiene sentido antes. **Si el chain
  296 custom no queda configurado y probado contra el Hedera JSON-RPC Relay real, no podemos
  avanzar** con este bloque.

- [ ] **Chainlink — $3,000, 2 pistas (Confidential Workflows CRE $2k + Upgrade $500).** Encaje
  débil, solo vigilar (`brainstorming.md` líneas 113-116): la pista de $500 exige que la
  integración **produzca un cambio de estado onchain** — *"simply displaying Chainlink data in a
  frontend is not sufficient"* — y Creva hoy no tiene contratos propios (el bloque Arc de arriba
  cambiaría eso). La de $2k (Confidential Workflows, CRE) todavía no publica requisitos.
  Prerrequisito antes de comprometer: (1) que el bloque Arc cierre y deje un contrato/evento
  onchain real que Chainlink pueda leer o disparar, y (2) que CRE publique los requisitos de
  Confidential Workflows y se confirmen compatibles con la tesis de privacidad de Creva. **Si
  ninguno de los dos prerrequisitos se cumple para el 09/14 (ver Q&A del dashboard), no podemos
  avanzar** con Chainlink y el bloque se descarta sin penalidad — es el fit más débil del lote.

## Variables de entorno por patrocinador — falta configurar

Checklist de cuentas/API keys que hay que crear y meter en el `.env` correspondiente antes de que
cualquier bloque de arriba pueda ejecutarse. `gateway/.env.example` y `app/.env.example` ya
declaran las de Hedera/World actuales; lo nuevo por patrocinador:

| Patrocinador | Variable(s) nuevas | Dónde | Fuente/cómo se obtiene |
|---|---|---|---|
| Hedera *(ya existe, confirmar valor real)* | `HEDERA_PAYER_ACCOUNT_ID`, `HEDERA_PAYER_PRIVATE_KEY`, `FACILITATOR_AUTH_TOKEN`, `FACILITATOR_FEE_PAYER`, `PAY_TO_ADDRESS` | `gateway/.env` | Cuenta testnet ya creada en `portal.hedera.com` (`brainstorming.md:396`) — el humano coloca la private key directo, nunca por chat |
| World *(ya existe, pendiente sandbox)* | `WORLD_API_KEY`, `WORLD_APP_ID`, `EXPO_PUBLIC_WORLD_APP_ID` | `gateway/.env`, `app/.env` | Developer Portal de World — bloqueado por aprobación de Tools for Humanity (ver bloque de arriba) |
| Arc (Circle) | `ARC_RPC_URL`, `ARC_NETWORK` (testnet/mainnet), `CIRCLE_AGENT_STACK_API_KEY`, cuenta/wallet de firma para el evento de respaldo | por definir (`gateway/.env` o nuevo `arc/.env`) | Cuenta Circle Developer + Arc testnet faucet |
| Uniswap Foundation | Ninguna API key — es contribución al stack, no runtime | — | Repo del stack de Uniswap a definir |
| Bazantic | `BAZANTIC_GATEWAY_URL`, `BAZANTIC_MCP_TOKEN` | `gateway/.env` | Signup en Bazantic — **confirmar que existe**, no está indexado públicamente hoy |
| Ledger | Config del Key Ring CLI (no es una env var de app, es estado local del CLI: `~/.ledger/` o similar) | Máquina del agente que firma, no `.env` del repo | `wallet-cli ring` del Ledger Agent Stack |
| Privy | `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, RPC URL de Hedera para `defineChain(296, ...)` | `gateway/.env` o `app/.env` | Dashboard de Privy |
| Chainlink | Por definir — CRE aún no publica requisitos de Confidential Workflows | — | Vigilar publicación, no crear cuenta todavía |

**Ninguna de estas API keys/private keys se pega en el chat** — el humano las coloca directo en el
`.env` que corresponda; una dirección pública o un tx hash sí son seguros de compartir por chat.

## Cerrados

- [x] `2026-09-05` — **Nav de 5 pestañas + sheet "Más" + set de iconos SVG (worktree
  `feature-nav-icon-fix`): 15 hallazgos de la auditoría UI cerrados.** `app/App.tsx`'s `TabBar`
  pasó de 2 pestañas (Inicio/Perfil) a las 5 del objetivo (Inicio, Score, Tarjeta, Crédito, Más);
  Tarjeta queda visiblemente deshabilitada con badge "PRONTO", no tocable
  (`disabled`/`accessibilityState`). "Más" abre `app/features/more/MoreSheet.tsx` ("Todo lo
  demás"), 11 ítems: Mi perfil/Ayuda navegan a `ProfileScreen`/`HelpScreen` existentes sin
  duplicarlas, los otros 9 (Movimientos, Calculadora, Estados de cuenta, Tu garantía, Sello de tu
  negocio, Reglas que te afectan, Tu reporte, Avisos, Aviso de privacidad) van a `StubScreen.tsx`
  genérico con copy tomado de `app/lib/help-content.ts` donde existe artículo. Set de iconos SVG
  compartido en `app/features/shared/icons/Icon.tsx` (21 glyphs, `react-native-svg` recién
  instalado vía `npx expo install`), paths copiados de
  `creva_finance/frontend/components/BottomNav.tsx`/`components/help/HelpGlyph.tsx` donde existían;
  colores resueltos desde `tailwind.config.js` (`theme-colors.ts`), cero hex nuevo en
  `app/features/`. **Decisión escogida:** Score y Crédito son pantallas mínimas reales nuevas
  (`ScoreScreen.tsx`/`CreditScreen.tsx`) que enlazan a `QueryScreen`/`VerifyScreen` respectivamente
  sin repurposearlas — ambas mantienen su identidad y entradas actuales. Los 9 callbacks no-op que
  la auditoría encontró (Dashboard: notificaciones/crédito/tarjeta; Profile: 5 filas de menú; Help:
  artículo/categoría) quedan todos cableados a una pantalla real. `DeleteAccountScreen.tsx` dedicado
  para "Eliminar mi cuenta" (no borra nada real, solo explica el canal de correo de
  `help-content.ts`). **Verify:** `tsc --noEmit` limpio; `jest unit+fuzz+invariant` → 36 suites/157
  tests verdes (antes 33/147, +10 tests nuevos: `test/unit/nav/structure.spec.ts`,
  `test/unit/more/structure.spec.ts`, `test/unit/shared/no-emoji.spec.ts`); `grep` de hex y de
  emoji sobre `app/features/` ambos vacíos; `npx expo start` bundleó `ios` sin error (CI mode,
  HTTP 200, ~9.7MB), servidor detenido y puerto confirmado libre con `netstat`. **Falta:** Expo Go
  en dispositivo físico real, mismo motivo que el resto del repo (sin hardware disponible). Detalle
  completo, incluida la lista de los 15 hallazgos y su resolución uno a uno: `docs/memoria.md`.

- [x] `2026-09-05` — **Auditoría UI/UX completa (worktree `feature-ui-audit-fix`): 6 hallazgos
  cerrados en el mismo lote.** (1) Bug de auth en reload corregido: `App.tsx`'s `AppFlow` ahora
  gatea la pantalla inicial en `useAuth()` real de Clerk (`isLoaded`/`isSignedIn`) en vez de
  `useState<Step>("sign-in")` fijo — una sesión activa + reload va directo a `home`, nunca vuelve a
  mostrar sign-in. (2) Paleta unificada: `app/tailwind.config.js` gana los 10 grupos de color
  `--cr-*` de `creva_finance/frontend/app/globals.css` (valores del `:root` claro, hardcodeados
  porque NativeWind no soporta custom properties CSS); los ~168 literales hex que había en
  `app/features/**` quedaron reemplazados 1:1 por esos tokens — `grep -rn
  "#[0-9A-Fa-f]\{3,6\}" app/features/` da vacío, sin excepciones. (3) Back button: `app/features/
  shared/BackButton.tsx` (nuevo, recreando `components/BackControl.tsx` de creva_finance) agregado
  a `SelfieCheckScreen`, `QueryScreen` y `VerifyScreen` — las tres pantallas sin tab bar; `SignInScreen`
  se deja sin back a propósito (pantalla de entrada, sin "antes" al que volver). (4) **Decisión
  bottom-nav-scope, reafirmada:** onboarding/query/verify se quedan de pantalla completa sin tab
  bar (flujos secuenciales de una sola tarea, no se quiere permitir saltar a Perfil a medio Selfie
  Check o a medio pago x402); dashboard/profile/help mantienen la tab bar mínima que ya tenían.
  (5) Afordancia "(?)": auditoría completa con `grep -rn "❓" app/features/` — un solo resultado
  (`ProfileScreen.tsx:68`), ya cableado a `onOpenHelp`/`setStep("help")`, confirmado funcionando,
  no se tocó. Ningún otro hallazgo. (6) Español: único archivo con copy en inglés real era
  `SelfieCheckScreen.tsx` (estados `identity_unavailable`/`idle`/`failed`/`verifying`) — traducido;
  sanity-check final con grep de palabras inglesas comunes sobre todo `app/features/**/*.tsx` no
  encontró copy visible restante (solo identificadores de código). Test de regresión real
  (no source-regex, a diferencia del resto de `test/unit/**`) en
  `app/test/unit/auth/auth-gate.spec.ts`: renderiza `App.tsx` completo con Clerk mockeado en sesión
  activa, confirma que `SignInScreen` nunca se monta. **Verify:** `tsc --noEmit` limpio;
  `jest unit fuzz invariant` → 33 suites/147 tests (antes 32/146) verdes; `grep` de hex vacío;
  `npx expo start` bundleó `ios` sin error (1332 módulos, HTTP 200), servidor detenido y puerto
  liberado (confirmado con `netstat` tras matar el proceso Node hijo, no solo el shell). **Falta:**
  Expo Go en dispositivo físico real — sin hardware disponible en esta sesión, mismo motivo que el
  resto del repo. Detalle completo, incluida la lista exacta de literales hex reemplazados y un
  incidente de git ajeno a este bloque (resuelto sin dejar rastro): `docs/memoria.md`.

- [x] `2026-09-05` — **Dashboard/Profile/Help Center screens ported, real Clerk sign-in screen
  added (worktree `feature-ui-port-core-screens`).** `app/features/dashboard/DashboardScreen.tsx`,
  `app/features/profile/ProfileScreen.tsx` y `app/features/help/HelpScreen.tsx` portan la
  estructura visual NativeWind de `creva_finance/frontend/app/{dashboard,profile,help}/page.tsx`
  (score primero + una sola acción siguiente en dashboard, menú de configuración en profile,
  buscador + más-preguntado + temas en help), reusando `app/features/query/components/
  VisualPrimitives.tsx` y `ScoreGauge.tsx` en vez de duplicarlos, y `app/lib/{help-content,
  reminders,format-money,score-display}.ts` ya portados. `app/features/help/components/
  {HelpGlyph,HelpSearch}.tsx` recrean los equivalentes de `components/help/*` con emoji en vez de
  SVG (mismo criterio que `ScoreGauge` de no añadir dependencia SVG nueva). Dashboard y Profile
  usan datos mock/estado local (igual que `QueryScreen`), no llaman a `app/lib/api.ts` — cablear
  datos reales queda fuera de este bloque. `app/features/auth/SignInScreen.tsx` es construcción
  nueva (no un port 1:1, porque `/login` de creva_finance solo redirige al formulario alojado por
  Clerk en web, sin equivalente en Expo): usa `useSignIn`/`useSignUp`/`useSSO` reales de
  `@clerk/clerk-expo` contra el contexto que ya monta `ClerkAppProvider.tsx` (no tocado), con
  estilo NativeWind recreando el lenguaje visual de `components/auth/*` (marca, GoogleButton,
  AuthDivider, campo de contraseña con ojo). Tests nuevos en `app/test/unit/{dashboard,profile,
  help,auth}/**` (10 specs, 146 tests totales en el repo tras el cambio) — mismo patrón de
  inspección de fuente por regex que `app/test/unit/query/safe-area.spec.ts`, porque
  `jest.config.js` solo matchea `*.spec.ts` y JSX en un test requeriría `.tsx`. **`tsc --noEmit`**
  y **`jest` (unit+fuzz+invariant)** verdes: 32 suites / 146 tests. `npx expo start` verificado
  bundleando para `ios` (CI mode, 1321 módulos, HTTP 200 en `/index.bundle`) — el bundle `web`
  falla por falta de `react-native-web` (dependencia preexistente, no instalada, fuera de alcance
  de este bloque: la app nunca se configuró para el target web). Servidor Metro detenido al
  terminar, puertos verificados libres con `netstat` tras `taskkill`. **Actualización `2026-09-05`:
  las cuatro pantallas ya están cableadas en `App.tsx`** — flujo `sign-in → onboarding → home
  (dashboard) ↔ profile → help`, más `query`/`verify` alcanzables desde `home` (`onOpenScore`).
  Tab bar mínima (Inicio/Perfil) agregada directamente en `App.tsx`, sin tocar las pantallas, para
  moverse entre `home`/`profile`/`help`; `query`, `verify`, `onboarding` y `sign-in` siguen de
  pantalla completa sin tab bar, igual que antes. Callbacks sin destino real todavía
  (`onOpenCredit`/`onOpenCard`/`onOpenNotifications`/`onOpenDetails`/`onOpenFiscal`/
  `onOpenSecurity`/`onOpenDeleteAccount`/`onOpenArticle`/`onOpenCategory`) quedan sin conectar a
  propósito — no hay pantalla destino todavía. `tsc`/`jest` (32 suites/146 tests) y bundle `ios`
  de Metro (CI mode, HTTP 200) verificados de nuevo tras el wiring, servidor detenido y puerto
  liberado. Falta, como en el resto del repo: Expo Go en dispositivo físico real (sin hardware
  disponible en esta sesión).

- [x] `2026-09-05` — **`negocio.creva.eth` registrado en Sepolia (ENSv2), folio sellado en el
  resolver.** `creva.eth` registrado vía el `ETHRegistrar` de ENSv2 (pagado en Sepolia USDC del
  faucet de Circle, no en ETH — la ruta ENSv1 documentada por ENS Labs para Sepolia está muerta,
  ver `docs/memoria.md` 2026-09-05 para la investigación completa). `negocio.creva.eth` creado bajo
  un `PermissionedRegistry` propio desplegado como subregistro de `creva.eth`, con un
  `PermissionedResolver` (clon EIP-1167) inicializado y record de texto
  `creva.report.folio = "SP-2026-000123"` — verificado con lectura on-chain (`text()` devuelve el
  valor exacto) y con la cadena completa registry→subregistry→resolver confirmada por separado.
  Evidencia (tx reales, Sepolia):
  - Registro `creva.eth`: commit `0x1e1c6370fd7842ec478b77f185d613ebb61c4655c9a1542e4bc2f2032fce344b`,
    approve USDC `0x14ce0d8c1386d91f99038a04965fc342aa58a6df6e909f3e3b0dd72308e20150`,
    register `0x84c7f6c0596a3e5bf034cf7a82dc02ed76149d7b260c7af01c7d137f14ee106c`.
  - Subregistro de `creva.eth`: deploy `0x5fbeb7a22ef310d42e62406ad3c8eea10aba5a8102f157795a607f1b0f1ea836`
    (dirección `0xe8FB3c870cAf02362Aba74EB0Bf81373B4C0FF37`), `setSubregistry`
    `0x3ca11cd18c6ae52b8240c242d87067aef6defa17c1eae45f20a6b0aa32e754ca`.
  - Registro `negocio`: `0xa31acb51c6bcda51485f321d6c91565a224e9f879806dd27225502ae6af4b03c`.
  - Resolver de `negocio.creva.eth`: deploy del clon
    `0x6aebd901d21bf1b1321f7883d6a6fe28a070e39d281791fff6ecfa16e21c2cfe` (dirección
    `0x9Ed7fF67BAb3f8fF254D0a966CFd1F94997B7E9E`), `initialize`
    `0x4547c16113a393b744e2c82874bdff1cff048ad28ebaf5d984f682008ea239ce`, `setResolver`
    `0x20f8e4ab13437b5e9040e2bae71592b5256a2aeca857e91329fa1b555a208250`, `setText`
    `0x24a736bef485cefbb61db2481ac94339c24f93d4a6ad947a92df2c9e6509f6a9`.
  - Explorer: https://sepolia.app.ens.domains/negocio.creva.eth
  Detalle completo (incluidos dos intentos previos que fallaron por bitmaps de rol incompletos, ya
  corregidos): `docs/memoria.md`.

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
