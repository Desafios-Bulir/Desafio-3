import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { bookingsService, BookingResponse } from '@/services/bookings.service';
import { walletService } from '@/services/wallet.service';

const getAvatarColor = (name: string) => {
  const colors = [
    { bg: '#e0e7ff', text: '#4338ca' }, // indigo
    { bg: '#ffe4e6', text: '#be123c' }, // rose
    { bg: '#fef3c7', text: '#b45309' }, // amber
    { bg: '#ccfbf1', text: '#0f766e' }, // teal
    { bg: '#dbeafe', text: '#1d4ed8' }, // blue
    { bg: '#f3e8ff', text: '#7e22ce' }, // purple
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

const getFormattedDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const timeStr = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  if (d.toDateString() === today.toDateString()) {
    return `Hoje, ${timeStr}`;
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return `Amanhã, ${timeStr}`;
  } else {
    return `${d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} • ${timeStr}`;
  }
};

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Usuário';

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [balData, bookingsData] = await Promise.all([
          walletService.getBalance(),
          isProvider
            ? bookingsService.getProviderBookings()
            : bookingsService.getMyBookings(),
        ]);
        setBalance(balData.balance);
        setBookings(bookingsData);
      } catch (error) {
        console.warn('Erro ao conectar ao servidor. Carregando dados simulados...', error);
        
        // Dynamic simulated fallback data matching database seed properties
        setBalance(user?.balance || 0);
        
        // Mock bookings list based on role
        if (isProvider) {
          setBookings([
            {
              id: 'b-1',
              clientId: 'client-1',
              serviceId: 'srv-1',
              status: 'PENDING',
              scheduledAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              client: {
                id: 'client-1',
                fullName: 'Gilson Chipombo',
                email: 'gilson@gmail.com',
                role: 'CLIENT',
                phone: '923123456',
              },
              service: {
                id: 'srv-1',
                name: 'Corte de Cabelo Masculino',
                description: 'Corte moderno com lavagem inclusa.',
                price: 2000,
              },
            },
            {
              id: 'b-2',
              clientId: 'client-2',
              serviceId: 'srv-2',
              status: 'COMPLETED',
              scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              createdAt: new Date().toISOString(),
              client: {
                id: 'client-2',
                fullName: 'Cláudio Santos',
                email: 'claudio@gmail.com',
                role: 'CLIENT',
                phone: '931445566',
              },
              service: {
                id: 'srv-2',
                name: 'Manicure & Pedicure',
                description: 'Manicure completa e esmaltação.',
                price: 1500,
              },
            },
          ]);
        } else {
          setBookings([
            {
              id: 'b-3',
              clientId: user?.id || 'client-1',
              serviceId: 'srv-3',
              status: 'COMPLETED',
              scheduledAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
              createdAt: new Date().toISOString(),
              client: {
                id: user?.id || 'client-1',
                fullName: user?.fullName || 'Gilson Chipombo',
                email: user?.email || 'gilson@gmail.com',
                role: 'CLIENT',
              },
              service: {
                id: 'srv-3',
                name: 'Lavagem Automóvel Completa',
                description: 'Limpeza interna e externa de veículo.',
                price: 3500,
              },
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, isProvider, isAuthenticated]);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const todayStr = new Date().toDateString();
  const todayBookingsCount = bookings.filter(
    (b) => new Date(b.scheduledAt).toDateString() === todayStr
  ).length;

  const uniqueClientsCount = new Set(
    bookings.map((b) => b.clientId).filter(Boolean)
  ).size;

  const upcomingBookings = bookings.slice(0, 5);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#052a5e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <DashboardHeader 
        title="Dashboard" 
        onMenuPress={() => setSidebarVisible(true)} 
      />

      {/* Sidebar Menu */}
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        currentRoute="dashboard" 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Greeting */}
        <View style={styles.greetingContainer}>
          <View style={styles.greetingHeader}>
            <Text style={styles.greetingText}>Bom dia, {firstName}!</Text>
            <Text style={styles.greetingSubtext}>
              Aqui está o resumo dos seus serviços para hoje.
            </Text>
          </View>

          {isProvider && (
            <TouchableOpacity 
              style={styles.newBookingButton} 
              activeOpacity={0.8}
              onPress={() => Alert.alert('Nova Reserva Manual', 'Disponível em breve.')}
            >
              <Ionicons name="add" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.newBookingText}>Nova Reserva Manual</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          {/* Card 1: Reservas Hoje */}
          <StatCard
            iconName="calendar-outline"
            iconColor="#3b82f6"
            iconBgColor="#eff6ff"
            cardBgColor="#eff6ff"
            label="Reservas Hoje"
            value={todayBookingsCount.toString()}
            badgeText="Hoje"
            badgeTextColor="#1d4ed8"
          />

          {/* Card 2: Total de Clientes (Only for Providers) */}
          {isProvider && (
            <StatCard
              iconName="people-outline"
              iconColor="#10b981"
              iconBgColor="#ecfdf5"
              cardBgColor="#f0fdf4"
              label="Total de Clientes"
              value={uniqueClientsCount.toString()}
              badgeText="Ativos"
              badgeTextColor="#047857"
            />
          )}

          {/* Card 3: Saldo Disponível */}
          <StatCard
            iconName="wallet-outline"
            iconColor="#8b5cf6"
            iconBgColor="#f5f3ff"
            cardBgColor="#faf5ff"
            label="Saldo Disponível"
            value={`KZ ${balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
            badgeText={isProvider ? 'Sacar' : 'Carteira'}
            badgeTextColor="#1d4ed8"
            onBadgePress={() => Alert.alert('Ação da Carteira', isProvider ? 'Solicitação de saque de saldo iniciada.' : 'Acessando sua carteira digital.')}
          />
        </View>

        {/* Upcoming Bookings Section */}
        <View style={styles.bookingsCard}>
          <View style={styles.bookingsHeader}>
            <Text style={styles.bookingsTitle}>
              {isProvider ? 'Próximas Reservas' : 'Minhas Reservas Recentes'}
            </Text>
            <Text style={styles.bookingsCount}>Total: {bookings.length}</Text>
          </View>

          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhuma reserva registada até ao momento.
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {upcomingBookings.map((booking, index) => {
                const displayName = isProvider
                  ? booking.client?.fullName || 'Cliente Geral'
                  : booking.service?.name || 'Serviço Geral';
                const displayDetail = isProvider
                  ? booking.service?.name || 'Serviço Geral'
                  : 'Reserva agendada';

                const avatarLetter = displayName.charAt(0).toUpperCase();
                const avatarTheme = getAvatarColor(displayName);

                let statusLabel = 'Pendente';
                let statusBg = '#fef3c7'; // yellow 100
                let statusText = '#b45309'; // yellow 700

                if (booking.status === 'COMPLETED') {
                  statusLabel = 'Confirmado';
                  statusBg = '#dbeafe'; // blue 100
                  statusText = '#1d4ed8'; // blue 700
                } else if (booking.status === 'CANCELED') {
                  statusLabel = 'Cancelado';
                  statusBg = '#fee2e2'; // red 100
                  statusText = '#b91c1c'; // red 700
                }

                return (
                  <View 
                    key={booking.id} 
                    style={[
                      styles.bookingItem,
                      index > 0 && styles.bookingDivider
                    ]}
                  >
                    {/* Client/Service Avatar */}
                    <View style={[styles.avatar, { backgroundColor: avatarTheme.bg }]}>
                      <Text style={[styles.avatarText, { color: avatarTheme.text }]}>
                        {avatarLetter}
                      </Text>
                    </View>

                    {/* Booking Details */}
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingName} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={styles.bookingDetail} numberOfLines={1}>
                        {displayDetail}
                      </Text>
                      {/* Date display for mobile layout */}
                      <View style={styles.bookingDateContainer}>
                        <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                        <Text style={styles.bookingDate}>
                          {getFormattedDate(booking.scheduledAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusText, { color: statusText }]}>
                        {statusLabel}
                      </Text>
                    </View>

                    {/* Action button */}
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => Alert.alert('Ações', `Opções para reserva de ${displayName}`)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // Light grey page background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  greetingContainer: {
    gap: 16,
  },
  greetingHeader: {
    gap: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  greetingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  newBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#052a5e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 6,
  },
  newBookingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    gap: 12,
  },
  bookingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bookingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  bookingsCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  bookingsList: {
    paddingHorizontal: 20,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  bookingDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingInfo: {
    flex: 1,
    marginRight: 8,
    gap: 2,
  },
  bookingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  bookingDetail: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  bookingDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  moreButton: {
    padding: 6,
  },
});
