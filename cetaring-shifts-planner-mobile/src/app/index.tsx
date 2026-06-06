import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={styles.title}>Catering Shifts Planner</Text>
          <Text style={styles.subtitle}>
            Plan and organise your catering shifts with ease.
          </Text>
        </View>

        <Link href="/login" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
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
  button: {
    backgroundColor: '#e67e22',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
