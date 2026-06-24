# Quick Start Guide - MIS Report Extractor

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ installed and running
- Git installed

---

## Step 1: Database Setup (2 minutes)

### Create Database
```sql
-- Login to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE mis_report_extractor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'misuser'@'localhost' IDENTIFIED BY 'mispassword123';

-- Grant privileges
GRANT ALL PRIVILEGES ON mis_report_extractor.* TO 'misuser'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

---

## Step 2: Backend Setup (2 minutes)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac

# Edit .env file - Update these values:
# DATABASE_URL="mysql://misuser:mispassword123@localhost:3306/mis_report_extractor"
# JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npm run seed

# Start backend server
npm run dev
```

Backend will run on **http://localhost:5000**

---

## Step 3: Frontend Setup (1 minute)

Open a NEW terminal:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create .env file
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac

# Edit .env file:
# VITE_API_URL=http://localhost:5000/api

# Start frontend development server
npm run dev
```

Frontend will run on **http://localhost:3000**

---

## Step 4: Access the Application

1. Open browser: **http://localhost:3000**
2. Register a new admin account
3. Login and start using the application!

---

## 🎯 Quick Test

### Test API Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "MIS Report Extractor API is running"
}
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "roleName": "admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

---

## 📁 Project Structure

```
mis-report-extractor/
├── server/               # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/ # API controllers
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Utilities
│   │   └── server.ts    # Entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── .env             # Environment variables
│   └── package.json
├── client/              # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.tsx      # Main app
│   ├── .env
│   └── package.json
└── README.md
```

---

## 🔧 Common Issues

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 5000 (Backend)
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (Frontend)
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Issue: Database connection failed
**Solution:**
1. Check MySQL is running:
   ```bash
   # Windows
   sc query MySQL80
   
   # Linux
   sudo systemctl status mysql
   ```
2. Verify DATABASE_URL in `.env`
3. Test connection:
   ```bash
   mysql -u misuser -p mis_report_extractor
   ```

### Issue: Prisma Client not generated
**Solution:**
```bash
cd server
npx prisma generate
```

### Issue: Migration failed
**Solution:**
```bash
cd server
npx prisma migrate reset  # ⚠️ This will delete all data
npx prisma migrate dev
```

---

## 📊 Default Credentials

After registration, you can create test users:

**Admin User:**
- Email: admin@example.com
- Password: admin123
- Role: admin

**Regular User:**
- Email: user@example.com
- Password: user123
- Role: user

---

## 🎯 Next Steps

1. **Upload a Report:**
   - Go to "Upload Report" page
   - Upload an Excel/CSV file with call data
   - Map columns to system fields
   - Process the report

2. **Create a Profile:**
   - Go to "Profiles" page
   - Create a processing profile
   - Save column mappings for reuse

3. **View Dashboard:**
   - Check Executive Dashboard for KPIs
   - View Agent Performance
   - Review Campaign Analytics

4. **Schedule Reports:**
   - Go to "Scheduled Reports"
   - Create daily/weekly/monthly schedules
   - Configure email delivery

---

## 📖 Documentation

- **API Reference:** See `API_REFERENCE.md`
- **Production Deployment:** See `PRODUCTION_DEPLOYMENT.md`
- **Phase 3 Features:** See `PHASE3_COMPLETE.md`
- **Full Documentation:** See `README.md`

---

## 🆘 Need Help?

1. Check the documentation files
2. Review server logs: `server/logs/`
3. Check browser console for frontend errors
4. Verify environment variables in `.env` files

---

## ✅ Verification Checklist

- [ ] MySQL is running
- [ ] Database created successfully
- [ ] Server .env configured correctly
- [ ] Client .env configured correctly
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can register/login successfully
- [ ] Can upload and process a report

---

## 🎉 Success!

Your MIS Report Extractor is now running locally!

**What you have:**
- ✅ Complete report processing system
- ✅ Advanced analytics dashboard
- ✅ Agent performance tracking
- ✅ Campaign management
- ✅ Scheduled reports
- ✅ Report comparison
- ✅ Dynamic KPIs
- ✅ Custom formulas
- ✅ Team management
- ✅ And much more!

**Start building amazing reports! 🚀**
