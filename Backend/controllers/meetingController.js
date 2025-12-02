const { customAlphabet } = require("nanoid");
const Meeting = require("../models/Meeting");

const generateMeetingId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

exports.createMeeting = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { title = "", inviteeId } = req.body || {};

    let meetingId = generateMeetingId();

    for (let i = 0; i < 3; i++) {
      const existing = await Meeting.findOne({ meetingId });
      if (!existing) break;
      meetingId = generateMeetingId();
    }

    const meeting = await Meeting.create({
      meetingId,
      hostId,
      title,
      participants: [hostId],
    });

    if (inviteeId && global.__emitToUser) {
      try {
        const User = require("../models/User");
        const hostUser = await User.findById(hostId);
        const hostName = hostUser?.name || "Unknown";

        console.log(`[Meeting Create] Emitting meet-started: host=${hostId}, invitee=${inviteeId}, meetingId=${meeting.meetingId}`);

        global.__emitToUser(inviteeId, "meet-started", {
          meetingId: meeting.meetingId,
          connectionId: String(hostId),
          connectionName: hostName,
          title: meeting.title || "Meeting",
          createdAt: meeting.createdAt,
        });
        
        console.log(`[Meeting Create] Emit completed for meetingId=${meeting.meetingId}`);
      } catch (err) {
        console.error("Error emitting meet-started event:", err.message);
      }
    } else {
      console.warn(`[Meeting Create] Cannot emit: inviteeId=${inviteeId}, __emitToUser=${!!global.__emitToUser}`);
    }

    return res.status(201).json({
      meetingId: meeting.meetingId,
      title: meeting.title,
      createdAt: meeting.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create meeting" });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findOne({ meetingId: id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    return res.json({
      meetingId: meeting.meetingId,
      title: meeting.title,
      hostId: meeting.hostId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch meeting" });
  }
};


