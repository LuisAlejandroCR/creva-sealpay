// StubScreen.tsx: generic "coming soon" screen shared by every Más item that has no real screen
// yet (Movimientos, Calculadora, Estados de cuenta, Tu garantía, Sello de tu negocio, Reglas que
// te afectan, Tu reporte, Avisos, Aviso de privacidad) plus the three profile detail rows (Datos
// personales, Información fiscal, Seguridad) — same shape, so one component covers all of them.
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "./BackButton";
import { Icon, type IconName } from "./icons/Icon";

export interface StubScreenProps {
  title: string;
  icon: IconName;
  /** Sourced from app/lib/help-content.ts where an article already answers this topic. */
  body?: string;
  onBack: () => void;
  testID?: string;
}

export function StubScreen({ title, icon, body, onBack, testID }: StubScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID={testID}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />

        <View className="mb-6 items-start gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-2xl border border-text/10 bg-surface-1">
            <Icon name={icon} size={26} color="text" />
          </View>
          <Text className="text-3xl font-bold text-text">{title}</Text>
        </View>

        {body ? <Text className="mb-4 text-base leading-6 text-text/70">{body}</Text> : null}

        <View className="rounded-2xl border-2 border-dashed border-text/15 bg-surface-1 p-6">
          <Text className="text-sm font-semibold text-text">Próximamente</Text>
          <Text className="mt-1 text-sm leading-5 text-text/60">
            Esta pantalla todavía no tiene funcionalidad real — está en el mapa, no lista hoy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
