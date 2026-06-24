import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MIS Report Extractor API',
      version,
      description: 'Enterprise-grade MIS Report Extraction and Processing Platform API',
      contact: {
        name: 'API Support',
        email: 'support@misreportextractor.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.misreportextractor.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            roleName: { type: 'string', enum: ['admin', 'supervisor', 'team_leader', 'agent', 'user'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Report: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fileName: { type: 'string' },
            status: { type: 'string', enum: ['uploaded', 'processing', 'processed', 'failed'] },
            recordsCount: { type: 'integer' },
            uploadDate: { type: 'string', format: 'date-time' },
          },
        },
        CustomFormula: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            formula: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            returnType: { type: 'string', enum: ['number', 'percentage', 'string'] },
            category: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        CustomKpi: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            calculation: { type: 'string' },
            targetValue: { type: 'number' },
            comparison: { type: 'string', enum: ['>=', '<=', '=', '!='] },
            displayFormat: { type: 'string', enum: ['number', 'percentage', 'currency'] },
            isActive: { type: 'boolean' },
          },
        },
        ReportDesign: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            layout: { type: 'object' },
            sections: { type: 'object' },
            styling: { type: 'object' },
            isPublic: { type: 'boolean' },
          },
        },
        DashboardLayout: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            layout: { type: 'object' },
            widgets: { type: 'array' },
            isDefault: { type: 'boolean' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Reports', description: 'Report upload and processing' },
      { name: 'Templates', description: 'Report templates management' },
      { name: 'Formulas', description: 'Custom formula management' },
      { name: 'KPIs', description: 'Custom KPI management' },
      { name: 'Report Designer', description: 'Report design and layout' },
      { name: 'Dashboard', description: 'Dashboard customization' },
      { name: 'Teams', description: 'Team management' },
      { name: 'Campaigns', description: 'Campaign management' },
      { name: 'Agents', description: 'Agent management' },
      { name: 'Audit', description: 'Audit logs and monitoring' },
      { name: 'Backup', description: 'Backup and restore' },
      { name: 'Search', description: 'Advanced search' },
      { name: 'Health', description: 'System health and monitoring' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
