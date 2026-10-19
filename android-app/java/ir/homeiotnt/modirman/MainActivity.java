package ir.homeiotnt.modirman;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebView.WebViewTransport;

/**
 * مدیرمن — اپلیکیشن مدیریت هوشمند ساختمان
 * پوسته WebView برای اپلیکیشن وب Next.js
 *
 * تغییر آدرس اپ: فقط مقدار BASE_URL را عوض کنید و دوباره بسازید (build.sh)
 */
public class MainActivity extends Activity {

    /** آدرس اپلیکیشن وب — بعد از دپلوی، اینجا را ویرایش کنید */
    public static final String BASE_URL = "https://homeiotnt.ir/";

    /** هاست‌های مجاز برای باز شدن داخل اپ (بقیه لینک‌ها در مرورگر باز می‌شوند) */
    private static final String[] ALLOWED_HOSTS = {
            "homeiotnt.ir",
            "www.homeiotnt.ir"
    };

    private static final int FILE_CHOOSER_CODE = 1001;
    private static final int NOTIF_PERMISSION_CODE = 2001;

    private WebView web;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean loadError = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        // رنگ نوار وضعیت هم‌رنگ تم آبی اپ
        getWindow().setStatusBarColor(Color.parseColor("#2563eb"));
        getWindow().setNavigationBarColor(Color.parseColor("#f8fafc"));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setBackgroundColor(Color.parseColor("#f8fafc"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                // لینک‌های تلفن/ایمیل/پیامک با اپ مرتبط باز شوند
                if (scheme.equals("tel") || scheme.equals("mailto") || scheme.equals("sms")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) { }
                    return true;
                }
                if (!scheme.equals("http") && !scheme.equals("https")) return true;
                // هاست‌های خارجی در مرورگر باز می‌شوند
                return !isAllowedHost(uri.getHost());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    loadError = true;
                    showOfflinePage();
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            // پشتیبانی از بارگذاری تصویر رسید پرداخت
            @Override
            public boolean onShowFileChooser(WebView wv, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.setType("image/*");
                    startActivityForResult(intent, FILE_CHOOSER_CODE);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        // مجوز نوتیفیکیشن در اندروید ۱۳ به بعد به‌صورت runtime است
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},
                    NOTIF_PERMISSION_CODE);
        }

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(BASE_URL);
        }
    }

    private boolean isAllowedHost(String host) {
        if (host == null) return false;
        for (String h : ALLOWED_HOSTS) {
            if (host.equals(h)) return true;
        }
        return false;
    }

    /** صفحه خطای اتصال با دکمه تلاش مجدد */
    private void showOfflinePage() {
        String html = "<html dir='rtl'><body style='font-family:sans-serif;display:flex;"
                + "flex-direction:column;align-items:center;justify-content:center;height:90vh;"
                + "background:#f8fafc;color:#334155;text-align:center'>"
                + "<div style='font-size:64px'>&#128268;</div>"
                + "<h2 style='color:#2563eb'>اتصال برقرار نیست</h2>"
                + "<p style='color:#64748b'>لطفاً اتصال اینترنت خود را بررسی کنید</p>"
                + "<button onclick='location.href=\"" + BASE_URL + "\"' "
                + "style='margin-top:16px;background:#2563eb;color:#fff;border:none;"
                + "padding:12px 32px;border-radius:12px;font-size:16px'>تلاش مجدد</button>"
                + "</body></html>";
        web.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_CODE) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        // صفحه خطا یا صفحه اصلی → خروج، بقیه → برگشت در وب‌ویو
        if (web != null && web.canGoBack() && !loadError) {
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
