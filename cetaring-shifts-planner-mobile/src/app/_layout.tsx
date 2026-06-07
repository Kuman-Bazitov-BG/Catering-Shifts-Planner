import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '@/context/auth';
import { colors } from '@/lib/theme';

function HomeBackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.replace('/')} hitSlop={10} style={{ paddingRight: 12 }}>
      <Ionicons name="chevron-back" size={26} color={colors.primary} />
    </Pressable>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Log In' }} />
        <Stack.Screen name="register" options={{ title: 'Sign Up' }} />
        <Stack.Screen
          name="shifts"
          options={{ title: 'Shifts', headerLeft: () => <HomeBackButton /> }}
        />
        <Stack.Screen name="shifts/[id]" options={{ title: 'Shift Details' }} />
      </Stack>
    </AuthProvider>
  );
}
