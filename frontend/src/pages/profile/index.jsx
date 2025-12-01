import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { BadgeCheck, Users, Code, Target, PencilLine } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [formData, setFormData] = useState({ name: "", skillsHave: "", skillsWant: "" });

  // Fetch current user
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
        setFormData({
          name: res.data.name || "",
          skillsHave: res.data.skillsHave?.join(", ") || "",
          skillsWant: res.data.skillsWant?.join(", ") || "",
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch user data");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    if (!user?._id) return;

    try {
      const res = await axios.put(
        `http://localhost:3000/user/update-profile/${user._id}`,
        {
          name: formData.name,
          skillsHave: formData.skillsHave.split(",").map((s) => s.trim()),
          skillsWant: formData.skillsWant.split(",").map((s) => s.trim()),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Profile updated successfully!");
      setUser(res.data);
      setOpenEdit(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="mt-24 flex justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <div className="rounded-3xl bg-white/90 p-6 shadow-2xl ring-1 ring-violet-100 sm:p-10">
            <div className="grid gap-8 md:grid-cols-[220px,1fr]">
              <div className="text-center">
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-violet-600 text-4xl font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                  {user.name}
                </h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                <button
                  type="button"
                  onClick={() => setOpenEdit(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  <PencilLine size={18} /> Edit Profile
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold text-white ${
                      user.isVerified ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    <BadgeCheck size={16} />
                    {user.isVerified ? "Verified" : "Not Verified"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1 text-sm font-semibold text-white">
                    <Users size={16} /> Free Connections:{" "}
                    {user.freeConnectionLeft ?? 0}
                  </span>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Code size={16} /> Skills Have
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsHave?.length ? (
                      user.skillsHave.map((skill, i) => (
                        <span
                          key={`${skill}-${i}`}
                          className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">None</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Target size={16} /> Skills Want
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsWant?.length ? (
                      user.skillsWant.map((skill, i) => (
                        <span
                          key={`${skill}-${i}`}
                          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">None</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {openEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpenEdit(false)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">
              Edit Profile
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Skills Have (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.skillsHave}
                  onChange={(e) =>
                    setFormData({ ...formData, skillsHave: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Skills Want (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.skillsWant}
                  onChange={(e) =>
                    setFormData({ ...formData, skillsWant: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenEdit(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProfile}
                className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
