require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------
// Middleware
// ------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ------------------------
// MongoDB Connection (FIXED)
// ------------------------
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // ✅ FIX: Removed old options
    cached.promise = mongoose.connect(process.env.MONGO_URI)
      .then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ------------------------
// Counter Schema
// ------------------------
const counterSchema = new mongoose.Schema({
  name: String,
  count: { type: Number, default: 0 }
});
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// ------------------------
// Contact Schema
// ------------------------
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

// ------------------------
// Message Schema
// ------------------------
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

// ------------------------
// API Routes
// ------------------------

// CREATE a contact
app.post("/api/contacts", async (req, res) => {
  try {
    await dbConnect();
    const newContact = new Contact(req.body);
    await newContact.save();
    res.json({ success: true, data: newContact });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// READ all contacts
app.get("/api/contacts", async (req, res) => {
  try {
    await dbConnect();
    const data = await Contact.find().sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a contact
app.delete("/api/contacts/:id", async (req, res) => {
  try {
    await dbConnect();
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------
// Serve frontend
// ------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------------------------
// Start server
// ------------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
