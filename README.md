# MIS Report Extractor

A complete production-ready web application for uploading dialer reports in Excel (.xlsx, .xls) or CSV format and generating MIS reports automatically based on predefined business rules.

## 🚀 Features

### Core Features
- **Dashboard**: Professional MIS dashboard with statistics and recent activity
- **Report Upload**: Drag and drop interface for Excel/CSV files
- **Report Processing Engine**: Rule-based processing (no AI/ML)
- **Dynamic Column Mapping**: Map uploaded columns to system columns
- **MIS Report Generation**: Generate formatted Excel reports with multiple sheets
- **Report History**: View, download, and manage all reports
- **Authentication**: JWT-based authentication with role management (Admin/User)

### Business Logic
The system automatically calculates:
- Total Dialed Calls
- Connected/Not Connected Calls
- Qualified/In Process/Converted/Rejected Leads
- Duplicate/Unique Numbers
- Agent-wise Summary
- Date-wise Summary
- Status-wise Summary

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI components
- React Router
- Axios
- React Dropzone

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- JWT Authentication
- Multer (file uploads)
- xlsx & exceljs (Excel processing)

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**

## 🔧 Installation & Setup

### 1. Clone/Navigate to the project
```bash
cd mis-report-extractor
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/mis_report_extractor
# JWT_SECRET=your_secret_key_here
# NODE_ENV=development
```

### 3. Frontend Setup

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# VITE_API_URL=http://localhost:5000/api
```

### 4. MongoDB Setup

Make sure MongoDB is running on your system:

```bash
# For Windows (if MongoDB installed as service)
net start MongoDB

# For Linux/Mac
sudo systemctl start mongod
# or
mongod --dbpath /path/to/data/directory
```

## 🚀 Running the Application

### Start Backend Server

```bash
# From server directory
cd server

# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The backend server will start on `http://localhost:5000`

### Start Frontend Application

```bash
# From client directory (in a new terminal)
cd client

# Development mode
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📱 Usage

### 1. Register/Login

- Open `http://localhost:3000/login`
- Register a new account (choose Admin or User role)
- Login with your credentials

**Default Test Users** (create these manually or via registration):
- Admin: admin@example.com / password123
- User: user@example.com / password123

### 2. Upload Report

1. Navigate to "Upload Report" from the sidebar
2. Drag and drop your Excel/CSV file or click to browse
3. Wait for upload to complete
4. Map your file columns to system columns:
   - Agent Name → Agent
   - Call Status → Status
   - Phone Number → Mobile
   - Call Date → Date
   - etc.
5. Click "Process Report"
6. View the generated summary

### 3. View Reports

- Navigate to "Report History"
- Search for specific reports
- View detailed information
- Download generated MIS reports
- Delete reports (Admin only)

### 4. Dashboard

- View overall statistics
- See recent activity
- Quick access to reports

## 📊 Report Format

### Input File Requirements

Your Excel/CSV file should contain columns like:
- Agent Name or Agent
- Call Status or Status
- Phone Number or Mobile
- Call Date or Date
- Call Duration (optional)
- Remarks (optional)

### Output Report Structure

The generated MIS report contains:

1. **Summary Sheet**: Overall statistics
2. **Agent Summary Sheet**: Performance by agent
3. **Date Summary Sheet**: Calls by date
4. **Status Summary Sheet**: Distribution by status

## 🔐 Authentication & Authorization

### User Roles

**Admin**:
- Upload reports
- Process reports
- View all reports
- Download reports
- Delete reports

**User**:
- View reports
- Download reports

## 📁 Project Structure

```
mis-report-extractor/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── reportController.ts
│   │   │   └── columnMappingController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── upload.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── UploadedReport.ts
│   │   │   ├── ProcessedReport.ts
│   │   │   └── ColumnMapping.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── reportRoutes.ts
│   │   │   └── columnMappingRoutes.ts
│   │   ├── services/
│   │   ├── utils/
│   │   │   ├── excelParser.ts
│   │   │   ├── reportProcessor.ts
│   │   │   └── excelGenerator.ts
│   │   └── server.ts
│   ├── uploads/
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Input.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ColumnMapper.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── ReportTable.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── UploadPage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   └── ReportDetailPage.tsx
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Reports
- `POST /api/upload` - Upload report file (Admin only)
- `POST /api/process` - Process uploaded report (Admin only)
- `GET /api/reports` - Get all reports (with pagination and search)
- `GET /api/reports/:id` - Get report by ID
- `GET /api/download/:id` - Download processed report
- `DELETE /api/reports/:id` - Delete report (Admin only)
- `GET /api/dashboard/stats` - Get dashboard statistics

### Column Mappings
- `POST /api/mappings` - Create column mapping
- `GET /api/mappings` - Get user's mappings
- `PUT /api/mappings/:id` - Update mapping
- `DELETE /api/mappings/:id` - Delete mapping

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes
- **Professional Dashboard**: Clean corporate design
- **Drag & Drop Upload**: Easy file upload interface
- **Progress Indicators**: Real-time upload and processing feedback
- **Data Tables**: Sortable and searchable tables
- **Pagination**: Efficient data display
- **Status Badges**: Visual status indicators

## ⚙️ Configuration

### Environment Variables

**Server (.env)**:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mis_report_extractor
JWT_SECRET=your_secure_secret_key
NODE_ENV=development
```

**Client (.env)**:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

### Sample Data

Create a test Excel file with the following columns:
- Agent Name
- Call Status
- Phone Number
- Call Date
- Remarks

Sample data:
```
Agent Name | Call Status  | Phone Number | Call Date   | Remarks
John Doe   | Connected    | 1234567890   | 2024-01-15  | Follow up
Jane Smith | Not Connected| 9876543210   | 2024-01-15  | Busy
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify MongoDB port (default: 27017)

2. **Port Already in Use**
   - Change PORT in server/.env
   - Update VITE_API_URL in client/.env

3. **File Upload Fails**
   - Check file format (.xlsx, .xls, or .csv)
   - Ensure file size is under 10MB
   - Verify uploads folder exists and has write permissions

4. **Cannot Login**
   - Clear browser localStorage
   - Check JWT_SECRET is set
   - Verify user exists in database

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Development

### Build for Production

**Backend**:
```bash
cd server
npm run build
npm start
```

**Frontend**:
```bash
cd client
npm run build
# Deploy the 'dist' folder to your web server
```

## 🔒 Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Regular security audits recommended
- Keep dependencies updated

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check MongoDB logs
4. Review browser console for frontend errors

## 🎯 Future Enhancements

Potential features for future versions:
- Email notifications
- Report scheduling
- Advanced filters
- Export to multiple formats (PDF, CSV)
- Bulk upload
- API rate limiting
- Activity logs
- User management dashboard
- Custom report templates

---

**Made with ❤️ for efficient MIS reporting**
