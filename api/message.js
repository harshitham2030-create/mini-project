// api/message.js
const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(m => m);
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

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const msg = new Message(req.body);
      await msg.save();

      let counter = await Counter.findOne({ name: "totalMessages" });
      if (!counter) counter = new Counter({ name: "totalMessages", count: 1 });
      else counter.count += 1;
      await counter.save();

      return res.status(200).json({ success: true, message: "Message saved", totalMessages: counter.count });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } 
  else if (req.method === "GET") {
    try {
      const data = await Message.find().sort({ date: -1 });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } 
  else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
