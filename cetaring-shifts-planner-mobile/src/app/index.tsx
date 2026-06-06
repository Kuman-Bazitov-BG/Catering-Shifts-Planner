import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';

export default function HomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e67e22" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={styles.title}>Catering Shifts Planner</Text>
          <Text style={styles.subtitle}>
            Plan and organise your catering shifts with ease.
          </Text>
          {user && (
            <Text style={styles.greeting}>Welcome back, {user.name}!</Text>
          )}
        </View>

        {user ? (
          <View style={styles.actions}>
            <Pressable
              style={styles.buttonPrimary}
              onPress={() => router.push('/shifts')}
            >
              <Text style={styles.buttonText}>View Shifts</Text>
            </Pressable>
            <Pressable style={styles.buttonSecondary} onPress={handleLogout}>
              <Text style={styles.buttonSecondaryText}>Log Out</Text>
            </Pressable>
          </View>
        ) : (
          <Link href="/login" asChild>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonText}>Log In</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#e67e22',
    fontWeight: '600',
    marginTop: 8,
  },
  actions: {
    gap: 12,
  },
  buttonPrimary: {
    backgroundColor: '#e67e22',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e67e22',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#e67e22',
    fontSize: 17,
    fontWeight: '600',
  },
});
