const { EmbedBuilder } = require('discord.js');
const config = require('../config');

// 1. تنبيه حان الآن وقت الصلاة (Azan Time Notification)
const buildPrayerEmbed = (prayerName, timeStr) => {
  return new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle(`🕌 حان الآن موعد أذان وصلاة [ ${prayerName} ]`)
    .setDescription(`> **قال تعالى:** {إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا}\n\n🕒 **التوقيت:** \`${timeStr}\``)
    .addFields(
      { name: '🤲 الدعاء عند الأذان', value: '«اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلاَةِ القَائِمَةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»' }
    )
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 2. تنبيه قبل الصلاة بـ 30 دقيقة (30-Minute Pre-Prayer Reminder)
const buildPrePrayerReminderEmbed = (prayerName, prayerTimeStr, minutesLeft = 30) => {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`⏳ تذكير: باقي ${minutesLeft} دقيقة على أذان [ ${prayerName} ]`)
    .setDescription(`> 💡 **استعد للصلاة:** حان وقت الاستعداد وتجديد الوضوء والتأهب لأداء صلاة **${prayerName}** في وقتها.`)
    .addFields(
      { name: '🕒 موعد الأذان المتوقع', value: `\`${prayerTimeStr}\``, inline: true },
      { name: '✨ فضل الاستعداد للصلاة', value: '«من توضأ للمؤمنين فأحسن الوضوء ثم خرج إلى الصلاة لم يخطُ خطوة إلا رفعت له بها درجة»', inline: false }
    )
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 3. إمبد حديث نبوي شريف (Authentic Hadith Embed)
const buildHadithEmbed = (hadithObj) => {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`📜 حديث نبوي شريف`)
    .setDescription(`> « **${hadithObj.hadith}** »`)
    .addFields(
      { name: '👤 الراوي', value: hadithObj.narrator || 'صحابي جليل', inline: true },
      { name: '📚 المصدر', value: hadithObj.source || 'حديث صحيح', inline: true }
    )
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 4. أذكار الصباح
const buildMorningAzkarEmbed = (azkarArray) => {
  const content = azkarArray.map((z, i) => `**${i + 1}.** ${z}`).join('\n\n');
  return new EmbedBuilder()
    .setColor(config.colors.cyan)
    .setTitle('☀️ أذكار الصباح كاملة')
    .setDescription(content)
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 5. أذكار المساء
const buildEveningAzkarEmbed = (azkarArray) => {
  const content = azkarArray.map((z, i) => `**${i + 1}.** ${z}`).join('\n\n');
  return new EmbedBuilder()
    .setColor(config.colors.cyan)
    .setTitle('🌙 أذكار المساء كاملة')
    .setDescription(content)
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 6. ذكر عشوائي
const buildRandomDhikrEmbed = (dhikrText) => {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('📿 ذكر اليوم')
    .setDescription(`> **« ${dhikrText} »**`)
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 7. آية قرأنية
const buildQuranEmbed = (verseObj) => {
  return new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle(`📖 من نفحات القرآن الكريم`)
    .setDescription(`> ﴿ **${verseObj.text}** ﴾`)
    .addFields(
      { name: '📖 السورة', value: verseObj.surah, inline: true },
      { name: '🔢 الآية', value: `${verseObj.verse}`, inline: true }
    )
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 8. سورة الكهف يوم الجمعة
const buildFridayKahfEmbed = () => {
  return new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle('✨ طاعة يوم الجمعة: سورة الكهف والصلاة على النبي ﷺ')
    .setDescription(`> **قال رسول الله ﷺ:** «مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ»\n\nلا تنسَ قراءة سورة الكهف والإكثار من الصلاة والسلام على نبينا محمد ﷺ 💚`)
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

// 9. ساعة الاستجابة يوم الجمعة
const buildFridayDuaEmbed = () => {
  return new EmbedBuilder()
    .setColor(config.colors.cyan)
    .setTitle('🤲 ساعة الاستجابة يوم الجمعة')
    .setDescription(`> **قال رسول الله ﷺ:** «فِيهِ سَاعَةٌ لا يُوَافِقُهَا عَبْدٌ مُسْلِمٌ وَهُوَ قَائِمٌ يُصَلِّي يَسْأَلُ اللَّهَ تَعَالَى شَيْئًا إِلا أَعْطَاهُ إِيَّاهُ»\n\nادعُ الله بما تحب وشارِك بالدعاء لإخوانك المسلمين في مشارق الأرض ومغاربها.`)
    .setFooter({ text: config.footerText })
    .setTimestamp();
};

module.exports = {
  buildPrayerEmbed,
  buildPrePrayerReminderEmbed,
  buildHadithEmbed,
  buildMorningAzkarEmbed,
  buildEveningAzkarEmbed,
  buildRandomDhikrEmbed,
  buildQuranEmbed,
  buildFridayKahfEmbed,
  buildFridayDuaEmbed
};
