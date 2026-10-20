#!/usr/bin/env bash
# ============================================================
# اسکریپت ساخت APK مدیرمن
# پیش‌نیازها: JDK 17+ و Android build-tools 34 + platform android-34
# مسیر SDK را در صورت لزوم تغییر دهید:
# ============================================================
set -e
cd "$(dirname "$0")"

# تشخیص خودکار مسیر SDK: متغیر ANDROID_SDK، سپس ANDROID_HOME (گیت‌هاب اکشنز)، سپس مسیر محلی
SDK="${ANDROID_SDK:-${ANDROID_HOME:-$HOME/android-sdk}}"
BT="$SDK/build-tools/34.0.0"
PLATFORM="$SDK/platforms/android-34/android.jar"
OUT="build"
VERSION="1.1"

KS="keystore/modirman.keystore"
KS_PASS="modirman123"

echo "استفاده از SDK: $SDK"
[ -d "$BT" ] || { echo "خطا: build-tools 34.0.0 در $SDK پیدا نشد"; exit 1; }
[ -f "$PLATFORM" ] || { echo "خطا: platforms;android-34 در $SDK پیدا نشد"; exit 1; }

mkdir -p "$OUT/classes" "$OUT/dex"

echo "1/6 کامپایل منابع (aapt package)..."
"$BT/aapt" package -f -m \
    -M AndroidManifest.xml \
    -S res \
    -I "$PLATFORM" \
    -F "$OUT/resources.ap_"

echo "2/6 کامپایل جاوا..."
SOURCES=$(find java -name "*.java")
if command -v javac >/dev/null 2>&1; then
    javac -source 8 -target 8 -encoding UTF-8 -Xlint:-options \
        -classpath "$PLATFORM" -d "$OUT/classes" $SOURCES
elif [ -f "$SDK/ecj.jar" ]; then
    # کامپایلر Eclipse — با JRE ساده هم کار می‌کند
    java -jar "$SDK/ecj.jar" -source 8 -target 8 -encoding UTF-8 \
        -classpath "$PLATFORM" -d "$OUT/classes" $SOURCES
else
    echo "خطا: javac یا ecj.jar پیدا نشد (ecj.jar را کنار SDK بگذارید)"
    exit 1
fi

echo "3/6 تبدیل به DEX (d8)..."
(cd "$OUT/classes" && "$BT"/d8 --release --lib "$PLATFORM" --min-api 24 \
    --output "../dex" $(find . -name "*.class"))

echo "4/6 بسته‌بندی APK..."
cp "$OUT/resources.ap_" "$OUT/unsigned.apk"
(cd "$OUT/dex" && "$BT"/aapt add ../unsigned.apk classes.dex >/dev/null)

echo "5/6 هم‌ترازی (zipalign)..."
"$BT/zipalign" -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

echo "6/6 امضا (apksigner)..."
if [ ! -f "$KS" ]; then
    echo "   ساخت keystore جدید..."
    mkdir -p keystore
    keytool -genkeypair -keystore "$KS" -alias modirman \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass "$KS_PASS" -keypass "$KS_PASS" \
        -dname "CN=ModirMan, OU=Building, O=Hosseinnemati, L=Tehran, C=IR"
fi
"$BT/apksigner" sign --ks "$KS" \
    --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
    --out "modirman-v$VERSION.apk" "$OUT/aligned.apk"

"$BT/apksigner" verify --print-certs "modirman-v$VERSION.apk" | head -3
echo ""
echo "✅ APK آماده شد: android-app/modirman-v$VERSION.apk"
echo "⚠️  فایل keystore/modirman.keystore را نگه دارید — برای بروزرسانی‌های بعدی بازار به همان امضا نیاز است"
