import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import {
  apiGetShiftDetail,
  apiJoinShift,
  apiLeaveShift,
  apiSetSlots,
  type ShiftDetail,
} from '@/lib/api';

const MAX_EXTRA_SLOTS = 3;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string, startTime: string, endTime: string): string {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);
  const datePart = start.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timePart =
    start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) +
    ' – ' +
    end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${datePart}\n${timePart}`;
}

function formatComment(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ShiftDetailScreen() {
  const { user, token, isLoading: authLoading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = Number(id);

  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setLoading(true);
      setError(null);
      const result = await apiGetShiftDetail(token, shiftId);
      setLoading(false);
      setRefreshing(false);
      if (!result.ok) { setError(result.error); return; }
      setShift(result.data);
    },
    [token, shiftId],
  );

  useEffect(() => {
    if (!authLoading && token) fetchDetail();
  }, [authLoading, token, fetchDetail]);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color="#e67e22" /></View>
      </SafeAreaView>
    );
  }
  if (!user) return <Redirect href="/login" />;

  if (loading && !shift) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color="#e67e22" /></View>
      </SafeAreaView>
    );
  }

  if (error && !shift) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchDetail()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!shift) return null;

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!token) return;
    setMutating(true);
    setActionError(null);
    const res = await apiJoinShift(token, shiftId);
    if (!res.ok) { setActionError(res.error); setMutating(false); return; }
    await fetchDetail(true);
    setMutating(false);
  }

  async function handleLeave() {
    if (!token) return;
    setMutating(true);
    setActionError(null);
    const res = await apiLeaveShift(token, shiftId);
    if (!res.ok) { setActionError(res.error); setMutating(false); return; }
    await fetchDetail(true);
    setMutating(false);
  }

  async function handleSlots(delta: number) {
    if (!token || shift.extraSlots === null) return;
    const next = Math.max(0, Math.min(MAX_EXTRA_SLOTS, shift.extraSlots + delta));
    if (next === shift.extraSlots) return;
    setMutating(true);
    setActionError(null);
    const res = await apiSetSlots(token, shiftId, next);
    if (!res.ok) { setActionError(res.error); setMutating(false); return; }
    await fetchDetail(true);
    setMutating(false);
  }

  // ── Derived display values ──────────────────────────────────────────────────

  const { state } = shift;

  const temporalLabel = state.canceled ? 'Canceled'
    : state.temporal === 'current' ? 'Current'
    : state.temporal === 'upcoming' ? 'Upcoming'
    : 'Past';
  const temporalColor = state.canceled ? '#6b7280'
    : state.temporal === 'current' ? '#16a34a'
    : state.temporal === 'upcoming' ? '#2563eb'
    : '#9ca3af';

  const capacityLabel =
    state.capacity === 'over' ? 'Over capacity' :
    state.capacity === 'full' ? 'Full' : 'Under capacity';
  const capacityColor =
    state.capacity === 'over' ? '#dc2626' :
    state.capacity === 'full' ? '#d97706' : '#16a34a';

  const canAct = state.isActive;
  const extraSlots = shift.extraSlots ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDetail(); }}
            tintColor="#e67e22"
            colors={['#e67e22']}
          />
        }
      >
        {/* ── State badges ── */}
        <View style={styles.badgeRow}>
          <Badge label={temporalLabel} color={temporalColor} />
          <Badge label={capacityLabel} color={capacityColor} />
          {shift.isJoined && <Badge label="✓ Joined" color="#16a34a" />}
        </View>

        {/* ── Title & group ── */}
        <Text style={styles.title}>{shift.title}</Text>
        <Text style={styles.group}>{shift.groupTitle}</Text>

        {/* ── Info rows ── */}
        <InfoRow icon="📅" text={formatDate(shift.date, shift.startTime, shift.endTime)} />
        {shift.location ? <InfoRow icon="📍" text={shift.location} /> : null}
        <InfoRow icon="👥" text={`${shift.staffCount} / ${shift.capacity} staff slots filled`} />
        {shift.commentCount > 0
          ? <InfoRow icon="💬" text={`${shift.commentCount} comment${shift.commentCount !== 1 ? 's' : ''}`} />
          : null}

        {/* ── Action section ── */}
        {canAct && (
          <View style={styles.section}>
            {actionError && (
              <View style={styles.actionErrorBox}>
                <Text style={styles.actionErrorText}>{actionError}</Text>
              </View>
            )}

            {shift.isJoined ? (
              <>
                {/* Extra slots stepper */}
                <Text style={styles.sectionTitle}>Extra slots (bring friends)</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={[styles.stepBtn, (mutating || extraSlots === 0) && styles.stepBtnDisabled]}
                    onPress={() => handleSlots(-1)}
                    disabled={mutating || extraSlots === 0}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{extraSlots}</Text>
                  <Pressable
                    style={[styles.stepBtn, (mutating || extraSlots === MAX_EXTRA_SLOTS) && styles.stepBtnDisabled]}
                    onPress={() => handleSlots(1)}
                    disabled={mutating || extraSlots === MAX_EXTRA_SLOTS}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
                {extraSlots > 0 && (
                  <Text style={styles.stepperHint}>
                    You are occupying {1 + extraSlots} slots total.
                  </Text>
                )}

                <Pressable
                  style={[styles.leaveBtn, mutating && styles.btnDisabled]}
                  onPress={handleLeave}
                  disabled={mutating}
                >
                  {mutating
                    ? <ActivityIndicator color="#dc2626" />
                    : <Text style={styles.leaveBtnText}>Leave Shift</Text>}
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[styles.joinBtn, mutating && styles.btnDisabled]}
                onPress={handleJoin}
                disabled={mutating}
              >
                {mutating
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.joinBtnText}>Join Shift</Text>}
              </Pressable>
            )}
          </View>
        )}

        {/* ── Staff list ── */}
        {shift.staff.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Staff joined ({shift.staff.length})</Text>
            {shift.staff.map(member => (
              <View key={member.userId} style={styles.staffRow}>
                <Text style={styles.staffName}>
                  {member.name}
                  {member.userId === user.id ? ' (you)' : ''}
                </Text>
                {member.extraSlots > 0 && (
                  <Text style={styles.staffSlots}>+{member.extraSlots} extra</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Comments ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Comments {shift.comments.length > 0 ? `(${shift.comments.length})` : ''}
          </Text>
          {shift.comments.length === 0 ? (
            <Text style={styles.emptyText}>No comments yet.</Text>
          ) : (
            shift.comments.map(c => (
              <View key={c.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    {c.authorName}{c.userId === user.id ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.commentDate}>
                    {formatComment(c.createdAt)}
                    {c.editedAt ? ' · edited' : ''}
                  </Text>
                </View>
                <Text style={styles.commentBody}>{c.body}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },

  // Badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Header
  title: { fontSize: 22, fontWeight: '800', color: '#111', lineHeight: 30, marginTop: 4 },
  group: { fontSize: 14, color: '#888', fontWeight: '500' },

  // Info rows
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  infoText: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22 },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Action error
  actionErrorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#fca5a5' },
  actionErrorText: { color: '#b91c1c', fontSize: 14 },

  // Buttons
  joinBtn: { backgroundColor: '#e67e22', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  leaveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: '#dc2626' },
  leaveBtnText: { color: '#dc2626', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e67e22',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: '#d1d5db' },
  stepBtnText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  stepperValue: { fontSize: 26, fontWeight: '700', color: '#111', minWidth: 32, textAlign: 'center' },
  stepperHint: { fontSize: 13, color: '#888' },

  // Staff
  staffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  staffName: { fontSize: 15, color: '#222' },
  staffSlots: { fontSize: 13, color: '#e67e22', fontWeight: '600' },

  // Comments
  emptyText: { fontSize: 14, color: '#aaa', fontStyle: 'italic' },
  comment: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, gap: 4 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#333', flexShrink: 1 },
  commentDate: { fontSize: 11, color: '#aaa', flexShrink: 0 },
  commentBody: { fontSize: 14, color: '#444', lineHeight: 20 },

  // Error / retry
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#e67e22', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
