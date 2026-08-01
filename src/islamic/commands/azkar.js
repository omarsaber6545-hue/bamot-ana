const { SlashCommandBuilder } = require('discord.js');
const { morningAzkar, eveningAzkar, randomAzkar } = require('../assets/azkarData');
const { buildMorningAzkarEmbed, buildEveningAzkarEmbed, buildRandomDhikrEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('azkar')
    .setDescription('عرض الأذكار الإسلامية')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('اختر نوع الأذكار المراد عرضها')
        .setRequired(true)
        .addChoices(
          { name: '☀️ أذكار الصباح', value: 'morning' },
          { name: '🌙 أذكار المساء', value: 'evening' },
          { name: '📿 ذكر عشوائي', value: 'random' }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');

    if (type === 'morning') {
      const embed = buildMorningAzkarEmbed(morningAzkar);
      return interaction.reply({ embeds: [embed] });
    } else if (type === 'evening') {
      const embed = buildEveningAzkarEmbed(eveningAzkar);
      return interaction.reply({ embeds: [embed] });
    } else {
      const randomIndex = Math.floor(Math.random() * randomAzkar.length);
      const embed = buildRandomDhikrEmbed(randomAzkar[randomIndex]);
      return interaction.reply({ embeds: [embed] });
    }
  }
};
