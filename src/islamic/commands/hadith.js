const { SlashCommandBuilder } = require('discord.js');
const hadiths = require('../assets/hadithData');
const { buildHadithEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hadith')
    .setDescription('عرض حديث نبوي شريف صحيح من السُنّة النبوية المطهرة'),

  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * hadiths.length);
    const hadithObj = hadiths[randomIndex];
    const embed = buildHadithEmbed(hadithObj);
    return interaction.reply({ embeds: [embed] });
  }
};
