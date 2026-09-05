// SignInScreen.tsx: real Expo sign-in/sign-up screen using @clerk/clerk-expo's useSignIn and
// useSignUp hooks against the Clerk context ClerkAppProvider.tsx already mounts. Not a 1:1 port
// like dashboard/profile/help — creva_finance's /login is a redirect stub to Clerk's own hosted
// web form, which has no Expo equivalent, so this recreates components/auth/*'s visual language
// (AuthHeader mark + title, GoogleButton, AuthDivider, PasswordField's show/hide eye, AuthFooter
// switch link) in NativeWind instead of importing from the Next.js reference app.
import { useSignIn, useSignUp, useSSO } from "@clerk/clerk-expo";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "sign-in" | "sign-up";

export interface SignInScreenProps {
  onSignedIn?: () => void;
}

function AuthMark() {
  return (
    <View className="mb-6 h-16 w-16 items-center justify-center self-center rounded-2xl bg-crimson">
      <Text className="text-2xl font-bold text-white">C</Text>
    </View>
  );
}

function GoogleButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID="google-oauth-button"
      className="flex-row items-center justify-center gap-3 rounded-xl border border-text/15 bg-surface-1 px-5 py-3"
    >
      <Text className="text-base">G</Text>
      <Text className="font-semibold text-text">{label}</Text>
    </Pressable>
  );
}

function AuthDivider({ label = "o con correo" }: { label?: string }) {
  return (
    <View className="my-6 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-text/10" />
      <Text className="text-xs uppercase text-text/40">{label}</Text>
      <View className="h-px flex-1 bg-text/10" />
    </View>
  );
}

function PasswordField({
  value,
  onChangeText,
  label,
  testID,
}: {
  value: string;
  onChangeText: (next: string) => void;
  label: string;
  testID: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-text">{label}</Text>
      <View className="flex-row items-center rounded-xl border border-text/15 bg-surface-1 pr-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!shown}
          autoCapitalize="none"
          autoComplete="password"
          testID={testID}
          className="flex-1 px-4 py-3 text-base text-text"
        />
        <Pressable onPress={() => setShown((current) => !current)} accessibilityLabel={shown ? "Ocultar contraseña" : "Mostrar contraseña"}>
          <Text className="text-text/50">{shown ? "🙈" : "👁️"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SignInScreen({ onSignedIn }: SignInScreenProps) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const isSignIn = mode === "sign-in";
  const title = isSignIn ? "Bienvenida de vuelta" : "Crea tu cuenta";
  const subtitle = isSignIn
    ? "Entra con tu correo y contraseña de Creva."
    : "Un correo y una contraseña, y ya estás dentro.";

  async function handleGoogle() {
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_google" });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        onSignedIn?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo continuar con Google.");
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignIn) {
        if (!signInLoaded) return;
        const attempt = await signIn.create({ identifier: email, password });
        if (attempt.status === "complete") {
          await setActiveSignIn({ session: attempt.createdSessionId });
          onSignedIn?.();
        } else {
          setError("No se pudo completar el inicio de sesión.");
        }
      } else {
        if (!signUpLoaded) return;
        const attempt = await signUp.create({ emailAddress: email, password });
        if (attempt.status === "complete") {
          await setActiveSignUp({ session: attempt.createdSessionId });
          onSignedIn?.();
        } else {
          // Most Clerk instances require email verification next; surface that instead of
          // silently failing.
          setError("Revisa tu correo para verificar tu cuenta antes de entrar.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center px-6 py-10">
        <AuthMark />
        <Text className="text-center text-2xl font-bold text-text">{title}</Text>
        <Text className="mt-2 text-center text-base leading-6 text-text/70">{subtitle}</Text>

        <View className="mt-8 gap-4">
          <GoogleButton label="Continuar con Google" onPress={handleGoogle} disabled={submitting} />
        </View>

        <AuthDivider />

        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-text">Correo</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="email-input"
              className="rounded-xl border border-text/15 bg-surface-1 px-4 py-3 text-base text-text"
            />
          </View>

          <PasswordField
            value={password}
            onChangeText={setPassword}
            label="Contraseña"
            testID="password-input"
          />

          {error ? (
            <Text testID="auth-error" className="text-sm font-semibold text-crimson">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            testID="auth-submit"
            className="items-center rounded-xl bg-crimson px-5 py-3"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-semibold text-white">{isSignIn ? "Entrar" : "Crear cuenta"}</Text>
            )}
          </Pressable>
        </View>

        <View className="mt-auto items-center pt-10">
          <Pressable
            onPress={() => setMode(isSignIn ? "sign-up" : "sign-in")}
            testID="auth-switch-mode"
          >
            <Text className="text-sm text-text/70">
              {isSignIn ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <Text className="font-semibold text-crimson">{isSignIn ? "Regístrate" : "Entra"}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
