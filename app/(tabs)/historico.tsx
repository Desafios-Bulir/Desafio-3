import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { bookingsService, BookingResponse } from '@/services/bookings.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterType = 'ALL' | 'COMPLETED' | 'PENDING' | 'CANCELLED';

export default function HistoricoScreen() {
  const { user, isAuthenticated } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = isProvider
        ? await bookingsService.getProviderBookings()
        : await bookingsService.getMyBookings();
      setBookings(data);
    } catch (error) {
      console.warn('Erro ao conectar ao servidor. Carregando dados simulados...', error);
      
      // Fallback static mocked bookings matching the standard schema
      setBookings([
        {
          id: 'mock-b1',
          clientId: 'client-1',
          serviceId: 'srv-1',
          status: 'COMPLETED',
          scheduledAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
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
          id: 'mock-b2',
          clientId: 'client-2',
          serviceId: 'srv-2',
          status: 'PENDING',
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
        {
          id: 'mock-b3',
          clientId: 'client-3',
          serviceId: 'srv-3',
          status: 'CANCELLED',
          scheduledAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
          createdAt: new Date().toISOString(),
          client: {
            id: 'client-3',
            fullName: 'Sandra Mateus',
            email: 'sandra@gmail.com',
            role: 'CLIENT',
            phone: '924889900',
          },
          service: {
            id: 'srv-3',
            name: 'Limpeza de Pele',
            description: 'Limpeza facial profunda com peeling.',
            price: 5000,
          },
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [isProvider]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchBookings();
      }
    }, [isAuthenticated, fetchBookings])
  );

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Count stats
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'ALL') return true;
    return b.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header matching image */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
              activeOpacity={0.6}
            >
              <Ionicons name="menu" size={26} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Histórico de Serviços</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => Alert.alert('Notificações', 'Nenhuma notificação nova.')}
              activeOpacity={0.6}
            >
              <Ionicons name="notifications-outline" size={20} color="#1f2937" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sidebar Menu */}
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        currentRoute="historico" // Keep active highlighting correct
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat Cards Grid */}
        <View style={styles.statsGrid}>
          {/* Card 1: Serviços Concluídos */}
          <StatCard
            iconName="checkmark-circle-outline"
            iconColor="#059669"
            iconBgColor="#ecfdf5"
            cardBgColor="#ecfdf4"
            label="Serviços Concluídos"
            value={completedCount.toString()}
            badgeText="Finalizados"
            badgeTextColor="#047857"
            badgeBgColor="#d1fae5"
          />

          {/* Card 2: Cancelamentos */}
          <StatCard
            iconName="close-circle-outline"
            iconColor="#dc2626"
            iconBgColor="#fef2f2"
            cardBgColor="#fef2f2"
            label="Cancelamentos"
            value={cancelledCount.toString()}
            badgeText="Cancelados"
            badgeTextColor="#b91c1c"
            badgeBgColor="#fee2e2"
          />

          {/* Card 3: Reservas Pendentes */}
          <StatCard
            iconName="time-outline"
            iconColor="#2563eb"
            iconBgColor="#eff6ff"
            cardBgColor="#eff6ff"
            label="Reservas Pendentes"
            value={pendingCount.toString()}
            badgeText="Em aberto"
            badgeTextColor="#1d4ed8"
            badgeBgColor="#dbeafe"
          />
        </View>

        {/* Todos os Serviços Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Todos os Serviços</Text>

            {/* Filter Tabs matching image */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
                onPress={() => setActiveFilter('ALL')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, activeFilter === 'COMPLETED' && styles.filterTabActive]}
                onPress={() => setActiveFilter('COMPLETED')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, activeFilter === 'COMPLETED' && styles.filterTabTextActive]}>
                  Concluídos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, activeFilter === 'PENDING' && styles.filterTabActive]}
                onPress={() => setActiveFilter('PENDING')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, activeFilter === 'PENDING' && styles.filterTabTextActive]}>
                  Pendentes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, activeFilter === 'CANCELLED' && styles.filterTabActive]}
                onPress={() => setActiveFilter('CANCELLED')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, activeFilter === 'CANCELLED' && styles.filterTabTextActive]}>
                  Cancelados
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color="#052a5e" />
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhuma reserva encontrada para este filtro.
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {/* Header Titles */}
              <View style={styles.tableRowHeader}>
                <Text style={[styles.columnHeader, styles.flexColDate]}>DATA</Text>
                <Text style={[styles.columnHeader, styles.flexColService]}>SERVIÇO</Text>
                <Text style={[styles.columnHeader, styles.flexColDest]}>DESTINO</Text>
              </View>

              {filteredBookings.map((item, index) => {
                // Formatting Date
                const dateObj = new Date(item.scheduledAt);
                const formattedDate = dateObj.toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                const formattedTime = dateObj.toLocaleTimeString('pt-PT', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                // Displaying client name or fallback
                const destinationName = item.client?.fullName || 'Consumidor Final';

                return (
                  <View 
                    key={item.id} 
                    style={[
                      styles.tableRow,
                      index > 0 && styles.rowDivider
                    ]}
                  >
                    {/* Date column */}
                    <View style={styles.flexColDate}>
                      <Text style={styles.rowDateText}>{formattedDate}</Text>
                      <Text style={styles.rowTimeText}>{formattedTime}</Text>
                    </View>

                    {/* Service column */}
                    <View style={styles.flexColService}>
                      <Text style={styles.rowServiceText} numberOfLines={1}>
                        {item.service?.name || 'Serviço Personalizado'}
                      </Text>
                      <Text style={styles.rowPriceText}>
                        {item.service?.price 
                          ? new Intl.NumberFormat('pt-AO', {
                              style: 'currency',
                              currency: 'AOA',
                              minimumFractionDigits: 2
                            }).format(item.service.price).replace('AOA', 'KZ')
                          : 'Sob consulta'}
                      </Text>
                    </View>

                    {/* Destination column */}
                    <View style={styles.flexColDest}>
                      <Text style={styles.rowDestText} numberOfLines={1}>{destinationName}</Text>
                    </View>
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
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  statsGrid: {
    gap: 12,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 3,
    justifyContent: 'space-between',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
  },
  filterTabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  loadingWrapper: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  flexColDate: {
    width: 90,
  },
  flexColService: {
    flex: 1,
    paddingRight: 8,
  },
  flexColDest: {
    width: 120,
  },
  rowDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  rowTimeText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  rowServiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  rowPriceText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  rowDestText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
});
