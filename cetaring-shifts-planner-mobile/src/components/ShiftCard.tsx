import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ShiftSummary } from '@/lib/api';

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

  const temporalColor = state.temporal === 'current' ? '#16a34a' : '#2563eb';
  const temporalLabel = state.temporal === 'current' ? 'Current' : 'Upcoming';

  const capacityLabel =
    state.capacity === 'full' ? 'Full' :
    state.capacity === 'over' ? 'Over capacity' : null;
  const capacityColor =
    state.capacity === 'full' ? '#d97706' :
    state.capacity === 'over' ? '#dc2626' : null;

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
            <Text style={styles.joinedText}>✓ Joined</Text>
          </View>
        )}
      </View>

      {/* Date & time */}
      <Text style={styles.datetime}>
        {formatDateTime(shift.date, shift.startTime, shift.endTime)}
      </Text>

      {/* Location */}
      {shift.location ? (
        <Text style={styles.location}>📍 {shift.location}</Text>
      ) : null}

      {/* Footer row: group + state badges + staff count */}
      <View style={styles.footer}>
        <Text style={styles.group} numberOfLines={1}>{shift.groupTitle}</Text>

        <View style={styles.badges}>
          {capacityLabel && capacityColor && (
            <View style={[styles.badge, { backgroundColor: capacityColor + '22' }]}>
              <Text style={[styles.badgeText, { color: capacityColor }]}>
                {capacityLabel}
              </Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: temporalColor + '22' }]}>
            <Text style={[styles.badgeText, { color: temporalColor }]}>
              {temporalLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Staff count */}
      <Text style={styles.staff}>
        👥 {shift.staffCount} / {shift.capacity} staff
        {shift.commentCount > 0 ? `  · 💬 ${shift.commentCount}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    color: '#111',
    lineHeight: 22,
  },
  joinedBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  joinedText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  datetime: {
    fontSize: 13,
    color: '#555',
  },
  location: {
    fontSize: 13,
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 8,
  },
  group: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  staff: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
});
