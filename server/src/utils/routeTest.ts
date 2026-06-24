/**
 * Route Testing Utility
 * Tests all API endpoints to verify they're properly registered
 */

import express from 'express';

export const testRoutes = (app: express.Application) => {
  const routes: { method: string; path: string }[] = [];

  // Extract all routes from the app
  const extractRoutes = (stack: any[], basePath = '') => {
    stack.forEach((middleware) => {
      if (middleware.route) {
        // Route registered directly
        const methods = Object.keys(middleware.route.methods);
        methods.forEach((method) => {
          routes.push({
            method: method.toUpperCase(),
            path: basePath + middleware.route.path,
          });
        });
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        // Router middleware
        const routerPath = middleware.regexp
          .toString()
          .replace('/^\\', '')
          .replace('\\/?(?=\\/|$)/i', '')
          .replace(/\\\//g, '/');
        
        extractRoutes(middleware.handle.stack, routerPath);
      }
    });
  };

  extractRoutes(app._router.stack);

  return routes;
};

export const logRoutes = (app: express.Application) => {
  const routes = testRoutes(app);
  
  console.log('\n============================================');
  console.log('📋 REGISTERED API ROUTES');
  console.log('============================================\n');
  
  const groupedRoutes: { [key: string]: typeof routes } = {};
  
  routes.forEach((route) => {
    const basePath = route.path.split('/')[1] || 'root';
    if (!groupedRoutes[basePath]) {
      groupedRoutes[basePath] = [];
    }
    groupedRoutes[basePath].push(route);
  });

  Object.keys(groupedRoutes).sort().forEach((group) => {
    console.log(`\n📁 /${group}`);
    groupedRoutes[group].forEach((route) => {
      console.log(`   ${route.method.padEnd(7)} ${route.path}`);
    });
  });

  console.log('\n============================================');
  console.log(`✅ Total Routes: ${routes.length}`);
  console.log('============================================\n');

  return routes;
};

export const verifyRequiredRoutes = (app: express.Application) => {
  const routes = testRoutes(app);
  const routePaths = routes.map((r) => `${r.method} ${r.path}`);

  const requiredRoutes = [
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET /api/auth/profile',
    'POST /api/reports/upload',
    'GET /api/reports',
    'GET /api/reports/:id',
    'DELETE /api/reports/:id',
    'GET /api/reports/download/:id',
    'POST /api/reports/process',
    'GET /api/health',
  ];

  const missingRoutes: string[] = [];
  const foundRoutes: string[] = [];

  requiredRoutes.forEach((required) => {
    const found = routePaths.some((path) => {
      // Handle dynamic parameters
      const requiredRegex = required.replace(/:\w+/g, ':[^/]+');
      return new RegExp(`^${requiredRegex}$`).test(path);
    });

    if (found) {
      foundRoutes.push(required);
    } else {
      missingRoutes.push(required);
    }
  });

  if (missingRoutes.length > 0) {
    console.log('\n⚠️  MISSING ROUTES:');
    missingRoutes.forEach((route) => console.log(`   ❌ ${route}`));
  }

  if (foundRoutes.length > 0) {
    console.log('\n✅ FOUND ROUTES:');
    foundRoutes.forEach((route) => console.log(`   ✓ ${route}`));
  }

  return {
    missing: missingRoutes,
    found: foundRoutes,
    allFound: missingRoutes.length === 0,
  };
};
