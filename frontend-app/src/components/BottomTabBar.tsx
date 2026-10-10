import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export type TabKey = 'store' | 'assistant' | 'compare' | 'orders' | 'ops';

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  const isStaff = user && ['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN', 'CATALOG_MANAGER', 'KNOWLEDGE_ADMIN'].includes(user.role);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'store', label: 'Store', icon: '🛍️' },
    { key: 'assistant', label: 'AI Hub', icon: '🤖' },
    { key: 'compare', label: 'Compare', icon: '⚖️' },
    { key: 'orders', label: 'Orders', icon: '📦' },
    { key: 'ops', label: isStaff ? 'Ops/Admin' : 'Support', icon: isStaff ? '⚙️' : '🎧' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onTabChange(tab.key)}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{tab.label}</Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        position: 'sticky',
        bottom: 0,
        zIndex: 100,
        maxWidth: 700,
        width: '100%',
        alignSelf: 'center',
      } as any,
    }),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.12)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(215, 190, 195, 0.45), 0 -2px 10px rgba(255, 255, 255, 0.8)',
      } as any,
      default: {
        shadowColor: colors.shadowDarkStrong,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 58,
    position: 'relative',
  },
  activeTabItem: {
    backgroundColor: '#FFE4E8',
  },
  tabIcon: {
    fontSize: 20,
  },
  activeTabIcon: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
