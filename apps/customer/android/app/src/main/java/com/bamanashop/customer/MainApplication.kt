package com.bamanashop.customer

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load

class MainApplication : Application(), ReactApplication {
    private val host: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages() = PackageList(this).packages
        override fun getJSMainModuleName() = "index"

        // The JS bundle is embedded in every variant. Do not start or connect to Metro.
        override fun getUseDeveloperSupport() = false

        override val isNewArchEnabled = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled = BuildConfig.IS_HERMES_ENABLED
    }

    override fun getReactNativeHost(): ReactNativeHost = host

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) load()
    }
}
