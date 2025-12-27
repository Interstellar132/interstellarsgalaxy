const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const STATE_FILE = './twitch-state.json';

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function getAccessToken() {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token` +
      `?client_id=${process.env.TWITCH_CLIENT_ID}` +
      `&client_secret=${process.env.TWITCH_CLIENT_SECRET}` +
      `&grant_type=client_credentials`,
    { method: 'POST' }
  );

  const data = await res.json();
  return data.access_token;
}

async function checkTwitch(client) {
  const channelName = process.env.TWITCH_USERNAME;
  const announceChannelId = process.env.CONTENT_ANNOUNCE_CHANNEL_ID;

  if (!channelName || !announceChannelId) return;

  const token = await getAccessToken();
  const state = loadState();

  const res = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${channelName}`,
    {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();
  const stream = data.data?.[0];

  // Not live
  if (!stream) {
    state.live = false;
    saveState(state);
    return;
  }

  // Already announced
  if (state.live && state.streamId === stream.id) return;

  state.live = true;
  state.streamId = stream.id;
  saveState(state);

  const channel = await client.channels.fetch(announceChannelId).catch(() => null);
  if (!channel) return;

  const thumbnail = stream.thumbnail_url
    .replace('{width}', '1280')
    .replace('{height}', '720') + `?t=${Date.now()}`;

  const embed = new EmbedBuilder()
    .setColor("#CB2EFF")
    .setTitle(stream.title)
    .setURL(`https://twitch.tv/${channelName}`)
    .setAuthor({
      name: `${stream.user_name} is LIVE on Twitch`,
      iconURL: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png'
    })
    .setImage(thumbnail)
    .addFields(
      { name: 'Game', value: stream.game_name || 'Unknown', inline: true },
      { name: 'Viewers', value: String(stream.viewer_count), inline: true }
    )
    .setTimestamp(new Date(stream.started_at))
    .setFooter({ text: 'Twitch Live' });

  await channel.send(`<@&894609836434653214> Interstellar is now streaming!`);
  await channel.send({ embeds: [embed] });
}

module.exports = { checkTwitch };
