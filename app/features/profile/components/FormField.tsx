// FormField.tsx: shared form controls for profile screens that edit real data (PersonalData,
// FiscalInfo, ...). React Native has no native <select>, so SelectField is a Pressable that
// expands an inline option list in place of the reference's <select> — no picker dependency added.
import { useState } from "react";
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  maxLength,
  autoCapitalize,
  note,
  testID,
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
  note?: string;
  testID?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs text-text/60">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        className={`rounded-xl border border-text/10 bg-surface-1 px-4 py-3 text-base text-text ${
          editable ? "" : "text-text/50"
        }`}
        testID={testID}
      />
      {note ? <Text className="mt-1.5 text-xs leading-4 text-text/50">{note}</Text> : null}
    </View>
  );
}

export interface FieldOption {
  value: string;
  label: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecciona una opción",
  testID,
}: {
  label: string;
  value: string;
  options: FieldOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs text-text/60">{label}</Text>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between rounded-xl border border-text/10 bg-surface-1 px-4 py-3"
        testID={testID}
      >
        <Text className={`text-base ${selected ? "text-text" : "text-text/40"}`}>
          {selected?.label ?? placeholder}
        </Text>
        <Text className="text-text/40">{open ? "▴" : "▾"}</Text>
      </Pressable>
      {open ? (
        <View className="mt-1 rounded-xl border border-text/10 bg-surface-1">
          {options.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`px-4 py-3 ${index < options.length - 1 ? "border-b border-text/5" : ""}`}
              testID={testID ? `${testID}-option-${option.value}` : undefined}
            >
              <Text className={`text-sm ${option.value === value ? "font-semibold text-crimson" : "text-text"}`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function SegmentedField({
  label,
  value,
  options,
  onChange,
  testID,
}: {
  label: string;
  value: string;
  options: FieldOption[];
  onChange: (value: string) => void;
  testID?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs text-text/60">{label}</Text>
      <View className="flex-row overflow-hidden rounded-xl border border-text/10">
        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`flex-1 items-center px-1 py-2.5 ${active ? "bg-crimson" : "bg-surface-1"} ${
                index > 0 ? "border-l border-text/10" : ""
              }`}
              testID={testID ? `${testID}-${option.value}` : undefined}
            >
              <Text
                numberOfLines={1}
                className={`text-[13px] font-semibold ${active ? "text-white" : "text-text/70"}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
