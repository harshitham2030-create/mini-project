// api/contact.js
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

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const newContact = new Contact(req.body);
      await newContact.save();
      return res.status(200).json({ success: true, data: newContact });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } 
  else if (req.method === "GET") {
    try {
      const data = await Contact.find().sort({ date: -1 });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } 
  else if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      const deleted = await Contact.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, error: "Contact not found" });
      return res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } 
  else {
    res.setHeader("Allow", ["POST", "GET", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
