import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { SAMPLE_PERSONAS, SamplePersona, useAuth } from '../context/AuthContext';
import { NeomorphCard } from './NeomorphCard';

interface PersonaModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({ visible, onClose }) => {
  const { user, quickSwitch } = useAuth();

  const handleSelect = async (p: SamplePersona) => {
    await quickSwitch(p.email);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>PRD Persona Switcher</Text>
              <Text style={styles.modalSubtitle}>
                Instant 1-tap testing across Customer & Ops roles
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* List of personas */}
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {SAMPLE_PERSONAS.map((p) => {
              const isSelected = user?.email === p.email;
              return (
                <TouchableOpacity
                  key={p.email}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(p)}
                >
                  <NeomorphCard
                    variant={isSelected ? 'glow' : 'raisedSoft'}
                    style={[styles.personaCard, isSelected && styles.activeCard]}
                    padding={14}
                  >
                    <View style={styles.personaRow}>
                      <View style={styles.avatarBubble}>
                        <Text style={styles.avatarEmoji}>{p.avatar}</Text>
                      </View>

                      <View style={styles.personaMeta}>
                        <View style={styles.nameRow}>
                          <Text style={styles.personaName}>{p.name}</Text>
                          <View style={styles.badgeRow}>
                            <View style={[styles.roleBadge, p.role !== 'CUSTOMER' && styles.staffBadge]}>
                              <Text style={styles.roleText}>{p.role}</Text>
                            </View>
                            <View style={styles.tierBadge}>
                              <Text style={styles.tierText}>{p.membership}</Text>
                            </View>
                          </View>
                        </View>

                        <Text style={styles.tagline}>{p.tagline}</Text>
                        <Text style={styles.scenario} numberOfLines={2}>
                          {p.scenario}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={styles.checkBubble}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </NeomorphCard>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 18, 21, 0.45)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(6px)',
      } as any,
    }),
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.2)',
      } as any,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(225, 29, 72, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  scrollList: {
    padding: 16,
    gap: 10,
  },
  personaCard: {
    marginVertical: 4,
  },
  activeCard: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFE4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  personaMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personaName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  roleBadge: {
    backgroundColor: '#FFE4E8',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  staffBadge: {
    backgroundColor: '#F3E8FF',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  tierBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0369A1',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  scenario: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  checkBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
