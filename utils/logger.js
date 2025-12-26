const { EmbedBuilder } = require('discord.js');

async function sendLog(client, options) {
  try {
    const channel = await client.channels.fetch(process.env.logID);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(options.color || 0x5865F2)
      .setTitle(options.title || 'Log')
      .setTimestamp();

    if (options.description) {
      embed.setDescription(options.description);
    }

    if (options.fields) {
      embed.addFields(options.fields);
    }

    if (options.footer) {
      embed.setFooter({ text: options.footer });
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Embed log failed:', err);
  }
}

module.exports = { sendLog };
