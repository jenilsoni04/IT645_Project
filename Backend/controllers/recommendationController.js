const { fetchRecommendedVideos } = require("../services/recommendationService");

// POST /recommendations
// Body: { interests?: string[], channel?: string }
// If interests missing/empty, falls back to req.user.skillsWant
exports.recommendVideos = async (req, res) => {
  try {
    const bodyInterests = Array.isArray(req.body?.interests)
      ? req.body.interests
      : [];

    const userSkills = Array.isArray(req.user?.skillsWant)
      ? req.user.skillsWant
      : [];

    const interests = bodyInterests.length ? bodyInterests : userSkills;

    const channel = req.body?.channel || "freecodecamp";

    const videos = await fetchRecommendedVideos({ interests, channel });

    return res.json({
      channel,
      interests,
      count: videos.length,
      videos,
    });
  } catch (err) {
    console.error("Error fetching recommended videos:", err.message);
    const status = err.message === "Unknown channel" ? 400 : 500;
    return res.status(status).json({ message: err.message || "Could not fetch videos" });
  }
};


