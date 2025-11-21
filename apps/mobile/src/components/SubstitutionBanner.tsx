import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, semanticColors } from '../../../packages/shared/src/theme/colors';
import type { IngredientSubstitution } from '../../../packages/shared/src/types/recipe';

interface SubstitutionBannerProps {
  substitutions: IngredientSubstitution[];
  compact?: boolean;
}

export default function SubstitutionBanner({ substitutions, compact = false }: SubstitutionBannerProps) {
  const [expanded, setExpanded] = useState(!compact);

  if (!substitutions || substitutions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="swap-horizontal" size={18} color={colors.surface} />
          </View>
          <Text style={styles.headerText}>
            {substitutions.length} Substitution{substitutions.length !== 1 ? 's' : ''} Made
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textPrimary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {substitutions.map((sub, index) => (
            <View key={index} style={styles.substitutionItem}>
              <View style={styles.substitutionRow}>
                <View style={styles.originalContainer}>
                  <Text style={styles.label}>Original:</Text>
                  <Text style={styles.originalText}>{sub.originalIngredient}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} style={styles.arrow} />
                <View style={styles.substitutedContainer}>
                  <Text style={styles.label}>Substituted:</Text>
                  <Text style={styles.substitutedText}>{sub.substitutedIngredient}</Text>
                </View>
              </View>
              <View style={styles.reasonContainer}>
                <Ionicons name="information-circle" size={14} color={colors.textSecondary} />
                <Text style={styles.reasonText}>
                  {sub.reason.startsWith('allergy:') 
                    ? `Allergy: ${sub.reason.replace('allergy: ', '')}`
                    : sub.reason.startsWith('restriction:')
                    ? `Restriction: ${sub.reason.replace('restriction: ', '')}`
                    : sub.reason}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: semanticColors.warningBackground || '#FFF4E6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: semanticColors.warningBorder || '#FFB74D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 12,
  },
  substitutionItem: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  substitutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  originalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  arrow: {
    marginHorizontal: 8,
  },
  substitutedContainer: {
    flex: 1,
  },
  substitutedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
});

