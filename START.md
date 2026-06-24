# 🚀 Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js v18+ installed (`node --version`)
- [ ] MongoDB installed and running
- [ ] npm or yarn installed

## Installation (First Time Only)

### Step 1: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd ../client
npm install
```

### Step 3: Start MongoDB
**Windows:**
```bash
# MongoDB usually runs as a service automatically
net start MongoDB
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

## Running the Application

You need TWO terminal windows:

### Terminal 1: Start Backend Server
```bash
cd server
npm run dev
```

**Wait for:**
```
✅ MongoDB connected successfully
🚀 Server is running on port 5000
```

### Terminal 2: Start Frontend Application
```bash
cd client
npm run dev
```

**Wait for:**
```
Local: http://localhost:3000
```

## Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## First Time Setup

1. **Register**: Click "Don't have an account? Register"
2. Fill in details:
   - Name: Admin User
   - Email: admin@example.com
   - Password: password123
   - Role: Admin
3. Click "Register"
4. Login with your credentials

## Test the Application

1. Navigate to "Upload Report"
2. Create a test Excel file with columns:
   - Agent Name
   - Call Status
   - Phone Number
   - Call Date
3. Upload the file
4. Map columns
5. Process report
6. View results!

## Stopping the Application

In both terminal windows, press: `Ctrl + C`

To stop MongoDB:
```bash
# Windows
net stop MongoDB

# Mac
brew services stop mongodb-community

# Linux
sudo systemctl stop mongod
```

## Troubleshooting

**MongoDB Connection Error:**
- Check if MongoDB is running
- Verify port 27017 is available

**Port Already in Use:**
- Change PORT in server/.env
- Update VITE_API_URL in client/.env

**Module Not Found:**
- Delete node_modules folders
- Run `npm install` again

## Need More Help?

Check these files:
- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup
- `API_DOCUMENTATION.md` - API reference
- `CREATE_TEST_DATA.md` - Test data samples

---

**Ready to go? Start with Terminal 1, then Terminal 2!** 🎉
