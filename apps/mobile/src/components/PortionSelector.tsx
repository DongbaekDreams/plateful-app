import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../packages/shared/src/theme/colors';

interface PortionSelectorProps {
  portions: number;
  originalPortions: number;
  defaultPortions?: number;
  onPortionsChange: (newPortions: number) => void;
  minPortions?: number;
  maxPortions?: number;
}

export default function PortionSelector({
  portions,
  originalPortions,
  defaultPortions,
  onPortionsChange,
  minPortions = 1,
  maxPortions = 20,
}: PortionSelectorProps) {
  const isUsingDefault = defaultPortions !== undefined && portions === defaultPortions;
  const isUsingOriginal = portions === originalPortions;

  const handleDecrement = () => {
    if (portions > minPortions) {
      onPortionsChange(portions - 1);
    }
  };

  const handleIncrement = () => {
    if (portions < maxPortions) {
      onPortionsChange(portions + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Ionicons name="people" size={16} color={colors.textSecondary} />
        <Text style={styles.label}>Servings</Text>
        {(isUsingDefault || isUsingOriginal) && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isUsingDefault ? 'Default' : 'Original'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, portions <= minPortions && styles.buttonDisabled]}
          onPress={handleDecrement}
          disabled={portions <= minPortions}
        >
          <Ionicons
            name="remove"
            size={20}
            color={portions <= minPortions ? colors.textSecondary : colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.portionText}>
          {portions} {portions === 1 ? 'serving' : 'servings'}
        </Text>
        <TouchableOpacity
          style={[styles.button, portions >= maxPortions && styles.buttonDisabled]}
          onPress={handleIncrement}
          disabled={portions >= maxPortions}
        >
          <Ionicons
            name="add"
            size={20}
            color={portions >= maxPortions ? colors.textSecondary : colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  portionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
  },
});

