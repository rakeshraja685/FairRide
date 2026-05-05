package com.fairride.app;

import android.Manifest;
import android.app.Activity;
import android.accounts.AccountManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import com.google.android.gms.common.AccountPicker;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
    private static final String LOCAL_SCHEME = "https";
    private static final String LOCAL_HOST = "fairride.local";
    private static final String START_PAGE = "loading animation.html";
    private static final int LOCATION_PERMISSION_REQUEST = 4100;
    private static final int GOOGLE_ACCOUNT_PICK_REQUEST = 4101;
    private static final String FUEL_SOURCE_URL = "https://www.mypetrolprice.com/5/Fuel-prices-in-Chennai";

    private WebView webView;
    private ProgressBar progressBar;
    private GeolocationPermissions.Callback pendingGeolocationCallback;
    private String pendingGeolocationOrigin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        buildLayout();
        configureWebView();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(buildLocalUrl(START_PAGE));
        }
    }

    private void buildLayout() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#F8F9FA"));

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleLarge);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        progressParams.gravity = Gravity.CENTER;
        int margin = (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                24,
                getResources().getDisplayMetrics()
        );
        progressParams.setMargins(margin, margin, margin, margin);
        progressBar.setLayoutParams(progressParams);
        progressBar.setIndeterminate(true);

        root.addView(webView);
        root.addView(progressBar);
        setContentView(root);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        CookieManager.getInstance().setAcceptCookie(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.addJavascriptInterface(new FairRideAuthBridge(), "FairRideAuth");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }

                pendingGeolocationOrigin = origin;
                pendingGeolocationCallback = callback;
                requestPermissions(
                        new String[] {
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                        },
                        LOCATION_PERMISSION_REQUEST
                );
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();

                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                    return false;
                }

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception error) {
                    Toast.makeText(MainActivity.this, "Unable to open that link.", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (LOCAL_HOST.equalsIgnoreCase(uri.getHost())) {
                    return loadLocalAsset(uri);
                }
                return super.shouldInterceptRequest(view, request);
            }
        });
    }

    private String buildLocalUrl(String assetName) {
        return LOCAL_SCHEME + "://" + LOCAL_HOST + "/" + Uri.encode(assetName, "/");
    }

    private WebResourceResponse loadLocalAsset(Uri uri) {
        String path = uri.getPath();
        if (path == null || "/".equals(path)) {
            path = "/" + START_PAGE;
        }

        String decodedPath = Uri.decode(path.startsWith("/") ? path.substring(1) : path);
        if (decodedPath.contains("..")) {
            return buildTextResponse("Forbidden", "text/plain", 403, "Forbidden");
        }

        try {
            InputStream inputStream = getAssets().open("www/" + decodedPath);
            String mimeType = guessMimeType(decodedPath);
            String encoding = mimeType.startsWith("text/") || mimeType.contains("javascript") ? "UTF-8" : null;
            WebResourceResponse response = new WebResourceResponse(mimeType, encoding, inputStream);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Map<String, String> headers = new HashMap<>();
                headers.put("Cache-Control", "no-cache, no-store");
                headers.put("Access-Control-Allow-Origin", "*");
                response.setResponseHeaders(headers);
                response.setStatusCodeAndReasonPhrase(200, "OK");
            }
            return response;
        } catch (IOException error) {
            return buildTextResponse("Not found: " + decodedPath, "text/plain", 404, "Not Found");
        }
    }

    private WebResourceResponse buildTextResponse(String body, String mimeType, int statusCode, String reason) {
        WebResourceResponse response = new WebResourceResponse(
                mimeType,
                "UTF-8",
                new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8))
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            response.setStatusCodeAndReasonPhrase(statusCode, reason);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache, no-store");
            response.setResponseHeaders(headers);
        }
        return response;
    }

    private String guessMimeType(String fileName) {
        String mimeType = URLConnection.guessContentTypeFromName(fileName);
        if (mimeType != null) {
            return mimeType;
        }

        if (fileName.endsWith(".js")) {
            return "application/javascript";
        }
        if (fileName.endsWith(".css")) {
            return "text/css";
        }
        if (fileName.endsWith(".svg")) {
            return "image/svg+xml";
        }
        if (fileName.endsWith(".md")) {
            return "text/markdown";
        }
        return "text/plain";
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void launchGoogleSignIn() {
        try {
            AccountPicker.AccountChooserOptions options = new AccountPicker.AccountChooserOptions.Builder()
                    .setAllowableAccountsTypes(Arrays.asList("com.google"))
                    .setAlwaysShowAccountPicker(true)
                    .build();
            Intent chooserIntent = AccountPicker.newChooseAccountIntent(options);
            startActivityForResult(chooserIntent, GOOGLE_ACCOUNT_PICK_REQUEST);
        } catch (Exception error) {
            showGoogleError("Google account picker could not be started on this device.");
        }
    }

    private void handleGoogleAccountPickResult(Intent data) {
        if (data == null) {
            showGoogleError("Google account selection did not return any data.");
            return;
        }

        String email = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
        if (email == null || email.trim().isEmpty()) {
            showGoogleError("Google account selection did not return an email address.");
            return;
        }

        String payload = "{"
                + "\"email\":\"" + escapeJs(email) + "\","
                + "\"displayName\":\"\","
                + "\"photoUrl\":\"\""
                + "}";
        postJavascript("window.onNativeGoogleLoginSuccess(" + toJsString(payload) + ");");
    }

    private void showGoogleError(String message) {
        postJavascript("window.onNativeGoogleLoginError(" + toJsString(message) + ");");
    }

    private void fetchFuelPrices() {
        new Thread(() -> {
            try {
                FuelSnapshot snapshot = loadFuelSnapshot();
                String payload = String.format(
                        Locale.US,
                        "{\"prices\":{\"Petrol\":%.2f,\"Diesel\":%.2f,\"CNG\":%.2f,\"LPG\":%.2f},\"updatedAt\":\"%s\"}",
                        snapshot.petrol,
                        snapshot.diesel,
                        snapshot.cng,
                        snapshot.lpg,
                        escapeJs(snapshot.updatedAt)
                );
                postJavascript("window.onNativeFuelPricesSuccess(" + toJsString(payload) + ");");
            } catch (Exception error) {
                showFuelError("Live fuel prices are unavailable right now.");
            }
        }).start();
    }

    private FuelSnapshot loadFuelSnapshot() throws IOException {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(FUEL_SOURCE_URL);
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setRequestMethod("GET");
            connection.setRequestProperty(
                    "User-Agent",
                    "Mozilla/5.0 (Linux; Android 14; FairRide) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36"
            );
            connection.setRequestProperty("Accept-Language", "en-IN,en;q=0.9");

            int statusCode = connection.getResponseCode();
            if (statusCode < 200 || statusCode >= 300) {
                throw new IOException("Fuel source returned " + statusCode);
            }

            String html = readToString(connection.getInputStream());
            return parseFuelSnapshot(html);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private FuelSnapshot parseFuelSnapshot(String html) throws IOException {
        String text = html
                .replaceAll("(?is)<script.*?</script>", " ")
                .replaceAll("(?is)<style.*?</style>", " ")
                .replaceAll("(?s)<[^>]+>", " ")
                .replace("&nbsp;", " ")
                .replace("&#8377;", "₹")
                .replaceAll("\\s+", " ")
                .trim();

        double petrol = readFuelPrice(text, "Petrol");
        double diesel = readFuelPrice(text, "Diesel");
        double cng = readFuelPrice(text, "CNG");
        double autoGas = readFuelPrice(text, "AutoGas");
        String updatedAt = readFuelDate(text, "Petrol");

        if (petrol <= 0 || diesel <= 0 || cng <= 0 || autoGas <= 0) {
            throw new IOException("Could not parse fuel prices.");
        }

        return new FuelSnapshot(petrol, diesel, cng, autoGas, updatedAt);
    }

    private double readFuelPrice(String text, String label) {
        Pattern pattern = Pattern.compile(
                label + "\\s*\\(Currently\\).*?₹\\s*([0-9]+(?:\\.[0-9]+)?)",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return 0;
        }
        try {
            return Double.parseDouble(matcher.group(1));
        } catch (NumberFormatException error) {
            return 0;
        }
    }

    private String readFuelDate(String text, String label) {
        Pattern pattern = Pattern.compile(
                label + "\\s*\\(Currently\\)\\s*([0-9]{1,2}\\s+[A-Za-z]{3}\\s+[0-9]{4})",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return "";
        }
        return matcher.group(1).trim();
    }

    private String readToString(InputStream inputStream) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            builder.append(line).append('\n');
        }
        return builder.toString();
    }

    private void showFuelError(String message) {
        postJavascript("window.onNativeFuelPricesError(" + toJsString(message) + ");");
    }

    private void signOutGoogle() {
        // Local session sign-out is handled in the web layer.
    }

    private void postJavascript(final String script) {
        runOnUiThread(() -> {
            if (webView == null) {
                return;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                webView.evaluateJavascript(script, null);
            } else {
                webView.loadUrl("javascript:" + script);
            }
        });
    }

    private String toJsString(String value) {
        return "'" + escapeJs(value) + "'";
    }

    private String escapeJs(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode != LOCATION_PERMISSION_REQUEST || pendingGeolocationCallback == null) {
            return;
        }

        boolean granted = false;
        for (int result : grantResults) {
            if (result == PackageManager.PERMISSION_GRANTED) {
                granted = true;
                break;
            }
        }

        pendingGeolocationCallback.invoke(pendingGeolocationOrigin, granted, false);
        pendingGeolocationCallback = null;
        pendingGeolocationOrigin = null;

        if (!granted) {
            Toast.makeText(this, "Location permission is needed for GPS features.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == GOOGLE_ACCOUNT_PICK_REQUEST) {
            if (resultCode == RESULT_CANCELED) {
                showGoogleError("Google login was cancelled.");
                return;
            }
            handleGoogleAccountPickResult(data);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }

    private final class FairRideAuthBridge {
        @JavascriptInterface
        public void googleLogin() {
            runOnUiThread(() -> launchGoogleSignIn());
        }

        @JavascriptInterface
        public void fetchFuelPrices() {
            MainActivity.this.fetchFuelPrices();
        }

        @JavascriptInterface
        public void signOut() {
            runOnUiThread(() -> signOutGoogle());
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }

    private static final class FuelSnapshot {
        final double petrol;
        final double diesel;
        final double cng;
        final double lpg;
        final String updatedAt;

        FuelSnapshot(double petrol, double diesel, double cng, double lpg, String updatedAt) {
            this.petrol = petrol;
            this.diesel = diesel;
            this.cng = cng;
            this.lpg = lpg;
            this.updatedAt = updatedAt == null ? "" : updatedAt;
        }
    }
}
