import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { apiGetShifts, type ShiftSummary } from '@/lib/api';
import ShiftCard from '@/components/ShiftCard';
import { colors } from '@/lib/theme';

const PAGE_SIZE = 10;

export default function ShiftsScreen() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate in-flight requests.
  const fetchingRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!token || fetchingRef.current) return;
      fetchingRef.current = true;
      if (!replace) setLoading(true);
      setError(null);

      const result = await apiGetShifts(token, pageNum, PAGE_SIZE);

      fetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const { items, totalPages: tp } = result.data;
      setTotalPages(tp);
      setPage(pageNum);
      setShifts(prev => (replace ? items : [...prev, ...items]));
    },
    [token],
  );

  // Initial load.
  useEffect(() => {
    if (!authLoading && token) {
      fetchPage(1, true);
    }
  }, [authLoading, token, fetchPage]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPage(1, true);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && page < totalPages) {
      fetchPage(page + 1, false);
    }
  }, [loading, refreshing, page, totalPages, fetchPage]);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  if (!user) return <Redirect href="/login" />;

  // ── Initial loading spinner ─────────────────────────────────────────────────
  if (loading && shifts.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error (no data yet) ─────────────────────────────────────────────────────
  if (error && shifts.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]} onPress={() => fetchPage(1, true)}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Active Shifts</Text>
        <Text style={styles.listHeaderSubtitle}>Tap a shift to view details and join</Text>
      </View>
      <FlatList
        data={shifts}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <ShiftCard shift={item} />}
        contentContainerStyle={
          shifts.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-clear-outline" size={40} color={colors.textFaint} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>No active shifts right now.</Text>
          </View>
        }
        ListFooterComponent={
          loading && shifts.length > 0 ? (
            <ActivityIndicator
              style={styles.footerSpinner}
              color={colors.primary}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 2,
  },
  listHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  listHeaderSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  listContent: { paddingVertical: 10, paddingBottom: 32 },
  emptyContainer: { flex: 1 },
  emptyText: { fontSize: 16, color: colors.textFaint, textAlign: 'center' },
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.85 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  footerSpinner: { marginVertical: 16 },
});
