const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildSettings, getGuildSettings } = require('../../database/db');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-gif')
    .setDescription('تعيين وتحديد GIF تلقائي يُرفق تلقائياً مع الرسائل الخاصة والإمبيدات')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('رابط الـ GIF أو الصورة التلقائية')
        .setRequired(false)
    ),

  async execute(interaction) {
    const gifUrl = interaction.options.getString('url')?.trim();

    if (!gifUrl) {
      const settings = getGuildSettings(interaction.guild.id);
      const currentGif = settings?.default_gif || config.defaultGif;

      const embed = infoEmbed(
        'إعداد الـ GIF التلقائي 🖼️',
        `• **رابط الـ GIF التلقائي الحالي:**\n${currentGif}\n\n` +
        `لتغيير الـ GIF، يرجى كتابة الأمر وتمرير رابط الصورة:\n` +
        `\`/setup-gif url: https://example.com/banner.gif\``
      );
      if (currentGif) embed.setImage(currentGif);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    let validUrl = gifUrl;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }

    try {
      new URL(validUrl);
      updateGuildSettings(interaction.guild.id, { default_gif: validUrl });

      const embed = successEmbed(
        'تم حفظ الـ GIF التلقائي بنجاح 🖼️',
        `سيتم إرفاق هذا الـ GIF تلقائياً في جميع الرسائل الخاصة عند عدم تحديد صورة مخصصة.\n\n• **الرابط:**\n${validUrl}`
      );
      embed.setImage(validUrl);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in setup-gif:', error);
      await interaction.reply({
        embeds: [errorEmbed('خطأ', 'يرجى تقديم رابط GIF أو صورة صالحة ورسمية.')],
        ephemeral: true
      });
    }
  }
};
