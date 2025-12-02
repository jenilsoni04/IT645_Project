const cron = require("node-cron");
const Subscription = require("../models/Subscription");
const User = require("../models/User");

cron.schedule("0 0 1 * *", async () => {
  try {
    await User.updateMany(
      { _id: { $nin: await Subscription.distinct("userId", { status: "active" }) } },
      { $set: { freeConnectionsLeft: 2 } }
    );
  } catch (err) {
    console.error("Free reset error:", err);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    const expired = await Subscription.find({
      expiryDate: { $lt: new Date() },
      status: "active",
    });

    for (const sub of expired) {
      sub.status = "expired";
      await sub.save();
      await User.updateOne({ _id: sub.userId }, { freeConnectionsLeft: 2 });
    }
  } catch (err) {
    console.error("Expiry job error:", err);
  }
});
