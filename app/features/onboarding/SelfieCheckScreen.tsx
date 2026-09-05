// SelfieCheckScreen.tsx: World Selfie Check onboarding step. Runs the hosted flow inside a
// WebView (works in Expo Go, no Orb and no Dev Client needed) and degrades to an
// identity_unavailable state when EXPO_PUBLIC_WORLD_APP_ID isn't set.
import { useAuth } from '@clerk/clerk-expo'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import type { WebViewNavigation } from 'react-native-webview'
import { useSelfieCheck } from './useSelfieCheck'
import { buildSelfieCheckUrl } from './world-config'

export interface SelfieCheckScreenProps {
  onVerified: (nullifierHash: string | null) => void
  onSkipped: () => void
}

export function SelfieCheckScreen({ onVerified, onSkipped }: SelfieCheckScreenProps) {
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
      <SafeAreaView className="flex-1 items-center justify-center gap-4 px-6" edges={['top', 'bottom']}>
        <Text className="text-center text-base text-neutral-600">
          Selfie Check isn't available right now. You can continue without it — this account
          will be flagged as identity_unavailable until it's verified.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="rounded-full bg-neutral-900 px-6 py-3"
          onPress={onSkipped}
        >
          <Text className="font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (result.status === 'idle') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 px-6" edges={['top', 'bottom']}>
        <Text className="text-center text-lg font-semibold">Verify it's you</Text>
        <Text className="text-center text-base text-neutral-600">
          World Selfie Check confirms you're a real, unique person — no Orb, no ID scan.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="rounded-full bg-neutral-900 px-6 py-3"
          disabled={!isSignedIn}
          onPress={start}
        >
          <Text className="font-semibold text-white">Start Selfie Check</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (result.status === 'failed') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 px-6" edges={['top', 'bottom']}>
        <Text className="text-center text-base text-neutral-600">
          Selfie Check didn't complete. You can try again.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="rounded-full bg-neutral-900 px-6 py-3"
          onPress={reset}
        >
          <Text className="font-semibold text-white">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (result.status === 'verifying') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 px-6" edges={['top', 'bottom']}>
        <ActivityIndicator />
        <Text className="text-center text-base text-neutral-600">Verifying with World...</Text>
      </SafeAreaView>
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
