import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { colors } from '@/lib/theme';

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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <Ionicons name="restaurant" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Catering Shifts Planner</Text>
          <Text style={styles.subtitle}>
            Plan and organise your catering shifts with ease.
          </Text>
          {user && (
            <View style={styles.greetingPill}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={styles.greeting}>Welcome back, {user.name}!</Text>
            </View>
          )}

          {!user && (
            <View style={styles.featureList}>
              <Feature icon="people" text="Join groups & shifts" />
              <Feature icon="calendar" text="Track upcoming events" />
              <Feature icon="chatbubble-ellipses" text="Comment with your team" />
            </View>
          )}
        </View>

        {user ? (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.buttonPrimary, pressed && styles.pressed]}
              onPress={() => router.push('/shifts')}
            >
              <Text style={styles.buttonText}>View Shifts</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.buttonSecondary, pressed && styles.pressed]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonSecondaryText}>Log Out</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.buttonPrimary, pressed && styles.pressed]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
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
    gap: 14,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
  },
  greeting: {
    fontSize: 15,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  featureList: {
    marginTop: 18,
    gap: 12,
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  actions: {
    gap: 12,
  },
  buttonPrimary: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonSecondary: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
});
