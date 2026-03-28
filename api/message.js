const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI)
      .then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Message Schema
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

// Counter Schema
const counterSchema = new mongoose.Schema({
  name: String,
  count: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

module.exports = async (req, res) => {
  await dbConnect();

  // ✅ POST
  if (req.method === "POST") {
    try {
      const msg = new Message(req.body);
      await msg.save();

      let counter = await Counter.findOne({ name: "totalMessages" });
      if (!counter) {
        counter = new Counter({ name: "totalMessages", count: 1 });
      } else {
        counter.count += 1;
      }

      await counter.save();

      return res.status(200).json({
        success: true,
        message: "Message saved",
        totalMessages: counter.count
      });

    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ✅ GET
  else if (req.method === "GET") {
    try {
      const data = await Message.find().sort({ date: -1 });
      return res.status(200).json({ success: true, data });

    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ✅ DELETE (UPDATED — supports both formats 🔥)
  else if (req.method === "DELETE") {
    try {
      let id = req.query.id;

      // 👇 handle /api/message/123 format
      if (!id && req.url) {
        const parts = req.url.split("/");
        id = parts[parts.length - 1];
      }

      if (!id) {
        return res.status(400).json({ success: false, message: "ID required" });
      }

      await Message.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Message deleted"
      });

    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ❌ others
  else {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
};
