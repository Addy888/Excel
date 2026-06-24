# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Login
**POST** `/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Get Profile
**GET** `/auth/profile`

Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Report Endpoints

### Upload Report
**POST** `/upload`

Upload an Excel or CSV file for processing.

**Authorization:** Admin only

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "message": "File uploaded successfully",
  "report": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "fileName": "dialer_report.xlsx",
    "recordsCount": 150,
    "uploadDate": "2024-01-15T10:30:00.000Z"
  },
  "headers": ["Agent Name", "Call Status", "Phone Number", "Call Date", "Remarks"]
}
```

**Error Responses:**
- `400`: No file uploaded
- `400`: Invalid file format
- `401`: Unauthorized
- `403`: Admin access required

---

### Process Report
**POST** `/process`

Process an uploaded report with column mapping.

**Authorization:** Admin only

**Request Body:**
```json
{
  "reportId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "columnMapping": {
    "Agent": "Agent Name",
    "Status": "Call Status",
    "Mobile": "Phone Number",
    "Date": "Call Date"
  }
}
```

**Response:**
```json
{
  "message": "Report processed successfully",
  "processedReport": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "summary": {
      "totalDialed": 150,
      "connectedCalls": 95,
      "notConnectedCalls": 55,
      "qualifiedLeads": 45,
      "inProcessLeads": 20,
      "convertedLeads": 15,
      "rejectedLeads": 25,
      "duplicateNumbers": 10,
      "uniqueNumbers": 140
    },
    "processedDate": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### Get All Reports
**GET** `/reports`

Get paginated list of all reports.

**Authorization:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `search` (optional): Search by file name

**Example:**
```
GET /reports?page=1&limit=10&search=dialer
```

**Response:**
```json
{
  "reports": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "originalName": "dialer_report.xlsx",
      "recordsCount": 150,
      "fileSize": 45678,
      "uploadDate": "2024-01-15T10:30:00.000Z",
      "status": "processed",
      "uploadedBy": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### Get Report by ID
**GET** `/reports/:id`

Get detailed information about a specific report.

**Authorization:** Required

**Response:**
```json
{
  "uploadedReport": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "originalName": "dialer_report.xlsx",
    "fileName": "1705318200000-dialer_report.xlsx",
    "filePath": "/uploads/1705318200000-dialer_report.xlsx",
    "fileSize": 45678,
    "uploadDate": "2024-01-15T10:30:00.000Z",
    "recordsCount": 150,
    "status": "processed",
    "uploadedBy": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "processedReport": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "uploadedReportId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "processedDate": "2024-01-15T10:35:00.000Z",
    "summary": {
      "totalDialed": 150,
      "connectedCalls": 95,
      "notConnectedCalls": 55,
      "qualifiedLeads": 45,
      "inProcessLeads": 20,
      "convertedLeads": 15,
      "rejectedLeads": 25,
      "duplicateNumbers": 10,
      "uniqueNumbers": 140
    },
    "agentWiseSummary": [
      {
        "agent": "John Doe",
        "totalCalls": 75,
        "connected": 50,
        "notConnected": 25,
        "qualified": 20,
        "converted": 8
      }
    ],
    "dateWiseSummary": [
      {
        "date": "2024-01-15",
        "totalCalls": 80,
        "connected": 50,
        "notConnected": 30
      }
    ],
    "statusWiseSummary": [
      {
        "status": "Connected",
        "count": 95
      },
      {
        "status": "Not Connected",
        "count": 55
      }
    ],
    "processedBy": {
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

---

### Download Report
**GET** `/download/:id`

Download the generated MIS report Excel file.

**Authorization:** Required

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download

---

### Delete Report
**DELETE** `/reports/:id`

Delete a report and its associated files.

**Authorization:** Admin only

**Response:**
```json
{
  "message": "Report deleted successfully"
}
```

---

### Get Dashboard Statistics
**GET** `/dashboard/stats`

Get dashboard overview statistics.

**Authorization:** Required

**Response:**
```json
{
  "totalUploaded": 25,
  "totalProcessed": 23,
  "lastProcessed": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "processedDate": "2024-01-15T10:35:00.000Z",
    "uploadedReportId": {
      "originalName": "dialer_report.xlsx"
    }
  },
  "recentActivity": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "originalName": "dialer_report.xlsx",
      "recordsCount": 150,
      "uploadDate": "2024-01-15T10:30:00.000Z",
      "status": "processed",
      "fileSize": 45678,
      "uploadedBy": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

---

## Column Mapping Endpoints

### Create Mapping
**POST** `/mappings`

Create a new column mapping template.

**Authorization:** Required

**Request Body:**
```json
{
  "name": "Standard Dialer Mapping",
  "mappings": [
    {
      "uploadedColumn": "Agent Name",
      "systemColumn": "Agent"
    },
    {
      "uploadedColumn": "Call Status",
      "systemColumn": "Status"
    },
    {
      "uploadedColumn": "Phone Number",
      "systemColumn": "Mobile"
    }
  ],
  "isDefault": false
}
```

**Response:**
```json
{
  "message": "Mapping created successfully",
  "mapping": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Standard Dialer Mapping",
    "mappings": [...],
    "createdBy": "65a1b2c3d4e5f6g7h8i9j0k1",
    "isDefault": false,
    "createdAt": "2024-01-15T10:40:00.000Z"
  }
}
```

---

### Get Mappings
**GET** `/mappings`

Get all column mappings created by the current user.

**Authorization:** Required

**Response:**
```json
{
  "mappings": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Standard Dialer Mapping",
      "mappings": [...],
      "isDefault": true,
      "createdAt": "2024-01-15T10:40:00.000Z"
    }
  ]
}
```

---

### Update Mapping
**PUT** `/mappings/:id`

Update an existing column mapping.

**Authorization:** Required

**Request Body:**
```json
{
  "name": "Updated Mapping Name",
  "mappings": [...],
  "isDefault": true
}
```

---

### Delete Mapping
**DELETE** `/mappings/:id`

Delete a column mapping.

**Authorization:** Required

**Response:**
```json
{
  "message": "Mapping deleted successfully"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider:
- 100 requests per 15 minutes per IP for authentication
- 1000 requests per hour for authenticated users

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"admin"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Upload File
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@/path/to/report.xlsx"
```

### Get Reports
```bash
curl -X GET http://localhost:5000/api/reports \
  -H "Authorization: Bearer <your_token>"
```

---

## Testing with Postman

1. Import the collection by creating requests for each endpoint
2. Set up environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (obtained from login)
3. Use {{base_url}} and {{token}} in requests

---

## WebSocket Support

Currently not implemented. Future versions may include:
- Real-time processing status updates
- Live dashboard statistics
- Notification system
