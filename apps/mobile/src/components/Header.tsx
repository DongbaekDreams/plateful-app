import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../packages/shared/src/theme/colors';
import ProfileMenu from './ProfileMenu';
import Logo from './Logo';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
}

export default function Header({ title, showBackButton = false, showLogo = false }: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleProfilePress = () => {
    setMenuVisible(true);
  };

  // Minimal top padding - just safe area for all headers
  const topPadding = Math.max(insets.top, 8); // Just safe area or minimum 8px

  return (
    <>
      <View style={[styles.container, { paddingTop: topPadding }]}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {showLogo ? (
          <View style={styles.logoContainer}>
            <Logo variant="full" width={160} height={50} />
          </View>
        ) : (
          title && <Text style={styles.title}>{title}</Text>
        )}
        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
          <Ionicons name="person-circle" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ProfileMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileButton: {
    padding: 4,
    marginLeft: 12,
  },
});

