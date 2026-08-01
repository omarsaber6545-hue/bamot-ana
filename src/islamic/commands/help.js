const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help_islamic')
    .setDescription('عرض قائمة الأوامر والميزات الإسلامية للبوت'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📿 قائمة أوامر وميزات البوت الإسلامي')
      .setDescription('البوت مصمم لإرسال الأذكار والقرآن ومواقيت الصلاة والتنبيهات المزدوجة والبث المباشر 24/7.')
      .addFields(
        { name: '⚙️ `/setup`', value: 'تحديد قنوات الصلاة والأذكار وروم الفويس والرول.' },
        { name: '🔊 `/voice_quran join/leave`', value: 'ربط البوت بروم الفويس وتأمين بث القرآن الكريم 24/7 بدون توقف.' },
        { name: '🕌 `/prayertimes`', value: 'عرض جدول مواقيت الصلاة لليوم.' },
        { name: '📜 `/hadith`', value: 'عرض أحاديث نبوية شريفة صحيحة.' },
        { name: '📖 `/quran`', value: 'عرض آيات من القرآن الكريم.' },
        { name: '📿 `/azkar`', value: 'عرض أذكار الصباح والمساء والأذكار العشوائية.' }
      )
      .setFooter({ text: config.footerText })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
