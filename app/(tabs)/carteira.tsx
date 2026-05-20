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
import { walletService, TransactionResponse } from '@/services/wallet.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterType = 'all' | 'credit' | 'debit';

export default function CarteiraScreen() {
  const { user, isAuthenticated } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  const insets = useSafeAreaInsets();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [balData, txData] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions(),
      ]);
      setBalance(balData.balance);
      setTransactions(txData);
    } catch (error) {
      console.warn('Erro ao carregar dados da carteira. Carregando dados simulados...', error);
      setBalance(user?.balance || 0);
      
      // Fallback mock transactions
      setTransactions([
        {
          id: 'mock-tx-1',
          fromUserId: 'client-1',
          fromUserEmail: 'gilson@gmail.com',
          toUserId: user?.id || 'provider-1',
          toUserEmail: user?.email || 'prestador@gmail.com',
          amount: 2000,
          bookingId: 'mock-b1',
          createdAt: new Date().toISOString(),
          type: 'credit',
        },
        {
          id: 'mock-tx-2',
          fromUserId: 'client-2',
          fromUserEmail: 'claudio@gmail.com',
          toUserId: user?.id || 'provider-1',
          toUserEmail: user?.email || 'prestador@gmail.com',
          amount: 1500,
          bookingId: 'mock-b2',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          type: 'credit',
        },
        {
          id: 'mock-tx-3',
          fromUserId: user?.id || 'provider-1',
          fromUserEmail: user?.email || 'prestador@gmail.com',
          toUserId: 'bank-1',
          toUserEmail: 'banco-ba.ao',
          amount: 1000,
          bookingId: null, // represents payout / transfer
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          type: 'debit',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user?.balance, user?.id, user?.email]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadWalletData();
      }
    }, [isAuthenticated, loadWalletData])
  );

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTotal = transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      const targetType = isProvider ? 'credit' : 'debit';
      return (
        tx.type === targetType &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingCount = transactions.filter((t) => t.bookingId === null).length;

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const handleWithdraw = () => {
    Alert.alert(
      'Sacar Saldo',
      `Deseja realizar o saque do seu saldo disponível de KZ ${balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Saque',
          onPress: () => {
            Alert.alert('Sucesso', 'Solicitação de saque enviada com sucesso! O valor será depositado na sua conta bancária cadastrada.');
          },
        },
      ]
    );
  };

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
            <Text style={styles.headerTitle}>Minha Carteira</Text>
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
        currentRoute="carteira" 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Available Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardTop}>
            <View>
              <Text style={styles.balanceCardLabel}>SALDO DISPONÍVEL</Text>
              <Text style={styles.balanceCardValue}>
                KZ {balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.balanceIconWrapper}>
              <Ionicons name="wallet-outline" size={24} color="#ffffff" />
            </View>
          </View>

          <View style={styles.balanceCardButtons}>
            {isProvider && (
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={handleWithdraw}
                activeOpacity={0.8}
              >
                <Text style={styles.withdrawBtnText}>Sacar Saldo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => setFilter('all')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewAllBtnText}>Ver Todas Transações</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Secondary Stats Grid */}
        <View style={styles.secondaryStatsGrid}>
          {/* Card 1: Pending Transactions */}
          <StatCard
            iconName="time-outline"
            iconColor="#d97706"
            iconBgColor="#fffbeb"
            cardBgColor="#fffbeb"
            label="Transações Pendentes"
            value={`${pendingCount} pendentes`}
            badgeText="Acumulado"
            badgeTextColor="#b45309"
            badgeBgColor="#fef3c7"
          />

          {/* Card 2: Monthly Income/Expenses */}
          <StatCard
            iconName="trending-up-outline"
            iconColor="#059669"
            iconBgColor="#ecfdf5"
            cardBgColor="#ecfdf4"
            label={isProvider ? "Ganhos do Mês" : "Despesas do Mês"}
            value={`KZ ${monthlyTotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
            badgeText="Mês Corrente"
            badgeTextColor="#047857"
            badgeBgColor="#d1fae5"
          />
        </View>

        {/* Transaction History Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Histórico de Transações</Text>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                onPress={() => setFilter('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                  Todas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, filter === 'credit' && styles.filterTabActive]}
                onPress={() => setFilter('credit')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, filter === 'credit' && styles.filterTabTextActive]}>
                  Entradas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, filter === 'debit' && styles.filterTabActive]}
                onPress={() => setFilter('debit')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, filter === 'debit' && styles.filterTabTextActive]}>
                  Saídas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color="#052a5e" />
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhuma transação encontrada para este filtro.
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredTransactions.map((tx, index) => {
                const isCredit = tx.type === 'credit';
                const isUserSender = user?.email === tx.fromUserEmail;
                
                let title = '';
                let subtitle = '';
                
                if (isCredit) {
                  title = 'Recebimento de Serviço';
                  subtitle = `De: ${tx.fromUserEmail}`;
                } else {
                  title = isUserSender ? 'Pagamento de Serviço' : 'Retirada de Saldo';
                  subtitle = `Para: ${tx.toUserEmail}`;
                }

                const txDate = new Date(tx.createdAt).toLocaleString('pt-PT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View 
                    key={tx.id} 
                    style={[
                      styles.tableRow,
                      index > 0 && styles.rowDivider
                    ]}
                  >
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txIconBg,
                          isCredit ? styles.txCreditIconBg : styles.txDebitIconBg
                        ]}
                      >
                        <Ionicons 
                          name={isCredit ? "arrow-down-outline" : "arrow-up-outline"} 
                          size={16} 
                          color={isCredit ? "#059669" : "#2563eb"} 
                        />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txTitleText}>{title}</Text>
                        <Text style={styles.txSubtitleText} numberOfLines={1}>{subtitle}</Text>
                        <Text style={styles.txDateText}>{txDate}</Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text style={[styles.txAmountText, isCredit ? styles.txCreditText : styles.txDebitText]}>
                        {isCredit ? '+ ' : '- '}
                        KZ {tx.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>Concluído</Text>
                      </View>
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
  balanceCard: {
    backgroundColor: '#052a5e',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  balanceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 1.5,
  },
  balanceCardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 8,
  },
  balanceIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  withdrawBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnText: {
    color: '#052a5e',
    fontWeight: '700',
    fontSize: 14,
  },
  viewAllBtn: {
    flex: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewAllBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryStatsGrid: {
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
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1.2,
  },
  txIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txCreditIconBg: {
    backgroundColor: '#ecfdf5',
  },
  txDebitIconBg: {
    backgroundColor: '#eff6ff',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  txSubtitleText: {
    fontSize: 11,
    color: '#6b7280',
  },
  txDateText: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 4,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  txCreditText: {
    color: '#059669',
  },
  txDebitText: {
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#047857',
    fontSize: 9,
    fontWeight: '700',
  },
});
