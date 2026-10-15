const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('forceban')
    .setDescription('forces a ban on a user, even if they\'re not in the server.')
    .addStringOption(option => 
        option.setName('userid')
        .setDescription('the user id')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
        .setDescription('why is this user getting force banned?')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),


async execute (interaction) {
    const userId = interaction.options.getString('userid');
    const Reason = interaction.options.getString('reason')

    try {
        const user = await interaction.client.users.fetch(userId);

        await interaction.guild.members.ban(userId, {
            reason: `${Reason}` ?? `No Reason Given`
        });

        await interaction.reply({
            content: `**${user.username}** has been forcebanned.`,
            ephemeral: true
        });

    } catch (error) {
        console.error('There was an error banning this user:', error);

        await interaction.reply({
            content: `Failed to ban this user.`,
            ephemeral: true
        });
    }
}
}
