const { SlashCommandBuilder } = require('discord.js');
const quranVerses = require('../assets/quranData');
const { buildQuranEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quran')
    .setDescription('عرض آية مباركة من القرآن الكريم'),

  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * quranVerses.length);
    const verseObj = quranVerses[randomIndex];
    const embed = buildQuranEmbed(verseObj);
    return interaction.reply({ embeds: [embed] });
  }
};
