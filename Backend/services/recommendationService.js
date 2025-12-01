const axios = require("axios");

const CHANNELS = {
  freecodecamp: "UC8butISFwT-Wl7EV0hUK0BQ",
  netninja: "UCW5YeuERMmlnqo4oq8vwUpg",
  codewithharry: "UCeVMnSShP_Iviwkknt83cww",
  traversymedia: "UC29ju8bIPH5as8OGnQzwJyA",
};

async function fetchRecommendedVideos({ interests = [], channel = "freecodecamp" }) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  const channelId = CHANNELS[channel.toLowerCase()];
  if (!channelId) {
    throw new Error("Unknown channel");
  }

  const searchQuery =
    (interests && interests.length ? interests.join(" ") : "programming web development") +
    " course";

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(
    searchQuery
  )}&maxResults=10&type=video&key=${apiKey}`;

  const response = await axios.get(url);
  const items = response.data?.items || [];

  return items.map((item) => ({
    id: item.id?.videoId,
    title: item.snippet?.title,
    description: item.snippet?.description,
    thumbnail: item.snippet?.thumbnails?.medium?.url,
    channelTitle: item.snippet?.channelTitle,
    publishedAt: item.snippet?.publishedAt,
    videoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
  }));
}

module.exports = {
  fetchRecommendedVideos,
};


