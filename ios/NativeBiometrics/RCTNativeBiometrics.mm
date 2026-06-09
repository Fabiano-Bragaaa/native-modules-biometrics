//
//  RCTNativeBiometrics.mm
//  NativeModulesBiometrics
//

#import "RCTNativeBiometrics.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <NativeBiometricsSpec/NativeBiometricsSpec.h>

@interface RCTNativeBiometrics() <NativeBiometricsSpec>
@end

@implementation RCTNativeBiometrics

RCT_EXPORT_MODULE(NativeBiometrics)

// Verifica se o dispositivo tem biometria disponível e qual tipo
RCT_EXPORT_METHOD(isSupportedAsync:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;
  BOOL supported = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                                        error:&error];

  NSString *biometryType = @"None";
  if (supported) {
    switch (context.biometryType) {
      case LABiometryTypeFaceID:
        biometryType = @"FaceID";
        break;
      case LABiometryTypeTouchID:
        biometryType = @"TouchID";
        break;
      default:
        biometryType = @"None";
        break;
    }
  }

  resolve(@{
    @"supported": @(supported),
    @"biometryType": biometryType
  });
}

// Dispara o prompt nativo de autenticação biométrica
RCT_EXPORT_METHOD(authenticateAsync:(NSString *)reason
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                            error:&error]) {
    resolve(@{ @"success": @NO, @"error": @"BiometryNotAvailable" });
    return;
  }

  [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
          localizedReason:reason
                    reply:^(BOOL success, NSError * _Nullable authError) {
    if (success) {
      resolve(@{ @"success": @YES });
    } else {
      resolve(@{ @"success": @NO, @"error": [self mapError:authError] });
    }
  }];
}

// Mapeia os códigos de erro do LAError para strings legíveis no JS
- (NSString *)mapError:(NSError *)error
{
  if (!error) return @"BiometryNotAvailable";
  switch ((LAError)error.code) {
    case LAErrorUserCancel:      return @"UserCancel";
    case LAErrorUserFallback:    return @"UserFallback";
    case LAErrorBiometryLockout: return @"BiometryLockout";
    default:                     return @"BiometryNotAvailable";
  }
}

// Ponte para o TurboModule — necessária para a New Architecture (JSI)
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBiometricsSpecJSI>(params);
}

@end
