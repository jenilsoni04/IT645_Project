import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
        toast.error(err.response?.data?.message || "Failed to fetch user data");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center mt-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#f0f4f8] p-2">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            My Profile
          </h2>

          <div className="space-y-3">
            <p className="text-base"><strong className="text-gray-700">Name:</strong> <span className="text-gray-600">{user.name}</span></p>
            <p className="text-base"><strong className="text-gray-700">Email:</strong> <span className="text-gray-600">{user.email}</span></p>
            <p className="text-base"><strong className="text-gray-700">Skills Have:</strong> <span className="text-gray-600">{user.skillsHave.join(", ")}</span></p>
            <p className="text-base"><strong className="text-gray-700">Skills Want:</strong> <span className="text-gray-600">{user.skillsWant.join(", ")}</span></p>
            <p className="text-base"><strong className="text-gray-700">Free Connections Left:</strong> <span className="text-gray-600">{user.freeConnectionLeft}</span></p>
            <p className="text-base"><strong className="text-gray-700">Verified:</strong> <span className="text-gray-600">{user.isVerified ? "Yes" : "No"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
