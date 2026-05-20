import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Redirect, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { servicesService, ServiceResponse } from '@/services/services.service';
import { bookingsService } from '@/services/bookings.service';
import { walletService } from '@/services/wallet.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ServicosScreen() {
  const { user, isAuthenticated, updateUserBalance } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Client states
  const [balance, setBalance] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<ServiceResponse | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = isProvider
        ? await servicesService.getMyServices()
        : await servicesService.getAll();
      setServices(data);

      if (!isProvider) {
        const balData = await walletService.getBalance();
        setBalance(balData.balance);
      }
    } catch (error) {
      console.warn('Erro ao conectar ao servidor. Carregando dados simulados...', error);
      
      // Fallback balance
      if (!isProvider) {
        setBalance(user?.balance || 4000);
      }

      // Mock services fallback matching standard items
      setServices([
        {
          id: 'mock-1',
          name: 'Desenvolver Apps',
          description: 'Desenvolvedor de Apps Android/iOS nativo e híbrido.',
          price: 20000,
          providerId: 'mock-p1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          name: 'Corte de Cabelo Masculino',
          description: 'Corte moderno com lavagem e finalização inclusos.',
          price: 1500,
          providerId: 'mock-p2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-3',
          name: 'Manicure & Pedicure',
          description: 'Manicure e pedicure completa com esmaltação premium.',
          price: 2000,
          providerId: 'mock-p3',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-4',
          name: 'Pintura Residencial',
          description: 'Pintura interna e externa com acabamento refinado.',
          price: 800,
          providerId: 'mock-p4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-5',
          name: 'Limpeza de Ar Condicionado',
          description: 'Limpeza e higienização completa de split.',
          price: 500,
          providerId: 'mock-p5',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [isProvider, user?.balance]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchServices();
      }
    }, [isAuthenticated, fetchServices])
  );

  // Handle service deletion (Provider only)
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
              setServices((prev) => prev.filter((s) => s.id !== id));
              Alert.alert('Sucesso (Simulação)', 'Serviço removido com sucesso!');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open booking modal for Client
  const handleOpenBookingModal = (service: ServiceResponse) => {
    setSelectedService(service);
    
    // Set tomorrow's date by default in MM/DD/YYYY format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    setScheduledDate(`${mm}/${dd}/${yyyy}`);
    setScheduledTime('10:00 AM');
  };

  // Submit client service booking
  const handleConfirmBooking = async () => {
    if (!selectedService) return;

    // Parse MM/DD/YYYY date format
    let parsedDate: Date;
    try {
      const dateParts = scheduledDate.split('/');
      if (dateParts.length !== 3) {
        throw new Error('Formato de data inválido. Use MM/DD/AAAA');
      }
      const month = parseInt(dateParts[0], 10) - 1;
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      // Parse time format "HH:MM AM/PM" or similar
      let hour = 10;
      let minute = 0;
      const timeClean = scheduledTime.trim().toUpperCase();
      const isPM = timeClean.includes('PM');
      const isAM = timeClean.includes('AM');
      const timeNumPart = timeClean.replace('AM', '').replace('PM', '').trim();
      const timeParts = timeNumPart.split(':');
      
      if (timeParts.length >= 1) {
        hour = parseInt(timeParts[0], 10);
      }
      if (timeParts.length >= 2) {
        minute = parseInt(timeParts[1], 10);
      }

      if (isPM && hour < 12) {
        hour += 12;
      }
      if (isAM && hour === 12) {
        hour = 0;
      }

      parsedDate = new Date(year, month, day, hour, minute);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Data ou hora inválida.');
      }
    } catch (err: any) {
      Alert.alert('Erro de Agendamento', err.message || 'Use o formato MM/DD/AAAA para a data e HH:MM AM/PM para a hora.');
      return;
    }

    if (parsedDate < new Date()) {
      Alert.alert('Erro de Agendamento', 'O agendamento não pode ser agendado no passado.');
      return;
    }

    try {
      setBookingLoading(true);
      await bookingsService.createBooking({
        serviceId: selectedService.id,
        scheduledAt: parsedDate.toISOString(),
      });
      
      Alert.alert('Sucesso', 'Serviço contratado com sucesso!');
      const newBal = balance - selectedService.price;
      setBalance(newBal);
      updateUserBalance(newBal);
      setSelectedService(null);
    } catch (error: any) {
      console.error('Booking error:', error);
      const errorMsg = error.response?.data?.message || 'Ocorreu um erro ao contratar o serviço.';
      
      // Simulating success anyway if we receive mock ids
      if (selectedService.id.startsWith('mock-')) {
        Alert.alert('Sucesso (Simulação)', 'Serviço contratado com sucesso! (Modo Simulação)');
        const newBal = balance - selectedService.price;
        setBalance(newBal);
        updateUserBalance(newBal);
        setSelectedService(null);
      } else {
        Alert.alert('Erro', Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Derived values
  const mostRequested = services.length > 0 ? services[0].name : 'N/A';

  return (
    <View style={styles.container}>
      {/* Header */}
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
            <Text style={styles.headerTitle}>
              {isProvider ? 'Meus Serviços' : 'Serviços Disponíveis'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => Alert.alert('Notificações', 'Nenhuma notificação nova.')}
              activeOpacity={0.6}
            >
              <Ionicons name="notifications-outline" size={20} color="#1f2937" />
            </TouchableOpacity>

            {isProvider && (
              <TouchableOpacity
                style={styles.newServiceBtn}
                onPress={() => router.push('/criar-servico' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#ffffff" style={styles.btnIcon} />
                <Text style={styles.newServiceBtnText}>Novo Serviço</Text>
              </TouchableOpacity>
            )}
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
          {/* Card 1: Services Count */}
          <StatCard
            iconName="briefcase-outline"
            iconColor="#2563eb"
            iconBgColor="#eff6ff"
            cardBgColor="#eff6ff"
            label={isProvider ? 'Meus Serviços Ativos' : 'Serviços Disponíveis'}
            value={services.length.toString()}
            badgeText={`Total: ${services.length}`}
            badgeTextColor="#2563eb"
            badgeBgColor="#dbeafe"
          />

          {/* Card 2: Rating */}
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

          {/* Card 3: Balance or Most Requested */}
          {isProvider ? (
            <StatCard
              iconName="build-outline"
              iconColor="#059669"
              iconBgColor="#ecfdf5"
              cardBgColor="#ecfdf4"
              label="Mais Solicitado"
              value={mostRequested}
              badgeText={services.length > 0 ? 'Mais solicitado' : 'Sem reservas'}
              badgeTextColor="#047857"
              badgeBgColor="#d1fae5"
            />
          ) : (
            <StatCard
              iconName="construct-outline"
              iconColor="#7c3aed"
              iconBgColor="#f5f3ff"
              cardBgColor="#f5f3ff"
              label="Meu Saldo"
              value={`KZ ${balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
              badgeText="Disponível"
              badgeTextColor="#047857"
              badgeBgColor="#d1fae5"
            />
          )}
        </View>

        {/* Catalog Section */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>
              {isProvider ? 'Gerenciar Catálogo' : 'Catálogo de Serviços'}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color="#052a5e" />
            </View>
          ) : services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isProvider
                  ? 'Nenhum serviço registrado no seu catálogo.'
                  : 'Nenhum serviço disponível no momento.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {/* Header Titles */}
              <View style={styles.tableRowHeader}>
                <Text style={[styles.columnHeader, styles.flexColName]}>SERVIÇO</Text>
                <Text style={[styles.columnHeader, styles.flexColPrice]}>PREÇO</Text>
                <Text style={[styles.columnHeader, styles.flexColDuration]}>DURAÇÃO</Text>
                {!isProvider && <Text style={[styles.columnHeader, styles.flexColStatus]}>STATUS</Text>}
                <Text style={[styles.columnHeader, isProvider ? styles.flexColActionProvider : styles.flexColActionClient]}></Text>
              </View>

              {services.map((item, index) => {
                const formattedPrice = `KZ ${item.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`;

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

                    {/* Duration */}
                    <View style={styles.flexColDuration}>
                      <View style={styles.durationRow}>
                        <Ionicons name="time-outline" size={13} color="#9ca3af" />
                        <Text style={styles.serviceDuration} numberOfLines={1}>A combinar</Text>
                      </View>
                    </View>

                    {/* Status badge for client */}
                    {!isProvider && (
                      <View style={styles.flexColStatus}>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>Ativo</Text>
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    {isProvider ? (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteService(item.id, item.name)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.contratarBtn}
                        onPress={() => handleOpenBookingModal(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.contratarBtnText}>Contratar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Booking Modal (Client Only) */}
      {selectedService && (
        <Modal
          visible={!!selectedService}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedService(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableWithoutFeedback onPress={() => setSelectedService(null)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Contratar Serviço</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedService(null)}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Service details */}
              <View style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.modalLabel}>SERVIÇO</Text>
                  <Text style={styles.modalServiceName}>{selectedService.name}</Text>
                  <Text style={styles.modalServiceDesc}>{selectedService.description}</Text>
                </View>

                {/* Price and Balance grid */}
                <View style={styles.priceBalanceGrid}>
                  <View style={styles.gridCell}>
                    <Text style={styles.modalLabel}>PREÇO DO SERVIÇO</Text>
                    <Text style={styles.modalPriceValue}>
                      KZ {selectedService.price.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={[styles.gridCell, styles.alignRight]}>
                    <Text style={styles.modalLabel}>SEU SALDO</Text>
                    <Text 
                      style={[
                        styles.modalBalanceValue,
                        balance >= selectedService.price ? styles.balanceSuccess : styles.balanceDanger
                      ]}
                    >
                      KZ {balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>

                {/* Insufficient Balance Alert */}
                {balance < selectedService.price && (
                  <View style={styles.alertBanner}>
                    <Text style={styles.alertBannerText}>
                      Aviso: Saldo insuficiente para contratar este serviço.
                    </Text>
                  </View>
                )}

                {/* Appointment Fields */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DATA DO AGENDAMENTO</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={scheduledDate}
                      onChangeText={setScheduledDate}
                      placeholder="MM/DD/AAAA"
                      placeholderTextColor="#9ca3af"
                    />
                    <Ionicons name="calendar-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>HORA DO AGENDAMENTO</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={scheduledTime}
                      onChangeText={setScheduledTime}
                      placeholder="10:00 AM"
                      placeholderTextColor="#9ca3af"
                    />
                    <Ionicons name="time-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  </View>
                </View>
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSelectedService(null)}
                  disabled={bookingLoading}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    (balance < selectedService.price || bookingLoading) && styles.confirmBtnDisabled
                  ]}
                  onPress={handleConfirmBooking}
                  disabled={balance < selectedService.price || bookingLoading}
                >
                  {bookingLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirmar Contratação</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
    flex: 1.5,
    paddingRight: 8,
  },
  flexColPrice: {
    flex: 1,
    paddingRight: 4,
  },
  flexColDuration: {
    flex: 1,
    paddingRight: 4,
  },
  flexColStatus: {
    width: 60,
    paddingRight: 4,
  },
  flexColActionProvider: {
    width: 30,
  },
  flexColActionClient: {
    width: 80,
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
    fontWeight: '700',
    color: '#1e3a8a',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  contratarBtn: {
    backgroundColor: '#052a5e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  contratarBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#052a5e',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 16,
  },
  detailSection: {
    gap: 4,
  },
  modalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  modalServiceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalServiceDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceBalanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    paddingVertical: 12,
  },
  gridCell: {
    flex: 1,
    gap: 4,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  modalPriceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  modalBalanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  balanceSuccess: {
    color: '#059669',
  },
  balanceDanger: {
    color: '#ef4444',
  },
  alertBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  alertBannerText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4b5563',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  inputIcon: {
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#052a5e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#052a5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
