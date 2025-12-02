import React, { useEffect, useState } from "react";
import axios from "axios";

const CHANNEL_OPTIONS = [
  { value: "freecodecamp", label: "freeCodeCamp" },
  { value: "netninja", label: "The Net Ninja" },
  { value: "codewithharry", label: "Code with Harry" },
  { value: "traversymedia", label: "Traversy Media" },
];

export default function RecommendationsPage() {
  const [channel, setChannel] = useState("freecodecamp");
  const [skills, setSkills] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        setError("");

        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3000/auth/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });

        const user = res.data;
        setSkills(user.skillsWant || []);
      } catch (err) {
        console.error("Error fetching user profile for recommendations:", err);
        setError(
          err.response?.data?.message ||
            "Could not load your skills. Please update your profile."
        );
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoadingVideos(true);
      setError("");

      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3000/recommendations",
        { interests: skills, channel },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );

      setVideos(res.data.videos || []);
    } catch (err) {
      console.error("Error fetching recommended videos:", err);
      setError(
        err.response?.data?.message || "Could not fetch recommended videos."
      );
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (!loadingUser) {
      fetchVideos();
    }

  }, [loadingUser, channel]);

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    setSkills(parts);
  };

  const skillsInputValue = skills.join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-24">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            YouTube Recommendations
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Videos curated from top channels based on the skills you want to
            learn.
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-4 shadow-soft-card sm:p-6">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Skills you want to learn (comma separated)
              </label>
              <input
                type="text"
                value={skillsInputValue}
                onChange={handleSkillInputChange}
                placeholder="e.g. React, Node.js, Data Structures"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                These default to your profile&apos;s &quot;Skills Want&quot;.
                You can customize them here.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchVideos}
                disabled={loadingVideos}
                className="mt-3 w-full rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingVideos ? "Refreshing..." : "Refresh Suggestions"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {loadingUser ? (
          <div className="flex justify-center pt-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft-card transition hover:-translate-y-1 hover:shadow-lg"
              >
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-40 w-full object-cover transition group-hover:brightness-105"
                  />
                )}
                <div className="flex flex-1 flex-col px-4 py-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {video.title}
                  </h3>
                  {video.channelTitle && (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {video.channelTitle}
                    </p>
                  )}
                  {video.publishedAt && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                  {video.description && (
                    <p className="mt-2 line-clamp-3 text-xs text-slate-600">
                      {video.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {!loadingUser && !videos.length && !error && (
          <p className="mt-6 text-center text-sm text-slate-500">
            No videos found. Try adjusting your skills or channel.
          </p>
        )}
      </div>
    </div>
  );
}


