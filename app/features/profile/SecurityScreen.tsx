// SecurityScreen.tsx: mobile port of creva_finance's app/profile/security/page.tsx — three cards
// (change password, session, your data). Reads the email from the Clerk session, not the
// reference's auth.me() (pre-Clerk backend), same fix already applied in PersonalDataScreen.tsx.
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";

import { auth } from "../../lib/api";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";

export interface SecurityScreenProps {
  onBack: () => void;
}

export function SecurityScreen({ onBack }: SecurityScreenProps) {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      await auth.forgotPassword(email);
      setSent(true);
    } catch {
      setError("No pudimos enviar el correo. Inténtalo de nuevo en un minuto.");
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="security-screen">
      <View className="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Seguridad</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">Tu contraseña y tu sesión.</Text>

        <Section>
          <Card>
            <Text className="text-base font-semibold text-text">Cambiar tu contraseña</Text>
            <Text className="mt-2 text-sm leading-5 text-text/60">
              Te enviamos un enlace a {email || "tu correo"} para que la cambies desde ahí. El
              enlace vence solo, y nadie más puede usarlo.
            </Text>
            {sent ? (
              <Text className="mt-3 text-sm font-semibold text-success" testID="security-reset-sent">
                Listo: revisa tu correo. Si no llega en unos minutos, revisa el spam.
              </Text>
            ) : (
              <Pressable
                className="mt-3 rounded-xl bg-crimson px-5 py-3"
                onPress={handleReset}
                disabled={sending || !email}
                testID="security-reset-cta"
              >
                <Text className="text-center font-semibold text-white">
                  {sending ? "Enviando…" : "Enviarme el enlace"}
                </Text>
              </Pressable>
            )}
            {error ? (
              <Text className="mt-3 text-sm text-danger" testID="security-reset-error">
                {error}
              </Text>
            ) : null}
          </Card>
        </Section>

        <Section>
          <Card>
            <Text className="text-base font-semibold text-text">Tu sesión</Text>
            <Text className="mt-2 text-sm leading-5 text-text/60">
              Creva guarda tu sesión solo en este dispositivo. Al cerrar sesión desde tu perfil, se
              borra de aquí; en otro dispositivo tendrás que volver a entrar.
            </Text>
          </Card>
        </Section>

        <Section>
          <Card>
            <Text className="text-base font-semibold text-text">Tus datos</Text>
            <Text className="mt-2 text-sm leading-5 text-text/60">
              Puedes eliminar tu cuenta y todo lo que guardamos de ti desde tu perfil. Es
              permanente: no hay copia que podamos devolverte después.
            </Text>
          </Card>
        </Section>
      </View>
    </SafeAreaView>
  );
}
