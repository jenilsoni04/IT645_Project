import React, { useEffect, useState } from "react";
import axios from "axios";
import { Play, Calendar, User, Search, RefreshCw } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const CHANNEL_OPTIONS = [
  { value: "freecodecamp", label: "freeCodeCamp", icon: "🎓" },
  { value: "netninja", label: "The Net Ninja", icon: "🥷" },
  { value: "codewithharry", label: "Code with Harry", icon: "💻" },
  { value: "traversymedia", label: "Traversy Media", icon: "🚀" },
  { value: "apnacollege", label: "Apna College", icon: "📚" },
  { value: "programmingwithmosh", label: "Programming with Mosh", icon: "🎯" },
  { value: "edureka", label: "Edureka", icon: "🌟" },
];

export default function RecommendationsPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [channel, setChannel] = useState("freecodecamp");
  const [skills, setSkills] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUser) {
      if (currentUser.skillsWant && currentUser.skillsWant.length > 0) {
        setSkills(currentUser.skillsWant);
      } else {
        // Set default skills if user has none - this ensures videos always load
        setSkills(["programming", "web development"]);
      }
    }
  }, [currentUser]);

  // Auto-fetch videos when component loads, user changes, or channel changes
  useEffect(() => {
    if (!authLoading && currentUser) {
      // Small delay to ensure skills state is updated
      const timer = setTimeout(() => {
        const skillsToUse = skills.length > 0 ? skills : ["programming", "web development"];
        fetchVideos(skillsToUse);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser, channel, skills.length]);

  const fetchVideos = async (customInterests = null) => {
    try {
      setLoadingVideos(true);
      setError("");

      const token = localStorage.getItem("token");
      const interestsToUse = customInterests || skills;

      // Always use at least default skills if none provided
      const finalInterests = interestsToUse && interestsToUse.length > 0 
        ? interestsToUse 
        : ["programming", "web development"];

      const res = await axios.post(
        "http://localhost:3000/recommendations",
        { interests: finalInterests, channel },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setVideos(res.data.videos || []);
      if (res.data.videos && res.data.videos.length === 0) {
        setError("No videos found. Try different skills or another channel.");
      } else {
        setError(""); // Clear error on success
      }
    } catch (err) {
      console.error("Error fetching recommended videos:", err);
      const errorMessage = err.response?.data?.message || err.message || "Could not fetch recommended videos.";
      
      // Provide helpful error messages
      if (errorMessage.includes("API key")) {
        setError("⚠️ YouTube API key is not configured or invalid. Please contact the administrator.");
      } else if (errorMessage.includes("quota")) {
        setError("⚠️ YouTube API quota exceeded. Please try again later.");
      } else {
        setError(`⚠️ ${errorMessage}`);
      }
      setVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    setSkills(parts);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchSkills = searchQuery.split(",").map((s) => s.trim()).filter(Boolean);
      fetchVideos(searchSkills);
    } else {
      fetchVideos();
    }
  };

  const skillsInputValue = skills.join(", ");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            📺 YouTube Recommendations
          </h1>
          <p className="text-slate-600">
            Discover curated videos from top programming channels based on your learning goals
          </p>
        </div>

        {/* Controls Card */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Skills Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Skills You Want to Learn
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillsInputValue}
                  onChange={handleSkillInputChange}
                  placeholder="e.g. React, Node.js, Python, Data Structures"
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loadingVideos}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {currentUser?.skillsWant?.length > 0 
                  ? `Using skills from your profile. You can customize them above. Videos will auto-load.`
                  : "Videos will auto-load with default skills. Add skills to your profile for personalized recommendations."}
              </p>
            </div>

            {/* Channel Selector */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fetchVideos()}
                disabled={loadingVideos}
                className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingVideos ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh Videos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Search - Optional */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Quick Search (Optional)
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Videos are automatically loaded based on your skills. Use this to search for specific topics.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for specific topics (e.g., React Hooks, MongoDB)"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={loadingVideos || !searchQuery.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Videos Grid */}
        {loadingVideos ? (
          <div className="flex justify-center pt-10">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Fetching videos from YouTube...</p>
            </div>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {video.thumbnail && (
                  <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h3>
                  <div className="mt-auto space-y-2">
                    {video.channelTitle && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        <span className="truncate">{video.channelTitle}</span>
                      </div>
                    )}
                    {video.publishedAt && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(video.publishedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    )}
                    {video.description && (
                      <p className="line-clamp-2 text-xs text-slate-600 mt-2">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white p-12 text-center shadow-md">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos found</h3>
            <p className="text-sm text-slate-600 mb-4">
              Try adjusting your skills, selecting a different channel, or using the quick search above.
            </p>
            <button
              onClick={() => fetchVideos()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
