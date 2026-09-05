// stub-topics.ts: the 9 "Más" items that have no real screen yet (Mi perfil and Ayuda route to
// the existing ProfileScreen/HelpScreen instead — see MoreSheet.tsx). Descriptive copy is pulled
// from app/lib/help-content.ts's existing articles where one already answers the topic, per the
// UI audit's instruction to reuse that copy instead of inventing new text for a stub.
import { findArticle } from "../../lib/help-content";
import type { IconName } from "../shared/icons/Icon";

export type StubTopicKey =
  | "movements"
  | "calculator"
  | "statements"
  | "collateral"
  | "business-verification"
  | "regulatory"
  | "report"
  | "notifications"
  | "privacy";

export interface StubTopic {
  key: StubTopicKey;
  label: string;
  icon: IconName;
  body?: string;
}

export const STUB_TOPICS: StubTopic[] = [
  {
    key: "movements",
    label: "Movimientos",
    icon: "movements",
    body: findArticle("cifras", "movimiento-sin-categoria")?.article.answer,
  },
  {
    key: "calculator",
    label: "Calculadora",
    icon: "calculator",
    // No help-content article documents the calculator yet — left without body copy on purpose
    // rather than inventing text (see docs/plan.md, "Más" block).
  },
  {
    key: "statements",
    label: "Estados de cuenta",
    icon: "statement",
    body: findArticle("cifras", "subir-estado-de-cuenta")?.article.answer,
  },
  {
    key: "collateral",
    label: "Tu garantía",
    icon: "collateral",
    body: findArticle("tarjeta", "cuanto-puedo-gastar")?.article.answer,
  },
  {
    key: "business-verification",
    label: "Sello de tu negocio",
    icon: "registry",
    body: findArticle("gobierno", "no-listado")?.article.answer,
  },
  {
    key: "regulatory",
    label: "Reglas que te afectan",
    icon: "seal",
    body: findArticle("gobierno", "reglas-que-me-afectan")?.article.answer,
  },
  {
    key: "report",
    label: "Tu reporte",
    icon: "seal",
    body: findArticle("reporte", "que-es-el-reporte")?.article.answer,
  },
  {
    key: "notifications",
    label: "Avisos",
    icon: "bell",
    // No dedicated help-content article for the notifications list itself.
  },
  {
    key: "privacy",
    label: "Aviso de privacidad",
    icon: "privacy",
    body: findArticle("datos", "quien-ve-mi-informacion")?.article.answer,
  },
];

export function findStubTopic(key: StubTopicKey): StubTopic {
  const topic = STUB_TOPICS.find((item) => item.key === key);
  if (!topic) throw new Error(`Unknown stub topic: ${key}`);
  return topic;
}
