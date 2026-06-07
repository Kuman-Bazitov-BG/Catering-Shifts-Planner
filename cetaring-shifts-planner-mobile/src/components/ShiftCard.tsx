import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ShiftSummary } from '@/lib/api';
import { colors } from '@/lib/theme';

function formatDateTime(date: string, startTime: string, endTime: string): string {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);
  const datePart = start.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const timePart =
    start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) +
    ' – ' +
    end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
}

type Props = { shift: ShiftSummary };

export default function ShiftCard({ shift }: Props) {
  const router = useRouter();
  const { state } = shift;

  const temporalColor = state.temporal === 'current' ? colors.success : colors.info;
  const temporalIcon = state.temporal === 'current' ? 'radio-button-on' : 'time-outline';
  const temporalLabel = state.temporal === 'current' ? 'Current' : 'Upcoming';

  const capacityLabel =
    state.capacity === 'full' ? 'Full' :
    state.capacity === 'over' ? 'Over capacity' : null;
  const capacityColor =
    state.capacity === 'full' ? colors.warning :
    state.capacity === 'over' ? colors.danger : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/shifts/${shift.id}`)}
    >
      {/* Header row: title + joined badge */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{shift.title}</Text>
        {shift.isJoined && (
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        )}
      </View>

      {/* Date & time */}
      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
        <Text style={styles.metaText}>
          {formatDateTime(shift.date, shift.startTime, shift.endTime)}
        </Text>
      </View>

      {/* Location */}
      {shift.location ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{shift.location}</Text>
        </View>
      ) : null}

      {/* Footer row: group + state badges */}
      <View style={styles.footer}>
        <View style={styles.groupRow}>
          <Ionicons name="people-outline" size={13} color={colors.textFaint} />
          <Text style={styles.group} numberOfLines={1}>{shift.groupTitle}</Text>
        </View>

        <View style={styles.badges}>
          {capacityLabel && capacityColor && (
            <View style={[styles.badge, { backgroundColor: capacityColor + '1a' }]}>
              <Text style={[styles.badgeText, { color: capacityColor }]}>
                {capacityLabel}
              </Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: temporalColor + '1a' }]}>
            <Ionicons name={temporalIcon as never} size={11} color={temporalColor} />
            <Text style={[styles.badgeText, { color: temporalColor }]}>
              {temporalLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Staff count */}
      <View style={styles.staffRow}>
        <Ionicons name="people" size={14} color={colors.textFaint} />
        <Text style={styles.staff}>
          {shift.staffCount} / {shift.capacity} staff
        </Text>
        {shift.commentCount > 0 && (
          <>
            <View style={styles.dot} />
            <Ionicons name="chatbubble-outline" size={13} color={colors.textFaint} />
            <Text style={styles.staff}>{shift.commentCount}</Text>
          </>
        )}
        <View style={styles.spacer} />
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  joinedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 8,
  },
  groupRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  group: {
    flex: 1,
    fontSize: 12,
    color: colors.textFaint,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  staff: {
    fontSize: 12,
    color: colors.textFaint,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textFaint,
    marginHorizontal: 2,
  },
  spacer: { flex: 1 },
});
