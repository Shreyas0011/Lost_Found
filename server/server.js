require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const SupabaseItemRepository = require('./repositories/supabaseItemRepository');
const SupabaseClaimRepository = require('./repositories/supabaseClaimRepository');
const SupabaseMessageRepository = require('./repositories/supabaseMessageRepository');
const AssetService = require('./services/assetService');

const itemRepo = new SupabaseItemRepository();
const claimRepo = new SupabaseClaimRepository();
const messageRepo = new SupabaseMessageRepository();
const assetService = new AssetService();

// Routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const claimRoutes = require('./routes/claims');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const assetRoutes = require('./routes/assetRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL ? (process.env.CLIENT_URL.includes(',') ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : process.env.CLIENT_URL) : '*';
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Serve frontend statically
const distDir = path.join(__dirname, '..', 'client', 'dist');
const clientDir = fs.existsSync(distDir) ? distDir : path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assets', assetRoutes);

// Centralized error handling middleware
app.use(errorHandler);

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
      const claim = await claimRepo.getClaimById(requestId, false);
      if (!claim) return;

      const studentIdStr = typeof claim.student_id === 'object' ? claim.student_id.id : claim.student_id;
      if (
        socket.user.role === 'student' &&
        studentIdStr !== socket.user.id
      ) return;

      const msg = await messageRepo.createMessage({
        request_id: requestId,
        sender_id: socket.user.id || 'admin',
        sender_role: socket.user.role,
        message: message.trim(),
      });

      // Broadcast to everyone in the room
      io.to(`request_${requestId}`).emit('new_message', {
        _id: msg.id,
        id: msg.id,
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
    const expiredItems = await itemRepo.getExpiringItems(cutoff);

    for (const item of expiredItems) {
      // Delete image file
      if (item.image_filename) {
        const imgPath = path.join(uploadsDir, item.image_filename);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
          console.log(`  🗑️  Deleted image: ${item.image_filename}`);
        }
      }

      // Delete assets from Supabase Storage if present
      if (item.asset_id) {
        try { await assetService.deleteAsset(item.asset_id, { role: 'admin' }, true); } catch (e) {}
      }
      if (item.handover_asset_id) {
        try { await assetService.deleteAsset(item.handover_asset_id, { role: 'admin' }, true); } catch (e) {}
      }

      // Delete related ownership requests and messages
      const requests = await claimRepo.getAllClaims({ item_id: item.id });
      for (const req of requests) {
        await messageRepo.deleteMessagesByRequestId(req.id);
      }
      await claimRepo.deleteClaimsByItem(item.id);

      // Delete item
      await itemRepo.deleteItem(item.id);
      console.log(`  ✅ Expired item deleted: ${item.id}`);
    }

    console.log(`🕐 Auto-expiry done — ${expiredItems.length} items removed.`);
  } catch (err) {
    console.error('Auto-expiry error:', err);
  }
});

// ─── CATCH-ALL → CLIENT ───────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(clientDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Transcend Lost & Found Server running (Vite Client build pending)');
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Supabase PostgreSQL Express Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
