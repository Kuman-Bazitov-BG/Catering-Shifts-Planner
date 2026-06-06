import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Log In' }} />
        <Stack.Screen name="shifts" options={{ title: 'Shifts' }} />
        <Stack.Screen name="shifts/[id]" options={{ title: 'Shift Details' }} />
      </Stack>
    </AuthProvider>
  );
}
