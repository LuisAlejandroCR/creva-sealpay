// WalletModeSelector.tsx: the minimal wallet picker shown just above the "Pagar y continuar"
// button in QueryScreen/VerifyScreen. Renders nothing at all unless more than one wallet mode is
// available, so the default single-wallet (demo) UI is unchanged.
import { Pressable, Text, View } from 'react-native'

import type { PaymentWalletMode } from './walletCore'

const LABELS: Record<PaymentWalletMode, string> = {
  demo: 'Billetera demo',
  privy: 'Billetera Privy',
}

export function WalletModeSelector({
  mode,
  availableModes,
  onSelect,
}: {
  mode: PaymentWalletMode
  availableModes: PaymentWalletMode[]
  onSelect: (mode: PaymentWalletMode) => void
}) {
  if (availableModes.length <= 1) return null
  return (
    <View className="gap-2" testID="wallet-mode-selector">
      <Text className="text-xs font-bold uppercase text-text/60">Billetera de pago</Text>
      <View className="flex-row gap-2">
        {availableModes.map((option) => {
          const active = option === mode
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              testID={`wallet-mode-${option}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`flex-1 rounded-xl border px-3 py-2 ${
                active ? 'border-crimson bg-crimson/10' : 'border-border bg-surface-1'
              }`}
            >
              <Text className={`text-center text-sm font-semibold ${active ? 'text-crimson' : 'text-text/70'}`}>
                {LABELS[option]}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
