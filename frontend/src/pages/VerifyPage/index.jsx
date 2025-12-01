import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = location.state || {};

  const [code, setCode] = useState("");

  if (!userId) {
    navigate("/signup");
  }

  const handleVerify = async () => {
    try {
      await axios.post("http://localhost:3000/auth/verify", {
        userId,
        verificationCode: code,
      });

      toast.success("Email verified! You can now login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Verification failed");
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#f0f4f8] p-2">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800">
            Verify Your Email
          </h2>
          <p className="text-sm text-center text-gray-600 mb-6">
            Enter the verification code sent to your email.
          </p>
          <input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
          <button
            onClick={handleVerify}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
