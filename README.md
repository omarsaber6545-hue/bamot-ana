# 🛡️ Arabic Discord Server Management Bot — بوت إدارة وتأمين السيرفرات العربي

بوت ديسكورد سيستم احترافي ومكمل لإدارة السيرفرات باللغة العربية، مبني باستخدام **Discord.js v14** ونظام **Slash Commands** مع كروت إمبيد تفاعلية بأزرار دعم التذاكر وقاعدة بيانات مدمجة.

---

## 🌟 الميزات الرئيسية (Main Features)

### 1. ⚖️ نظام الإدارة والرقابة (Moderation System):
- `/ban` - حظر عضو من السيرفر مع تسجيل السبب في اللوج.
- `/kick` - طرد عضو من السيرفر.
- `/timeout` - كتم عضو مؤقتاً (Time out) لمدة محددة بالدقائق.
- `/untimeout` - إلغاء الكتم المؤقت عن عضو.
- `/warn` - توجيه تحذير مأخوذ في قاعدة البيانات مع إرسال رسالة خاصة للعضو.
- `/warnings` - عرض كافة التحذيرات المسجلة بحق عضو أو مسحها بالكامل.
- `/clear` - تطهير ومسح الشات بعدد محدد من الرسائل (من 1 إلى 100).
- `/lock` & `/unlock` - قفل وإعادة فتح القناة الحالية.

### 2. 🎫 نظام التذاكر والدعم الفني (Ticket System):
- `/ticket-setup` - إنشاء وإرسال لوحة التذاكر التفاعلية زر "فتح تذكرة 🎫".
- إنشاء قناة خاصة تلقائيًا لكل تذكرة مع ضبط الصلاحيات للمستخدم وفريق الدعم.
- أزرار تفاعلية داخل التذكرة للإغلاق 🔒 أو الحذف 🗑️.

### 3. 👋 نظام الترحيب والرتب التلقائية (Welcome & Auto-Role):
- `/setup-welcome` - تعيين قناة الترحيب والرتبة التلقائية (Auto Role).
- إرسال كارت ترحيب عربي مصمم عند دخول أي عضو جديد يوضح رتبته وعدد أعضاء السيرفر.

### 4. 📜 نظام السجلات واللوجات (Audit Logs System):
- `/setup-logs` - تحديد قناة السجلات لمتابعة أحداث السيرفر تلقائيًا:
  - حذف وتعديل الرسائل.
  - دخول وخروج الأعضاء.

### 5. 📊 نظام المعلومات العامة (General & Stats):
- `/serverinfo` - إحصائيات ومعلومات السيرفر (المالك، الأعضاء، القنوات، الرتب).
- `/userinfo` - فحص حساب عضو (تاريخ الإنشاء، الانضمام، الرتب).
- `/avatar` - عرض وتحميل صورة الحساب الشخصية أو صورة السيرفر.
- `/botinfo` - سرعة استجابة البوت وزمن التشغيل واستهلاك الذاكرة.
- `/help` - قائمة الأوامر المتاحة.

---

## 🚀 طريقة التجهيز والتشغيل (Setup & Run)

### 1. تجهيز التوكن ومتغيرات البيئة:
افتح ملف `.env` وضَع التوكن الخاص ببوتك وتعرف التطبيق (Client ID):

```env
DISCORD_TOKEN=ضع_التوكن_الخاص_ببوتينك_هنا
CLIENT_ID=ضع_معرف_التطبيق_CLIENT_ID_هنا
```

> 📌 **ملاحظة:** احرص على تفعيل خيارات **Privileged Gateway Intents** من صفحة Bot في [Discord Developer Portal](https://discord.com/developers/applications):
> - ✅ Server Members Intent
> - ✅ Message Content Intent

### 2. تشغيل البوت:
```bash
npm start
```

---

## 📁 هيكل المشروع (Project Structure)

```
open bot/
├── src/
│   ├── commands/              # أوامر Slash Commands
│   │   ├── moderation/        # ban, kick, timeout, untimeout, warn, warnings, clear, lock, unlock
│   │   ├── tickets/           # ticket-setup
│   │   ├── system/            # setup-welcome, setup-logs
│   │   └── general/           # serverinfo, userinfo, avatar, botinfo, help
│   ├── config/
│   │   └── config.js          # ألوان الشارات والإيموجيات
│   ├── database/
│   │   └── db.js              # إدارة قاعدة البيانات وحفظ الإعدادات والتذاكر والتحذيرات
│   ├── events/                # أحداث ديسكورد (ready, interactionCreate, guildMemberAdd, messageDelete, ...)
│   ├── handlers/              # مسجلات الأوامر والأحداث
│   │   ├── commandHandler.js
│   │   └── eventHandler.js
│   ├── utils/                 # تصميم الإمبيدات والمساعدات
│   │   └── embeds.js
│   └── index.js               # ملف التشغيل الرئيسي
├── .env.example
├── .env
├── package.json
└── README.md
```

---

*بُني بحب وسهولة لتوفير نظام إدارة سيرفرات ديسكورد عربي احترافي ومتكامل.*
