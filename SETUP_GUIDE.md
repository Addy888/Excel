# Quick Setup Guide

## Step-by-Step Installation

### 1. Install Prerequisites

**Install Node.js**:
- Download from https://nodejs.org/
- Recommended: v18 LTS or higher
- Verify: `node --version`

**Install MongoDB**:
- Windows: Download from https://www.mongodb.com/try/download/community
- Mac: `brew install mongodb-community`
- Linux: Follow official MongoDB installation guide
- Verify: `mongod --version`

### 2. Setup Backend

```bash
# Open terminal in project root
cd mis-report-extractor/server

# Install packages
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your settings
# Windows: notepad .env
# Mac/Linux: nano .env

# Required settings in .env:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/mis_report_extractor
# JWT_SECRET=mySecretKey123!@#
# NODE_ENV=development
```

### 3. Setup Frontend

```bash
# Open a new terminal
cd mis-report-extractor/client

# Install packages
npm install

# Copy environment file
cp .env.example .env

# Edit .env file
# VITE_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

**Windows**:
```bash
# If installed as service, it's already running
# Check with: net start MongoDB

# Or start manually:
mongod --dbpath "C:\data\db"
```

**Mac/Linux**:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or
brew services start mongodb-community
```

### 5. Start the Application

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
```

Wait for: `✅ MongoDB connected successfully` and `🚀 Server is running on port 5000`

**Terminal 2 - Frontend**:
```bash
cd client
npm run dev
```

Wait for: `Local: http://localhost:3000`

### 6. Access the Application

Open your browser and go to: `http://localhost:3000`

### 7. Create Your First User

1. Click "Don't have an account? Register"
2. Fill in:
   - Name: Your Name
   - Email: admin@example.com
   - Password: password123
   - Role: Admin
3. Click "Register"
4. Login with your credentials

### 8. Upload Your First Report

1. Navigate to "Upload Report"
2. Create a test Excel file with columns:
   ```
   Agent Name | Call Status  | Phone Number | Call Date
   John Doe   | Connected    | 1234567890   | 2024-01-15
   Jane Smith | Not Connected| 9876543210   | 2024-01-15
   ```
3. Drag and drop the file
4. Map the columns
5. Click "Process Report"

## Common Setup Issues

### Issue: MongoDB Connection Failed
**Solution**: 
- Ensure MongoDB is running
- Check if port 27017 is available
- Verify MONGODB_URI in .env

### Issue: Port 5000 Already in Use
**Solution**: 
- Change PORT in server/.env to 5001
- Update VITE_API_URL in client/.env to match

### Issue: npm install fails
**Solution**: 
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and try again
- Check internet connection

### Issue: Cannot upload files
**Solution**: 
- Check server/uploads folder exists
- Verify folder permissions
- Check file size (must be under 10MB)

## Need Help?

Check the main README.md for detailed documentation.
