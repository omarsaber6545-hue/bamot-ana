const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserProfile } = require('../../database/db');
const config = require('../../config/config');

const ALL_ACHIEVEMENTS = [
  { id: 'welcome_badge', title: '👋 العضو الجديد', desc: 'الانضمام للسيرفر واستخدام أول أمر', reward: '100 XP + 50 Coins' },
  { id: 'first_song', title: '🎵 عاشق الموسيقى', desc: 'تشغيل أول أغنية في الروم الصوتي', reward: '150 XP + 100 Coins' },
  { id: 'ticket_opener', title: '🎫 داعم الفني', desc: 'فتح تذكرة دعم فني تواصل مع الإدارة', reward: '200 XP + 150 Coins' },
  { id: 'pet_owner', title: '🦊 مربي الحيوانات', desc: 'تبني وإطعام أول حيوان أليف افتراضي', reward: '250 XP + 200 Coins' },
  { id: 'chat_master', title: '💬 المتحدث الذهبي', desc: 'الوصول إلى المستوى 5 في التفاعل', reward: '500 XP + 400 Coins' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('عرض قائمة الإنجازات والأوسمة القابلة للفتح ومتابعة الإنجازات المكتسبة')
    .setDMPermission(false),

  async execute(interaction) {
    const profile = getUserProfile(
      interaction.user.id,
      interaction.user.tag,
      interaction.user.displayAvatarURL({ dynamic: true })
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🏅 قائمة الإنجازات والأوسمة (Member Achievements)')
      .setDescription(
        'قم بإكمال المهام والتفاعل داخل السيرفر لفتح الأوسمة والجوائز النادرة:\n\n' +
        ALL_ACHIEVEMENTS.map(a => {
          const unlocked = profile.achievements.includes(a.id);
          const icon = unlocked ? '✅ 🔓 [مكتسب]' : '🔒 [مغلق]';
          return `### ${a.title} ${icon}\n` +
            `• **الوصف:** ${a.desc}\n` +
            `• **المكافأة:** \`${a.reward}\``;
        }).join('\n\n')
      )
      .setFooter({ text: `${interaction.guild.name} • Gamification Achievements` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
