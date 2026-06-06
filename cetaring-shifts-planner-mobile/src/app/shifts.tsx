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
import { useAuth } from '@/context/auth';
import { apiGetShifts, type ShiftSummary } from '@/lib/api';
import ShiftCard from '@/components/ShiftCard';

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
          <ActivityIndicator size="large" color="#e67e22" />
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
          <ActivityIndicator size="large" color="#e67e22" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error (no data yet) ─────────────────────────────────────────────────────
  if (error && shifts.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchPage(1, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
            tintColor="#e67e22"
            colors={['#e67e22']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No active shifts right now.</Text>
          </View>
        }
        ListFooterComponent={
          loading && shifts.length > 0 ? (
            <ActivityIndicator
              style={styles.footerSpinner}
              color="#e67e22"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContent: { paddingVertical: 10, paddingBottom: 32 },
  emptyContainer: { flex: 1 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#e67e22',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  footerSpinner: { marginVertical: 16 },
});
