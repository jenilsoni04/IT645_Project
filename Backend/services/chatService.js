const User = require('../models/User');
const Message = require('../models/Message');
const { getUserConnections } = require('./connection');

async function getChatConnections(userId) {
  try {
    const connectedUserIds = await getUserConnections(userId);

    console.log('Connected User IDs:', connectedUserIds);

    if (connectedUserIds.length === 0) {
      console.log('No connections found for user:', userId);
      return [];
    }
    const users = await User.find(
      { _id: { $in: connectedUserIds } },
      'name email skillsHave skillsWant'
    ).lean();

    console.log(`Found ${users.length} connected users`);
    const lastMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId, receiver: { $in: connectedUserIds } },
            { sender: { $in: connectedUserIds }, receiver: userId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender',
            ],
          },
              lastMessage: { $first: '$$ROOT' },
        },
      },
    ]);

    console.log(`Found ${lastMessages.length} conversations with last messages`);

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiver: userId,
          sender: { $in: connectedUserIds },
          read: false,
        },
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log(`Unread message counts:`, unreadCounts.map(u => ({ 
      user: u._id.toString(), 
      count: u.count 
    })));
    
    const lastMessageMap = new Map(
      lastMessages.map((m) => [m._id.toString(), m.lastMessage])
    );

    const unreadCountMap = new Map(
      unreadCounts.map((u) => [u._id.toString(), u.count])
    );

    const messageIds = Array.from(lastMessageMap.values()).map(m => m._id);
    
    const populatedMessages = await Message.find({ _id: { $in: messageIds } })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .lean();

    const populatedMessageMap = new Map(
      populatedMessages.map(m => [m._id.toString(), m])
    );

    console.log(`Populated ${populatedMessages.length} last messages`);

    const result = users.map((u) => {
      const userIdStr = u._id.toString();
      const lastMsg = lastMessageMap.get(userIdStr);
      const unreadCount = unreadCountMap.get(userIdStr) || 0;

      let lastMessage = null;

      if (lastMsg) {
        const populatedMsg = populatedMessageMap.get(lastMsg._id.toString()) || lastMsg;
        
        lastMessage = {
          _id: populatedMsg._id,
          sender: {
            _id: populatedMsg.sender._id || populatedMsg.sender,
            name: populatedMsg.sender.name || 'Unknown',
            email: populatedMsg.sender.email || '',
          },
          receiver: {
            _id: populatedMsg.receiver._id || populatedMsg.receiver,
            name: populatedMsg.receiver.name || 'Unknown',
            email: populatedMsg.receiver.email || '',
          },
          content: populatedMsg.content || '',
          type: populatedMsg.type || 'text',
          fileName: populatedMsg.fileName || null,
          fileUrl: populatedMsg.fileUrl || null,
          read: populatedMsg.read || false,
          createdAt: populatedMsg.createdAt,
        };
      }

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        skillsHave: u.skillsHave || [],
        skillsWant: u.skillsWant || [],
        lastMessage,
        unreadCount,
      };
    });

    result.sort((a, b) => {
      const at = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const bt = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return bt - at;
    });

    console.log(`Returning ${result.length} chat connections`);

    return result;
  } catch (error) {
    console.error('Error in getChatConnections:', error);
    throw error;
  }
}

module.exports = { getChatConnections };