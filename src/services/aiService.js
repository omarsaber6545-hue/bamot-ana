const { EmbedBuilder } = require('discord.js');
const { addSystemLog } = require('../database/db');

// Forbidden toxic words & patterns for Moderation
const toxicPatterns = [
  /\b(زب|شرموط|قحبة|كس|عرص|طيز|يا ابن الكلب|يا ابن الشرموطة|خول|مأير)\b/i,
  /discord\.(gg|com\/invite)\/[a-zA-Z0-9]+/i,
  /(http|https):\/\/[^\s]+/i
];

/**
 * 1. Moderation Engine
 * Evaluates message content and flags violations automatically.
 */
async function moderateMessage(content) {
  if (!content || typeof content !== 'string') return { flagged: false };

  // Check toxic patterns & invite links
  if (/discord\.(gg|com\/invite)\/[a-zA-Z0-9]+/i.test(content)) {
    return {
      flagged: true,
      reason: 'نشر رابط سيرفر ديسكورد آخر (Spam / Self-Promotion)',
      action: 'DELETE'
    };
  }

  const toxicMatch = toxicPatterns[0].exec(content);
  if (toxicMatch) {
    return {
      flagged: true,
      reason: `استخدام ألفاظ غير لائقة أو شتائم مسيئة (\`${toxicMatch[0]}\`)`,
      action: 'DELETE'
    };
  }

  // Check repetitive spam
  if (content.length > 500 && /(.)\1{15,}/.test(content)) {
    return {
      flagged: true,
      reason: 'رسالة إزعاج وتكرار حروف مفرط (Spam)',
      action: 'DELETE'
    };
  }

  return { flagged: false };
}

/**
 * 2. Ticket First-Responder
 * Generates official natural support greeting before human staff step in.
 */
async function generateTicketResponse(userQuery, category = 'General') {
  const q = (userQuery || '').toLowerCase();

  let responseText = '';
  if (q.includes('رتب') || q.includes('رتبة') || q.includes('role')) {
    responseText = 
      `أهلاً بك! بالنسبة لاستفسارك حول **الرتب والعضويات**:\n` +
      `• يمكنك الحصول على الرتب التلقائية عبر التفاعل والارتفاع في المستوى (Level Up).\n` +
      `• لرتب الشراء أو الترقية الإدارية، يرجى كتابة التفاصيل وسيقوم أحد مشرفي الدعم الفني بمراجعتها فوراً!`;
  } else if (q.includes('شراء') || q.includes('دفع') || q.includes('buy') || q.includes('pay')) {
    responseText = 
      `مرحباً بك! بالنسبة لاستفسارات **الشراء والمدفوعات**:\n` +
      `• يرجى إرفاق صورة إثبات التحويل ورقم المعاملة داخل هذا الروم.\n` +
      `• فريق المبيعات والدعم الفني متواجد لمراجعة الطلب وتجهيز الخدمات فوراً!`;
  } else if (q.includes('مشكلة') || q.includes('بوج') || q.includes('خطأ') || q.includes('error')) {
    responseText = 
      `أهلاً بك! يسعدنا مساعدتك في حل المشكلة:\n` +
      `• يرجى كتابة تفاصيل المشكلة بدقة وإرفاق صورة أو فيديو يوضح الخطأ.\n` +
      `• سيتدخل فريق الدعم الفني لمتابعة الحالة معك خطوة بخطوة.`;
  } else {
    responseText = 
      `أهلاً وسهلاً بك في قسم الدعم الفني!\n` +
      `لقد تم استلام تذكرتك وتسجيل الطلب بنجاح.\n\n` +
      `• **ملاحظة هامّة:** يرجى كتابة استفسارك بالتفصيل وإرفاق أي صور متعلقة بالطلب.\n` +
      `• سيقوم أحد أعضاء فريق الدعم الفني بالرد عليك ومتابعتك في أقرب وقت ممكن!`;
  }

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setAuthor({ name: '⚡ فريق الدعم الفني | Support Team' })
    .setTitle('🎫 مرحباً بك في الدعم الفني')
    .setDescription(responseText)
    .setFooter({ text: 'فريق الدعم الفني في خدمتك • يرجى الانتظار لحين المتابعة' })
    .setTimestamp();

  return embed;
}

/**
 * 3. Embed Generator Engine
 * Generates custom Discord Embeds based on topic prompts.
 */
function generateAIEmbed(topicPrompt, authorTag = 'إدارة السيرفر 🛡️') {
  let title = '🎨 إعلان وتنسيق مخصص';
  let description = topicPrompt;
  let color = '#7289DA';
  const fields = [];

  const lower = topicPrompt.toLowerCase();

  if (lower.includes('قوانين') || lower.includes('rules')) {
    title = '📜 قوانين وتعليمات السيرفر الرسمية';
    color = '#ED4245';
    description = `مرحباً بكم جميعاً في سيرفرنا! نرجو من الجميع الالتزام بالقواعد التالية لضمان بيئة آمنة وممتعة:\n\n` +
      `1️⃣ **الاحترام المتبادل:** يمنع السب أو الإهانة أو التمييز بأي شكل من الأشكال.\n` +
      `2️⃣ **يمنع الإعلانات:** حظر تام لنشر روابط السيرفرات الأخرى أو الروابط المشبوهة.\n` +
      `3️⃣ **الرومات المخصصة:** يرجى التحدث في الرومات المخصصة لكل موضوع.\n` +
      `4️⃣ **الالتزام بتعليمات الإدارة:** قرارات الطاقم الإداري نهائية وواجبة الاحترام.`;
  } else if (lower.includes('مسابقة') || lower.includes('giveaway') || lower.includes('فعالية')) {
    title = '🎉 مسابقة وفعالية جديدة!';
    color = '#FEE75C';
    description = `يسرنا الإعلان عن فعالية ومسابقة جديدة مميزة بأسرار وجوائز قيمة!\n\n` +
      `📌 **التفاصيل:** ${topicPrompt}\n` +
      `🎁 **الجوائز:** رتب مخصصة، عملاتCoins، وجوائز حصرية!\n` +
      `⏰ **موعد السحب:** سيتم الإعلان عن الفائزين قريبًا عبر روم النتائج.`;
  } else if (lower.includes('صيانة') || lower.includes('تحديث') || lower.includes('update')) {
    title = '🛠️ تنبيه تحديث وصيانة دورية';
    color = '#E67E22';
    description = `نود إعلامكم بوجود أعمال صيانة وتحديثات جديدة لرفع كفاءة الخدمات والسيرفر:\n\n` +
      `• **طبيعة التحديث:** ${topicPrompt}\n` +
      `• **المدة المتوقعة:** بضع دقائق.\n` +
      `نشكركم على حسن تعاونكم وتفهمكم!`;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `إدارة السيرفر • ${authorTag}` })
    .setTimestamp();

  return embed;
}

/**
 * 4. Rules & Announcement Writer Engine
 * Generates formatted text for server announcements and rules.
 */
function generateAnnouncementOrRules(type, promptDetails) {
  const typeKey = (type || 'announcement').toLowerCase();

  if (typeKey === 'rules' || typeKey === 'قوانين') {
    return (
      `# 📜 قوانين وإرشادات السيرفر الرسمية\n\n` +
      `أهلاً بكم في مجتمعنا! يرجى قراءة القواعد التالية بدقة لتجنب العقوبات الإدارية:\n\n` +
      `### 1. 🤝 الاحترام والتعامل الراقي\n` +
      `• يُحظر تماماً الشتائم، التنمر، أو الخطاب الطائفي والعنصري.\n\n` +
      `### 2. 🚫 الترويج والسبام\n` +
      `• يُمنع ترويج السيرفرات أو الحسابات الشخصية أو إرسال الروابط العشوائية (Spam).\n\n` +
      `### 3. 🔊 الرومات الصوتية والكتابية\n` +
      `• التزام الأدب في الرومات الصوتية وتجنب استخدام مزعجات الصوت (Soundboards).\n\n` +
      `### 4. ⚖️ قرارات الإدارة\n` +
      `• قرارات فريق المشرفين نهائية وفي حال وجود شكوى يرجى فتح تذكرة دعم.`
    );
  }

  if (typeKey === 'welcome' || typeKey === 'ترحيب') {
    return (
      `# 👋 أهلاً وسهلاً بكم في سيرفرنا الرسمى!\n\n` +
      `يسعدنا جداً انضمامكم إلى مجتمعنا المتألق ✨\n\n` +
      `📌 **روابط هامة للبدء:**\n` +
      `• 📜 الاطلاع على القوانين: <#rules>\n` +
      `• 💬 الشات العام للتفاعل: <#general>\n` +
      `• 🎫 الدعم الفني والمساعدة: <#tickets>\n\n` +
      `نتمنى لكم أوقاتاً ممتعة ومميزة معنا! 🌟`
    );
  }

  // Default: Announcement
  return (
    `# 📢 إعلان رسمي هام\n\n` +
    `أعضاءنا الكرام، يسر إدارة السيرفر أن تعلن لكم عن التالي:\n\n` +
    `> **${promptDetails}**\n\n` +
    `💡 **ملاحظة:** لمزيد من التفاصيل والاستفسارات، يمكنك التواصل مع المشرفين المتاحين.\n\n` +
    `مع تحيات **إدارة السيرفر** 🛡️`
  );
}

module.exports = {
  moderateMessage,
  generateTicketResponse,
  generateAIEmbed,
  generateAnnouncementOrRules
};
