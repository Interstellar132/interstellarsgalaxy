const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    // Restrict command usage to admins
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason =
      interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: 'I did not find this user.',
        ephemeral: true
      });
    }

    if (!member.bannable) {
      return interaction.reply({
        content: 'I cannot ban this user (role hierarchy).',
        ephemeral: true
      });
    }

    try {
      await member.ban({ reason });

      await interaction.reply({
        content: `🔨 **${target.tag}** has been banned.\nReason: ${reason}`,
        ephemeral: true
      });

      // OPTIONAL: DM owner
      try {
        const owner = await interaction.client.users.fetch(process.env.OwnerID);
        await owner.send(
          `🔨 **Ban Command Used**
User: ${target.tag} (${target.id})
Moderator: ${interaction.user.tag}
Reason: ${reason}`
        );
      } catch {}

    } catch (err) {
      console.error(err);
      interaction.reply({
        content: 'Failed to ban the user.',
        ephemeral: true
      });
    }
  }
};

