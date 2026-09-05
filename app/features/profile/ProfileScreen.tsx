// ProfileScreen.tsx: mobile port of creva_finance's profile/page.tsx — account summary, the
// menu into every setting screen, and sign-out. Reads the signed-in Clerk user for name/email
// (ClerkAppProvider is already mounted higher up; this screen only consumes useUser/useClerk).
import { useClerk, useUser } from "@clerk/clerk-expo";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Section } from "../query/components/VisualPrimitives";
import { Icon, type IconName } from "../shared/icons/Icon";

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
  icon: IconName;
  onPress?: () => void;
}

function MenuRow({ label, icon, onPress, testID }: { label: string; icon: IconName; onPress?: () => void; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="flex-row items-center justify-between border-b border-text/5 py-4"
    >
      <View className="flex-row items-center gap-3">
        <Icon name={icon} size={19} color="text" />
        <Text className="text-base text-text">{label}</Text>
      </View>
      <Text className="text-text/30">›</Text>
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
    { key: "details", label: "Datos personales", icon: "profile", onPress: onOpenDetails },
    { key: "fiscal", label: "Información fiscal", icon: "statement", onPress: onOpenFiscal },
    { key: "security", label: "Seguridad", icon: "shield", onPress: onOpenSecurity },
    { key: "notifications", label: "Avisos", icon: "bell", onPress: onOpenNotifications },
    { key: "help", label: "Ayuda", icon: "help", onPress: onOpenHelp },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text">Perfil</Text>
        </View>

        <Section>
          <Card>
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-crimson">
                <Text className="text-xl font-bold text-white">{displayName[0]?.toUpperCase() ?? "?"}</Text>
              </View>
              <View className="gap-0.5">
                <Text className="text-base font-semibold text-text">{displayName}</Text>
                <Text className="text-sm text-text/60">{userEmail}</Text>
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
            className="mt-4 flex-row items-center gap-3 rounded-2xl bg-crimson/10 px-4 py-3"
          >
            <Icon name="logout" size={18} color="crimson" />
            <Text className="font-semibold text-crimson">Cerrar sesión</Text>
          </Pressable>

          <View className="mt-5 items-center gap-2">
            <Pressable onPress={onOpenDeleteAccount} testID="profile-delete-account">
              <Text className="text-sm font-semibold text-text/50 underline">Eliminar mi cuenta</Text>
            </Pressable>
            <Text className="text-xs text-text/40">Creva v1.0.0</Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
