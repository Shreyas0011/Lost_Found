# Lost & Found Module

A full-stack Lost & Found portal built with **Node.js + Express + MongoDB + Socket.IO**.

## Personas

| Persona | Entry |
|---|---|
| Student (Found Item Reporter) | `/login.html` → `/submit.html` |
| Student (Claimant) | `/` → `/item.html?id=…` → `/claim-chat.html?request=…` |
| Admin | `/admin/login.html` → Dashboard |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
Edit `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/lostfound
JWT_SECRET=your_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=5000
```

### 3. Seed student data
Place your student CSV at `server/seed/students.csv` (see existing sample), then:
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev
```

Visit `http://localhost:5000`

---

## CSV Format for Student Import

```
registration_number,name,email,class,section,parent_name,parent_email
REG001,Aarav Sharma,aarav@school.edu,10,A,Rajesh Sharma,rajesh@email.com
```

## Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`
*(Change in `.env` before deploying)*

## Features
- ✅ Student identity verification (no arbitrary accounts)
- ✅ Found item submission with image upload (max 5MB)
- ✅ Admin publish/unpublish/delete/mark-returned workflow
- ✅ Searchable item registry (category, location, color, brand, date)
- ✅ Ownership claim submission
- ✅ Real-time ownership verification chat (Socket.IO)
- ✅ In-person verification request flow
- ✅ Admin two-panel chat interface
- ✅ Automatic expiry (30 days, runs daily via node-cron)
- ✅ JWT authentication (24h expiry)
