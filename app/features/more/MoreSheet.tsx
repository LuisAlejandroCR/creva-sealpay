// MoreSheet.tsx: "Todo lo demás" — the screen the bottom nav's "Más" tab opens, grouping the 11
// items creva_finance's BottomNav.tsx keeps in its own sheet (Tu dinero / Señales de gobierno /
// Tu cuenta). Mi perfil and Ayuda route to the existing ProfileScreen/HelpScreen; the other 9 are
// stub screens (see stub-topics.ts). Rendered as a full screen, not a native modal sheet — this
// app's navigation is a plain step-state machine (App.tsx), with no bottom-sheet primitive wired.
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon, type IconName } from "../shared/icons/Icon";
import { STUB_TOPICS, type StubTopicKey } from "./stub-topics";

export interface MoreSheetProps {
  onOpenStub: (key: StubTopicKey) => void;
  onOpenProfile: () => void;
  onOpenHelp: () => void;
}

interface MoreRow {
  label: string;
  icon: IconName;
  onPress: () => void;
  testID: string;
}

function Row({ label, icon, onPress, testID }: MoreRow) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="w-[47%] items-center gap-2 rounded-xl border border-text/10 bg-surface-1 p-4"
    >
      <Icon name={icon} size={22} color="text" />
      <Text className="text-center text-sm font-semibold text-text">{label}</Text>
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-7">
      <Text className="mb-3 text-base font-semibold text-text">{title}</Text>
      <View className="flex-row flex-wrap gap-3">{children}</View>
    </View>
  );
}

export function MoreSheet({ onOpenStub, onOpenProfile, onOpenHelp }: MoreSheetProps) {
  const money = STUB_TOPICS.filter((t) => ["movements", "calculator", "statements", "collateral"].includes(t.key));
  const gov = STUB_TOPICS.filter((t) => ["business-verification", "regulatory", "report"].includes(t.key));
  const account = STUB_TOPICS.filter((t) => ["notifications", "privacy"].includes(t.key));

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="more-sheet">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text">Todo lo demás</Text>
        </View>

        <Group title="Tu dinero">
          {money.map((item) => (
            <Row
              key={item.key}
              label={item.label}
              icon={item.icon}
              onPress={() => onOpenStub(item.key)}
              testID={`more-${item.key}`}
            />
          ))}
        </Group>

        <Group title="Señales de gobierno">
          {gov.map((item) => (
            <Row
              key={item.key}
              label={item.label}
              icon={item.icon}
              onPress={() => onOpenStub(item.key)}
              testID={`more-${item.key}`}
            />
          ))}
        </Group>

        <Group title="Tu cuenta">
          <Row label="Mi perfil" icon="profile" onPress={onOpenProfile} testID="more-profile" />
          {account
            .filter((item) => item.key === "notifications")
            .map((item) => (
              <Row
                key={item.key}
                label={item.label}
                icon={item.icon}
                onPress={() => onOpenStub(item.key)}
                testID={`more-${item.key}`}
              />
            ))}
          <Row label="Ayuda" icon="help" onPress={onOpenHelp} testID="more-help" />
          {account
            .filter((item) => item.key === "privacy")
            .map((item) => (
              <Row
                key={item.key}
                label={item.label}
                icon={item.icon}
                onPress={() => onOpenStub(item.key)}
                testID={`more-${item.key}`}
              />
            ))}
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}
