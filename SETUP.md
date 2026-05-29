# WorkPulse HRM - Setup Guide

## Prerequisites
- Node.js v18+
- MongoDB Atlas Account (Free)
- Cloudinary Account (Free)

---

## Step 1: Server Setup

```bash
cd server
npm install
```

`.env` file banao (`.env.example` copy karo):
```bash
cp .env.example .env
```

`.env` mein fill karo:
```
MONGODB_URI=mongodb+srv://...  ← MongoDB Atlas connection string
JWT_SECRET=koi_bhi_random_string_yahan_likho
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OFFICE_LATITUDE=28.6139    ← Apne office ki latitude
OFFICE_LONGITUDE=77.2090   ← Apne office ki longitude
OFFICE_RADIUS=100          ← Meters mein radius
```

---

## Step 2: Client Setup

```bash
cd client
npm install
```

---

## Step 3: Run Karo

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

App open hoga: http://localhost:3000

---

## Step 4: First Admin Account

Server start hone ke baad, ek API call karo:

```bash
curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@company.com",
    "password": "Admin@123",
    "companyName": "Your Company Name",
    "officeLat": 28.6139,
    "officeLon": 77.2090
  }'
```

Ya Postman/Thunder Client se POST karo.

---

## Step 5: Office Location Set Karo

Google Maps pe jao → Apne office pe right-click karo → "What's here?" → Latitude, Longitude copy karo.

Admin login ke baad Settings page pe jao aur office coordinates update karo.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Tailwind CSS + Redux Toolkit |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Auth | JWT Token + Role-Based |
| File Upload | Cloudinary |
| Charts | Recharts |

---

## Roles

| Role | Access |
|------|--------|
| `super_admin` | Full control + settings |
| `hr_admin` | Employee management + leaves |
| `employee` | Self attendance + leaves + docs |

---

## Default Employee Password

Jab admin new employee create karta hai, default password hota hai:
**`WorkPulse@123`**

Employee pehli login ke baad apna password change kare.

---

## API Endpoints

```
POST   /api/auth/setup          → First admin setup
POST   /api/auth/login          → Login
GET    /api/auth/me             → Current user

POST   /api/attendance/checkin  → Check in (location required)
POST   /api/attendance/checkout → Check out
GET    /api/attendance/me       → My attendance records
GET    /api/attendance/today    → Today's status
GET    /api/attendance/admin    → Admin view all attendance

POST   /api/leaves/apply        → Apply leave
GET    /api/leaves/me           → My leaves
PUT    /api/leaves/:id/action   → Approve/Reject (Admin)
PUT    /api/leaves/:id/cancel   → Cancel leave

GET    /api/employees           → All employees (Admin)
POST   /api/employees           → Create employee (Admin)
PUT    /api/employees/:id       → Update employee (Admin)
POST   /api/employees/documents/upload → Upload document

GET    /api/notifications       → My notifications
PUT    /api/settings            → Update company settings (Super Admin)
```

---

## Deployment

### Backend (Render.com - Free)
1. GitHub pe push karo
2. Render.com pe New Web Service
3. Environment variables add karo
4. Deploy!

### Frontend (Vercel - Free)
1. `client` folder Vercel pe deploy karo
2. `REACT_APP_API_URL` set karo backend URL ke saath

### Database (MongoDB Atlas - Free)
- Free M0 cluster use karo
- IP Whitelist: 0.0.0.0/0 (sabke liye)
