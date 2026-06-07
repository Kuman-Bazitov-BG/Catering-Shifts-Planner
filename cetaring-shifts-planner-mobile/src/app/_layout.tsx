import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/auth';
import { colors } from '@/lib/theme';

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
        <Stack.Screen name="shifts" options={{ title: 'Shifts' }} />
        <Stack.Screen name="shifts/[id]" options={{ title: 'Shift Details' }} />
      </Stack>
    </AuthProvider>
  );
}
