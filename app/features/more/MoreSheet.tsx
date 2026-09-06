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

// NavCell parity: creva_finance/frontend/components/BottomNav.tsx:131-158 — icon left, label
// right, gap 10, min-height 56, padding 10/12, radius 14, 1px --cr-border, 13px/600 --cr-text.
// Glyph svg is 20px with stroke --cr-text-secondary (BottomNav.tsx:153), not the dark text token.
function Row({ label, icon, onPress, testID }: MoreRow) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="w-[calc(50%-4px)] min-h-[56px] flex-row items-center gap-[10px] rounded-[14px] border border-border bg-surface-1 px-3 py-[10px]"
    >
      <Icon name={icon} size={20} color="text-secondary" />
      <Text className="flex-1 text-[13px] font-semibold leading-[1.3] text-text">{label}</Text>
    </Pressable>
  );
}

// Group-title parity: creva_finance/frontend/app/globals.css .cr-nav-group-title (line 264) —
// 10px, weight 700, letter-spacing 0.08em, uppercase, --cr-text-subtle; 8px below.
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-subtle">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
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
        <View className="mb-4 items-center">
          {/* Drag-handle + 16px/600 title echo the web BottomSheet chrome
              (creva_finance/frontend/components/ui/BottomSheet.tsx:74-78). */}
          <View className="mb-[14px] h-1 w-10 rounded-[2px] bg-border" />
        </View>
        <Text className="mb-[14px] text-base font-semibold text-text">Todo lo demás</Text>

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
