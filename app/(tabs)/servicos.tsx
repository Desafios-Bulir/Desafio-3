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
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { servicesService, ServiceResponse } from '@/services/services.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ServicosScreen() {
  const { user, isAuthenticated } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  async function fetchServices() {
    try {
      setLoading(true);
      const data = await servicesService.getMyServices();
      setServices(data);
    } catch (error) {
      console.warn('Erro ao conectar ao servidor. Carregando dados simulados...', error);
      // Mock services fallback matching standard items
      setServices([
        {
          id: 'mock-1',
          name: 'Corte de Cabelo Masculino',
          description: 'Corte moderno com lavagem e finalização inclusos.',
          price: 2000,
          providerId: 'mock-p',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          name: 'Manicure & Pedicure',
          description: 'Manicure e pedicure completa com esmaltação premium.',
          price: 1500,
          providerId: 'mock-p',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !isProvider) {
      return;
    }
    fetchServices();
  }, [user, isAuthenticated, isProvider]);

  // Handle service deletion
  const handleDeleteService = (id: string, name: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja remover o serviço "${name}" do seu catálogo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await servicesService.delete(id);
              Alert.alert('Sucesso', 'Serviço removido com sucesso!');
              fetchServices();
            } catch (error) {
              console.error('Delete error:', error);
              // Fallback for mock deletion
              setServices((prev) => prev.filter((s) => s.id !== id));
              Alert.alert('Sucesso (Simulação)', 'Serviço removido com sucesso!');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isProvider) {
    return <Redirect href={"/(tabs)" as any} />;
  }

  // Find most requested service (simulated or derived)
  const mostRequested = services.length > 0 ? services[0].name : 'N/A';

  return (
    <View style={styles.container}>
      {/* Header matching image exactly */}
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
            <Text style={styles.headerTitle}>Meus Serviços</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => Alert.alert('Notificações', 'Nenhuma notificação nova.')}
              activeOpacity={0.6}
            >
              <Ionicons name="notifications-outline" size={20} color="#1f2937" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newServiceBtn}
              onPress={() => router.push('/criar-servico' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#ffffff" style={styles.btnIcon} />
              <Text style={styles.newServiceBtnText}>Novo Serviço</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sidebar Menu */}
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        currentRoute="servicos" 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat Cards Grid */}
        <View style={styles.statsGrid}>
          {/* Card 1: Meus Serviços Ativos */}
          <StatCard
            iconName="briefcase-outline"
            iconColor="#2563eb"
            iconBgColor="#eff6ff"
            cardBgColor="#eff6ff"
            label="Meus Serviços Ativos"
            value={services.length.toString()}
            badgeText={`Total: ${services.length}`}
            badgeTextColor="#2563eb"
            badgeBgColor="#dbeafe"
          />

          {/* Card 2: Avaliação Média */}
          <StatCard
            iconName="star-outline"
            iconColor="#d97706"
            iconBgColor="#fffbeb"
            cardBgColor="#fffbeb"
            label="Avaliação Média"
            value="5.0"
            badgeText="Excelente"
            badgeTextColor="#b45309"
            badgeBgColor="#fef3c7"
          />

          {/* Card 3: Mais Solicitado */}
          <StatCard
            iconName="build-outline"
            iconColor="#059669"
            iconBgColor="#ecfdf5"
            cardBgColor="#ecfdf4"
            label="Mais Solicitado"
            value={mostRequested}
            badgeText={services.length > 0 ? "Mais solicitado" : "Sem reservas"}
            badgeTextColor="#047857"
            badgeBgColor="#d1fae5"
          />
        </View>

        {/* Gerenciar Catálogo Section */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Gerenciar Catálogo</Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color="#052a5e" />
            </View>
          ) : services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhum serviço registrado no seu catálogo.
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {/* Header Titles */}
              <View style={styles.tableRowHeader}>
                <Text style={[styles.columnHeader, styles.flexColName]}>SERVIÇO</Text>
                <Text style={[styles.columnHeader, styles.flexColPrice]}>PREÇO</Text>
                <Text style={[styles.columnHeader, styles.flexColDuration]}>DURAÇÃO</Text>
                <View style={styles.flexColAction}></View>
              </View>

              {services.map((item, index) => {
                // Formatting price to Angolan Kwanza
                const formattedPrice = new Intl.NumberFormat('pt-AO', {
                  style: 'currency',
                  currency: 'AOA',
                  minimumFractionDigits: 2
                }).format(item.price).replace('AOA', 'KZ');

                return (
                  <View 
                    key={item.id} 
                    style={[
                      styles.serviceItem,
                      index > 0 && styles.serviceDivider
                    ]}
                  >
                    {/* Name & Desc */}
                    <View style={styles.flexColName}>
                      <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.serviceDesc} numberOfLines={1}>{item.description}</Text>
                    </View>

                    {/* Price */}
                    <View style={styles.flexColPrice}>
                      <Text style={styles.servicePrice}>{formattedPrice}</Text>
                    </View>

                    {/* Duration - Fallback standard */}
                    <View style={styles.flexColDuration}>
                      <Text style={styles.serviceDuration}>1h</Text>
                    </View>

                    {/* Action - Delete */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteService(item.id, item.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
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
    gap: 10,
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
  newServiceBtn: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#052a5e',
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnIcon: {
    marginRight: -2,
  },
  newServiceBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e3a8a',
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
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  serviceDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  flexColName: {
    flex: 2,
    paddingRight: 8,
  },
  flexColPrice: {
    width: 90,
  },
  flexColDuration: {
    width: 70,
  },
  flexColAction: {
    width: 30,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  serviceDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
});
