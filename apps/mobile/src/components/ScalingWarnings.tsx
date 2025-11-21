import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, semanticColors } from '../../../packages/shared/src/theme/colors';
import type { ScalingWarning } from '../../../packages/shared/src/types/recipe';

interface ScalingWarningsProps {
  warnings: ScalingWarning[];
}

export default function ScalingWarnings({ warnings }: ScalingWarningsProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
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
                ? semanticColors.warning
                : semanticColors.info
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    gap: 8,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  warningInfo: {
    backgroundColor: semanticColors.info + '20',
    borderLeftWidth: 3,
    borderLeftColor: semanticColors.info,
  },
  warningWarning: {
    backgroundColor: semanticColors.warning + '20',
    borderLeftWidth: 3,
    borderLeftColor: semanticColors.warning,
  },
  warningCritical: {
    backgroundColor: semanticColors.error + '20',
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
});

