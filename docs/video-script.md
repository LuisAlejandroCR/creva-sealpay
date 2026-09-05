<!-- video-script.md: guion del video de 3 minutos para el Q&A en vivo del 09/14 y el rango 2-5
     min de los patrocinadores. No es docs/plan.md (ahí solo el criterio de aceptación del bloque)
     ni brainstorming.md (ahí el análisis completo detrás de cada decisión narrativa). -->

# Guion del video — armado con el framework Pitch Deck (no Sales Deck)

**Por qué Pitch Deck y no Sales Deck:** quien decide en el Q&A del 09/14 es el jurado que reparte
premio — busca retorno (impacto + dificultad técnica + creatividad), no resuelve un problema propio
como lo haría un cliente. El héroe de un Pitch Deck es el equipo, no el usuario — la usuaria de
Creva aparece como prueba de tracción, no como protagonista a quien convencer.

| Columna del framework | Cómo aplica aquí |
|---|---|
| Quién decide | El jurado — reparte premio de patrocinador y decide quién avanza a finalista |
| El héroe | El equipo — lo que construyó en los 12 días, no la usuaria |
| TAM o mercado | La tesis regulatoria (§3 de `brainstorming.md`): sin Open Finance en México, el sello cripto sustituye al río de datos que el Estado no garantiza |
| Tracción | Lo que ya corre: sello firmado en producción, señales de registros oficiales, 4 ramas integradas, spec pública |
| Precio | No hay precio — el ask son las pistas de premio: Hedera ($6k) + World ($3.5k) + ENS ($500, entregado) + Arc ($10k) + Uniswap Foundation ($5k) |
| Éxito de la reunión | No hay "segunda reunión" literal — el equivalente es avanzar a finalista y que el jurado pida ver el repo |

## Restricción dura antes de grabar

**Actualización `2026-09-05`: la liquidación real de Hedera ya existe — grabarla como hecho, no
como pendiente.** `docs/plan.md` (bloque "Gateway x402/Hedera") confirma tx real liquidada en
Hedera testnet, `result: SUCCESS`, hash `0.0.7162784-1788585962-768194628`
(https://hashscan.io/testnet/transaction/0.0.7162784-1788585962-768194628). Lo que sigue pendiente
el día de grabar es **World ID Sandbox** (aprobación de Tools for Humanity todavía no llega, ver
`docs/plan.md`) — ese es el bloqueo real a nombrar en el beat de honestidad, no Hedera. Revisar
`docs/plan.md` de nuevo el día de grabar por si el estado cambió otra vez.

## Guion — 180 segundos

| Tiempo | Beat | Qué se dice / muestra |
|---|---|---|
| 0:00–0:15 | **Gancho — tracción disfrazada de demo** | Pantalla: el radar regulatorio de Creva respondiendo solo, sin que nadie se lo pida, con la disposición exacta de la CNBV que sostiene la tesis. *"Esto no es un mockup leyendo un JSON de prueba — es Creva encontrando, en producción, la norma que dice por qué este producto existe."* |
| 0:15–0:35 | **El problema — mercado, no la usuaria** | *"En México no hay Open Finance. El artículo 76 de la Ley Fintech lleva más de 2,170 días de retraso. Donde no hay un regulador que garantice el flujo del dato, la portabilidad tiene que salir de otro lado."* |
| 0:35–0:55 | **La respuesta — el sello, ya construido** | *"Creva ya emite un reporte firmado que cualquiera verifica sin cuenta — Ed25519, folio, cinco veredictos, y dice explícitamente qué NO acredita."* Mostrar `/verify` respondiendo en vivo contra un reporte real. |
| 0:55–1:25 | **Lo nuevo — qué se construyó en el evento** | Selfie Check al alta (World, sin Orb) → query de señales gateada por x402 → verificación del sello, también gateada. Mostrar la app en Expo Go: pantalla de onboarding → pantalla de query → 402 → pantalla de reporte verificado. *"Cada consulta se paga individual, en vez de gastar la cuota compartida de Creva."* |
| 1:25–1:45 | **Tracción agregada — la prueba de ejecución** | Un solo plano con las cifras reales: repo público, 4 ramas de feature integradas, suite de tests unit+fuzz+invariant en verde, spec OpenAPI con 46 rutas ya desplegada antes del evento. *"Esto no es un prototipo de una noche — es una integración real sobre un backend que ya sirve producción."* |
| 1:45–2:05 | **Honestidad sobre lo que falta** | *"Lo que no hemos cerrado todavía: Selfie Check contra el sandbox real de World — el enrollment está pendiente de aprobación de Tools for Humanity, no es trabajo nuestro sin hacer."* (Mostrar el hash de la tx real de Hedera ya liquidada como prueba de lo que sí cerró.) |
| 2:05–2:30 | **El ask** | *"Aplicamos a Hedera AI & Agentic Payments, World Selfie Check, ENS, Arc de Circle y Uniswap Foundation, dentro de la pista Continuity. Les pedimos avanzar como finalistas — lo que ya corre es la prueba de que el resto se cierra."* |
| 2:30–2:50 | **El cierre — hacia dónde va después** | *"El sello firmado y el sello de conocimiento cero son el mismo puerto con distinta implementación. `creva-zk` ya tiene los circuitos. Este es el paso uno."* |
| 2:50–3:00 | **Llamado a la acción** | Repo público en pantalla, URL legible, folio del reporte de la demo legible en voz alta (regla de Creva: el folio se puede dictar). |

## Verify

- [ ] Cronometrado real contra un cronómetro, no estimado por conteo de palabras
- [ ] La sección 1:45–2:05 dice la verdad del día de grabación — revisar `docs/plan.md` antes de
      grabar, no antes de escribir el guion
- [ ] Ningún número en este guion sin fuente verificable en `brainstorming.md` o `docs/plan.md`
- [ ] Cabe en 3:00 exactos para el límite del Q&A del 09/14; el recorte a 2:00 para patrocinadores
      más estrictos identificado (candidato: comprimir 0:55–1:45 en una sola toma continua)
