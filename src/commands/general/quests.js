const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserProfile, claimQuestReward } = require('../../database/db');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('عرض المهام اليومية (Daily Quests) واستلام مكافآت الـ XP والعملات')
    .setDMPermission(false),

  async execute(interaction) {
    const profile = getUserProfile(
      interaction.user.id,
      interaction.user.tag,
      interaction.user.displayAvatarURL({ dynamic: true })
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📜 المهام اليومية (Daily Quests)')
      .setDescription(
        'أكمل المهام اليومية التالية واستلم مكافآتك المباشرة من الـ XP والعملات:\n\n' +
        profile.quests.map(q => {
          const status = q.completed ? '✅ [مكتملة والمكافأة مُستلمة]' : '⏳ [متاحة للاستلام]';
          return `### المهمة #${q.id}: ${q.title} (${status})\n` +
            `• 🎁 **المكافأة:** \`+${q.rewardXp} XP\` | \`+${q.rewardCoins} Coins\``;
        }).join('\n\n')
      )
      .setFooter({ text: `${interaction.guild.name} • Daily Quests System` })
      .setTimestamp();

    const buttons = profile.quests.map(q =>
      new ButtonBuilder()
        .setCustomId(`claim_quest_${q.id}`)
        .setLabel(`استلام مهمة #${q.id} 🎁`)
        .setStyle(q.completed ? ButtonStyle.Secondary : ButtonStyle.Success)
        .setDisabled(q.completed)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
