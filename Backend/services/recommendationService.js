const axios = require("axios");
require("dotenv").config();

// Check YouTube API key on module load
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  console.warn("⚠️  YouTube API key not configured. Recommendations will fail.");
  console.warn("Please set YOUTUBE_API_KEY in your .env file");
} else {
  console.log("✅ YouTube API key configured");
}

const CHANNELS = {
  freecodecamp: "UC8butISFwT-Wl7EV0hUK0BQ",
  netninja: "UCW5YeuERMmlnqo4oq8vwUpg",
  codewithharry: "UCeVMnSShP_Iviwkknt83cww",
  traversymedia: "UC29ju8bIPH5as8OGnQzwJyA",
  apnacollege: "UCBwmMxybNva6P_5VmxjzwqA",
  programmingwithmosh: "UCWv7vMb8WHxV2RqsUJROE-A",
  edureka: "UCkw4JCwteGrDHIsyiiKo1tQ",
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

  // Build search query from interests
  let searchQuery = "programming tutorial";
  if (interests && interests.length > 0) {
    // Use first 3 skills to keep query focused
    const skills = interests.slice(0, 3).join(" ");
    searchQuery = `${skills} tutorial course`;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(
    searchQuery
  )}&maxResults=12&type=video&order=relevance&key=${apiKey}`;

  try {
    console.log('Fetching videos from YouTube API...', { channel, searchQuery });
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
    });

    if (response.data?.error) {
      const error = response.data.error;
      console.error('YouTube API Error:', error);
      
      if (error.errors && error.errors.length > 0) {
        const apiError = error.errors[0];
        if (apiError.reason === 'keyInvalid') {
          throw new Error('YouTube API key is invalid. Please check your API key configuration.');
        } else if (apiError.reason === 'quotaExceeded') {
          throw new Error('YouTube API quota exceeded. Please try again later.');
        } else if (apiError.reason === 'keyExpired') {
          throw new Error('YouTube API key has expired. Please update your API key.');
        } else {
          throw new Error(`YouTube API error: ${apiError.message || apiError.reason}`);
        }
      }
      throw new Error(error.message || 'YouTube API returned an error');
    }

    const items = response.data?.items || [];
    console.log(`Found ${items.length} videos for query: ${searchQuery}`);

    return items.map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
      videoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    }));
  } catch (error) {
    console.error('YouTube API request failed:', error.message);
    
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      if (apiError.errors && apiError.errors.length > 0) {
        const err = apiError.errors[0];
        if (err.reason === 'keyInvalid') {
          throw new Error('YouTube API key is invalid. Please check your API key in .env file.');
        } else if (err.reason === 'quotaExceeded') {
          throw new Error('YouTube API daily quota exceeded. Please try again tomorrow or upgrade your API quota.');
        } else if (err.reason === 'keyExpired') {
          throw new Error('YouTube API key has expired. Please generate a new key from Google Cloud Console.');
        } else {
          throw new Error(`YouTube API error: ${err.message || err.reason}`);
        }
      }
      throw new Error(apiError.message || 'YouTube API returned an error');
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request to YouTube API timed out. Please try again.');
    }
    
    if (error.message.includes('API key')) {
      throw error; // Re-throw API key errors as-is
    }
    
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }
}

module.exports = {
  fetchRecommendedVideos,
};


