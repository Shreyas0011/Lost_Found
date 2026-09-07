require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const MongoItemRepository = require('./repositories/mongoItemRepository');
const MongoClaimRepository = require('./repositories/mongoClaimRepository');
const MongoMessageRepository = require('./repositories/mongoMessageRepository');

const itemRepo = new MongoItemRepository();
const claimRepo = new MongoClaimRepository();
const messageRepo = new MongoMessageRepository();


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

// ─── MIDDLEWARE & AIRTIGHT CORS ───────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
app.options('*', cors());
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

const { autoDonateUnclaimedItems } = require('./services/autoDonateService');

// ─── AUTO-EXPIRY & AUTO-DONATE CRON ───────────────────────────────────────────
// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🕐 Running auto-donate & auto-expiry job...');
  try {
    await autoDonateUnclaimedItems();
  } catch (err) {
    console.error('Auto-donate cron error:', err);
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
    console.log(`🚀 Transcend Lost & Found Server (MongoDB + Cloudinary) running on http://localhost:${PORT}`);
  });
}

module.exports = app;
