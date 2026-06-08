import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Tipos exportados para consumo em JS/TS — não são processados pelo Codegen
export type BiometryType = 'FaceID' | 'TouchID' | 'Fingerprint' | 'None';

export type AuthErrorCode =
  | 'UserCancel'
  | 'UserFallback'
  | 'BiometryNotAvailable'
  | 'BiometryLockout';

// O Codegen exige tipos primitivos nos objetos de retorno (sem union de strings)
// Por isso biometryType e error são `string` aqui — o narrowing fica no wrapper JS
export interface Spec extends TurboModule {
  /**
   * Verifica se o dispositivo suporta biometria e qual tipo está disponível.
   * biometryType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'None'
   */
  isSupportedAsync(): Promise<{
    supported: boolean;
    biometryType: string;
  }>;

  /**
   * Dispara o prompt nativo de autenticação biométrica.
   * reason: mensagem exibida no prompt (iOS) ou título do diálogo (Android)
   * error: 'UserCancel' | 'UserFallback' | 'BiometryNotAvailable' | 'BiometryLockout' | null
   */
  authenticateAsync(reason: string): Promise<{
    success: boolean;
    error?: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeBiometrics');
