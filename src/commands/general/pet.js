const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserProfile, updatePetStatus } = require('../../database/db');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('إدارة وتبني وإطعام الحيوانات الأليفة الافتراضية (Virtual Pet System)')
    .setDMPermission(false)
    .addSubcommand(sub => sub.setName('info').setDescription('عرض حالة وتفاصيل حيوانك الأليف الحالية'))
    .addSubcommand(sub => sub.setName('feed').setDescription('إطعام حيوانك الأليف لرفع مستوى السعادة والـ XP'))
    .addSubcommand(sub =>
      sub
        .setName('adopt')
        .setDescription('تبني حيوان أليف جديد')
        .addStringOption(opt =>
          opt
            .setName('type')
            .setDescription('نوع الحيوان الأليف')
            .setRequired(true)
            .addChoices(
              { name: '🦊 الثعلب السايبر', value: '🦊 الثعلب السايبر' },
              { name: '🐲 التنين الملكي', value: '🐲 التنين الملكي' },
              { name: '🐱 قط الكوانتوم', value: '🐱 قط الكوانتوم' },
              { name: '🦁 الأسد الإمبراطوري', value: '🦁 الأسد الإمبراطوري' }
            )
        )
        .addStringOption(opt => opt.setName('name').setDescription('اسم الحيوان الأليف (اختياري)'))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const profile = getUserProfile(
      interaction.user.id,
      interaction.user.tag,
      interaction.user.displayAvatarURL({ dynamic: true })
    );

    // 1. Info
    if (subcommand === 'info') {
      const pet = profile.pet || { name: 'فليكس 🦊', type: '🦊 الثعلب السايبر', level: 1, happiness: 100 };
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`🐾 الحيوان الأليف | ${pet.name}`)
        .setDescription(
          `• 🏷️ **النوع:** \`${pet.type}\`\n` +
          `• ⭐ **المستوى:** \`Level ${pet.level}\`\n` +
          `• ❤️ **نسبة السعادة:** \`${pet.happiness}%\` [██████████]\n` +
          `• ⚡ **ميزة النشاط:** \`+15% XP Boost\` تفاعلي!`
        )
        .setFooter({ text: `${interaction.guild.name} • Virtual Pet System` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // 2. Feed
    if (subcommand === 'feed') {
      const pet = updatePetStatus(interaction.user.id, null, 'feed');
      return interaction.reply({
        embeds: [
          successEmbed(
            'تم إطعام الحيوان الأليف 🍖',
            `قم بإطعام **${pet.name}** بنجاح!\n` +
            `• 📈 **المستوى الجديد:** \`Level ${pet.level}\`\n` +
            `• 🎁 **المكافأة:** \`+100 XP\` تم إضافتها لحسابك!`
          )
        ]
      });
    }

    // 3. Adopt
    if (subcommand === 'adopt') {
      const type = interaction.options.getString('type');
      const name = interaction.options.getString('name') || type;
      const pet = updatePetStatus(interaction.user.id, name, 'adopt');
      pet.type = type;
      pet.name = name;

      return interaction.reply({
        embeds: [
          successEmbed(
            'تم تبني حيوان أليف جديد 🥳',
            `مبروك! تم تبني **${name}** بنجاح!\n` +
            `• 🏷️ **النوع:** \`${type}\`\n` +
            `• 🎁 يمكنك إطعامه يومياً عبر الأمر \`/pet feed\` للحصول على جوائز XP!`
          )
        ]
      });
    }
  }
};
