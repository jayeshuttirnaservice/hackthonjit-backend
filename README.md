# ⚡ JITHON '27 Backend (Express.js & MongoDB)

Backend service for **JITHON '27 // JIT College of Engineering** handling hacker registrations, unique VIP digital pass minting, and attendee statistics with MongoDB Atlas.

---

## 🛠️ Tech Stack

- **Node.js & Express.js** (ES Modules)
- **MongoDB & Mongoose** (Database: `jit_hackthon`)
- **Cors & Dotenv**

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Configuration is pre-set in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://maza_nagar_sevak_1:N4v2IeyrwJfiS9xo@cluster0-mazanagarsevak.qr9xexd.mongodb.net/jit_hackthon?retryWrites=true&w=majority
DB_NAME=jit_hackthon
CLIENT_URL=http://localhost:5173
```

### 3. Run Server
- **Development (Auto-reload)**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & MongoDB connection status |
| `POST` | `/api/register` | Register an attendee & dynamically mint a VIP pass |
| `GET` | `/api/registrations` | Fetch registered attendees (paginated) |
| `GET` | `/api/registrations/stats` | Live count of attendees, in-person vs virtual & tracks |

### Sample Registration Payload (`POST /api/register`)
```json
{
  "name": "Jayesh Patil",
  "email": "jayesh@example.com",
  "college": "JIT College of Engineering",
  "role": "Full-Stack Degen",
  "track": "Autonomous AI",
  "mode": "JIT Campus (In-Person)"
}
```

### Sample Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Hacker pass dynamically minted and registered successfully!",
  "data": {
    "id": "6abb576f312b365ab4a23cac",
    "name": "Jayesh Patil",
    "email": "jayesh@example.com",
    "college": "JIT College of Engineering",
    "role": "Full-Stack Degen",
    "track": "Autonomous AI",
    "mode": "JIT Campus (In-Person)",
    "confCode": "#JITHON-43837",
    "venue": "JIT Campus Labs & Auditorium",
    "createdAt": "2026-09-29T06:15:11.953Z"
  }
}
```
