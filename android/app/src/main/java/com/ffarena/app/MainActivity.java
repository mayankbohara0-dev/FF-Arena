package com.ffarena.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Ensure fresh assets load and prevent any cached HTML/JS from causing blank screens
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView webView = this.bridge.getWebView();
                webView.clearCache(true);
                WebSettings settings = webView.getSettings();
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
            }
        } catch (Exception ignored) {}
    }
}
