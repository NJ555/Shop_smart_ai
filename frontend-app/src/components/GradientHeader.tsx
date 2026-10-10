import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth, SAMPLE_PERSONAS } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface GradientHeaderProps {
  onOpenPersonaModal: () => void;
  onOpenCart: () => void;
  onOpenCompare: () => void;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  onOpenPersonaModal,
  onOpenCart,
  onOpenCompare,
}) => {
  const { user } = useAuth();
  const { count, compareList } = useCart();

  const currentPersona = SAMPLE_PERSONAS.find((p) => p.email === user?.email);

  return (
    <View style={styles.header}>
      {/* Brand title */}
      <View style={styles.brandContainer}>
        <View style={styles.logoPill}>
          <Text style={styles.logoIcon}>✨</Text>
        </View>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>ShopSmart</Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>Autonomous E-Commerce</Text>
        </View>
      </View>

      {/* Right actions: Compare indicator, Persona Switcher, Cart Badge */}
      <View style={styles.rightActions}>
        {compareList.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onOpenCompare}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>⚖️</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{compareList.length}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Cart Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onOpenCart}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>🛒</Text>
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Persona quick-switch avatar button */}
        <TouchableOpacity
          style={styles.personaButton}
          onPress={onOpenPersonaModal}
          activeOpacity={0.8}
        >
          <Text style={styles.personaAvatar}>{currentPersona?.avatar || '👤'}</Text>
          <View style={styles.personaInfo}>
            <Text style={styles.personaName} numberOfLines={1}>
              {user?.fullName?.split(' ')[0] || 'User'}
            </Text>
            <View style={styles.tierChip}>
              <Text style={styles.tierText}>
                {user?.role === 'CUSTOMER' ? user.membershipTier : user?.role?.slice(0, 7) || 'BASIC'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(225, 29, 72, 0.08)',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(249, 245, 246, 0.92)',
      } as any,
    }),
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 8px #DECED2, -3px -3px 8px #FFFFFF',
      } as any,
    }),
  },
  logoIcon: {
    fontSize: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  aiTag: {
    marginLeft: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 8px #DECED2, -3px -3px 8px #FFFFFF',
      } as any,
    }),
  },
  actionIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  personaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.15)',
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 8px #DECED2, -3px -3px 8px #FFFFFF',
      } as any,
    }),
  },
  personaAvatar: {
    fontSize: 18,
    marginRight: 6,
  },
  personaInfo: {
    flexDirection: 'column',
  },
  personaName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 65,
  },
  tierChip: {
    backgroundColor: '#FFE4E8',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
});
