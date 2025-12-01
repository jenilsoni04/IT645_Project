import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:3000/subscription";

// Load Razorpay script dynamically if not already loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      resolve(); // Resolve anyway to prevent hanging
    };
    document.body.appendChild(script);
  });
};

const plans = {
  Basic: { connectionsAllowed: 5, price: 99 },
  Premium: { connectionsAllowed: 15, price: 299 },
};

const Subscription = () => {
  const { user: currentUser, loading: authLoading } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript().then(() => {
      setRazorpayLoaded(true);
    });
  }, []);

  // ✅ Fetch subscription status
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to finish loading
    }
    
    if (!currentUser || !currentUser._id) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${API_BASE_URL}/status/${currentUser._id}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        const isExpired = expiryDate && expiryDate < new Date();

        setSubscription({
          ...data,
          isSubscribed: data.isSubscribed && !isExpired,
          expiryDate,
        });
      } catch (err) {
        toast.error("Failed to load subscription status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [currentUser, authLoading]);

  // ✅ Handle Subscribe
  const handleSubscribe = async (planName) => {
    if (!currentUser?._id) {
      toast.error("Please login to subscribe");
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Razorpay is loading. Please wait a moment and try again.");
      // Try to load again
      await loadRazorpayScript();
      setRazorpayLoaded(!!window.Razorpay);
      if (!window.Razorpay) {
        toast.error("Failed to load Razorpay. Please refresh the page.");
        return;
      }
    }

    try {
      setProcessingPlan(planName);

      // 1️⃣ Create Order
      const token = localStorage.getItem("token");
      const { data: orderData } = await axios.post(
        `${API_BASE_URL}/create-order`,
        {
          userId: currentUser._id,
          planName,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!orderData || !orderData.orderId || !orderData.amount) {
        throw new Error("Invalid order data received from server");
      }

      const options = {
        key: orderData.keyId || "rzp_test_dMsLDQLJDCGKIF", // Use key from backend if provided
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        order_id: orderData.orderId,
        name: "SkillXchange",
        description: `${planName} Plan - ${plans[planName].connectionsAllowed} connections per month`,
        prefill: {
          name: currentUser.name || "",
          email: currentUser.email || "",
          contact: currentUser.phone || "",
        },
        handler: async (response) => {
          try {
            // 2️⃣ Verify Payment
            const token = localStorage.getItem("token");
            const verifyRes = await axios.post(
              `${API_BASE_URL}/verify-payment`,
              {
                userId: currentUser._id,
                planName,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );

            toast.success("Subscription activated successfully!");

            // Refresh subscription status
            try {
              const statusRes = await axios.get(
                `${API_BASE_URL}/status/${currentUser._id}`,
                {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
              );

              const expiryDate = statusRes.data.expiryDate
                ? new Date(statusRes.data.expiryDate)
                : null;

              setSubscription({
                ...statusRes.data,
                isSubscribed: statusRes.data.isSubscribed,
                expiryDate,
              });
            } catch (refreshErr) {
              console.error("Failed to refresh subscription status:", refreshErr);
              // Still show success since payment was verified
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            toast.error(
              err.response?.data?.message ||
                "Payment verification failed. Please contact support."
            );
          } finally {
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null);
            toast.info("Payment cancelled");
          },
        },
        theme: {
          color: "#30187d",
        },
        notes: {
          plan: planName,
          userId: currentUser._id,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        toast.error(
          `Payment failed: ${response.error.description || "Unknown error"}`
        );
        setProcessingPlan(null);
      });

      razorpay.open();
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to initiate payment. Please try again."
      );
      setProcessingPlan(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-red-600 text-sm">Please log in to view subscriptions</p>
      </div>
    );
  }

  const isSubscribed = subscription?.isSubscribed;
  const activePlan = subscription?.plan;

  return (
    <div className="flex-1 bg-white p-8">
      <h2 className="mb-2 text-center text-3xl font-bold">
        Subscription Plans
      </h2>

      {isSubscribed ? (
        <p className="mb-6 text-center text-green-600">
          You&apos;re subscribed to <b>{activePlan}</b> till{" "}
          <b>{subscription.expiryDate?.toDateString()}</b> <br />
          Connections left: <b>{subscription.connectionsLeft}</b>
        </p>
      ) : (
        <p className="mb-6 text-center text-red-600">
          No active subscription. Free connections:{" "}
          <b>{subscription?.connectionsLeft ?? 2}</b>
        </p>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {/* ✅ Basic Plan */}
        <PlanCard
          title="Basic Plan"
          price={99}
          features={[
            "5 connections per month",
            "Messaging access",
            "Basic visibility",
          ]}
          active={activePlan === "Basic"}
          loading={processingPlan === "Basic"}
          onClick={() => handleSubscribe("Basic")}
        />

        {/* ✅ Premium Plan */}
        <PlanCard
          title="Premium Plan"
          price={299}
          features={[
            "15 connections per month",
            "Priority search visibility",
            "Unlimited messaging",
          ]}
          active={activePlan === "Premium"}
          loading={processingPlan === "Premium"}
          onClick={() => handleSubscribe("Premium")}
          highlighted
        />

        {/* ✅ Coming Soon */}
        <PlanCard
          title="Coming Soon"
          price={0}
          features={[
            "Unlimited connections",
            "AI recommendations",
            "Video highlights",
          ]}
          disabled
        />
      </div>
    </div>
  );
};

const PlanCard = ({
  title,
  price,
  features,
  onClick,
  loading,
  active,
  highlighted,
  disabled,
}) => {
  return (
    <div
      className={`flex h-[420px] flex-col justify-between rounded-lg p-6 shadow-md ${
        highlighted ? "ring-2 ring-blue-500" : ""
      } ${disabled ? "bg-gray-200" : "bg-gray-100"}`}
    >
      <div>
        <h3 className="mb-2 text-center text-xl font-semibold">{title}</h3>
        {price > 0 && (
          <p className="mb-4 text-center text-lg text-gray-700">
            ₹{price} / month
          </p>
        )}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={onClick}
        disabled={disabled || loading || active}
        className="mt-6 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {active
          ? "Current Plan"
          : loading
          ? "Processing..."
          : disabled
          ? "Stay Tuned"
          : "Subscribe"}
      </button>
    </div>
  );
};

export default Subscription;
