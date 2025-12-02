import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in");
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get("http://localhost:3000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch user data");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchConnections = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:3000/connect/connections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConnections(res.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch connections");
      }
    };
    if (user) fetchConnections();
  }, [user]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;
      const token = localStorage.getItem("token");

      try {
        const res = await axios.get(
          "http://localhost:3000/connect/suggestions",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const filtered = res.data.filter((s) => s.status !== "accepted");
        setSuggestions(filtered);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch connection suggestions");
      }
    };
    fetchSuggestions();
  }, [user]);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!suggestions.length) return;
      const token = localStorage.getItem("token");
      const newStatuses = {};

      await Promise.all(
        suggestions.map(async (s) => {
          try {
            const res = await axios.get("http://localhost:3000/connect/status", {
              headers: { Authorization: `Bearer ${token}` },
              params: { senderId: user._id, receiverId: s._id },
            });
            newStatuses[s._id] = res.data.status;
          } catch {
            newStatuses[s._id] = "none";
          }
        })
      );

      setStatuses(newStatuses);
    };

    if (user && suggestions.length) fetchStatuses();
  }, [suggestions, user]);

  const handleConnect = async (receiverId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/connect/request",
        { receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Connection request sent!");
      setStatuses((prev) => ({ ...prev, [receiverId]: "pending" }));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleAccept = async (senderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/connect/accept",
        { senderId, receiverId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("You’re now connected!");
      setSuggestions((prev) => prev.filter((s) => s._id !== senderId));
      setStatuses((prev) => ({ ...prev, [senderId]: "accepted" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (senderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/connect/reject",
        { senderId, receiverId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.info("Connection request rejected!");
      setStatuses((prev) => ({ ...prev, [senderId]: "none" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center mt-24">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <Navbar />
      <div className="mx-auto mt-24 max-w-6xl px-4 pb-12">
        {user && (
          <div className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/90 p-5 text-center shadow ring-1 ring-emerald-100">
              <p className="text-sm font-semibold text-emerald-700">👤 Profile</p>
              <p className="mt-2 text-lg font-semibold text-emerald-900">
                {user.name}
              </p>
              <p className="text-sm text-emerald-500">{user.email}</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-5 text-center shadow ring-1 ring-emerald-100">
              <p className="text-sm font-semibold text-emerald-700">🧩 Skills Have</p>
              <p className="mt-3 text-sm text-emerald-900">
                {user.skillsHave?.join(", ") || "N/A"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 p-5 text-center shadow ring-1 ring-emerald-100">
              <p className="text-sm font-semibold text-emerald-700">🎯 Skills Want</p>
              <p className="mt-3 text-sm text-emerald-900">
                {user.skillsWant?.join(", ") || "N/A"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 p-5 text-center shadow ring-1 ring-emerald-100">
              <p className="text-sm font-semibold text-emerald-700">🤝 Connections</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {connections.length}
              </p>
              <p className="text-xs text-emerald-500">
                Free Left: {user.freeConnectionLeft}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-emerald-100 sm:p-10">
          <div className="text-center">
            <p className="text-3xl font-semibold text-emerald-900">
              🌿 Suggested Connections
            </p>
            <p className="mt-2 text-sm text-emerald-500">
              Discover peers with complementary skills
            </p>
          </div>

          <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-emerald-100 to-transparent" />

          {!suggestions.length ? (
            <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/60 p-10 text-center text-emerald-600">
              No mutual skill matches found yet
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((s) => {
                const status = statuses[s._id] || "none";
                return (
                  <div
                    key={s._id}
                    className="rounded-2xl bg-white/80 p-5 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-3">
                      <p className="text-lg font-semibold text-emerald-800">
                        {s.name}
                      </p>
                      <p className="text-sm text-emerald-500">{s.email}</p>
                    </div>

                    <div className="space-y-1 text-sm text-emerald-700">
                      <p>
                        <span className="font-semibold text-emerald-900">
                          Skills Have:
                        </span>{" "}
                        {s.skillsHave?.join(", ") || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-emerald-900">
                          Skills Want:
                        </span>{" "}
                        {s.skillsWant?.join(", ") || "N/A"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {status === "none" && (
                        <button
                          type="button"
                          onClick={() => handleConnect(s._id)}
                          className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                        >
                          Connect
                        </button>
                      )}

                      {status === "pending" && (
                        <button
                          type="button"
                          disabled
                          className="flex-1 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600"
                        >
                          Pending
                        </button>
                      )}

                      {status === "received" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAccept(s._id)}
                            className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(s._id)}
                            className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {status === "accepted" && (
                        <button
                          type="button"
                          disabled
                          className="flex-1 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700"
                        >
                          Connected
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
