import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:3000/subscription";

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
      resolve(); 
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

  useEffect(() => {
    loadRazorpayScript().then(() => {
      setRazorpayLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
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
        toast.error("Failed to load subscription status", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [currentUser, authLoading]);

  const handleSubscribe = async (planName) => {
    if (!currentUser?._id) {
      toast.error("Please login to subscribe");
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Razorpay is loading. Please wait a moment and try again.");
      await loadRazorpayScript();
      setRazorpayLoaded(!!window.Razorpay);
      if (!window.Razorpay) {
        toast.error("Failed to load Razorpay. Please refresh the page.");
        return;
      }
    }

    try {
      setProcessingPlan(planName);

      const token = localStorage.getItem("token");
      console.log("Creating order for plan:", planName);
      
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

      console.log("Order created:", orderData);

      if (!orderData || !orderData.orderId || !orderData.amount) {
        console.error("Invalid order data:", orderData);
        throw new Error("Invalid order data received from server");
      }

      const options = {
        key: orderData.keyId || "rzp_test_dMsLDQLJDCGKIF",
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
        theme: {
          color: "#30187d",
        },
        notes: {
          plan: planName,
          userId: currentUser._id,
        },
        handler: async (response) => {
          console.log("Payment successful, response:", response);
          try {
            const token = localStorage.getItem("token");
            
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error("Invalid payment response from Razorpay");
            }

            console.log("Verifying payment with:", {
              userId: currentUser._id,
              planName,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });

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

            console.log("Payment verified successfully:", verifyRes.data);
            toast.success("Subscription activated successfully!");

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
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            console.error("Error details:", {
              message: err.message,
              response: err.response?.data,
              status: err.response?.status,
            });
            toast.error(
              err.response?.data?.message ||
                err.message ||
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
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed - Full response:", JSON.stringify(response, null, 2));
        console.error("Error object:", response.error);
        console.error("Error details:", {
          description: response.error?.description,
          reason: response.error?.reason,
          code: response.error?.code,
          source: response.error?.source,
          step: response.error?.step,
          metadata: response.error?.metadata,
        });
        
        const errorDesc = response.error?.description || 
                         response.error?.reason || 
                         response.error?.code || 
                         response.error?.source || 
                         response.error?.step || 
                         "Unknown error";
        
        try {
          if (razorpay && typeof razorpay.close === 'function') {
            razorpay.close();
          }
        } catch (closeErr) {
          console.warn('Failed to close Razorpay modal programmatically:', closeErr);
        }

        if (errorDesc.toLowerCase().includes("international") ||
            errorDesc.toLowerCase().includes("not supported") ||
            response.error?.reason === 'international_transaction_not_allowed') {
          toast.error(
            "International cards are not supported by this merchant account. Please use an Indian card, UPI, or Netbanking, or contact support."
          );
        } else if (errorDesc.toLowerCase().includes("bad request") ||
                   response.error?.code === "BAD_REQUEST_ERROR" ||
                   response.error?.code === 400) {
          toast.error(
            `Invalid payment request (400). Error: ${errorDesc}. Please check your Razorpay configuration.`
          );
        } else {
          toast.error(`Payment failed: ${errorDesc}`);
        }
        setProcessingPlan(null);
      });

      razorpay.on("modal.close", function () {
        console.log("Razorpay modal closed");
        setProcessingPlan(null);
      });

      razorpay.on("external.wallet.selected", function (response) {
        console.log("External wallet selected:", response);
      });

      console.log("Opening Razorpay checkout with options:", {
        key: options.key,
        amount: options.amount,
        order_id: options.order_id,
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

      <div className="mx-auto mb-6 max-w-2xl space-y-3">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <strong>💳 Payment Info:</strong> We accept Indian debit/credit cards, UPI, Net Banking, and Wallets. 
            For international payments, please contact our support team.
          </p>
        </div>
        
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">🧪 Test Mode - Use these test card details:</p>
          <ul className="text-xs text-yellow-700 space-y-1 ml-4">
            <li><strong>Card Number:</strong> 4111 1111 1111 1111</li>
            <li><strong>Expiry:</strong> Any future date (e.g., 12/25)</li>
            <li><strong>CVV:</strong> Any 3 digits (e.g., 123)</li>
            <li><strong>Name:</strong> Any name</li>
          </ul>
          <p className="text-xs text-yellow-600 mt-2">
            <strong>Note:</strong> If payment fails, check browser console (F12) for error details.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
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
