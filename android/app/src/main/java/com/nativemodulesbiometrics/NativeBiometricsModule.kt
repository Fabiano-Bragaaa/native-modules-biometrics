package com.nativemodulesbiometrics

import android.os.Handler
import android.os.Looper
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeBiometricsModule.NAME)
class NativeBiometricsModule(reactContext: ReactApplicationContext) :
    NativeBiometricsSpec(reactContext) {

    override fun getName() = NAME

    override fun isSupportedAsync(promise: Promise) {
        val biometricManager = BiometricManager.from(reactApplicationContext)
        val result = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
        )

        val map = WritableNativeMap()
        if (result == BiometricManager.BIOMETRIC_SUCCESS) {
            map.putBoolean("supported", true)
            map.putString("biometryType", "Fingerprint")
        } else {
            map.putBoolean("supported", false)
            map.putString("biometryType", "None")
        }
        promise.resolve(map)
    }

    override fun authenticateAsync(reason: String, promise: Promise) {
        val biometricManager = BiometricManager.from(reactApplicationContext)
        val canAuth = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
        )

        if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
            val map = WritableNativeMap()
            map.putBoolean("success", false)
            map.putString("error", "BiometryNotAvailable")
            promise.resolve(map)
            return
        }

        val activity = currentActivity as? FragmentActivity
        if (activity == null) {
            val map = WritableNativeMap()
            map.putBoolean("success", false)
            map.putString("error", "BiometryNotAvailable")
            promise.resolve(map)
            return
        }

        Handler(Looper.getMainLooper()).post {
            val executor = ContextCompat.getMainExecutor(reactApplicationContext)

            val callback = object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    val map = WritableNativeMap()
                    map.putBoolean("success", true)
                    promise.resolve(map)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    val map = WritableNativeMap()
                    map.putBoolean("success", false)
                    map.putString("error", mapError(errorCode))
                    promise.resolve(map)
                }

                override fun onAuthenticationFailed() {
                    // biometria não reconhecida — o usuário pode tentar de novo, não resolve a Promise
                }
            }

            val biometricPrompt = BiometricPrompt(activity, executor, callback)

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(reason)
                .setNegativeButtonText("Cancelar")
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG or
                        BiometricManager.Authenticators.BIOMETRIC_WEAK
                )
                .build()

            biometricPrompt.authenticate(promptInfo)
        }
    }

    private fun mapError(errorCode: Int): String = when (errorCode) {
        BiometricPrompt.ERROR_USER_CANCELED,
        BiometricPrompt.ERROR_NEGATIVE_BUTTON -> "UserCancel"
        BiometricPrompt.ERROR_LOCKOUT,
        BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "BiometryLockout"
        else -> "BiometryNotAvailable"
    }

    companion object {
        const val NAME = "NativeBiometrics"
    }
}
