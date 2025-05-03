const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const auth = require("../middleware/auth");

// @route   POST api/sessions
// @desc    Create a new session
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { attentiveTime, distractedTime, attentionSwitches, totalDuration } =
      req.body;

    const newSession = new Session({
      user: req.user.id,
      attentiveTime,
      distractedTime,
      attentionSwitches,
      totalDuration,
    });

    const session = await newSession.save();
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET api/sessions
// @desc    Get all sessions for a user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET api/sessions/stats
// @desc    Get user's stats
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    // Get all sessions for the user
    const sessions = await Session.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    // Initialize stats
    const stats = {
      totalSessions: sessions.length,
      totalAttentiveTime: 0,
      totalDistractedTime: 0,
      averageAttentionSpan: 0,
      latestSessions: sessions.slice(0, 5), // Get 5 most recent sessions
    };

    // Calculate aggregated stats
    if (sessions.length > 0) {
      // Sum up times
      sessions.forEach((session) => {
        stats.totalAttentiveTime += session.attentiveTime;
        stats.totalDistractedTime += session.distractedTime;
      });

      // Calculate average attention span
      const totalAttentionSwitches = sessions.reduce(
        (sum, session) => sum + session.attentionSwitches,
        0
      );

      if (totalAttentionSwitches > 0) {
        stats.averageAttentionSpan =
          stats.totalAttentiveTime / totalAttentionSwitches;
      }
    }

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET api/sessions/:id
// @desc    Get a specific session
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    // Check if session exists
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user owns the session
    if (session.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE api/sessions/:id
// @desc    Delete a session
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    // Check if session exists
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user owns the session
    if (session.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await session.remove();
    res.json({ message: "Session removed" });
  } catch (err) {
    console.error(err);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
