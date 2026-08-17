require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const Item = require('./models/Item');
const OwnershipRequest = require('./models/OwnershipRequest');
const OwnershipMessage = require('./models/OwnershipMessage');

// Routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const claimRoutes = require('./routes/claims');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ─── DB ──────────────────────────────────────────────────────────────────────
connectDB();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Serve frontend statically
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── SOCKET.IO — OWNERSHIP VERIFICATION CHAT ─────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} [${socket.user.role}]`);

  // Join a chat room for a specific ownership request
  socket.on('join_room', (requestId) => {
    socket.join(`request_${requestId}`);
    console.log(`   → Joined room: request_${requestId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { requestId, message } = data;

      if (!message || !message.trim()) return;

      // Verify request exists and user has access
      const claim = await OwnershipRequest.findById(requestId);
      if (!claim) return;

      if (
        socket.user.role === 'student' &&
        claim.student_id.toString() !== socket.user.id
      ) return;

      const msg = new OwnershipMessage({
        request_id: requestId,
        sender_id: socket.user.id || 'admin',
        sender_role: socket.user.role,
        message: message.trim(),
      });

      await msg.save();

      // Broadcast to everyone in the room
      io.to(`request_${requestId}`).emit('new_message', {
        _id: msg._id,
        request_id: requestId,
        sender_id: socket.user.id,
        sender_role: socket.user.role,
        sender_name: socket.user.name || socket.user.username || 'Admin',
        message: msg.message,
        createdAt: msg.createdAt,
      });
    } catch (err) {
      console.error('Socket send_message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── AUTO-EXPIRY CRON ─────────────────────────────────────────────────────────
// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🕐 Running auto-expiry job...');
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredItems = await Item.find({
      uploaded_at: { $lt: cutoff },
      status: { $nin: ['CLAIMED', 'RETURNED', 'EXPIRED'] },
    });

    for (const item of expiredItems) {
      // Delete image file
      if (item.image_filename) {
        const imgPath = path.join(uploadsDir, item.image_filename);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
          console.log(`  🗑️  Deleted image: ${item.image_filename}`);
        }
      }

      // Delete related ownership requests and messages
      const requests = await OwnershipRequest.find({ item_id: item._id });
      for (const req of requests) {
        await OwnershipMessage.deleteMany({ request_id: req._id });
      }
      await OwnershipRequest.deleteMany({ item_id: item._id });

      // Delete item
      await Item.findByIdAndDelete(item._id);
      console.log(`  ✅ Expired item deleted: ${item._id}`);
    }

    console.log(`🕐 Auto-expiry done — ${expiredItems.length} items removed.`);
  } catch (err) {
    console.error('Auto-expiry error:', err);
  }
});

// ─── CATCH-ALL → CLIENT ───────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
