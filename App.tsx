import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NativeBiometrics, {
  type AuthErrorCode,
  type BiometryType,
  parseAuthError,
  parseBiometryType,
} from './specs/NativeBiometrics';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export default function App() {
  const [biometryType, setBiometryType] = useState<BiometryType | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authError, setAuthError] = useState<AuthErrorCode | null>(null);

  async function handleCheckSupport() {
    const result = await NativeBiometrics.isSupportedAsync();
    setBiometryType(parseBiometryType(result.biometryType));
  }

  async function handleAuthenticate() {
    if (!biometryType || biometryType === 'None') return;

    setAuthStatus('loading');
    setAuthError(null);

    const result = await NativeBiometrics.authenticateAsync(
      'Confirme sua identidade para continuar.',
    );

    if (result.success) {
      setAuthStatus('success');
    } else {
      setAuthStatus('error');
      setAuthError(parseAuthError(result.error));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Biometrics Module</Text>
        <Text style={styles.subtitle}>TurboModule — New Architecture</Text>

        {/* Suporte */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Biometria disponível</Text>
          <Text style={styles.cardValue}>
            {biometryType === null ? '—' : biometryType}
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleCheckSupport}>
            <Text style={styles.buttonText}>Verificar suporte</Text>
          </TouchableOpacity>
        </View>

        {/* Autenticação */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Autenticação</Text>

          <View style={statusBadgeStyle(authStatus)}>
            {authStatus === 'loading' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.statusText}>
                {authStatus === 'idle' && 'Aguardando'}
                {authStatus === 'success' && '✓ Autenticado'}
                {authStatus === 'error' && `✗ ${authError ?? 'Erro'}`}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!biometryType || biometryType === 'None') &&
                styles.buttonDisabled,
            ]}
            onPress={handleAuthenticate}
            disabled={!biometryType || biometryType === 'None'}
          >
            <Text style={styles.buttonText}>Autenticar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const STATUS_COLORS: Record<AuthStatus, string> = {
  idle: '#3a3a3a',
  loading: '#2563eb',
  success: '#16a34a',
  error: '#dc2626',
};

function statusBadgeStyle(status: AuthStatus) {
  return {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: STATUS_COLORS[status],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 40,
  };
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
