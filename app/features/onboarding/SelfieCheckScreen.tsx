// SelfieCheckScreen.tsx: World Selfie Check onboarding step. Runs the hosted flow inside a
// WebView (works in Expo Go, no Orb and no Dev Client needed) and degrades to an
// identity_unavailable state when EXPO_PUBLIC_WORLD_APP_ID isn't set.
import { useAuth } from '@clerk/clerk-expo'
import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import type { WebViewNavigation } from 'react-native-webview'
import { useSelfieCheck } from './useSelfieCheck'
import { buildSelfieCheckUrl } from './world-config'
import { BackButton } from '../shared/BackButton'

// Back sits top-left like the other full-screen flows (QueryScreen/VerifyScreen); the message and
// its CTA stay centred below it, instead of the whole column — Back included — floating mid-screen.
function CenteredState({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 px-6" edges={['top', 'bottom']}>
      {onBack ? <BackButton onPress={onBack} /> : null}
      <View className="flex-1 items-center justify-center gap-4">{children}</View>
    </SafeAreaView>
  )
}

export interface SelfieCheckScreenProps {
  onVerified: (nullifierHash: string | null) => void
  onSkipped: () => void
  /** Full-screen flow, no bottom nav — back is treated the same as skipping this step. */
  onBack?: () => void
}

export function SelfieCheckScreen({ onVerified, onSkipped, onBack }: SelfieCheckScreenProps) {
  const { isSignedIn } = useAuth()
  const { result, start, handleCallbackUrl, reset } = useSelfieCheck()
  const [webviewUrl] = useState(() => {
    try {
      return buildSelfieCheckUrl()
    } catch {
      return null
    }
  })

  const handleNavigationChange = (navState: WebViewNavigation) => {
    handleCallbackUrl(navState.url)
  }

  useEffect(() => {
    if (result.status === 'verified') {
      onVerified(result.nullifierHash)
    }
  }, [result.status, result.nullifierHash, onVerified])

  if (result.status === 'identity_unavailable') {
    return (
      <CenteredState onBack={onBack}>
        <Text className="text-center text-base text-text-secondary">
          Selfie Check no está disponible en este momento. Puedes continuar sin verificarte — esta
          cuenta quedará marcada como identidad no verificada hasta que se complete.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="rounded-full bg-crimson px-6 py-3"
          onPress={onSkipped}
        >
          <Text className="font-semibold text-white">Continuar</Text>
        </TouchableOpacity>
      </CenteredState>
    )
  }

  if (result.status === 'idle') {
    return (
      <CenteredState onBack={onBack}>
        <Text className="text-center text-lg font-semibold">Verifica que eres tú</Text>
        <Text className="text-center text-base text-text-secondary">
          World Selfie Check confirma que eres una persona real y única — sin Orb, sin escaneo de
          identificación.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="rounded-full bg-crimson px-6 py-3"
          disabled={!isSignedIn}
          onPress={start}
        >
          <Text className="font-semibold text-white">Iniciar Selfie Check</Text>
        </TouchableOpacity>
      </CenteredState>
    )
  }

  if (result.status === 'failed') {
    return (
      <CenteredState onBack={onBack}>
        <Text className="text-center text-base text-text-secondary">
          Selfie Check no se completó. Puedes intentarlo de nuevo.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="rounded-full bg-crimson px-6 py-3"
          onPress={reset}
        >
          <Text className="font-semibold text-white">Intentar de nuevo</Text>
        </TouchableOpacity>
      </CenteredState>
    )
  }

  if (result.status === 'verifying') {
    return (
      <CenteredState>
        <ActivityIndicator />
        <Text className="text-center text-base text-text-secondary">Verificando con World...</Text>
      </CenteredState>
    )
  }

  // in_progress
  if (!webviewUrl) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" edges={['top', 'bottom']}>
        <ActivityIndicator />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <WebView
        onNavigationStateChange={handleNavigationChange}
        source={{ uri: webviewUrl }}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}
      />
    </SafeAreaView>
  )
}
