import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        toast.error("You must be logged in to view connections");
        return;
      }

      try {
        // ✅ Parse user from localStorage
        const user = JSON.parse(userData);
        const userId = user._id || user.id || user.userId;

        if (!userId) {
          toast.error("Invalid user data. Please log in again.");
          return;
        }

        // ✅ Fixed URL quotes and Authorization syntax
        const res = await axios.get("http://localhost:3000/connect/connections", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setConnections(res.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching connections:", err);
        toast.error("Failed to fetch connections");
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center mt-24">
        <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <Navbar />
      <div className="mx-auto mt-24 max-w-6xl px-4 pb-12">
        <div className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-emerald-100 sm:p-10">
          <div className="text-center">
            <p className="text-3xl font-semibold text-emerald-900">
              🌿 Your Connections
            </p>
            <p className="mt-2 text-sm text-emerald-500">
              Meet the people you can learn with and from
            </p>
          </div>

          <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-emerald-100 to-transparent" />

          {!connections.length ? (
            <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/60 p-10 text-center text-emerald-600">
              You haven’t connected with anyone yet 🤝
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((conn) => (
                <div
                  key={conn._id}
                  className="rounded-2xl bg-white/80 p-5 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3">
                    <p className="text-lg font-semibold text-emerald-800">
                      {conn.name}
                    </p>
                    <p className="text-sm text-emerald-500">{conn.email}</p>
                  </div>

                  <div className="space-y-1 text-sm text-emerald-700">
                    <p>
                      <span className="font-semibold text-emerald-900">
                        Skills Have:
                      </span>{" "}
                      {conn.skillsHave?.join(", ") || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-900">
                        Skills Want:
                      </span>{" "}
                      {conn.skillsWant?.join(", ") || "N/A"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => toast.info("Feature coming soon!")}
                      className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                    >
                      ❌ Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info("Chat feature coming soon!")}
                      className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      💬 Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;
