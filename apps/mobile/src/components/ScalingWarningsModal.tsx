import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, semanticColors } from '../../../packages/shared/src/theme/colors';
import type { ScalingWarning } from '../../../packages/shared/src/types/recipe';

interface ScalingWarningsModalProps {
  visible: boolean;
  warnings: ScalingWarning[];
  onClose: () => void;
}

export default function ScalingWarningsModal({ visible, warnings, onClose }: ScalingWarningsModalProps) {
  // Don't render modal if not visible or no warnings
  if (!visible || !warnings || warnings.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <Text style={styles.modalTitle}>Scaling Considerations</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.warningsContainer} showsVerticalScrollIndicator={false}>
            {warnings.map((warning, index) => (
              <View
                key={index}
                style={[
                  styles.warning,
                  warning.severity === 'info' && styles.warningInfo,
                  warning.severity === 'warning' && styles.warningWarning,
                  warning.severity === 'critical' && styles.warningCritical,
                ]}
              >
                <Ionicons
                  name={
                    warning.severity === 'critical'
                      ? 'alert-circle'
                      : warning.severity === 'warning'
                      ? 'warning'
                      : 'information-circle'
                  }
                  size={20}
                  color={
                    warning.severity === 'critical'
                      ? semanticColors.error
                      : warning.severity === 'warning'
                      ? semanticColors.warningBorder
                      : colors.primary
                  }
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.warningText,
                    warning.severity === 'critical' && styles.warningTextCritical,
                    warning.severity === 'warning' && styles.warningTextWarning,
                    warning.severity === 'info' && styles.warningTextInfo,
                  ]}
                >
                  {warning.message}
                </Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  warningsContainer: {
    maxHeight: 400,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    gap: 12,
  },
  warningInfo: {
    backgroundColor: colors.primaryLight + '30',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  warningWarning: {
    backgroundColor: '#FFF4E6',
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D',
  },
  warningCritical: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 3,
    borderLeftColor: semanticColors.error,
  },
  icon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  warningTextInfo: {
    color: colors.textPrimary,
  },
  warningTextWarning: {
    color: colors.textPrimary,
  },
  warningTextCritical: {
    color: colors.textPrimary,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});

