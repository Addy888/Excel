/// <reference types="vite/client" />

/**
 * Vite Environment Variables Type Definitions
 * 
 * All environment variables must be prefixed with VITE_
 * to be exposed to the client-side code.
 * 
 * Define in .env file:
 * VITE_API_URL=http://localhost:5000/api
 */

interface ImportMetaEnv {
  /**
   * Backend API base URL
   * @default 'http://localhost:5000/api'
   */
  readonly VITE_API_URL: string;
  
  /**
   * Environment mode
   * @default 'development'
   */
  readonly MODE: string;
  
  /**
   * Base URL for the app
   * @default '/'
   */
  readonly BASE_URL: string;
  
  /**
   * Is production build
   */
  readonly PROD: boolean;
  
  /**
   * Is development build
   */
  readonly DEV: boolean;
  
  /**
   * Is server-side rendering
   */
  readonly SSR: boolean;
  
  // Add more custom environment variables here as needed
  // readonly VITE_APP_TITLE?: string;
  // readonly VITE_FEATURE_FLAG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
