# Prisma & MySQL Migration Guide

This project has been completely migrated from MongoDB and Mongoose to MySQL 8 and Prisma ORM.

## Setup Instructions

### Prerequisites
- MySQL 8 installed locally
- Node.js 20+

### Database Setup
Ensure your local MySQL server is running and you have created a database named `mis_report_extractor` (or the name specified in your DATABASE_URL).

### Installation & Environment
1. Ensure your `.env` file is set up correctly in the `server` directory. Use `.env.example` as a template.
```bash
DATABASE_URL="mysql://root:password@localhost:3306/mis_report_extractor"
```

2. Install dependencies:
```bash
cd server
npm install
```

### Prisma Workflow
1. **Initialize DB & Run Migrations**
Apply the Prisma schema to create tables in your local MySQL database:
```bash
npx prisma migrate dev --name init
```

2. **Generate Prisma Client**
Any time you modify `prisma/schema.prisma`, you need to regenerate the Prisma client so TypeScript picks up the types:
```bash
npx prisma generate
```

3. **Seeding the Database**
To insert default admin data (`admin@example.com` / `Admin@123`):
```bash
npm run seed
```

## Database ER Diagram

Below is the Entity Relationship Diagram representing the new MySQL Schema:

```mermaid
erDiagram
  User ||--o{ Role : "Has one Role"
  User ||--o{ UploadedReport : "Uploads many"
  User ||--o{ ProcessedReport : "Processes many"
  User ||--o{ ReportTemplate : "Creates many templates"
  User ||--o{ AuditLog : "Performs actions"
  User ||--o{ ColumnMapping : "Creates many mappings"

  UploadedReport ||--o{ ProcessedReport : "Generates many"
  UploadedReport ||--o{ ValidationReport : "Has validations"

  ReportTemplate ||--o{ ProcessedReport : "Uses template"

  Campaign ||--o{ Agent : "Has many agents"
  Team ||--o{ Agent : "Has many agents"

  User {
    int id PK
    string name
    string email
    string password
    string roleName
  }

  Role {
    int id PK
    string name
  }

  UploadedReport {
    int id PK
    string fileName
    int uploadedById FK
    string status
  }

  ProcessedReport {
    int id PK
    int uploadedReportId FK
    int processedById FK
    int templateId FK
  }

  Campaign {
    int id PK
    string name
  }

  Team {
    int id PK
    string name
  }

  Agent {
    int id PK
    string name
    string email
    int campaignId FK
    int teamId FK
  }
```

## Application Architecture

- `src/config/prisma.ts` exports the single instantiated `PrismaClient` to be used across the app.
- Mongoose schemas in `src/models` have been deleted and replaced with Prisma models in `prisma/schema.prisma`.
- Services and Controllers utilize `prisma.$transaction()` to guarantee atomicity, such as when creating `UploadedReport` and `ValidationReport` concurrently, or when deleting a report along with its processed equivalents.
