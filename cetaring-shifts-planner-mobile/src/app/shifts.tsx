import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Prevent duplicate in-flight requests.
  const fetchingRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean, searchTerm: string) => {
      if (!token || fetchingRef.current) return;
      fetchingRef.current = true;
      if (!replace) setLoading(true);
      setError(null);

      const result = await apiGetShifts(token, pageNum, PAGE_SIZE, searchTerm);

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
      setShifts(prev => {
        if (replace) return items;
        // Active shifts are time-filtered server-side, so the underlying offsets
        // can drift between page fetches — guard against the same shift landing
        // on two consecutive pages and producing duplicate list keys.
        const seenIds = new Set(prev.map(s => s.id));
        return [...prev, ...items.filter(item => !seenIds.has(item.id))];
      });
    },
    [token],
  );

  // Initial load.
  useEffect(() => {
    if (!authLoading && token) {
      fetchPage(1, true, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

  // Debounce search input, then reload from page 1 with the new term.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchPage(1, true, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPage(1, true, search);
  }, [fetchPage, search]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && page < totalPages) {
      fetchPage(page + 1, false, search);
    }
  }, [loading, refreshing, page, totalPages, fetchPage, search]);

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

  // ── Initial loading spinner (only before the very first load completes) ─────
  if (loading && shifts.length === 0 && !search) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error (no data yet) ─────────────────────────────────────────────────────
  if (error && shifts.length === 0 && !search) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]} onPress={() => fetchPage(1, true, search)}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Active Shifts</Text>
        <Text style={styles.listHeaderSubtitle}>Tap a shift to view details and join</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by event, date, or location"
            placeholderTextColor={colors.textFaint}
            value={searchInput}
            onChangeText={setSearchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => setSearchInput('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
      </View>
      <FlatList
        keyboardShouldPersistTaps="handled"
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
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name={search ? 'search-outline' : 'calendar-clear-outline'} size={40} color={colors.textFaint} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>
                {search ? `No shifts match "${search}".` : 'No active shifts right now.'}
              </Text>
            </View>
          )
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
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
