const router = require("express").Router();
const Scan = require("../models/Scan");
const authMiddleware = require("../middleware/auth");

// All routes require auth
router.use(authMiddleware);

// POST /api/scans — save a scan
router.post("/", async (req, res) => {
  try {
    const { barcode, result } = req.body;
    if (!barcode || !result) {
      return res.status(400).json({ message: "barcode and result are required." });
    }

    // Update if barcode already scanned by this user, otherwise insert
    const scan = await Scan.findOneAndUpdate(
      { user: req.user._id, barcode },
      { barcode, result, user: req.user._id, scannedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ scan });
  } catch (err) {
    res.status(500).json({ message: "Failed to save scan." });
  }
});

// GET /api/scans/history — get user's scan history
router.get("/history", async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user._id })
      .sort({ scannedAt: -1 })
      .limit(100)
      .lean();

    res.json({ scans });
  } catch (err) {
    res.status(500).json({ message: "Failed to load history." });
  }
});

// GET /api/scans/cached/:barcode — check if this barcode is cached
router.get("/cached/:barcode", async (req, res) => {
  try {
    const scan = await Scan.findOne({
      user: req.user._id,
      barcode: req.params.barcode,
    }).lean();

    if (scan) {
      return res.json({ found: true, scan });
    }
    res.json({ found: false });
  } catch (err) {
    res.status(500).json({ message: "Cache lookup failed." });
  }
});

// GET /api/scans/stats — get user scan stats
router.get("/stats", async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user._id })
      .sort({ scannedAt: -1 })
      .lean();

    const stats = { halal: 0, haram: 0, mushbooh: 0, unknown: 0, total: scans.length };

    for (const scan of scans) {
      const status = scan.result?.halal_status;
      if (status === "halal") stats.halal++;
      else if (status === "haram") stats.haram++;
      else if (status === "mushbooh") stats.mushbooh++;
      else stats.unknown++;
    }

    res.json({
      ...stats,
      recentProducts: scans.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats." });
  }
});

module.exports = router;
