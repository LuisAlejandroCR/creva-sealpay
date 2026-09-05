<!-- slides-outline.md: outline de las 10 slides de slides.html (artefacto de brainstorming.md §6),
     Pitch Deck para que el jurado avance el proyecto a finalista — no un Sales Deck de cliente.
     Se distingue de video-script.md: el guion narra en 180s continuos, esto son 10 momentos
     discretos que alguien puede hojear sin sonido. -->

# Outline de `slides.html` — Pitch Deck, 10 slides / 4 actos

Misma decisión narrativa que `video-script.md`: el jurado decide premio, busca retorno — el héroe
es el equipo, la tracción es lo que ya corre, el ask son las dos pistas de premio. Mapeado 1:1
contra los beats del guion de video para que un jurado que ve las slides y el video no reciba dos
historias distintas.

| # | Acto | Slide | Contenido |
|---|---|---|---|
| 1 | Contexto | **Portada — la promesa, no el logo** | Título: *"Verifica que un negocio es real en segundos — no en semanas de llamadas y referencias."* (mismo gancho del README, una sola fuente). Debajo, no antes: el radar regulatorio de Creva respondiendo solo con la disposición CNBV exacta — captura de pantalla real, no mockup, como prueba de la promesa, no como el gancho en sí |
| 2 | Contexto | **El problema — mercado** | México sin Open Finance: artículo 76 de la Ley Fintech, 2,170+ días de retraso, fuente y fecha (`brainstorming.md` §3) |
| 3 | Contexto | **Por qué hoy — disparador de competencia, no de regla** | El vacío regulatorio de la slide 2 es crónico (2,170+ días), no es lo nuevo. Lo nuevo: **agentes de IA que necesitan pagar por una señal de confianza ellos mismos, sin que un humano intervenga en cada consulta** — x402 recién lo hizo posible como estándar (Hedera, ["Hedera and the x402 Payment Standard"](https://hedera.com/blog/hedera-and-the-x402-payment-standard/), leído 2026-08-31). *"Este año, un agente evaluando una proveedora mexicana ya puede pagar por la respuesta él mismo — antes no tenía cómo."* El sello firmado ya existe (`brainstorming.md` §0.2) y es lo que hace que ese pago valga algo: una respuesta que se puede verificar, no solo comprar |
| 4 | Costo | **Qué le cuesta seguir así — costo real, no inventado** | Hoy Creva consulta registros oficiales bajo **una cuota diaria de toda la organización** (`brainstorming.md` §5, regla #19 del producto): cada consulta que hace un agente le resta cuota a todos los demás usuarios reales. Sin x402, escalar el número de agentes que consultan **agota el servicio para las personas**, no solo cuesta dinero. **⏳ pendiente — una línea, un número, una tarea concreta:** preguntarle a un usuario real de
Creva (o al próximo que llame) *"¿qué te cuesta seguir verificando negocios como lo haces hoy —
en plata, en horas, o en errores?"* y usar la respuesta exacta, no una paráfrasis. Si no hay
respuesta real antes de presentar, la slide se queda solo con el argumento de la cuota (sí
sourced) — nunca con un número inventado para sonar completo |
| 5 | Camino | **La solución — flujo de 3 pasos** | Diagrama: Selfie Check (World) → query gateada por x402 (Hedera) → verificación del sello, cada paso pagado individual |
| 6 | Camino | **Lo que se construyó en el evento** | Las 3 pantallas reales de la app (capturas de Expo Go): onboarding, query pagada, reporte verificado |
| 7 | Camino | **Tracción agregada** | Cifras verificables: repo público, 4 ramas de feature integradas, suite unit+fuzz+invariant en verde, spec OpenAPI con 46 rutas desplegada antes del evento |
| 8 | Camino | **Arquitectura** | `app (Expo/RN) --x402--> gateway (Express) --> Creva API` — el mismo diagrama del README, una sola fuente de verdad |
| 9 | Compromiso | **Honestidad + el ask** | Qué falta (liquidación real en Hedera testnet, con estado del día) + pistas objetivo: Hedera AI & Agentic Payments ($6k) y World Selfie Check ($3.5k), track Continuity |
| 10 | Compromiso | **Cierre + siguiente paso** | Hacia dónde va (creva-zk, mismo puerto distinta implementación) + repo público en pantalla + folio del reporte de demo, legible en voz alta |

## Regla de consistencia con el video

Cualquier cambio a un beat de `video-script.md` que afecte una cifra o un estado (ej. si ya existe
tx real de Hedera para cuando se presente) se refleja en la slide correspondiente **en el mismo
lote** — no hay una versión "actualizada" y otra desactualizada de la misma afirmación.

## Verify

- [ ] Cada slide con una cifra tiene la misma fuente que su beat correspondiente en
      `video-script.md`
- [ ] La slide 9 se revisa contra `docs/plan.md` el día de presentar, no el día de escribir esto
- [ ] Ninguna slide reintroduce una funcionalidad no construida (regla dura de `AGENTS.md`)
