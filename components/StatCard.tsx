import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  iconName: any;
  iconColor: string;
  iconBgColor: string;
  cardBgColor: string;
  label: string;
  value: string;
  badgeText: string;
  badgeTextColor: string;
  badgeBgColor?: string;
  onBadgePress?: () => void;
}

export function StatCard({
  iconName,
  iconColor,
  iconBgColor,
  cardBgColor,
  label,
  value,
  badgeText,
  badgeTextColor,
  badgeBgColor = 'transparent',
  onBadgePress,
}: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: cardBgColor }]}>
      {/* Top Row: Icon & Badge */}
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        <TouchableOpacity
          disabled={!onBadgePress}
          onPress={onBadgePress}
          style={[styles.badge, { backgroundColor: badgeBgColor }]}
          activeOpacity={0.6}
        >
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>
            {badgeText}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Content: Label & Value */}
      <View style={styles.contentContainer}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={styles.valueText} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    height: 125,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    gap: 2,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  valueText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
});
