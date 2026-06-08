import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import {
  apiAddComment,
  apiDeleteComment,
  apiGetShiftDetail,
  apiJoinShift,
  apiLeaveShift,
  apiSetSlots,
  apiUpdateComment,
  type ShiftDetail,
} from '@/lib/api';
import { colors } from '@/lib/theme';

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

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
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

  const [commentDraft, setCommentDraft] = useState('');
  const [commentMutating, setCommentMutating] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');

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
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }
  if (!user) return <Redirect href="/login" />;

  if (loading && !shift) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error && !shift) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]} onPress={() => fetchDetail()}>
            <Ionicons name="refresh" size={16} color="#fff" />
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
    if (!token || !shift || shift.extraSlots === null) return;
    const next = Math.max(0, Math.min(MAX_EXTRA_SLOTS, shift.extraSlots + delta));
    if (next === shift.extraSlots) return;
    setMutating(true);
    setActionError(null);
    const res = await apiSetSlots(token, shiftId, next);
    if (!res.ok) { setActionError(res.error); setMutating(false); return; }
    await fetchDetail(true);
    setMutating(false);
  }

  async function handlePostComment() {
    const body = commentDraft.trim();
    if (!token || !body) return;
    setCommentMutating(true);
    setCommentError(null);
    const res = await apiAddComment(token, shiftId, body);
    if (!res.ok) { setCommentError(res.error); setCommentMutating(false); return; }
    setCommentDraft('');
    await fetchDetail(true);
    setCommentMutating(false);
  }

  function startEditComment(commentId: number, body: string) {
    setCommentError(null);
    setEditingCommentId(commentId);
    setEditDraft(body);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditDraft('');
  }

  async function handleSaveEditComment(commentId: number) {
    const body = editDraft.trim();
    if (!token || !body) return;
    setCommentMutating(true);
    setCommentError(null);
    const res = await apiUpdateComment(token, shiftId, commentId, body);
    if (!res.ok) { setCommentError(res.error); setCommentMutating(false); return; }
    setEditingCommentId(null);
    setEditDraft('');
    await fetchDetail(true);
    setCommentMutating(false);
  }

  async function handleDeleteComment(commentId: number) {
    if (!token) return;
    setCommentMutating(true);
    setCommentError(null);
    const res = await apiDeleteComment(token, shiftId, commentId);
    if (!res.ok) { setCommentError(res.error); setCommentMutating(false); return; }
    await fetchDetail(true);
    setCommentMutating(false);
  }

  // ── Derived display values ──────────────────────────────────────────────────

  const { state } = shift;

  const temporalLabel = state.canceled ? 'Canceled'
    : state.temporal === 'current' ? 'Current'
    : state.temporal === 'upcoming' ? 'Upcoming'
    : 'Past';
  const temporalColor = state.canceled ? colors.neutral
    : state.temporal === 'current' ? colors.success
    : state.temporal === 'upcoming' ? colors.info
    : colors.textFaint;
  const temporalIcon = state.canceled ? 'ban-outline'
    : state.temporal === 'current' ? 'radio-button-on'
    : state.temporal === 'upcoming' ? 'time-outline'
    : 'time-outline';

  const capacityLabel =
    state.capacity === 'over' ? 'Over capacity' :
    state.capacity === 'full' ? 'Full' : 'Under capacity';
  const capacityColor =
    state.capacity === 'over' ? colors.danger :
    state.capacity === 'full' ? colors.warning : colors.success;
  const capacityIcon =
    state.capacity === 'over' ? 'warning-outline' :
    state.capacity === 'full' ? 'speedometer-outline' : 'people-outline';

  const canAct = state.isActive;
  const extraSlots = shift.extraSlots ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDetail(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── State badges ── */}
        <View style={styles.badgeRow}>
          <Badge label={temporalLabel} color={temporalColor} icon={temporalIcon as never} />
          <Badge label={capacityLabel} color={capacityColor} icon={capacityIcon as never} />
          {shift.isJoined && <Badge label="Joined" color={colors.success} icon="checkmark-circle" />}
        </View>

        {/* ── Title & group ── */}
        <Text style={styles.title}>{shift.title}</Text>
        <View style={styles.groupRow}>
          <Ionicons name="people-outline" size={14} color={colors.textFaint} />
          <Text style={styles.group}>{shift.groupTitle}</Text>
        </View>

        {/* ── Info rows ── */}
        <View style={styles.infoCard}>
          <InfoRow icon="calendar-outline" text={formatDate(shift.date, shift.startTime, shift.endTime)} />
          {shift.location ? <InfoRow icon="location-outline" text={shift.location} /> : null}
          <InfoRow icon="people-outline" text={`${shift.staffCount} / ${shift.capacity} staff slots filled`} />
          {shift.commentCount > 0
            ? <InfoRow icon="chatbubble-outline" text={`${shift.commentCount} comment${shift.commentCount !== 1 ? 's' : ''}`} last />
            : null}
        </View>

        {/* ── Action section ── */}
        {canAct && (
          <View style={styles.section}>
            {actionError && (
              <View style={styles.actionErrorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
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
                    <Ionicons name="remove" size={20} color="#fff" />
                  </Pressable>
                  <Text style={styles.stepperValue}>{extraSlots}</Text>
                  <Pressable
                    style={[styles.stepBtn, (mutating || extraSlots === MAX_EXTRA_SLOTS) && styles.stepBtnDisabled]}
                    onPress={() => handleSlots(1)}
                    disabled={mutating || extraSlots === MAX_EXTRA_SLOTS}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
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
                    ? <ActivityIndicator color={colors.danger} />
                    : (
                      <>
                        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                        <Text style={styles.leaveBtnText}>Leave Shift</Text>
                      </>
                    )}
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
                  : (
                    <>
                      <Ionicons name="log-in-outline" size={18} color="#fff" />
                      <Text style={styles.joinBtnText}>Join Shift</Text>
                    </>
                  )}
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
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(member.name)}</Text>
                </View>
                <Text style={styles.staffName}>
                  {member.name}
                  {member.userId === user.id ? ' (you)' : ''}
                </Text>
                {member.extraSlots > 0 && (
                  <View style={styles.extraPill}>
                    <Text style={styles.staffSlots}>+{member.extraSlots} extra</Text>
                  </View>
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

          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              value={commentDraft}
              onChangeText={setCommentDraft}
              placeholder="Write a comment…"
              placeholderTextColor="#aaa"
              multiline
              editable={!commentMutating}
            />
            <Pressable
              style={[styles.commentPostBtn, (commentMutating || !commentDraft.trim()) && styles.btnDisabled]}
              onPress={handlePostComment}
              disabled={commentMutating || !commentDraft.trim()}
            >
              {commentMutating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="send" size={16} color="#fff" />}
              <Text style={styles.commentPostBtnText}>Post</Text>
            </Pressable>
          </View>

          {commentError && (
            <View style={styles.actionErrorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.actionErrorText}>{commentError}</Text>
            </View>
          )}

          {shift.comments.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textFaint} />
              <Text style={styles.emptyText}>No comments yet.</Text>
            </View>
          ) : (
            shift.comments.map(c => {
              const canManage = c.userId === user.id || shift.isManager;
              const isEditing = editingCommentId === c.id;
              return (
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

                  {isEditing ? (
                    <View style={styles.commentEditBox}>
                      <TextInput
                        style={styles.commentInput}
                        value={editDraft}
                        onChangeText={setEditDraft}
                        multiline
                        editable={!commentMutating}
                      />
                      <View style={styles.commentEditActions}>
                        <Pressable
                          style={[styles.commentSmallBtn, styles.commentCancelBtn]}
                          onPress={cancelEditComment}
                          disabled={commentMutating}
                        >
                          <Ionicons name="close" size={14} color={colors.textMuted} />
                          <Text style={styles.commentCancelBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.commentSmallBtn, styles.commentSaveBtn, (commentMutating || !editDraft.trim()) && styles.btnDisabled]}
                          onPress={() => handleSaveEditComment(c.id)}
                          disabled={commentMutating || !editDraft.trim()}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                          <Text style={styles.commentSaveBtnText}>Save</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.commentBody}>{c.body}</Text>
                      {canManage && (
                        <View style={styles.commentEditActions}>
                          <Pressable
                            style={styles.commentSmallBtn}
                            onPress={() => startEditComment(c.id, c.body)}
                            disabled={commentMutating}
                          >
                            <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.commentCancelBtnText}>Edit</Text>
                          </Pressable>
                          <Pressable
                            style={styles.commentSmallBtn}
                            onPress={() => handleDeleteComment(c.id)}
                            disabled={commentMutating}
                          >
                            <Ionicons name="trash-outline" size={14} color={colors.danger} />
                            <Text style={styles.commentDeleteBtnText}>Delete</Text>
                          </Pressable>
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Badge({ label, color, icon }: { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '1a' }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, text, last }: { icon: keyof typeof Ionicons.glyphMap; text: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 140, gap: 12 },
  pressed: { opacity: 0.85 },

  // Badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Header
  title: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 30, marginTop: 4 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  group: { fontSize: 14, color: colors.textFaint, fontWeight: '500' },

  // Info card
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1, fontSize: 15, color: '#333', lineHeight: 21 },

  // Sections
  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Action error
  actionErrorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#fca5a5' },
  actionErrorText: { flex: 1, color: '#b91c1c', fontSize: 14 },

  // Buttons
  joinBtn: { flexDirection: 'row', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  leaveBtn: { flexDirection: 'row', gap: 8, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.danger },
  leaveBtnText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: '#d1d5db' },
  stepperValue: { fontSize: 24, fontWeight: '700', color: colors.text, minWidth: 32, textAlign: 'center' },
  stepperHint: { fontSize: 13, color: colors.textFaint },

  // Staff
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  staffName: { flex: 1, fontSize: 15, color: '#222' },
  extraPill: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  staffSlots: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },

  // Comments
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: colors.textFaint, fontStyle: 'italic' },
  comment: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 6 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#333', flexShrink: 1 },
  commentDate: { fontSize: 11, color: colors.textFaint, flexShrink: 0 },
  commentBody: { fontSize: 14, color: '#444', lineHeight: 20 },

  commentComposer: { gap: 8 },
  commentInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  commentPostBtn: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentPostBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  commentEditBox: { gap: 8 },
  commentEditActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  commentSmallBtn: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentCancelBtn: { backgroundColor: colors.background },
  commentCancelBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  commentSaveBtn: { backgroundColor: colors.primary },
  commentSaveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  commentDeleteBtnText: { fontSize: 12, fontWeight: '600', color: colors.danger },

  // Error / retry
  errorText: { fontSize: 15, color: '#b91c1c', textAlign: 'center', marginBottom: 16 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
