const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Database setup
const db = new sqlite3.Database("./videos.db");

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    url TEXT
  )
`);

// ✅ File upload config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Upload API
app.post("/upload", upload.single("file"), (req, res) => {
  const { title, description } = req.body;
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;

  db.run(
    "INSERT INTO videos (title, description, url) VALUES (?, ?, ?)",
    [title, description, fileUrl],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "DB insert failed" });
      }
      res.json({ id: this.lastID, title, description, url: fileUrl });
    }
  );
});

// ✅ Get all videos
app.get("/videos", (req, res) => {
  db.all("SELECT * FROM videos", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "DB fetch failed" });
    }
    res.json(rows);
  });
});

// ✅ Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public"))); // serve HTML

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API running on ${PORT}`));
});
