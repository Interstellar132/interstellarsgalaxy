const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const STATE_FILE = './youtube-state.json';

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function extract(tag, xml) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

async function checkYouTube(client) {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const discordChannelId = process.env.CONTENT_ANNOUNCE_CHANNEL_ID;

  if (!channelId || !discordChannelId) return;

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  const res = await fetch(feedUrl);
  const xml = await res.text();

  const videoId = extract('yt:videoId', xml);
  if (!videoId) return;

  const state = loadState();
  if (state.lastVideoId === videoId) return;

  const title = extract('title', xml);
  const channelName = extract('name', xml);
  const published = extract('published', xml);

  state.lastVideoId = videoId;
  saveState(state);

  const channel = await client.channels.fetch(discordChannelId).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor("#DC143C")
    .setTitle(title || 'New YouTube Video')
    .setURL(`https://youtu.be/${videoId}`)
    .setAuthor({
      name: channelName || 'YouTube',
      iconURL: 'https://www.youtube.com/s/desktop/fe2e0f1d/img/favicon_144x144.png'
    })
    .setThumbnail(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
    .setTimestamp(published ? new Date(published) : new Date())
    .setFooter({ text: 'New upload' });

  await channel.send(`<@&1114778023951081584> Interstellar uploaded a new video!`);
  await channel.send({ embeds: [embed] });
}

module.exports = { checkYouTube };
