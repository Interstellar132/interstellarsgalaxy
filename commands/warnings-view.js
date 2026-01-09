const { SlashCommandBuilder } = require('discord.js');
const warningStore = require('../utils/warnings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings')
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('View warnings for a user')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to check')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const count = await warningStore.get(
      interaction.guild.id,
      user.id
    );

    await interaction.reply({
      embeds: [{
        title: '⚠️ Warning Count',
        color: 0xFEE75C,
        fields: [
          { name: 'User', value: user.tag },
          { name: 'Warnings', value: `${count}` }
        ]
      }],
      ephemeral: true
    });
  }
};
