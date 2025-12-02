const { fetchRecommendedVideos } = require("../services/recommendationService");

exports.recommendVideos = async (req, res) => {
  try {
    const bodyInterests = Array.isArray(req.body?.interests)
      ? req.body.interests
      : [];

    const userSkills = Array.isArray(req.user?.skillsWant)
      ? req.user.skillsWant
      : [];

    // Use body interests if provided, otherwise use user skills, otherwise use default
    const interests = bodyInterests.length 
      ? bodyInterests 
      : userSkills.length 
      ? userSkills 
      : ["programming", "web development"]; // Default fallback

    const channel = req.body?.channel || "freecodecamp";

    console.log('Fetching recommendations:', { interests, channel, userId: req.user?._id });

    const videos = await fetchRecommendedVideos({ interests, channel });

    return res.json({
      channel,
      interests,
      count: videos.length,
      videos,
    });
  } catch (err) {
    console.error("Error fetching recommended videos:", err.message);
    console.error("Error stack:", err.stack);
    
    let status = 500;
    if (err.message === "Unknown channel") {
      status = 400;
    } else if (err.message.includes("API key") || err.message.includes("quota") || err.message.includes("expired")) {
      status = 503; // Service Unavailable
    }
    
    return res.status(status).json({ 
      message: err.message || "Could not fetch videos",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};


