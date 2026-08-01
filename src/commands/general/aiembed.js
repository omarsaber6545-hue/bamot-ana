const { SlashCommandBuilder } = require('discord.js');
const { generateAIEmbed } = require('../../services/aiService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aiembed')
    .setDescription('إنشاء بطاقة إعلان أو موضوع احترافي (Embed) باستخدام الذكاء الاصطناعي')
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('topic')
        .setDescription('موضوع الإعلان أو البطاقة المطلوب تصميمها بالذكاء الاصطناعي')
        .setRequired(true)
    ),

  async execute(interaction) {
    const topic = interaction.options.getString('topic');
    await interaction.deferReply();

    const embed = generateAIEmbed(topic, `@${interaction.user.username}`);

    await interaction.editReply({
      content: '✨ **تم توليد البطاقة الاحترافية بواسطة الذكاء الاصطناعي بنجاح:**',
      embeds: [embed]
    });
  }
};
