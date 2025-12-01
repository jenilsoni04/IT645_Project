const { getChatConnections } = require('../services/chatService');

async function getChatUserList(req, res) {
  try {
    const userId = req.user._id;
    console.log('Fetching chat connections for userId:', userId);
    const result = await getChatConnections(userId);
    res.json(result);
  } catch (err) {
    console.error('Error in getChatUserList:', err);
    res.status(500).json({ message: 'Failed to fetch chat connections' });
  }
}

module.exports = getChatUserList;
