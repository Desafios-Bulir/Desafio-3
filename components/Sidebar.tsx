import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  currentRoute: 'dashboard' | 'clientes' | 'servicos' | 'historico' | 'carteira';
}

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.8, 300);

export function Sidebar({ visible, onClose, currentRoute }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleNavigation = (route: 'dashboard' | 'clientes' | 'servicos' | 'historico' | 'carteira') => {
    onClose();
    if (route === 'dashboard') {
      router.push('/(tabs)' as any);
    } else if (route === 'clientes') {
      router.push('/(tabs)/clientes' as any);
    } else if (route === 'servicos') {
      router.push('/(tabs)/servicos' as any);
    } else if (route === 'historico') {
      router.push('/(tabs)/historico' as any);
    } else if (route === 'carteira') {
      router.push('/(tabs)/carteira' as any);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
    router.replace('/login');
  };

  const isProvider = user?.role === 'PROVIDER';
  const roleLabel = isProvider ? 'Prestador' : 'Cliente';
  const avatarLetter = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.overlay}>
        {/* Click outside to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sidebar Container */}
        <View style={[styles.menuContainer, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header Close button */}
          <View style={styles.closeHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName} numberOfLines={1}>
                {user?.fullName || 'Usuário'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email || 'email@exemplo.com'}
              </Text>
              <View style={[styles.roleBadge, isProvider ? styles.providerBadge : styles.clientBadge]}>
                <Text style={[styles.roleBadgeText, isProvider ? styles.providerBadgeText : styles.clientBadgeText]}>
                  {roleLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Nav Links */}
          <View style={styles.navSection}>
            <TouchableOpacity
              style={[styles.navItem, currentRoute === 'dashboard' && styles.navItemActive]}
              onPress={() => handleNavigation('dashboard')}
              activeOpacity={0.6}
            >
              <Ionicons
                name={currentRoute === 'dashboard' ? 'grid' : 'grid-outline'}
                size={20}
                color={currentRoute === 'dashboard' ? '#052a5e' : '#4b5563'}
              />
              <Text style={[styles.navText, currentRoute === 'dashboard' && styles.navTextActive]}>
                Painel Principal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navItem, currentRoute === 'historico' && styles.navItemActive]}
              onPress={() => handleNavigation('historico')}
              activeOpacity={0.6}
            >
              <Ionicons
                name={currentRoute === 'historico' ? 'list' : 'list-outline'}
                size={20}
                color={currentRoute === 'historico' ? '#052a5e' : '#4b5563'}
              />
              <Text style={[styles.navText, currentRoute === 'historico' && styles.navTextActive]}>
                Histórico de Serviços
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, currentRoute === 'carteira' && styles.navItemActive]}
              onPress={() => handleNavigation('carteira')}
              activeOpacity={0.6}
            >
              <Ionicons
                name={currentRoute === 'carteira' ? 'wallet' : 'wallet-outline'}
                size={20}
                color={currentRoute === 'carteira' ? '#052a5e' : '#4b5563'}
              />
              <Text style={[styles.navText, currentRoute === 'carteira' && styles.navTextActive]}>
                Minha Carteira
              </Text>
            </TouchableOpacity>
            {isProvider && (
              <>
                <TouchableOpacity
                  style={[styles.navItem, currentRoute === 'clientes' && styles.navItemActive]}
                  onPress={() => handleNavigation('clientes')}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={currentRoute === 'clientes' ? 'people' : 'people-outline'}
                    size={20}
                    color={currentRoute === 'clientes' ? '#052a5e' : '#4b5563'}
                  />
                  <Text style={[styles.navText, currentRoute === 'clientes' && styles.navTextActive]}>
                    Meus Clientes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navItem, currentRoute === 'servicos' && styles.navItemActive]}
                  onPress={() => handleNavigation('servicos')}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={currentRoute === 'servicos' ? 'briefcase' : 'briefcase-outline'}
                    size={20}
                    color={currentRoute === 'servicos' ? '#052a5e' : '#4b5563'}
                  />
                  <Text style={[styles.navText, currentRoute === 'servicos' && styles.navTextActive]}>
                    Meus Serviços
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.logoutItem}
              onPress={handleLogout}
              activeOpacity={0.6}
            >
              <Ionicons name="log-out-outline" size={20} color="#b91c1c" />
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
    paddingHorizontal: 20,
  },
  closeHeader: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#052a5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  fullName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  email: {
    fontSize: 12,
    color: '#6b7280',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  providerBadge: {
    backgroundColor: '#eff6ff',
  },
  clientBadge: {
    backgroundColor: '#f3f4f6',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  providerBadgeText: {
    color: '#1d4ed8',
  },
  clientBadgeText: {
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  navSection: {
    flex: 1,
    gap: 8,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#eff6ff',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  navTextActive: {
    color: '#052a5e',
  },
  footerSection: {
    marginBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b91c1c',
  },
});
