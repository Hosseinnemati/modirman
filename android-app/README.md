# اپ اندروید مدیرمن (WebView)

این پوشه سورس کامل اپ اندرویدی «مدیرمن» است — یک پوسته WebView سبک و امن
که اپلیکیشن وب (Next.js) را روی گوشی به‌صورت یک اپ واقعی نمایش می‌دهد.

## مشخصات APK آماده
| مورد | مقدار |
|---|---|
| نام اپ | مدیرمن |
| پکیج | `ir.homeiotnt.modirman` |
| نسخه | 1.0 (versionCode 1) |
| حداقل اندروید | 7.0 (API 24) |
| هدف | اندروید 14 (API 34) ✅ مجاز کافه‌بازار |
| حجم | ~۱۶۰ کیلوبایت |
| امضا | `keystore/modirman.keystore` (رمز: `modirman123`) |

فایل آماده نصب: [`apk/modirman-v1.0.apk`](../apk/modirman-v1.0.apk)

## امکانات اپ اندروید
- ✅ آیکون لانچر اختصاصی مدیرمن در همه چگالی‌ها
- ✅ بارگذاری تصویر رسید پرداخت از گالری/دوربین (File Chooser)
- ✅ باز کردن لینک‌های `tel:` / `mailto:` / `sms:` با اپ مرتبط
- ✅ دکمه برگشت گوشی → برگشت داخل صفحات اپ
- ✅ صفحه «اتصال برقرار نیست» با دکمه تلاش مجدد
- ✅ مجوز نوتیفیکیشن اندروید ۱۳+ (POST_NOTIFICATIONS)
- ✅ حفظ وضعیت هنگام چرخش صفحه
- ✅ فقط هاست‌های مجاز داخل اپ باز می‌شوند (بقیه در مرورگر)

## تغییر آدرس اپ
اگر اپلیکیشن وب را روی آدرس دیگری دپلوی کردید، فقط دو جا را در
`java/ir/homeiotnt/modirman/MainActivity.java` عوض کنید:

```java
public static final String BASE_URL = "https://homeiotnt.ir/";
private static final String[] ALLOWED_HOSTS = {
    "homeiotnt.ir", "www.homeiotnt.ir"
};
```

سپس دوباره بسازید.

## ساخت مجدد APK
پیش‌نیاز: JDK 17+ (یا فقط JRE + فایل `ecj.jar`) و Android build-tools 34 و platform android-34

```bash
export ANDROID_SDK=/path/to/android-sdk    # مسیر SDK
bash android-app/build.sh
```

خروجی: `android-app/modirman-v1.0.apk`

## ⚠️ نکته خیلی مهم — keystore
- فایل `keystore/modirman.keystore` را **گم نکنید**!
- کافه‌بازار برای هر بروزرسانی، امضای APK را با نسخه قبل مقایسه می‌کند؛
  اگر keystore عوض شود بروزرسانی رد می‌شود.
- این keystore در ریپو عمومی است با رمز ساده؛ **قبل از انتشار تجاری جدی**،
  یک keystore جدید با رمز قوی بسازید و آن را در جای امن (خارج از گیت‌هاب) نگه دارید.

## محدودیت‌ها
- نوتیفیکیشن **Push واقعی** (وقتی اپ بسته است) در WebView پشتیبانی نمی‌شود؛
  برای آن نیاز به اضافه‌کردن FCM (Firebase Cloud Messaging) هست.
  در حال حاضر اپ باز، اعلان‌های داخل اپ و زنگ داشبورد را دارد.
