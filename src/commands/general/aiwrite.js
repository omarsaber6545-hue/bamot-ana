const { SlashCommandBuilder } = require('discord.js');
const { generateAnnouncementOrRules } = require('../../services/aiService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aiwrite')
    .setDescription('كتابة وصياغة إعلانات وقوانين السيرفر ورسائل الترحيب بواسطة الذكاء الاصطناعي')
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('نوع النص المطلوب كتابته')
        .setRequired(true)
        .addChoices(
          { name: '📢 إعلان رسمي (Announcement)', value: 'announcement' },
          { name: '📜 قوانين وتعليمات السيرفر (Rules)', value: 'rules' },
          { name: '👋 رسالة ترحيب بالعضويات (Welcome)', value: 'welcome' }
        )
    )
    .addStringOption(option =>
      option
        .setName('details')
        .setDescription('تفاصيل أو موضوع الإعلان / القوانين المطلوب صياغتها')
        .setRequired(true)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const details = interaction.options.getString('details');

    await interaction.deferReply();

    const formattedText = generateAnnouncementOrRules(type, details);

    await interaction.editReply({
      content: formattedText
    });
  }
};
