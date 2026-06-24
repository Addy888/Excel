# MIS Report Extractor - Complete API Reference

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication
All API endpoints (except login/register) require JWT authentication.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication APIs

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "roleName": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "roleName": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Login and get JWT token.

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
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "roleName": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "roleName": "user"
  }
}
```

---

## 2. Processing Profile APIs

### POST /profiles
Create a new processing profile.

**Request Body:**
```json
{
  "name": "Campaign Report",
  "description": "Standard campaign reporting profile",
  "columnMappingId": 1,
  "rules": [
    {
      "field": "status",
      "condition": "equals",
      "value": "Connected"
    }
  ],
  "filters": {
    "dateRange": "last30days"
  },
  "isDefault": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processing profile created successfully",
  "data": {
    "id": 1,
    "name": "Campaign Report",
    "description": "Standard campaign reporting profile",
    "isDefault": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### GET /profiles
Get all processing profiles.

**Query Parameters:**
- `search` (optional): Search by name or description
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Campaign Report",
      "description": "Standard campaign reporting profile",
      "isDefault": false,
      "columnMapping": {...},
      "createdBy": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### GET /profiles/default
Get default processing profile.

### GET /profiles/:id
Get processing profile by ID.

### PUT /profiles/:id
Update processing profile.

### DELETE /profiles/:id
Delete processing profile.

---

## 3. Campaign APIs

### POST /campaigns
Create a new campaign.

**Request Body:**
```json
{
  "name": "Q1 2024 Campaign",
  "description": "First quarter sales campaign"
}
```

### GET /campaigns
Get all campaigns.

**Query Parameters:**
- `search` (optional): Search by name
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

### GET /campaigns/:id/analytics
Get campaign analytics with date filtering.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [...],
    "summary": {
      "totalDialed": 5000,
      "totalConnected": 3500,
      "totalQualified": 1200,
      "totalConverted": 450,
      "avgConversionRate": 9.0,
      "connectionRate": 70.0,
      "qualificationRate": 34.29
    }
  }
}
```

### GET /campaigns/reports
Get all campaign reports.

### POST /campaigns/reports
Create or update campaign report.

**Request Body:**
```json
{
  "campaignId": 1,
  "reportDate": "2024-01-15",
  "totalDialed": 1000,
  "connected": 700,
  "qualified": 250,
  "converted": 90,
  "agentCount": 10,
  "metrics": {
    "avgCallDuration": 180
  }
}
```

### GET /campaigns/:id/agents
Get agents assigned to a campaign.

---

## 4. Agent APIs

### POST /agents
Create a new agent.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "campaignId": 1,
  "teamId": 1
}
```

### GET /agents
Get all agents with filtering.

**Query Parameters:**
- `search` (optional): Search by name or email
- `campaignId` (optional): Filter by campaign
- `teamId` (optional): Filter by team
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

### GET /agents/performance/dashboard
Get agent performance dashboard.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)
- `campaignId` (optional)
- `teamId` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "topPerformers": [
      {
        "rank": 1,
        "agentName": "Jane Smith",
        "campaign": "Q1 2024",
        "team": "Team Alpha",
        "totalCalls": 500,
        "conversionRate": 12.5,
        "productivityScore": 85.3
      }
    ],
    "allAgents": [...],
    "summary": {
      "totalAgents": 50,
      "avgCalls": 350,
      "avgConversionRate": 8.5
    }
  }
}
```

### GET /agents/:id/performance
Get individual agent performance.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

### POST /agents/performance
Create or update agent performance record.

---

## 5. Report Comparison APIs

### POST /comparisons
Compare two reports.

**Request Body:**
```json
{
  "report1Id": 1,
  "report2Id": 2,
  "name": "Yesterday vs Today"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison": {
      "summary": {
        "totalDialed": {
          "report1": 1000,
          "report2": 1200,
          "difference": 200,
          "percentChange": 20.0
        },
        "connectedCalls": {...},
        "qualifiedLeads": {...},
        "convertedLeads": {...}
      },
      "insights": [
        "Total dialed calls increased by 20.0% (200 more calls)",
        "Connection rate improved by 5.2%"
      ]
    }
  }
}
```

### GET /comparisons
Get all saved comparisons.

### GET /comparisons/:id
Get comparison by ID.

### DELETE /comparisons/:id
Delete a comparison.

---

## 6. Scheduled Reports APIs

### POST /scheduled-reports
Create a scheduled report. (Admin only)

**Request Body:**
```json
{
  "name": "Daily MIS Report",
  "description": "Automated daily report",
  "frequency": "daily",
  "schedule": "0 9 * * *",
  "templateId": 1,
  "recipients": ["admin@example.com", "manager@example.com"],
  "subject": "Daily MIS Report - {{date}}",
  "emailBody": "<h2>Daily Report</h2><p>Please find attached the daily MIS report.</p>"
}
```

### GET /scheduled-reports
Get all scheduled reports.

**Query Parameters:**
- `isActive` (optional): Filter by active status
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

### GET /scheduled-reports/:id
Get scheduled report by ID.

### PUT /scheduled-reports/:id
Update scheduled report. (Admin only)

### DELETE /scheduled-reports/:id
Delete scheduled report. (Admin only)

### POST /scheduled-reports/:id/trigger
Manually trigger a scheduled report. (Admin only)

### GET /scheduled-reports/:id/runs
Get execution history for a scheduled report.

---

## 7. Executive Dashboard APIs

### GET /dashboard/executive
Get executive dashboard with comprehensive KPIs.

**Query Parameters:**
- `startDate` (optional, default: last 30 days)
- `endDate` (optional, default: today)

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalCalls": 50000,
      "totalConnected": 35000,
      "totalQualified": 12000,
      "totalConverted": 4500,
      "totalUnique": 48000,
      "conversionRate": 9.0,
      "connectionRate": 70.0,
      "qualificationRate": 34.29,
      "activeAgents": 50,
      "activeCampaigns": 5,
      "totalReports": 120
    },
    "trendData": [
      {
        "date": "2024-01-15",
        "totalDialed": 1000,
        "connected": 700,
        "qualified": 250,
        "converted": 90
      }
    ],
    "topAgents": [...],
    "recentActivity": [...],
    "statusDistribution": {
      "connected": 35000,
      "notConnected": 15000,
      "qualified": 12000,
      "inProcess": 3000,
      "converted": 4500,
      "rejected": 2000
    }
  }
}
```

### GET /dashboard/stats
Get detailed statistics for admins.

### GET /dashboard/downloads
Get download center data.

**Query Parameters:**
- `search` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

---

## 8. Report Designer APIs

### POST /report-designer
Create a custom report design.

**Request Body:**
```json
{
  "name": "Custom Sales Report",
  "description": "Customized sales metrics report",
  "columns": ["agent", "totalDialed", "connected", "qualified", "converted"],
  "metrics": [
    {
      "name": "Conversion Rate",
      "expression": "(convertedLeads / totalDialed) * 100"
    }
  ],
  "summaries": [
    {
      "name": "Total Agents",
      "type": "count",
      "field": "agentWiseSummary"
    }
  ]
}
```

### GET /report-designer
Get all report designs.

### GET /report-designer/:id
Get report design by ID.

### PUT /report-designer/:id
Update report design.

### DELETE /report-designer/:id
Delete report design. (Admin only)

### POST /report-designer/apply
Apply a report design to data.

**Request Body:**
```json
{
  "designId": 1,
  "reportId": 5
}
```

---

## 9. Formula Builder APIs

### POST /formulas
Create a custom formula. (Admin only)

**Request Body:**
```json
{
  "name": "Custom Conversion Rate",
  "description": "Enhanced conversion calculation",
  "expression": "(qualifiedLeads / connectedCalls) * 100",
  "variables": ["qualifiedLeads", "connectedCalls"],
  "category": "conversion",
  "isActive": true
}
```

### GET /formulas
Get all formulas.

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional)
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

### GET /formulas/built-in
Get built-in formulas.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Conversion Rate",
      "description": "Percentage of converted leads from total dialed",
      "expression": "(convertedLeads / totalDialed) * 100",
      "variables": ["convertedLeads", "totalDialed"],
      "category": "conversion"
    }
  ]
}
```

### GET /formulas/:id
Get formula by ID.

### PUT /formulas/:id
Update formula. (Admin only)

### DELETE /formulas/:id
Delete formula. (Admin only)

### POST /formulas/test
Test a formula with sample data.

**Request Body:**
```json
{
  "expression": "(qualifiedLeads / connectedCalls) * 100",
  "variables": ["qualifiedLeads", "connectedCalls"],
  "sampleData": {
    "qualifiedLeads": 40,
    "connectedCalls": 80
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expression": "(qualifiedLeads / connectedCalls) * 100",
    "result": 50.0,
    "sampleData": {
      "qualifiedLeads": 40,
      "connectedCalls": 80
    }
  }
}
```

---

## 10. Dynamic KPI APIs

### POST /kpis
Create a dynamic KPI. (Admin only)

**Request Body:**
```json
{
  "name": "Today's Conversion Rate",
  "description": "Real-time conversion rate for today",
  "formula": "(convertedLeads / totalDialed) * 100",
  "category": "conversion",
  "displayFormat": "percentage",
  "thresholds": {
    "excellent": 15,
    "good": 10,
    "average": 5,
    "poor": 0
  },
  "isActive": true
}
```

### GET /kpis
Get all KPIs.

### GET /kpis/built-in
Get built-in KPIs.

### GET /kpis/values
Calculate KPI values for dashboard.

**Query Parameters:**
- `startDate` (optional, default: today)
- `endDate` (optional, default: today)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Today's Conversion Rate",
      "description": "Real-time conversion rate for today",
      "value": 12.5,
      "displayFormat": "percentage",
      "status": "good",
      "category": "conversion",
      "thresholds": {
        "excellent": 15,
        "good": 10,
        "average": 5,
        "poor": 0
      }
    }
  ],
  "aggregateData": {
    "totalDialed": 1000,
    "connectedCalls": 700,
    "qualifiedLeads": 250,
    "convertedLeads": 125,
    "uniqueNumbers": 950
  }
}
```

### PUT /kpis/:id
Update KPI. (Admin only)

### DELETE /kpis/:id
Delete KPI. (Admin only)

---

## 11. Team Management APIs

### POST /teams
Create a team. (Admin only)

**Request Body:**
```json
{
  "name": "Team Alpha",
  "description": "Primary sales team"
}
```

### GET /teams
Get all teams.

### GET /teams/:id
Get team by ID with statistics.

### PUT /teams/:id
Update team. (Admin only)

### DELETE /teams/:id
Delete team. (Admin only)

### GET /teams/:id/performance
Get team performance metrics.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

### POST /teams/assign-agent
Assign an agent to a team. (Admin only)

**Request Body:**
```json
{
  "teamId": 1,
  "agentId": 5
}
```

### DELETE /teams/:agentId/remove-agent
Remove agent from team. (Admin only)

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- Development: No rate limiting
- Production: 100 requests per 15 minutes per IP

---

## Data Export Formats

### Excel Export
All report data can be exported as Excel (.xlsx) files with multiple sheets:
- Summary Sheet
- Agent-wise Summary
- Date-wise Summary
- Status-wise Summary

### CSV Export
Reports can be exported as CSV files for easy data manipulation.

### PDF Export
Executive summaries and comparison reports can be exported as PDF documents.

---

## Best Practices

1. **Authentication**: Always include the JWT token in the Authorization header
2. **Pagination**: Use pagination for list endpoints to improve performance
3. **Date Ranges**: Use ISO 8601 format (YYYY-MM-DD) for date parameters
4. **Error Handling**: Always check the `success` field in responses
5. **Rate Limiting**: Implement exponential backoff for rate limit errors

---

## Webhooks (Coming Soon)

Future support for webhooks to notify external systems about:
- Report processing completion
- Scheduled report generation
- Error notifications
- Data updates

---

## Support

For API support, contact: support@example.com

## Version

API Version: 1.0.0
Last Updated: January 2024
