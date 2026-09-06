// PrivacyScreen.tsx: mobile port of creva_finance's app/privacy/page.tsx — the privacy notice the
// LFPDPPP requires. Pure legal text with no API behind it; the copy is carried 1:1 from the
// reference, with the few emphasised phrases kept as bold runs.
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "../shared/BackButton";

export interface PrivacyScreenProps {
  onBack: () => void;
}

type Run = string | { b: string };
type Block = { p: Run[] } | { ul: string[] };
interface LegalSection {
  title: string;
  blocks: Block[];
}

const SECTIONS: LegalSection[] = [
  {
    title: "1. Responsable del tratamiento",
    blocks: [
      {
        p: [
          'FINARA / Creva (en adelante "Creva"), con domicilio en Ciudad de México, México, es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
        ],
      },
    ],
  },
  {
    title: "2. Datos personales que recopilamos",
    blocks: [
      { p: ["Recopilamos los siguientes datos personales:"] },
      {
        ul: [
          "Nombre completo",
          "Correo electrónico",
          "Número telefónico",
          "CURP (Clave Única de Registro de Población)",
          "RFC (Registro Federal de Contribuyentes)",
          "Régimen fiscal y dirección fiscal",
          "Historial de transacciones con tarjeta",
          "Movimientos de los estados de cuenta bancarios que subas voluntariamente (fecha, concepto y monto)",
        ],
      },
      {
        p: [
          "Si el estado de cuenta que sube contiene su nombre, RFC o domicilio, leemos esa información una sola vez para confirmar que el documento te pertenece. ",
          { b: "Esa información de identidad nunca se almacena" },
          " — únicamente conservamos si coincidió o no con su perfil.",
        ],
      },
    ],
  },
  {
    title: "3. Finalidades del tratamiento",
    blocks: [
      { p: ["Sus datos personales son utilizados para:"] },
      {
        ul: [
          "Finalidades primarias: Verificación de identidad (KYC), emisión y gestión de tarjeta virtual, procesamiento de transacciones, cálculo de capacidad de gasto, y prestación del servicio financiero.",
          "Finalidades secundarias: Generación de reportes financieros personalizados, cálculo de su perfil y recomendaciones de crédito a partir de sus movimientos (de tarjeta y de los estados de cuenta que suba), y mejora continua del servicio.",
        ],
      },
      {
        p: [
          "Al subir un estado de cuenta, confirmas bajo su propio criterio que la información es real y no ha sido alterada. Creva no verifica de forma independiente la autenticidad del documento y no es responsable de las decisiones tomadas con base en información alterada por el usuario.",
        ],
      },
    ],
  },
  {
    title: "4. Transferencia de datos a terceros",
    blocks: [
      { p: ["Sus datos pueden ser transferidos a:"] },
      {
        ul: [
          "Dynerox — Para verificación de identidad (KYC) y gestión de colateral (on-ramp MXN). Dynerox opera bajo regulación mexicana y gestiona CLABEs, KYC y reportes UIF.",
          "Reap Global — Para emisión y operación de tarjeta virtual Visa. Reap es emisor principal Visa en México.",
          "Supabase (AWS) — Para almacenamiento seguro de datos. Los servidores se encuentran en Estados Unidos (región Oregon, US-West-2).",
        ],
      },
      {
        p: [
          "Al registrarse, consientes la transferencia internacional de sus datos a servidores ubicados en Estados Unidos, conforme a los artículos 36 y 37 de la LFPDPPP.",
        ],
      },
    ],
  },
  {
    title: "5. Derechos ARCO",
    blocks: [
      {
        p: [
          "Tienes derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales (derechos ARCO). Para ejercer estos derechos, envíe un correo a ",
          { b: "privacidad@finarahub.mx" },
          " indicando su nombre, correo registrado en Creva, y el derecho que desea ejercer. Responderemos en un plazo máximo de 20 días hábiles.",
        ],
      },
    ],
  },
  {
    title: "6. Medidas de seguridad",
    blocks: [
      {
        p: [
          "Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales, incluyendo: cifrado en tránsito (TLS 1.2+) y en reposo (AES-256), autenticación por JWT, políticas de Row Level Security (RLS) en base de datos, verificación de firmas en webhooks, y rate limiting para prevenir accesos no autorizados.",
        ],
      },
    ],
  },
  {
    title: "7. Uso de cookies y tecnologías",
    blocks: [
      {
        p: [
          "Creva utiliza almacenamiento local del navegador (localStorage y sessionStorage) para gestionar su sesión de usuario. No utilizamos cookies de terceros ni tecnologías de rastreo publicitario.",
        ],
      },
    ],
  },
  {
    title: "8. Cambios al aviso de privacidad",
    blocks: [
      {
        p: [
          "Nos reservamos el derecho de modificar este aviso de privacidad. Cualquier cambio será comunicado a través de la plataforma o por correo electrónico.",
        ],
      },
    ],
  },
  {
    title: "9. Contacto",
    blocks: [
      {
        p: [
          "Para cualquier duda o solicitud relacionada con la protección de sus datos personales, puede contactarnos en: ",
          { b: "privacidad@finarahub.mx" },
        ],
      },
    ],
  },
];

function Paragraph({ runs }: { runs: Run[] }) {
  return (
    <Text className="text-sm leading-6 text-text/70">
      {runs.map((run, i) =>
        typeof run === "string" ? (
          <Text key={i}>{run}</Text>
        ) : (
          <Text key={i} className="font-bold text-text">
            {run.b}
          </Text>
        ),
      )}
    </Text>
  );
}

export function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="privacy-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Aviso de Privacidad</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">Última actualización: agosto 2026</Text>

        <View className="gap-6">
          {SECTIONS.map((section) => (
            <View key={section.title} className="gap-2" testID="privacy-section">
              <Text className="text-base font-bold text-text">{section.title}</Text>
              {section.blocks.map((block, i) =>
                "ul" in block ? (
                  <View key={i} className="gap-1.5">
                    {block.ul.map((item) => (
                      <Text key={item} className="text-sm leading-6 text-text/70">
                        •  {item}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Paragraph key={i} runs={block.p} />
                ),
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
