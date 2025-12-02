const User = require("../models/User");
const Subscription = require("../models/Subscription");
const ConnectionRequest = require("../models/ConnectionRequest");
const sendEmail = require("../utils/sendEmail");

const getUserSuggestions = async (userId) => {
  const loggedInUser = await User.findById(userId);
  if (!loggedInUser) {
    throw new Error("User not found");
  }

  const allUsers = await User.find({ _id: { $ne: userId } });

  const suggestions = allUsers.filter(
    (user) =>
      user.skillsHave.some((skill) =>
        loggedInUser.skillsWant.includes(skill)
      ) &&
      user.skillsWant.some((skill) =>
        loggedInUser.skillsHave.includes(skill)
      )
  );

  return suggestions;
};
const sendConnectionRequest = async (senderId, receiverId) => {
  const sender = await User.findById(senderId);
  const activeSubscriptionPlan = await Subscription.findOne({
    userId: senderId,
    status: "active",
  });

  if (!sender) throw new Error("Sender not found");
  if (sender.freeConnectionLeft <= 0 && !activeSubscriptionPlan) {
    throw new Error("Free tier used. Purchase a plan to continue");
  }

  const existingUser = await ConnectionRequest.findOne({
    senderId,
    receiverId,
    status: "pending",
  });
  if (existingUser) throw new Error("Connection request already sent");

  const receiver = await User.findById(receiverId);
  if (!receiver) throw new Error("Receiver not found");

  const newRequest = new ConnectionRequest({ senderId, receiverId });
  await newRequest.save();

  await sendEmail(
    receiver.email,
    "New Connection Request",
    `${sender.name} (${sender.email}) sent you a connection request on SkillSwap.`
  );

  return { message: "Connection request sent" };
};

const acceptConnectionRequest = async (senderId, receiverId) => {
  const request = await ConnectionRequest.findOne({
    senderId,
    receiverId,
    status: "pending",
  });
  if (!request) throw new Error("Request not found");

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) throw new Error("User not found");

  const senderSubscription = await Subscription.findOne({
    userId: senderId,
    status: "active",
  });

  const receiverSubscription = await Subscription.findOne({
    userId: receiverId,
    status: "active",
  });

  if (
    (!senderSubscription && sender.freeConnectionLeft <= 0) ||
    (!receiverSubscription && receiver.freeConnectionLeft <= 0)
  ) {
    throw new Error("One or both users have no connections left");
  }

  if (
    (senderSubscription && senderSubscription.connectionsLeft <= 0) ||
    (receiverSubscription && receiverSubscription.connectionsLeft <= 0)
  ) {
    throw new Error("One or both users have reached their limit");
  }

  // Deduct connection limits
  if (!senderSubscription) {
    sender.freeConnectionLeft -= 1;
    await sender.save();
  } else {
    senderSubscription.connectionsLeft -= 1;
    await senderSubscription.save();
  }

  if (!receiverSubscription) {
    receiver.freeConnectionLeft -= 1;
    await receiver.save();
  } else {
    receiverSubscription.connectionsLeft -= 1;
    await receiverSubscription.save();
  }

  request.status = "accepted";
  await request.save();

  return { message: "Connection request accepted" };
};

// ❌ Reject connection
const rejectConnectionRequest = async (senderId, receiverId) => {
  const request = await ConnectionRequest.deleteOne({
    senderId,
    receiverId,
    status: "pending",
  });

  if (!request.deletedCount) throw new Error("Request not found");

  return { message: "Connection request rejected" };
};

// 🔍 Get request status
const getConnectionStatus = async (senderId, receiverId) => {
  let request = await ConnectionRequest.findOne({ senderId, receiverId });
  if (!request) {
    request = await ConnectionRequest.findOne({
      senderId: receiverId,
      receiverId: senderId,
    });
  }

  if (!request) throw new Error("Request not found");

  if (request.status === "pending") {
    if (request.senderId.toString() === senderId)
      return { status: "pending" };
    else return { status: "received" };
  }

  return { status: request.status };
};
 const getUserConnections = async (userId) => {
  // find all accepted connections where user is sender or receiver
  const connections = await ConnectionRequest.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
    status: "accepted",
  });

  // extract the IDs of the connected users
  const connectedUserIds = connections.map((conn) =>
    conn.senderId.toString() === userId.toString()
      ? conn.receiverId
      : conn.senderId
  );

  // find and return user data for these connections
  const connectedUsers = await User.find(
    { _id: { $in: connectedUserIds } },
    "name email skillsHave skillsWant"
  );

  return connectedUsers;
};
module.exports = { getUserSuggestions, 
    sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionStatus, 
getUserConnections};
