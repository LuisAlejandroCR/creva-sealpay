// PersonalDataScreen.tsx: mobile port of creva_finance's app/profile/details/page.tsx — edits
// firstName/lastName/phone via the real profiles.get()/profiles.update() (app/lib/api.ts). Email
// stays read-only from the Clerk session (same reasoning as the reference: the backend still
// answers a pre-Clerk token that could hand back a different account's address).
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";

import { profiles } from "../../lib/api";
import { BackButton } from "../shared/BackButton";
import { Section } from "../query/components/VisualPrimitives";
import { TextField as Field } from "./components/FormField";

export interface PersonalDataScreenProps {
  onBack: () => void;
}

export function PersonalDataScreen({ onBack }: PersonalDataScreenProps) {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName((current) => current || user?.firstName || "");
    setLastName((current) => current || user?.lastName || "");
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    profiles
      .get()
      .then((data) => {
        if (cancelled) return;
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        setPhone(data.phone ?? "");
      })
      .catch(() => {
        // The backend still speaks Supabase; until it speaks Clerk, Clerk's own names stand.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await profiles.update({ firstName, lastName, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="personal-data-screen">
      <View className="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="mb-6 text-3xl font-bold text-text">Datos personales</Text>

        {loading ? (
          <View className="items-center py-6" testID="personal-data-loading">
            <ActivityIndicator />
          </View>
        ) : (
          <Section>
            <Field
              label="Nombres"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nombre"
              testID="personal-data-first-name"
            />
            <Field
              label="Apellidos"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Apellido"
              testID="personal-data-last-name"
            />
            <Field
              label="Correo electrónico"
              value={email}
              editable={false}
              note="Es el correo con el que entras. Para cambiarlo, usa Seguridad."
              testID="personal-data-email"
            />
            <Field
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="+52 55 1234 5678"
              testID="personal-data-phone"
            />

            {error ? (
              <Text className="mb-3 text-sm text-danger" testID="personal-data-error">
                {error}
              </Text>
            ) : null}
            {saved ? (
              <Text className="mb-3 text-sm text-success" testID="personal-data-saved">
                Cambios guardados
              </Text>
            ) : null}

            <Pressable
              className="rounded-xl bg-crimson px-5 py-3"
              onPress={handleSave}
              disabled={saving}
              testID="personal-data-save-cta"
            >
              <Text className="text-center font-semibold text-white">
                {saving ? "Guardando…" : "Guardar cambios"}
              </Text>
            </Pressable>
          </Section>
        )}
      </View>
    </SafeAreaView>
  );
}
