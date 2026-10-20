package ir.homeiotnt.modirman;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * مدیرمن — اپلیکیشن مدیریت هوشمند ساختمان (نسخه آفلاین)
 * کل برنامه و داده‌ها داخل خود گوشی ذخیره می‌شود؛ بدون نیاز به اینترنت و هاست.
 *
 * ── حالت آنلاین (اختیاری) ──
 * اگر خواستید اپ به وب‌اپ روی هاست وصل شود، مقدار ONLINE_URL را آدرس سایت
 * بگذارید و در onCreate مقدار START_URL را روی ONLINE_URL تغییر دهید.
 */
public class MainActivity extends Activity {

    /** آدرس اپ آفلاین — داخل خود APK (تغییر ندهید) */
    private static final String OFFLINE_URL = "file:///android_asset/www/index.html";

    /** برای حالت آنلاین: آدرس وب‌اپ دپلوی‌شده را اینجا بگذارید */
    private static final String ONLINE_URL = "https://homeiotnt.ir/";

    /** نقطه شروع اپ: آفلاین یا آنلاین */
    private static final String START_URL = OFFLINE_URL;

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        getWindow().setStatusBarColor(Color.parseColor("#2563eb"));
        getWindow().setNavigationBarColor(Color.parseColor("#f8fafc"));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);          // برای بارگذاری assets داخلی
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setBackgroundColor(Color.parseColor("#f8fafc"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        web.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                // همه ناوبری‌ها داخل همان اپ می‌ماند (اپ آفلاین تک‌صفحه‌ای است)
                return false;
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(START_URL);
        }
    }

    /** پل ارتباط جاوااسکریپت با اندروید */
    class AndroidBridge {

        /** کپی متن در کلیپ‌بورد گوشی */
        @JavascriptInterface
        public void copy(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    cm.setPrimaryClip(ClipData.newPlainText("modirman", text));
                    Toast.makeText(MainActivity.this, "کپی شد ✓", Toast.LENGTH_SHORT).show();
                }
            });
        }

        /** اشتراک‌گذاری متن (برای فایل پشتیبان) */
        @JavascriptInterface
        public void shareText(final String title, final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                    send.putExtra(Intent.EXTRA_SUBJECT, title);
                    send.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(send, "اشتراک‌گذاری پشتیبان"));
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
