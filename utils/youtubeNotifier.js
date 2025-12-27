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

function extractEntry(xml) {
  const match = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  return match ? match[1] : null;
}

function cleanHtml(text) {
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

async function checkYouTube(client) {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const announceChannelId = process.env.CONTENT_ANNOUNCE_CHANNEL_ID;

  if (!channelId || !announceChannelId) return;

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl);
  const xml = await res.text();

  const entry = extractEntry(xml);
  if (!entry) return;

  const videoId = extract('yt:videoId', entry);
  if (!videoId) return;

  const state = loadState();
  if (state.lastVideoId === videoId) return;

  state.lastVideoId = videoId;
  saveState(state);

  const title = cleanHtml(extract('title', entry)) || 'New YouTube Video';
  const description = cleanHtml(extract('media:description', entry) || '');
  const published = extract('published', entry);

  const channel = await client.channels.fetch(announceChannelId).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle(title) // ✅ ACTUAL VIDEO TITLE
    .setURL(`https://youtu.be/${videoId}`)
    .setAuthor({
      name: 'New YouTube Upload',
      iconURL: 'https://i.ibb.co/ZzH647jv/youtube-icon-logo-symbol-free-png.webp'
    })
    .setThumbnail(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
    .setDescription(
      description.length > 1024
        ? description.slice(0, 1021) + '...'
        : description || '*No description provided*'
    )
    .setTimestamp(published ? new Date(published) : new Date())
    .setFooter({ text: 'YouTube' });

  await channel.send(`<@&1114778023951081584> Interstellar uploaded a new video!`);
  await channel.send({ embeds: [embed] });
}

module.exports = { checkYouTube };
