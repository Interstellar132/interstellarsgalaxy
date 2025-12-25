const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    )
    // Admin-only
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: 'I cannot find this user', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({ content: 'I cannot kick this user (role hierarchy).', ephemeral: true });
    }

    try {
      await member.kick(reason);

      await interaction.reply({
        content: `👢 **${target.tag}** has been kicked.\nReason: ${reason}`,
        ephemeral: true
      });

      // DM owner
      try {
        const owner = await interaction.client.users.fetch(process.env.OwnerID);
        await owner.send(
          `👢 **Kick Command Used**
User: ${target.tag} (${target.id})
Moderator: ${interaction.user.tag}
Reason: ${reason}`
        );
      } catch (err) {
        console.error('Failed to DM owner:', err);
      }

    } catch (err) {
      console.error(err);
      interaction.reply({ content: 'Failed to kick the user.', ephemeral: true });
    }
  }
};

