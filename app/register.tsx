import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';

type Role = 'CLIENT' | 'PROVIDER';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('CLIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (role === 'PROVIDER' && !nif.trim()) {
      setErrorMsg('Por favor, insira o seu NIF.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Por favor, insira um e-mail válido.');
      return;
    }

    // Password length validation
    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const payload = {
        fullName: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        ...(role === 'PROVIDER' && { nif: nif.trim() }),
      };

      await register(payload, role);
      
      // Navigate to main tabs upon successful registration
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      console.error('Registration error details:', err);
      const message =
        err.response?.data?.message ||
        err.message ||
        'Erro ao criar conta. Tente novamente mais tarde.';
      
      setErrorMsg(message);
      Alert.alert('Erro ao Registrar', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Heading */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Crie sua conta</Text>
            <Text style={styles.subtitle}>
              Encontre ou ofereça serviços de forma rápida e segura.
            </Text>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Account Type Selector (Tabs) */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  role === 'CLIENT' && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setRole('CLIENT');
                  setErrorMsg(null);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    role === 'CLIENT' && styles.tabButtonTextActive,
                  ]}
                >
                  Quero contratar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  role === 'PROVIDER' && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setRole('PROVIDER');
                  setErrorMsg(null);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    role === 'PROVIDER' && styles.tabButtonTextActive,
                  ]}
                >
                  Sou prestador
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nome Completo Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Gilson Chipombo"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                editable={!loading}
              />
            </View>

            {/* Telemóvel Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telemóvel</Text>
              <TextInput
                style={styles.input}
                placeholder="9XX XXX XXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                editable={!loading}
              />
            </View>

            {/* NIF Field (Only for PROVIDER) */}
            {role === 'PROVIDER' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NIF</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456789"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={nif}
                  onChangeText={(text) => {
                    setNif(text);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  editable={!loading}
                />
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="gilson@gmail.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                editable={!loading}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#9ca3af" 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Mínimo de 6 caracteres.</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Criando conta...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Criar conta</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/login')}
                disabled={loading}
                activeOpacity={0.6}
              >
                <Text style={styles.loginLinkText}>Faça login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#052a5e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 14,
    paddingRight: 48,
    fontSize: 14,
    color: '#111827',
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  submitButton: {
    height: 48,
    backgroundColor: '#052a5e',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#4b5563',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
