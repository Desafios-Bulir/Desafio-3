import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface DashboardHeaderProps {
  title: string;
  onMenuPress: () => void;
  onNotificationsPress?: () => void;
}

export function DashboardHeader({ title, onMenuPress, onNotificationsPress }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        {/* Left Side: Hamburger Menu */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenuPress}
          activeOpacity={0.6}
        >
          <Ionicons name="menu" size={26} color="#1f2937" />
        </TouchableOpacity>

        {/* Center: Title */}
        <Text style={styles.titleText}>{title}</Text>

        {/* Right Side: Notification Bell */}
        <TouchableOpacity
          style={styles.bellButton}
          onPress={onNotificationsPress || (() => alert('Notificações (funcionalidade futura)'))}
          activeOpacity={0.6}
        >
          <Ionicons name="notifications-outline" size={20} color="#1f2937" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    padding: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
