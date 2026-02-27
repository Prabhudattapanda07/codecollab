const Room = require('../models/Room');
const Code = require('../models/Code');
const crypto = require('crypto');

// @route   POST /api/create-room
// @desc    Create a new coding room
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    // Generate unique room ID
    const roomId = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create room
    const room = await Room.create({
      roomId,
      createdBy: req.user._id,
      participants: [req.user._id]
    });

    // Create initial code document for the room
    await Code.create({
      roomId,
      code: '// Start coding...',
      language: 'javascript'
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        roomId: room.roomId,
        createdBy: room.createdBy,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating room',
      error: error.message
    });
  }
};

// @route   POST /api/join-room
// @desc    Join an existing room
// @access  Private
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a room ID'
      });
    }

    // Find room
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Add user to participants if not already added
    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }

    res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      room: {
        roomId: room.roomId,
        createdBy: room.createdBy,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining room',
      error: error.message
    });
  }
};

// @route   POST /api/save-code
// @desc    Save code for a room
// @access  Private
exports.saveCode = async (req, res) => {
  try {
    const { roomId, code, language } = req.body;

    if (!roomId || code === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roomId and code'
      });
    }

    // Check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Update or create code document
    let codeDoc = await Code.findOne({ roomId });
    
    if (codeDoc) {
      codeDoc.code = code;
      if (language) codeDoc.language = language;
      await codeDoc.save();
    } else {
      codeDoc = await Code.create({
        roomId,
        code,
        language: language || 'javascript'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Code saved successfully',
      code: codeDoc
    });
  } catch (error) {
    console.error('Save code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving code',
      error: error.message
    });
  }
};

// @route   GET /api/my-saved-code
// @desc    Get all saved code for rooms the user has joined or created
// @access  Private
exports.getMySavedCode = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all rooms where user is creator or participant
    const rooms = await Room.find({
      $or: [
        { createdBy: userId },
        { participants: userId }
      ]
    }).select('roomId');

    const roomIds = rooms.map((r) => r.roomId);
    if (roomIds.length === 0) {
      return res.status(200).json({
        success: true,
        savedCode: []
      });
    }

    // Get code documents for those rooms, sorted by updatedAt desc
    const codeDocs = await Code.find({ roomId: { $in: roomIds } })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      savedCode: codeDocs
    });
  } catch (error) {
    console.error('Get my saved code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved code',
      error: error.message
    });
  }
};

// @route   GET /api/load-code/:roomId
// @desc    Load code for a room
// @access  Private
exports.loadCode = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Get code document
    let codeDoc = await Code.findOne({ roomId });

    if (!codeDoc) {
      // Create default code if none exists
      codeDoc = await Code.create({
        roomId,
        code: '// Start coding...',
        language: 'javascript'
      });
    }

    res.status(200).json({
      success: true,
      code: codeDoc
    });
  } catch (error) {
    console.error('Load code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading code',
      error: error.message
    });
  }
};

// @route   DELETE /api/room/delete-room/:roomId
// @desc    Delete a room and its code
// @access  Private (creator only)
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a room ID'
      });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room creator can delete this room'
      });
    }

    await Code.deleteMany({ roomId });
    await Room.deleteOne({ roomId });

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting room',
      error: error.message
    });
  }
};
