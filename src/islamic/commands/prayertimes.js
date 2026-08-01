const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPrayerTimes } = require('../services/aladhanService');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prayertimes')
    .setDescription('عرض مواقيت الصلاة لليوم لمدينة معينة')
    .addStringOption(option =>
      option.setName('city')
        .setDescription('المدينة (مثال: Cairo / Riyadh / Dubai)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('country')
        .setDescription('الدولة (مثال: Egypt / Saudi Arabia)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const city = interaction.options.getString('city') || config.defaultCity;
    const country = interaction.options.getString('country') || config.defaultCountry;

    await interaction.deferReply();

    const timings = await getPrayerTimes(city, country);
    if (!timings) {
      return interaction.editReply({ content: '❌ تعذر جلب مواقيت الصلاة للمدينة المحددة. يرجى التأكد من كتابة اسمها بالإنجليزية بشكل صحيح.' });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle(`🕌 مواقيت الصلاة اليوم لمدينة ${city} - ${country}`)
      .addFields(
        { name: '🌅 الفجر', value: `\`${timings.Fajr}\``, inline: true },
        { name: '☀️ الشروق', value: `\`${timings.Sunrise}\``, inline: true },
        { name: '🌞 الظهر', value: `\`${timings.Dhuhr}\``, inline: true },
        { name: '🌤️ العصر', value: `\`${timings.Asr}\``, inline: true },
        { name: '🌅 المغرب', value: `\`${timings.Maghrib}\``, inline: true },
        { name: '🌙 العشاء', value: `\`${timings.Isha}\``, inline: true }
      )
      .setFooter({ text: config.footerText })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
