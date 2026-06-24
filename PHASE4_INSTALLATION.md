# Phase 4 - Quick Installation Guide

## Prerequisites
- Node.js 18.x or higher
- MySQL 8.x or higher
- Git

## Quick Start (Development)

### 1. Clone and Setup

```bash
# Clone repository
cd mis-report-extractor

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE mis_report_extractor;

# Create user (optional)
CREATE USER 'mis_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON mis_report_extractor.* TO 'mis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment

```bash
# Server environment
cd server
cp .env.example .env

# Edit .env
# Update DATABASE_URL with your MySQL credentials
# Update JWT_SECRET with a secure random string
```

### 4. Migrate Database to Enterprise Schema

```bash
cd server

# Backup old schema (if exists)
cp prisma/schema.prisma prisma/schema-backup.prisma

# Replace with enterprise schema
cp prisma/schema-enterprise.prisma prisma/schema.prisma

# Run migration
npx prisma migrate dev --name enterprise_upgrade

# Generate Prisma client
npx prisma generate

# Optional: Seed database
npm run seed
```

### 5. Build and Start

```bash
# Build server
cd server
npm run build

# Start development server
npm run dev

# In another terminal, start client
cd client
npm run dev
```

### 6. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs (once routes are implemented)
- Health Check: http://localhost:5000/api/health (once implemented)

## Production Installation

Follow the comprehensive guide in `PHASE4_ENTERPRISE_DEPLOYMENT.md`

## Post-Installation Steps

### 1. Setup Code Quality Tools

```bash
cd server

# Initialize Husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

### 2. Verify Installation

```bash
# Run linting
npm run lint

# Run tests (once created)
npm run test

# Build for production
npm run build
```

### 3. Create Initial Admin User

```bash
# Run seed script or create manually through API
npm run seed
```

Default admin credentials (if seeded):
- Email: admin@example.com
- Password: (check seed script)

## Troubleshooting

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u mis_user -p mis_report_extractor

# Check DATABASE_URL format
# mysql://username:password@host:port/database
```

### Port Already in Use

```bash
# Change PORT in .env file
PORT=5001

# Or kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Prisma Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### 1. Making Database Changes

```bash
# Edit prisma/schema.prisma
# Then run migration
npx prisma migrate dev --name description_of_change

# Generate client
npx prisma generate
```

### 2. Running in Development

```bash
# Server with auto-reload
cd server
npm run dev

# Client with HMR
cd client
npm run dev
```

### 3. Before Committing

```bash
# Lint and format code
npm run lint:fix
npm run format

# Run tests
npm run test
```

## Environment Variables Reference

### Server (.env)

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="mysql://user:password@localhost:3306/mis_report_extractor"

# Authentication
JWT_SECRET=your_very_long_and_secure_secret_here

# File Storage
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Client (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=MIS Report Extractor
```

## Available Scripts

### Server

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run watch        # Watch TypeScript compilation
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run seed         # Seed database
```

### Client

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Next Steps

1. ✅ Database schema upgraded to enterprise version
2. ⏳ Implement controllers for new features
3. ⏳ Create routes for new endpoints
4. ⏳ Build frontend components
5. ⏳ Write tests
6. ⏳ Deploy to production

## Support

- Check `PHASE4_FEATURES_COMPLETE.md` for feature documentation
- Check `PHASE4_ENTERPRISE_DEPLOYMENT.md` for production deployment
- Check logs in `server/logs/` directory
- Review Prisma schema in `server/prisma/schema.prisma`

## Important Notes

⚠️ **Development vs Production**:
- In development, use `npm run dev` for hot-reload
- In production, always use `npm run build` then `npm start` or PM2

⚠️ **Database Migrations**:
- Always backup database before running migrations
- Test migrations in development first
- Keep migration files in version control

⚠️ **Security**:
- Change default JWT_SECRET in production
- Use strong MySQL passwords
- Enable firewall in production
- Keep dependencies updated

⚠️ **Performance**:
- Use PM2 clustering in production
- Enable Nginx caching
- Configure MySQL optimization
- Monitor system resources

## Useful Commands

```bash
# View database in browser
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Format Prisma schema
npx prisma format

# Check Prisma schema for errors
npx prisma validate

# Generate ERD (requires extension)
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

## License

MIT
