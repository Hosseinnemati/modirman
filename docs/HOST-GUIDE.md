# 📘 راهنمای میزبان «مدیرمن» — اتصال اپ به هاست homeiotnt.ir

سلام! این راهنما مخصوص شماست: صاحب یک **هاست اشتراکی ایرانی** (homeiotnt.ir) با پنل cPanel یا DirectAdmin که می‌خواهید داده‌های اپ مدیریت ساختمان «مدیرمن» — یعنی **قبض‌ها و پرداختی‌های واحدها** — روی همان هاست ذخیره شوند.

قرار نیست چیزی «نصب» کنید؛ فقط با **فایل منیجر پنل** چند فایل می‌سازید و کدهای آماده این راهنما را داخلشان کپی می‌کنید. در پایان یک API واقعی روی هاستتان خواهید داشت که اپ Next.js شما می‌تواند با آن حرف بزند.

**پیش‌نیازها:**
- آدرس ورود به پنل هاست (معمولاً `https://homeiotnt.ir:2083` برای cPanel، یا ورود از سایت میزبان/سامانه کاربری)
- نام کاربری و رمز پنل
- حدود ۱۵ تا ۲۰ دقیقه وقت آسوده 😊

---

## فهرست مطالب

1. [نمای کلی: چه چیزی می‌سازیم؟](#۱-نمای-کلی-چه-چیزی-می‌سازیم)
2. [گام اول: ساخت دیتابیس MySQL با «MySQL Database Wizard»](#۲-گام-اول-ساخت-دیتابیس-mysql-با-mysql-database-wizard)
3. [گام دوم: کار با File Manager و ساخت پوشه API](#۳-گام-دوم-کار-با-file-manager-و-ساخت-پوشه-api)
4. [گام سوم: کد کامل API (فایل index.php)](#۴-گام-سوم-کد-کامل-api-فایل-indexphp)
5. [گام چهارم: صدا زدن API از داخل اپ Next.js](#۵-گام-چهارم-صدا-زدن-api-از-داخل-اپ-nextjs)
6. [گزینه دوم: «Setup Node.js App» در cPanel](#۶-گزینه-دوم-setup-nodejs-app-در-cpanel)
7. [نکات امنیتی](#۷-نکات-امنیتی)
8. [رفع اشکال (Troubleshooting)](#۸-رفع-اشکال-troubleshooting)
9. [چک‌لیست نهایی](#۹-چک‌لیست-نهایی)

---

## ۱) نمای کلی: چه چیزی می‌سازیم؟

### راه اصلی (توصیه‌شده برای هاست اشتراکی): PHP به‌عنوان مخزن داده

```text
اپ «مدیرمن» (Next.js)                      هاست homeiotnt.ir
┌─────────────────────────┐   HTTPS    ┌──────────────────────────────┐
│  روی سرور خودتان یا     │ ────────►  │  public_html/modirman-api/   │
│  سیستم محلی/VPS اجرا    │  fetch     │      index.php  (API + PHP)  │
│  می‌شود                 │ ◄────────  │      .htaccess               │
└─────────────────────────┘   JSON     └──────────────┬───────────────┘
                                                      │
                                              ┌───────▼───────┐
                                              │  MySQL (cPanel)│
                                              │  bills / receipts │
                                              └───────────────┘
```

یعنی:
- **اپ و رابط کاربری** همان‌طور که الان هست سرِ جایش می‌ماند (سرور فعلی Next.js).
- **داده‌ها (قبض‌ها و رسیدها)** روی هاست اشتراکی شما، در یک دیتابیس MySQL و از طریق یک فایل PHP کوچک ذخیره/دریافت می‌شوند.

این ترکیب برای هاست اشتراکی PHP/MySQL ایرانی **راحت‌ترین و پایدارترین** حالت است.

> ⚠️ نکته صادقانه: هاست‌های اشتراکی PHP برای اجرای **کل اپ Next.js** مناسب نیستند (نیاز به Node دائم‌کار، RAM و Build دارند). راه درست همان است که این راهنما می‌گوید: یا PHP API فقط به‌عنوان مخزن داده، یا اگر cPanel شما «Setup Node.js App» دارد، گزینه بخش ۶.

### دستور کار در یک نگاه

| # | کار | کجای پنل |
|---|-----|----------|
| ۱ | ساخت دیتابیس MySQL | `Databases → MySQL® Database Wizard` |
| ۲ | ساخت پوشه و فایل‌های API | `Files → File Manager → public_html/modirman-api` |
| ۳ | کپی کد API | محتوای بخش ۴ همین راهنما |
| ۴ | اتصال اپ | کد fetch در بخش ۵ |

---

## ۲) گام اول: ساخت دیتابیس MySQL با «MySQL Database Wizard»

### ۲-۱) ورود به cPanel

1. در مرورگر آدرس `https://homeiotnt.ir:2083` را باز کنید (یا اگر وارد پنل میزبان می‌شوید، دکمه «ورود به cPanel» را بزنید).
2. اگر هشدار امنیتی مرورگر دیدید معمولاً به‌خاطر SSL پنل است؛ «Advanced → Proceed» را بزنید (یا با `http://homeiotnt.ir:2082` وارد شوید).
3. نام کاربری و رمز هاست را وارد و Login کنید.

### ۲-۲) اجرای جادوگر دیتابیس

1. در صفحه اول cPanel، در بخش **Databases** روی **MySQL® Database Wizard** کلیک کنید.
   *(Wizard یعنی «جادوگر»؛ ۴ قدم ساده دارد و بهترین انتخاب برای بار اول است.)*

2. **قدم ۱ — ساخت دیتابیس:**
   - در کادر بنویسید: `modir`
   - دکمه **Next Step** را بزنید.
   - ⚠️ دقت کنید: cPanel خودش **پیشوند نام کاربری هاست** را اول نام می‌گذارد. پس نام واقعی دیتابیس می‌شود مثلاً:
     **`homeiotnt_modir`**
     *(پیشوند ممکن است کمی متفاوت باشد — نام کامل و نهایی را در همان صفحه می‌بینید و باید عیناً همین را در کد PHP بنویسید.)*

3. **قدم ۲ — ساخت کاربر دیتابیس:**
   - **Username:** `modir` (کامل می‌شود `homeiotnt_modir`)
   - **Password:** دکمه **Generate Password** (تولید رمز) را بزنید تا یک رمز قوی بسازد.
   - ✏️ **همین حالا این سه چیز را در جایی امن (یادداشت/مدیریت‌پسورد) ذخیره کنید:**
     نام کامل دیتابیس، نام کامل کاربر، رمز تولیدشده.
   - دکمه **Create User** را بزنید.

4. **قدم ۳ — دادن دسترسی:**
   - گزینه **ALL PRIVILEGES** (همه دسترسی‌ها) را تیک بزنید تا همه چیز انتخاب شود.
   - دکمه **Next Step** را بزنید.

5. **قدم ۴ — پایان:** پیام موفقیت می‌بینید. تمام شد! 🎉

### ۲-۳) اطلاعات اتصال شما (این‌ها را در کد PHP وارد می‌کنیم)

| مورد | مقدار |
|------|-------|
| آدرس سرور دیتابیس (Host) | `localhost` |
| نام دیتابیس | `homeiotnt_modir` |
| نام کاربر دیتابیس | `homeiotnt_modir` |
| رمز دیتابیس | همان رمزی که در قدم ۲ ساختید |
| پیشوند نام‌ها | نام کاربری هاست + `_` (اینجا: `homeiotnt_`) |

> 💡 **نکته:** روی هاست‌های cPanel، دیتابیس و کاربر همیشه روی `localhost` هستند و نام‌ها حتماً پیشوند دارند. اگر روزی خطای «Access denied» دیدید، ۹۰٪ مواقع یعنی یا رمز اشتباه است یا کاربر به دیتابیس **وصل نشده** (بخش ۸ راهنما).

### ۲-۴) تست اتصال (اختیاری ولی دلگرم‌کننده)

در فایل منیجر (بخش بعدی آشنا می‌شوید) یک فایل موقت `db-test.php` بسازید و این را داخلش بریزید:

```php
<?php
// فایل تست اتصال دیتابیس — بعد از دیدن نتیجه، حتماً حذفش کنید!
$conn = @new mysqli('localhost', 'homeiotnt_modir', 'رمز-دیتابیس-شما', 'homeiotnt_modir');
if ($conn->connect_error) {
    echo '❌ اتصال ناموفق: ' . htmlspecialchars($conn->connect_error);
} else {
    echo '✅ اتصال به دیتابیس برقرار شد!';
}
```

بعد آدرس `https://homeiotnt.ir/db-test.php` را در مرورگر باز کنید. اگر پیام سبز ✅ دیدید، دیتابیس آماده است. **فایل را از فایل منیجر پاک کنید** (راست‌کلیک روی فایل → Delete).

---

## ۳) گام دوم: کار با File Manager و ساخت پوشه API

### ۳-۱) باز کردن فایل منیجر

1. در cPanel، بخش **Files** → روی **File Manager** کلیک کنید.
   *(در DirectAdmin هم اسمش File Manager است و کارها تقریباً یکسان‌اند.)*
2. صفحه‌ای شبیه ویندوز اکسپلورر باز می‌شود. پوشه **`public_html`** را باز کنید (دابل‌کلیک).
   این پوشه، ریشه وب‌سایت شماست؛ هر فایلی اینجا باشد از `https://homeiotnt.ir/...` قابل دسترسی است.

### ۳-۲) نمایش فایل‌های مخفی (برای `.htaccess` لازم است)

1. بالای فایل منیجر، دکمه چرخ‌دنده **Settings** (گوشه بالا-راست) را بزنید.
2. تیک **Show Hidden Files (dotfiles)** را بزنید و Save کنید.
   *(فایل‌هایی که اسمشان با نقطه شروع می‌شود مثل `.htaccess` پیش‌فرض پنهان‌اند.)*

### ۳-۳) ساخت پوشه `modirman-api`

1. داخل `public_html` باشید (لیست پوشه‌ها را می‌بینید).
2. از نوار ابزار بالا دکمه **+ Folder** را بزنید.
3. نام پوشه: `modirman-api` → دکمه **Create New Folder**.
4. وارد پوشه جدید شوید (دابل‌کلیک).

### ۳-۴) ساخت فایل‌ها

داخل پوشه `modirman-api` دو فایل می‌سازیم:

**فایل اول — `index.php` (قلب API):**
1. دکمه **+ File** را بزنید → نام: `index.php` → **Create New File**.
2. روی فایل **راست‌کلیک → Edit** (یا دکمه Edit نوار ابزار) → در پنجره تأیید **Edit** را بزنید.
3. **تمام محتوای کد بخش ۴ این راهنما را کپی** و داخل ادیتور **Paste** کنید.
4. دکمه **Save Changes** بالا-راست را بزنید و **Close** کنید.

**فایل دوم — `.htaccess` (مسیرهای تمیز):**
1. دوباره **+ File** → نام: `.htaccess` *(دقت کنید: با نقطه شروع می‌شود)* → Create.
2. اگر فایل را نمی‌بینید، مرحله ۳-۲ (نمایش فایل‌های مخفی) را انجام نداده‌اید.
3. راست‌کلیک → Edit → محتوای کد بخش ۴-ب را Paste کنید → Save Changes.

> 📌 اگر ادیتور اجازه ساخت فایل با نقطه را نداد، اول فایل `htaccess.txt` بسازید، محتوا را بریزید، بعد راست‌کلیک → **Rename** به `.htaccess`.

### ۳-۵) ساختار نهایی پوشه

```text
public_html/
└── modirman-api/
    ├── index.php    ← کد کامل API (بخش ۴-الف)
    └── .htaccess    ← هدایت آدرس‌ها (بخش ۴-ب)
```

### ۳-۶) اولین تست!

در مرورگر این آدرس را باز کنید:

```text
https://homeiotnt.ir/modirman-api/
```

باید یک متن JSON با پیام «نصب موفق است» ببینید. اگر دیدید، تبریک — API شما **زنده** است! ✅

---

## ۴) گام سوم: کد کامل API (فایل index.php)

این کد **تک‌فایلی** است:
- به MySQL وصل می‌شود (PDO)
- بار اول **جدول‌های `bills` و `receipts` را خودش می‌سازد** (نیازی به phpMyAdmin برای ساخت جدول نیست)
- همه endpointهای لازم را دارد (لیست/ثبت/پرداخت قبض، ارسال/تأیید/رد رسید)
- هدر امنیتی **X-Api-Key** را چک می‌کند
- هدرهای **CORS** را می‌فرستد تا اپ Next.js (که روی دامنه دیگری است) بتواند وصل شود
- پیام‌های خطا **فارسی** و کامنت‌های داخل کد هم فارسی هستند

### ۴-الف) محتوای `index.php` — کل کد را کپی کنید

فقط ۵ خط اول بخش تنظیمات را با مقادیر هاست خودتان عوض کنید.

```php
<?php
/**
 * =====================================================================
 *  «مدیرمن» — API ذخیره‌سازی قبض‌ها و رسیدهای پرداخت روی هاست اشتراکی
 * ---------------------------------------------------------------------
 *  محل آپلود    : public_html/modirman-api/index.php
 *  آدرس فراخوانی: https://homeiotnt.ir/modirman-api/...
 *  پیش‌نیاز     : PHP 7.4+ و یک دیتابیس MySQL (ساخته‌شده در cPanel)
 *  امنیت        : همه درخواست‌های داده باید هدر X-Api-Key داشته باشند
 * =====================================================================
 */

/* =============================================================
 * ۱) تنظیمات — فقط همین ۵ خط را با مقادیر هاست خودتان عوض کنید
 * ============================================================= */
define('DB_HOST', 'localhost');              // معمولاً localhost می‌ماند
define('DB_NAME', 'homeiotnt_modir');        // نام کامل دیتابیس (با پیشوند)
define('DB_USER', 'homeiotnt_modir');        // نام کامل کاربر دیتابیس
define('DB_PASS', 'رمز-قوی-دیتابیس-شما');    // رمزی که در Wizard ساختید
define('API_KEY', 'کلید-مخفی-طولانی-تا-با-اپ-یکی-باشد');

ini_set('display_errors', '0');          // جلوگیری از نمایش جزئیات خطا به بازدیدکننده
date_default_timezone_set('Asia/Tehran'); // ساعت ایران برای تاریخ‌ها

/* =============================================================
 * ۲) هدرهای CORS (اجازه ارتباط اپ با این API) + پاسخ به پیش‌پرواز
 *    برای امنیت بیشتر، به‌جای * دامنه اپ خود را بنویسید
 * ============================================================= */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');
header('Content-Type: application/json; charset=utf-8');

// مرورگرها قبل از هر درخواست واقعی، یک درخواست OPTIONS می‌فرستند؛
// ما با 204 جواب می‌دهیم تا مطمئن شود اجازه هست
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* =============================================================
 * ۳) توابع کمکی
 * ============================================================= */

/** خروجی JSON و پایان پاسخ */
function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** خواندن بدنه JSON درخواست (POST / PATCH) */
function read_json_body(): array
{
    $data = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($data)) {
        json_out(['error' => 'بدنه درخواست یک JSON معتبر نیست'], 400);
    }
    return $data;
}

/** چک کردن فیلدهای اجباری بدنه */
function require_fields(array $data, array $fields): void
{
    foreach ($fields as $f) {
        if (!isset($data[$f]) || $data[$f] === '' || $data[$f] === null) {
            json_out(['error' => "فیلد «{$f}» الزامی است"], 400);
        }
    }
}

/** برش امن متن (اگر mbstring روی هاست فعال نباشد هم کار می‌کند) */
function cut(?string $text, int $max): ?string
{
    if ($text === null) return null;
    $text = trim($text);
    if ($text === '') return null;
    return function_exists('mb_substr') ? mb_substr($text, 0, $max, 'UTF-8') : substr($text, 0, $max);
}

/* =============================================================
 * ۴) تشخیص متد و مسیر درخواست
 *    نمونه‌ها:
 *      https://homeiotnt.ir/modirman-api/bills
 *      https://homeiotnt.ir/modirman-api/receipts/5
 * ============================================================= */
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// پشتیبان: اگر هاستی متد PATCH را مسدود کرده بود،
// می‌توانید به‌جای PATCH، درخواست POST با ?_method=PATCH بفرستید
if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper((string)$_GET['_method']);
}

if (isset($_GET['path'])) {
    // حالت بدون mod_rewrite:  index.php?path=bills/5
    $path = trim((string)$_GET['path'], '/');
} elseif (!empty($_SERVER['PATH_INFO'])) {
    // حالت CGI/FastCGI
    $path = trim((string)$_SERVER['PATH_INFO'], '/');
} else {
    // حالت معمول با .htaccess
    $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
    if ($base !== '' && strpos($uri, $base) === 0) {
        $uri = substr($uri, strlen($base));
    }
    $path = trim($uri, '/');
}

$parts    = $path === '' ? [] : explode('/', $path);
$resource = $parts[0] ?? '';                       // bills یا receipts
$recordId = (isset($parts[1]) && $parts[1] !== '') ? (int)$parts[1] : null;

/* =============================================================
 * ۵) صفحه سلامت — GET https://homeiotnt.ir/modirman-api/
 *    برای تست سریع نصب؛ بدون نیاز به کلید
 * ============================================================= */
if ($resource === '') {
    json_out([
        'ok'        => true,
        'name'      => 'مدیرمن API',
        'version'   => '1.0',
        'message'   => 'نصب موفق است! برای دریافت داده‌ها هدر X-Api-Key را بفرستید.',
        'endpoints' => [
            'GET    /bills          لیست قبض‌ها (?unit= یا ?status=)',
            'POST   /bills          ثبت قبض جدید',
            'PATCH  /bills/{id}     پرداخت یا برگرداندن قبض',
            'GET    /receipts       لیست رسیدها (بدون تصویر)',
            'GET    /receipts/{id}  یک رسید همراه تصویر',
            'POST   /receipts       ثبت رسید (تصویر base64)',
            'PATCH  /receipts/{id}  تأیید یا رد رسید',
        ],
    ]);
}

/* =============================================================
 * ۶) بررسی کلید API (هدر X-Api-Key)
 * ============================================================= */
$givenKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if (!hash_equals(API_KEY, $givenKey)) {
    json_out(['error' => 'کلید API نامعتبر است؛ هدر X-Api-Key را بررسی کنید'], 401);
}

/* =============================================================
 * ۷) اتصال به دیتابیس (PDO) + ساخت خودکار جدول‌ها در بار اول
 * ============================================================= */
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    // جزئیات فنی خطا در فایل error_log هاست ثبت می‌شود، نه در پاسخ
    error_log('[modirman-api] اتصال دیتابیس ناموفق: ' . $e->getMessage());
    json_out(['error' => 'اتصال به دیتابیس برقرار نشد؛ نام دیتابیس / کاربر / رمز را بررسی کنید'], 500);
}

try {
    // جدول قبض‌ها
    $pdo->exec("CREATE TABLE IF NOT EXISTS bills (
        id          INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(190)     NOT NULL           COMMENT 'عنوان قبض',
        amount      BIGINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT 'مبلغ به تومان',
        unit_number VARCHAR(20)      NULL               COMMENT 'شماره واحد',
        due_date    VARCHAR(30)      NULL               COMMENT 'سررسید (شمسی یا میلادی، همان‌طور که اپ می‌فرستد)',
        status      ENUM('pending','paid') NOT NULL DEFAULT 'pending' COMMENT 'وضعیت پرداخت',
        paid_at     DATETIME         NULL               COMMENT 'زمان پرداخت',
        created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // جدول رسیدهای پرداخت
    $pdo->exec("CREATE TABLE IF NOT EXISTS receipts (
        id          INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
        bill_id     INT UNSIGNED     NULL               COMMENT 'پیوند به قبض',
        amount      BIGINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT 'مبلغ واریز',
        image       MEDIUMTEXT       NULL               COMMENT 'تصویر رسید به‌صورت base64 (تا ~۱۶MB)',
        note        VARCHAR(500)     NULL               COMMENT 'یادداشت ساکن',
        status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT 'وضعیت بررسی مدیر',
        uploaded_by VARCHAR(100)     NULL               COMMENT 'ارسال‌کننده (نام یا واحد)',
        created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_receipts_bill FOREIGN KEY (bill_id)
            REFERENCES bills(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (PDOException $e) {
    error_log('[modirman-api] ساخت جدول ناموفق: ' . $e->getMessage());
    json_out(['error' => 'ساخت جدول‌های دیتابیس ناموفق بود؛ دسترسی کاربر دیتابیس را بررسی کنید'], 500);
}

/* =============================================================
 * ۸) مسیرها (Endpoints)
 * ============================================================= */

/* ---------------- ۸-۱) قبض‌ها ---------------- */
if ($resource === 'bills') {

    // GET /bills — لیست قبض‌ها (اختیاری: ?unit=8 و ?status=pending|paid)
    if ($method === 'GET' && $recordId === null) {
        $sql    = 'SELECT * FROM bills';
        $where  = [];
        $params = [];
        if (isset($_GET['unit']) && $_GET['unit'] !== '') {
            $where[]         = 'unit_number = :unit';
            $params[':unit'] = (string)$_GET['unit'];
        }
        if (isset($_GET['status']) && $_GET['status'] !== '') {
            $where[]           = 'status = :status';
            $params[':status'] = ($_GET['status'] === 'paid') ? 'paid' : 'pending';
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        json_out($st->fetchAll());
    }

    // POST /bills — ثبت قبض جدید
    // بدنه نمونه: {"title":"شارژ آبان - واحد ۸","amount":1250000,"unit_number":"8","due_date":"1404-09-10"}
    if ($method === 'POST') {
        $b = read_json_body();
        require_fields($b, ['title', 'amount']);
        $amount = (int)$b['amount'];
        if ($amount <= 0) {
            json_out(['error' => 'مبلغ باید عددی بزرگ‌تر از صفر باشد'], 400);
        }
        $st = $pdo->prepare('INSERT INTO bills (title, amount, unit_number, due_date)
                             VALUES (:title, :amount, :unit, :due)');
        $st->execute([
            ':title'  => cut((string)$b['title'], 190),
            ':amount' => $amount,
            ':unit'   => cut((string)($b['unit_number'] ?? ''), 20),
            ':due'    => cut((string)($b['due_date'] ?? ''), 30),
        ]);
        json_out([
            'ok'      => true,
            'id'      => (int)$pdo->lastInsertId(),
            'message' => 'قبض با موفقیت ثبت شد',
        ], 201);
    }

    // PATCH /bills/{id} — پرداخت کردن یا برگرداندن قبض به معوق
    // بدنه: {"status":"paid"}  یا  {"status":"pending"}
    if ($method === 'PATCH') {
        if ($recordId === null) {
            json_out(['error' => 'شناسه قبض در انتهای مسیر مشخص نشده است'], 400);
        }
        $b = read_json_body();

        // اول مطمئن شویم قبض وجود دارد
        $chk = $pdo->prepare('SELECT id FROM bills WHERE id = :id');
        $chk->execute([':id' => $recordId]);
        if (!$chk->fetch()) {
            json_out(['error' => 'قبضی با این شناسه پیدا نشد'], 404);
        }

        $status = (($b['status'] ?? 'paid') === 'pending') ? 'pending' : 'paid';
        $st = $pdo->prepare('UPDATE bills SET status = :status, paid_at = :paid_at WHERE id = :id');
        $st->execute([
            ':status'  => $status,
            ':paid_at' => ($status === 'paid') ? date('Y-m-d H:i:s') : null,
            ':id'      => $recordId,
        ]);
        json_out([
            'ok'      => true,
            'message' => $status === 'paid' ? 'قبض پرداخت‌شده علامت خورد' : 'قبض به حالت معوق برگشت',
        ]);
    }

    json_out(['error' => 'این متد برای قبض‌ها پشتیبانی نمی‌شود'], 405);
}

/* ---------------- ۸-۲) رسیدها ---------------- */
if ($resource === 'receipts') {

    // GET /receipts/{id} — یک رسید همراه با تصویر (برای نمایش در اپ)
    if ($method === 'GET' && $recordId !== null) {
        $st = $pdo->prepare('SELECT * FROM receipts WHERE id = :id');
        $st->execute([':id' => $recordId]);
        $row = $st->fetch();
        if (!$row) {
            json_out(['error' => 'رسیدی با این شناسه پیدا نشد'], 404);
        }
        json_out($row);
    }

    // GET /receipts — لیست رسیدها (سبک، بدون تصویر تا دیتای سنگین منتقل نشود)
    // اختیاری: ?bill_id=12  یا  ?status=pending|approved|rejected
    if ($method === 'GET') {
        $sql    = 'SELECT id, bill_id, amount, note, status, uploaded_by, created_at FROM receipts';
        $where  = [];
        $params = [];
        if (isset($_GET['bill_id']) && $_GET['bill_id'] !== '') {
            $where[]            = 'bill_id = :bill_id';
            $params[':bill_id'] = (int)$_GET['bill_id'];
        }
        if (isset($_GET['status']) && $_GET['status'] !== '') {
            $where[]           = 'status = :status';
            $params[':status'] = in_array($_GET['status'], ['pending', 'approved', 'rejected'], true)
                ? $_GET['status'] : 'pending';
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        json_out($st->fetchAll());
    }

    // POST /receipts — ثبت رسید با تصویر base64
    // بدنه نمونه: {"bill_id":12,"amount":1250000,"image":"data:image/jpeg;base64,...",
    //              "note":"واریز از بانک ملت","uploaded_by":"سارا - واحد ۸"}
    if ($method === 'POST') {
        $b = read_json_body();
        require_fields($b, ['amount']);

        // محدودیت حجم تصویر (حدود ۴.۵ میلیون کاراکتر ≈ تصویر ۳.۳ مگابایتی)
        $image = (string)($b['image'] ?? '');
        if ($image !== '' && strlen($image) > 4500000) {
            json_out(['error' => 'حجم تصویر رسید زیاد است؛ آن را فشرده یا کوچک‌تر کنید'], 413);
        }

        // اگر رسید به قبضی وصل شده، وجودش را چک می‌کنیم
        $billId = (isset($b['bill_id']) && $b['bill_id'] !== '' && $b['bill_id'] !== null)
            ? (int)$b['bill_id'] : null;
        if ($billId !== null) {
            $chk = $pdo->prepare('SELECT id FROM bills WHERE id = :id');
            $chk->execute([':id' => $billId]);
            if (!$chk->fetch()) {
                json_out(['error' => 'قبض موردنظر پیدا نشد'], 404);
            }
        }

        $st = $pdo->prepare('INSERT INTO receipts (bill_id, amount, image, note, status, uploaded_by)
                             VALUES (:bill_id, :amount, :image, :note, :status, :uploaded_by)');
        $st->execute([
            ':bill_id'     => $billId,
            ':amount'      => (int)$b['amount'],
            ':image'       => ($image !== '') ? $image : null,
            ':note'        => cut((string)($b['note'] ?? ''), 500),
            ':status'      => 'pending',
            ':uploaded_by' => cut((string)($b['uploaded_by'] ?? ''), 100),
        ]);
        json_out([
            'ok'      => true,
            'id'      => (int)$pdo->lastInsertId(),
            'message' => 'رسید ثبت شد و در انتظار تأیید مدیر است',
        ], 201);
    }

    // PATCH /receipts/{id} — تأیید یا رد رسید (فقط مدیر)
    // بدنه: {"status":"approved"}  یا  {"status":"rejected"}
    if ($method === 'PATCH') {
        if ($recordId === null) {
            json_out(['error' => 'شناسه رسید در انتهای مسیر مشخص نشده است'], 400);
        }
        $b      = read_json_body();
        $status = (string)($b['status'] ?? '');
        if (!in_array($status, ['approved', 'rejected'], true)) {
            json_out(['error' => 'وضعیت باید approved یا rejected باشد'], 400);
        }

        try {
            $pdo->beginTransaction(); // تا تأیید رسید و پرداخت قبض «هم‌زمان» انجام شود

            // وجود رسید را چک می‌کنیم
            $chk = $pdo->prepare('SELECT id FROM receipts WHERE id = :id');
            $chk->execute([':id' => $recordId]);
            if (!$chk->fetch()) {
                $pdo->rollBack();
                json_out(['error' => 'رسیدی با این شناسه پیدا نشد'], 404);
            }

            $st = $pdo->prepare('UPDATE receipts SET status = :status WHERE id = :id');
            $st->execute([':status' => $status, ':id' => $recordId]);

            // اگر رسید تأیید شد، قبض مرتبط خودکار «پرداخت‌شده» می‌شود
            if ($status === 'approved') {
                $get = $pdo->prepare('SELECT bill_id FROM receipts WHERE id = :id');
                $get->execute([':id' => $recordId]);
                $billId = $get->fetchColumn();
                if ($billId) {
                    $pdo->prepare('UPDATE bills SET status = :status, paid_at = NOW() WHERE id = :id')
                        ->execute([':status' => 'paid', ':id' => (int)$billId]);
                }
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('[modirman-api] بروزرسانی رسید ناموفق: ' . $e->getMessage());
            json_out(['error' => 'بروزرسانی رسید ناموفق بود'], 500);
        }
        json_out(['ok' => true, 'message' => $status === 'approved' ? 'رسید تأیید شد' : 'رسید رد شد']);
    }

    json_out(['error' => 'این متد برای رسیدها پشتیبانی نمی‌شود'], 405);
}

/* مسیر ناشناخته */
json_out(['error' => 'مسیر پیدا نشد؛ از /bills یا /receipts استفاده کنید'], 404);
```

### ۴-ب) محتوای `.htaccess`

```apache
# ===== modirman-api/.htaccess =====
# همه آدرس‌ها به index.php هدایت می‌شوند تا مسیرهایی مثل /bills و /receipts/5 کار کنند
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /modirman-api/

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# جلوگیری از دانلود مستقیم فایل‌های حساس (لاگ، بکاپ، کانفیگ)
<FilesMatch "\.(env|log|sql|ini)$">
    Require all denied
</FilesMatch>
```

> 💡 اگر روزی API را داخل یک **ساب‌دامنه** (مثلاً `api.homeiotnt.ir`) گذاشتید، خط `RewriteBase /modirman-api/` را حذف کنید.

### ۴-ج) جدول کامل Endpointها

| متد | آدرس کامل | کارکرد | بدنه JSON (در صورت نیاز) |
|------|-----------|--------|--------------------------|
| `GET` | `https://homeiotnt.ir/modirman-api/` | تست سلامت نصب | — |
| `GET` | `.../bills` | لیست همه قبض‌ها (فیلتر: `?unit=8` یا `?status=pending/paid`) | — |
| `POST` | `.../bills` | ثبت قبض جدید | `{"title":"...","amount":1250000,"unit_number":"8","due_date":"1404-09-10"}` |
| `PATCH` | `.../bills/{id}` | پرداخت کردن (`paid`) یا معوق کردن (`pending`) قبض | `{"status":"paid"}` |
| `GET` | `.../receipts` | لیست رسیدها **بدون تصویر** (فیلتر: `?bill_id=` یا `?status=`) | — |
| `GET` | `.../receipts/{id}` | یک رسید **همراه تصویر** | — |
| `POST` | `.../receipts` | ثبت رسید با تصویر base64 | `{"bill_id":12,"amount":1250000,"image":"data:image/jpeg;base64,...","note":"...","uploaded_by":"واحد ۸"}` |
| `PATCH` | `.../receipts/{id}` | تأیید (`approved`) یا رد (`rejected`) رسید — با تأیید، قبض خودکار پرداخت‌شده می‌شود | `{"status":"approved"}` |

**همه درخواست‌ها (به‌جز صفحه سلامت) باید این هدر را داشته باشند:** `X-Api-Key: کلید-مخفی-شما`

### ۴-د) نمونه خروجی‌ها

**GET `.../bills`** (لیست قبض‌ها):

```json
[
  {
    "id": 1,
    "title": "شارژ ماه آبان - واحد ۸",
    "amount": 1250000,
    "unit_number": "8",
    "due_date": "1404-09-10",
    "status": "pending",
    "paid_at": null,
    "created_at": "2025-11-20 10:15:30"
  }
]
```

**POST `.../bills`** (ثبت قبض):

```json
{ "ok": true, "id": 13, "message": "قبض با موفقیت ثبت شد" }
```

**خطاها** همیشه با کلید `error` و پیام فارسی برمی‌گردند:

```json
{ "error": "کلید API نامعتبر است؛ هدر X-Api-Key را بررسی کنید" }
```

### ۴-ه) تست سریع با curl (اختیاری)

```bash
# لیست قبض‌ها
curl -H "X-Api-Key: کلید-شما" https://homeiotnt.ir/modirman-api/bills

# ثبت قبض جدید
curl -X POST https://homeiotnt.ir/modirman-api/bills \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: کلید-شما" \
  -d '{"title":"شارژ آبان","amount":1250000,"unit_number":"8"}'

# علامت‌گذاری قبض ۱۲ به‌عنوان پرداخت‌شده
curl -X PATCH https://homeiotnt.ir/modirman-api/bills/12 \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: کلید-شما" \
  -d '{"status":"paid"}'
```

*(در ویندوز اگر curl ندارید، همان آدرس‌ها را در مرورگر باز کنید — برای تست GET کافی است.)*

> 🔧 **پشتیبان مهم:** اگر روزی دیدید متد `PATCH` روی هاست جواب نمی‌دهد (بعضی هاست‌ها با mod_security آن را می‌بندند)، به‌جای آن `POST` با پارامتر `?_method=PATCH` بفرستید؛ کد بالا خودش آن را به PATCH ترجمه می‌کند. مثلاً:
> `POST https://homeiotnt.ir/modirman-api/bills/12?_method=PATCH`

---

## ۵) گام چهارم: صدا زدن API از داخل اپ Next.js

دو روش دارید:

| روش | کلید API کجاست؟ | مناسب برای |
|------|------------------|------------|
| **الف) fetch مستقیم از مرورگر** | داخل کد فرانت‌اند (قابل دیدن توسط کاربر حرفه‌ای!) | شروع سریع، اپ خانوادگی کوچک |
| **ب) پروکسی از طریق سرور Next.js** ✅ | در متغیر محیطی سمت سرور (مخفی می‌ماند) | امن‌ترین حالت — پیشنهاد ما |

### ۵-الف) روش مستقیم — fetch با هدر X-Api-Key

در کامپوننت‌های React/Next.js (سمت مرورگر یا سرور):

```ts
const HOST_API     = 'https://homeiotnt.ir/modirman-api';
const HOST_API_KEY = 'کلید-مخفی-شما'; // همان API_KEY که در index.php گذاشتید

// ۱) دریافت لیست قبض‌های یک واحد
const res = await fetch(`${HOST_API}/bills?unit=8`, {
  headers: { 'X-Api-Key': HOST_API_KEY },
  cache: 'no-store',
});
const bills = await res.json();

// ۲) ثبت قبض جدید (مدیر)
await fetch(`${HOST_API}/bills`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': HOST_API_KEY },
  body: JSON.stringify({
    title: 'شارژ ماه آبان - واحد ۸',
    amount: 1250000,
    unit_number: '8',
    due_date: '1404-09-10',
  }),
});

// ۳) پرداخت قبض
await fetch(`${HOST_API}/bills/12`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': HOST_API_KEY },
  body: JSON.stringify({ status: 'paid' }),
});

// ۴) ارسال رسید با تصویر base64 (ساکن)
await fetch(`${HOST_API}/receipts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': HOST_API_KEY },
  body: JSON.stringify({
    bill_id: 12,
    amount: 1250000,
    image: dataUrl,          // خروجی فشرده‌سازی؛ نکته پایین را ببینید
    note: 'واریز از بانک ملت',
    uploaded_by: 'سارا - واحد ۸',
  }),
});

// ۵) تأیید رسید توسط مدیر (قبض خودکار پرداخت‌شده می‌شود)
await fetch(`${HOST_API}/receipts/3`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': HOST_API_KEY },
  body: JSON.stringify({ status: 'approved' }),
});
```

💡 **فشرده‌سازی تصویر قبل از ارسال:** پروژه «مدیرمن» همین حالا تابع آماده `compressImageToDataUrl` در فایل `src/lib/image.ts` دارد که تصویر رسید را به حداکثر ۱۲۸۰ پیکسل و JPEG با حجم کم می‌رساند. حتماً قبل از ارسال به `image` از آن استفاده کنید تا هم سرعت بالا باشد و هم خطای «حجم زیاد» نگیرید.

💡 **مسیر نسبی یا کامل؟** چون اپ و API الان روی دو دامنه مختلف هستند، باید **آدرس کامل** `https://homeiotnt.ir/modirman-api/...` را بدهید. مسیر نسبی (مثل `/modirman-api/bills`) فقط وقتی کار می‌کند که اپ هم روی همان دامنه سرو شود.

### ۵-ب) روش پیشنهادی — پروکسی از خود سرور Next.js (کلید مخفی می‌ماند)

ایده: اپ به **مسیر نسبی خودش** (`/api/storage/...`) درخواست می‌دهد؛ سرور Next.js با کلید مخفی سمت سرور، درخواست را به هاست می‌فرستد. هیچ کلیدی در مرورگر دیده نمی‌شود و CORS هم درگیر نمی‌شود.

**فایل `src/app/api/storage/bills/route.ts`:**

```ts
import { NextResponse } from 'next/server';

const API = 'https://homeiotnt.ir/modirman-api';
const KEY = process.env.HOST_API_KEY ?? ''; // در .env سرور (بدون NEXT_PUBLIC_)

export async function GET(req: Request) {
  const unit = new URL(req.url).searchParams.get('unit');
  const r = await fetch(`${API}/bills${unit ? `?unit=${encodeURIComponent(unit)}` : ''}`, {
    headers: { 'X-Api-Key': KEY },
    cache: 'no-store',
  });
  return NextResponse.json(await r.json(), { status: r.status });
}

export async function POST(req: Request) {
  const r = await fetch(`${API}/bills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': KEY },
    body: JSON.stringify(await req.json()),
  });
  return NextResponse.json(await r.json(), { status: r.status });
}
```

و در کامپوننت‌ها خیلی ساده:

```ts
const bills = await fetch('/api/storage/bills?unit=8').then(r => r.json()); // مسیر نسبی!
```

**در `.env` سرور Next.js:** `HOST_API_KEY=کلید-مخفی-شما`

---

## ۶) گزینه دوم: «Setup Node.js App» در cPanel

اگر در cPanel شما (بخش **Software**) گزینه **Setup Node.js App** وجود دارد، یعنی هاست CloudLinux با Node.js Selector دارید و می‌توانید به‌جای PHP، سرویس Node اجرا کنید — حتی کل اپ Next.js.

### ۶-الف) چک کنید

cPanel → بخش **Software** → دنبال **Setup Node.js App** (یا **Node Selector**) بگردید. اگر نبود، این بخش به هاست شما تعلق ندارد و همان راه PHP (بخش ۳ و ۴) نتیجه کامل می‌دهد.

### ۶-ب) ساخت اپ Node (نمونه: همان API با Express)

1. روی **Create Application** کلیک کنید.
2. **Node.js version:** بالاترین موجود (20 یا 22).
3. **Application mode:** `Production`.
4. **Application root:** `modirman-node` (پوشه‌ای که ساخته می‌شود).
5. **Application URL:** دامنه یا مسیر زیر دامنه‌ای که می‌خواهید (مثلاً `homeiotnt.ir/modirman-node`).
6. **Application startup file:** `app.js`.
7. دکمه **Create** → اپ ساخته می‌شود.

سپس:
1. با File Manager داخل پوشه `modirman-node` فایل‌های `app.js` و `package.json` را بسازید/آپلود کنید.
2. در صفحه Node.js App دکمه **Run NPM Install** را بزنید.
3. روی **Start** (یا **Restart**) بزنید.

**`package.json`:**

```json
{
  "name": "modirman-node-api",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "express": "^4.19.2",
    "mysql2": "^3.11.0"
  }
}
```

**`app.js` (اسکلت همان API — مسیرها عیناً مثل نسخه PHP):**

```js
// «مدیرمن» — نمونه API با Express روی Setup Node.js App
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json({ limit: '16mb' })); // جا برای تصویر base64

const pool = mysql.createPool({
  host: 'localhost',
  user: 'homeiotnt_modir',
  password: 'رمز-دیتابیس',
  database: 'homeiotnt_modir',
  charset: 'utf8mb4',
});

const API_KEY = 'کلید-مخفی-طولانی';

// CORS + چک کلید
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  if (req.get('X-Api-Key') !== API_KEY) {
    return res.status(401).json({ error: 'کلید API نامعتبر است' });
  }
  next();
});

app.get('/bills', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM bills ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/bills', async (req, res) => {
  const { title, amount, unit_number = null, due_date = null } = req.body;
  if (!title || !amount) return res.status(400).json({ error: 'عنوان و مبلغ الزامی است' });
  const [r] = await pool.query(
    'INSERT INTO bills (title, amount, unit_number, due_date) VALUES (?,?,?,?)',
    [title, amount, unit_number, due_date]
  );
  res.status(201).json({ ok: true, id: r.insertId, message: 'قبض با موفقیت ثبت شد' });
});

// بقیه مسیرها (PATCH /bills/:id ، receipts و ...) مشابه نسخه PHP تکمیل شود
app.listen(process.env.PORT || 3000);
```

> 💡 ساخت جدول‌ها: می‌توانید یک بار فایل PHP بخش ۴ را اجرا کنید تا جدول‌ها ساخته شوند، یا دستورات `CREATE TABLE` را در phpMyAdmin (تب SQL) اجرا کنید.

### ۶-ج) دپلوی کل اپ Next.js روی Node.js App (برای حرفه‌ای‌ترها)

اگر خواستید **کل اپ** را روی همین هاست ببرید:

1. روی سیستم خودتان `next build` (خروجی standalone) بگیرید.
2. پوشه‌های `.next`، `public`، فایل‌های `package.json` و `server.js` را با File Manager آپلود کنید (آپلود ZIP و Extract راحت‌تر است).
3. **Run NPM Install** بزنید.
4. **Application startup file** را روی `server.js` بگذارید و Restart کنید.

⚠️ **هشدار صادقانه:** هاست‌های اشتراکی معمولاً **RAM و CPU محدود** و **Entry Processes** کم دارند؛ اپ Next.js سنگین است و ممکن است کند شود یا Crash بگیرد. توصیه ما همچنان: **سرور فعلی Next.js سر جایش بماند و فقط داده‌ها از PHP API هاست برود** (بخش ۱).

---

## ۷) نکات امنیتی

1. **🔒 HTTPS را حتماً فعال کنید.** cPanel → بخش **Security** → **SSL/TLS Status** → دامنه را تیک بزنید → **Run AutoSSL**. بعد از چند دقیقه، `https://homeiotnt.ir` قفل سبز می‌گیرد (Let's Encrypt). همه فراخوانی‌های API فقط با `https://` — رمز دیتابیس و کلید API در مسیر http لخت، قابل شنود هستند!

2. **🔑 رمز دیتابیس قوی.** از دکمه Generate Password خود cPanel استفاده کنید (۱۶+ کاراکتر، ترکیبی). رمز را هرگز در چت/ایمیل/ریپوی عمومی نگذارید.

3. **🗝️ کلید API طولانی و تصادفی.** یک رشته ۶۴ کاراکتری تصادفی بسازید (در مدیریت‌پسورد یا از دستور `openssl rand -hex 32`). این کلید تنها قفل API شماست؛ اگر لو رفت، فقط در `index.php` و env اپ عوضش کنید.
   - توجه: در «روش مستقیم» کلید در کد مرورگر دیده می‌شود — برای اپ ساختمانی خانوادگی قابل قبول است، اما اگر می‌خواهید مخفی بماند از **روش پروکسی (۵-ب)** استفاده کنید.

4. **🎯 CORS را محدود کنید (پیشنهادی).** بعد از اطمینان از کارکرد، در `index.php` به‌جای `Access-Control-Allow-Origin: *` دامنه اپ خودتان را بنویسید:
   `header('Access-Control-Allow-Origin: https://دامنه-اپ-شما');`

5. **💾 بکاپ منظم از phpMyAdmin.** cPanel → **Databases → phpMyAdmin** → از لیست سمت چپ دیتابیس `homeiotnt_modir` را انتخاب کنید → تب **Export** → گزینه **Quick** و فرمت **SQL** → دکمه **Start/Go** → فایل بکاپ دانلود می‌شود. ماهی یک بار (یا بعد از تغییرات مهم) این کار را بکنید. (cPanel → **Backup** هم بکاپ کامل هاست می‌دهد.)

6. **📦 محدودیت آپلود را تنظیم کنید.** تصاویر رسید base64 حجم می‌گیرند؛ در cPanel → **Software → MultiPHP INI Editor** → دامنه را انتخاب → حالت Basic → این دو را روی **16M** بگذارید:
   - `post_max_size = 16M` (حجم کل درخواست POST)
   - `upload_max_filesize = 16M` (حجم یک فایل آپلودی)

7. **⚠️ انتظار واقع‌بینانه از هاست اشتراکی PHP داشته باشید.** برای اجرای **کل Next.js** مناسب نیست (بخش ۶-ج). معماری توصیه‌شده: سرور Next.js فعلی + PHP API هاست فقط برای ذخیره داده. اگر روزی ترافیک/امنیت جدی‌تر شد، مهاجرت به VPS ارزان بهترین گام بعدی است.

8. **🚫 این API احراز هویت کاربر ندارد** (کلید مشترک است) و نقش «مدیر/ساکن» را چک نمی‌کند. تصمیم اینکه چه کسی چه چیزی را صدا بزند با اپ شماست. اگر کنترل نقش سمت سرور می‌خواهید، همان منطق Bearer-token بک‌اند فعلی پروژه (کار تسک 3-a و 4-a) را باید در سمت Node یا پروکسی Next.js اضافه کنید.

---

## ۸) رفع اشکال (Troubleshooting)

### ۸-الف) جدول خطاهای رایج

| مشکل | علت احتمالی | راه‌حل |
|------|-------------|--------|
| **خطای 500 (Internal Server Error)** | خطای PHP یا دستور نامعتبر در `.htaccess` | در File Manager دنبال فایل **`error_log`** بگردید (در `public_html` یا پوشه `modirman-api` — اگر نیست، از cPanel → **Metrics → Errors** ببینید). متن خطا معمولاً خودش راه‌حل را می‌گوید. پیام‌های فارسی API هم مشکلات دیتابیس را در `error_log` ثبت می‌کنند. |
| **خطای CORS در کنسول مرورگر** («No Access-Control-Allow-Origin») | فایل `.htaccess` آپلود نشده یا هدرها برای OPTIONS برنگشته‌اند | مطمئن شوید `.htaccess` داخل پوشه است؛ تست کنید `curl -i -X OPTIONS https://homeiotnt.ir/modirman-api/bills` — باید `HTTP/1.1 204` ببینید. آدرس API را حتماً با `https://` بدهید نه `http://`. |
| **خطای 413 (Request Entity Too Large)** | درخواست POST بزرگ‌تر از حد مجاز (تصویر base64) | cPanel → **MultiPHP INI Editor** → `post_max_size=16M` و `upload_max_filesize=16M` (بخش ۷-۶). سمت اپ هم تصویر را با `compressImageToDataUrl` فشرده کنید. |
| **MySQL «Access denied for user»** | رمز اشتباه، یا کاربر دیتابیس به دیتابیس **وصل نشده** | cPanel → **MySQL® Databases** → پایین صفحه، بخش **Add User To Database**: کاربر `homeiotnt_modir` را انتخاب و به دیتابیس `homeiotnt_modir` اضافه کنید و **ALL PRIVILEGES** بدهید. نام‌ها حتماً با پیشوند کامل (مثل `homeiotnt_modir`) در کد نوشته شده باشند. |
| **خطای 401 «کلید API نامعتبر است»** | هدر `X-Api-Key` فرستاده نمی‌شود یا مقدارش با `API_KEY` در `index.php` یکی نیست | مقدار دو طرف را کاراکتر به کاراکتر مقایسه کنید (فاصله/گیومه اضافه نباشد). |
| **API به‌جای JSON صفحه HTML/404 می‌دهد** | `mod_rewrite` یا `.htaccess` کار نمی‌کند | از حالت جایگزین استفاده کنید: `https://homeiotnt.ir/modirman-api/index.php?path=bills` — در اپ هم می‌توانید همه آدرس‌ها را با `?path=` بفرستید. |
| **حروف فارسی به‌صورت `????` ذخیره می‌شوند** | charset جدول یا اتصال utf8mb4 نیست | کد فعلی `charset=utf8mb4` را هم در اتصال و هم در ساخت جدول رعایت می‌کند؛ اگر دستی جدولی ساختید، Collation را `utf8mb4_unicode_ci` بگذارید. |
| **ویرایش فایل اثر نمی‌کند** | کش مرورگر یا کش اپ | درخواست‌ها را با `cache: 'no-store'` بفرستید و صفحه را با Ctrl+Shift+R رفرش کنید. |
| **صفحه سفید و بدون پاسخ** | خطای PHP با display_errors خاموش | همان `error_log` (ردیف اول جدول) را ببینید. |

### ۸-ب) سه دستور عیب‌یابی طلایی

```bash
# ۱) آیا API زنده است؟ (بدون کلید)
curl -i https://homeiotnt.ir/modirman-api/

# ۲) آیا کلید قبول می‌شود؟ (باید لیست قبض‌ها بيايد)
curl -i -H "X-Api-Key: کلید-شما" https://homeiotnt.ir/modirman-api/bills

# ۳) آیا هدرهای CORS برمی‌گردند؟
curl -i -X OPTIONS -H "Origin: https://your-app.example" \
     https://homeiotnt.ir/modirman-api/bills
```

---

## ۹) چک‌لیست نهایی

- [ ] دیتابیس `homeiotnt_modir` + کاربر با **ALL PRIVILEGES** ساخته شد (بخش ۲)
- [ ] اطلاعات اتصال و رمزها در جای امن ذخیره شد
- [ ] پوشه `public_html/modirman-api` ساخته شد (بخش ۳)
- [ ] `index.php` با ۵ مقدار تنظیماتِ ویرایش‌شده آپلود شد (بخش ۴-الف)
- [ ] `.htaccess` ساخته شد (بخش ۴-ب)
- [ ] `https://homeiotnt.ir/modirman-api/` در مرورگر پیام «نصب موفق» داد
- [ ] با هدر X-Api-Key تست شد و `[]` (لیست خالی قبض‌ها) برگشت
- [ ] AutoSSL فعال و آدرس‌ها با `https://` است (بخش ۷-۱)
- [ ] `post_max_size` و `upload_max_filesize` روی 16M تنظیم شد (بخش ۷-۶)
- [ ] اپ به API وصل شد — ترجیحاً با روش پروکسی ۵-ب
- [ ] اولین بکاپ phpMyAdmin گرفته شد 🎉

---

> **خلاصه یک‌خطی:** دیتابیس را با Wizard بسازید → فایل `index.php` و `.htaccess` را در `public_html/modirman-api` بگذارید → ۵ خط تنظیمات را عوض کنید → اپ را با هدر `X-Api-Key` به `https://homeiotnt.ir/modirman-api/...` وصل کنید. همین!
>
> اگر به هر مرحله‌ای نیاز به کمک داشتید، همین راهنما را برای پشتیبانی هاست هم بفرستید؛ هر میزبانی cPanel با این مراحل آشناست. موفق باشید! 🏠💙
