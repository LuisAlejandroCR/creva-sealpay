// ProfileScreen.tsx: mobile port of creva_finance's profile/page.tsx — account summary, the
// menu into every setting screen, and sign-out. Reads the signed-in Clerk user for name/email
// (ClerkAppProvider is already mounted higher up; this screen only consumes useUser/useClerk).
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Section } from "../query/components/VisualPrimitives";

export interface ProfileScreenProps {
  onOpenDetails?: () => void;
  onOpenFiscal?: () => void;
  onOpenSecurity?: () => void;
  onOpenNotifications?: () => void;
  onOpenHelp?: () => void;
  onOpenDeleteAccount?: () => void;
  onSignedOut?: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  onPress?: () => void;
}

function MenuRow({ label, icon, onPress, testID }: { label: string; icon: string; onPress?: () => void; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="flex-row items-center justify-between border-b border-[#1A1613]/5 py-4"
    >
      <View className="flex-row items-center gap-3">
        <Text className="text-lg">{icon}</Text>
        <Text className="text-base text-[#1A1613]">{label}</Text>
      </View>
      <Text className="text-[#1A1613]/30">›</Text>
    </Pressable>
  );
}

export function ProfileScreen({
  onOpenDetails,
  onOpenFiscal,
  onOpenSecurity,
  onOpenNotifications,
  onOpenHelp,
  onOpenDeleteAccount,
  onSignedOut,
}: ProfileScreenProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.firstName || "—";
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "—";

  async function handleLogout() {
    await signOut();
    onSignedOut?.();
  }

  const menuItems: MenuItem[] = [
    { key: "details", label: "Datos personales", icon: "👤", onPress: onOpenDetails },
    { key: "fiscal", label: "Información fiscal", icon: "🧾", onPress: onOpenFiscal },
    { key: "security", label: "Seguridad", icon: "🔒", onPress: onOpenSecurity },
    { key: "notifications", label: "Avisos", icon: "🔔", onPress: onOpenNotifications },
    { key: "help", label: "Ayuda", icon: "❓", onPress: onOpenHelp },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F6F1E7]" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-[#1A1613]">Perfil</Text>
        </View>

        <Section>
          <Card>
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#C41E3A]">
                <Text className="text-xl font-bold text-white">{displayName[0]?.toUpperCase() ?? "?"}</Text>
              </View>
              <View className="gap-0.5">
                <Text className="text-base font-semibold text-[#1A1613]">{displayName}</Text>
                <Text className="text-sm text-[#1A1613]/60">{userEmail}</Text>
              </View>
            </View>
          </Card>
        </Section>

        <Section>
          <Card>
            <View>
              {menuItems.map((item) => (
                <MenuRow key={item.key} label={item.label} icon={item.icon} onPress={item.onPress} testID={`menu-${item.key}`} />
              ))}
            </View>
          </Card>

          <Pressable
            onPress={handleLogout}
            testID="profile-logout"
            className="mt-4 flex-row items-center gap-3 rounded-2xl bg-[#C41E3A]/10 px-4 py-3"
          >
            <Text className="text-lg">🚪</Text>
            <Text className="font-semibold text-[#C41E3A]">Cerrar sesión</Text>
          </Pressable>

          <View className="mt-5 items-center gap-2">
            <Pressable onPress={onOpenDeleteAccount} testID="profile-delete-account">
              <Text className="text-sm font-semibold text-[#1A1613]/50 underline">Eliminar mi cuenta</Text>
            </Pressable>
            <Text className="text-xs text-[#1A1613]/40">Creva v1.0.0</Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
