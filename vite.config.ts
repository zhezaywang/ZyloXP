import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const contentSecurityDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "img-src 'self' data: blob:",
  "manifest-src 'self'",
  "media-src 'self' data: blob:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
];
const strictContentSecurityPolicy = contentSecurityDirectives.join('; ');
const staticContentSecurityPolicy = contentSecurityDirectives
  .filter((directive) => !directive.startsWith('frame-ancestors'))
  .join('; ');
const developmentContentSecurityPolicy = strictContentSecurityPolicy
  .replace("connect-src 'self'", "connect-src 'self' ws: wss:")
  .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");

const securityHeaders = {
  'Content-Security-Policy': strictContentSecurityPolicy,
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'Permissions-Policy':
    'accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-DNS-Prefetch-Control': 'off',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      apply: 'build',
      name: 'zyloxp-security-meta',
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              attrs: {
                content: staticContentSecurityPolicy,
                'http-equiv': 'Content-Security-Policy',
              },
              injectTo: 'head-prepend',
              tag: 'meta',
            },
          ],
        };
      },
    },
  ],
  server: {
    headers: {
      ...securityHeaders,
      'Content-Security-Policy': developmentContentSecurityPolicy,
    },
  },
  preview: {
    headers: securityHeaders,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }

          if (
            id.includes('/src/LocalAppSecurity.tsx') ||
            id.includes('/src/localAppLock.ts')
          ) {
            return 'app-security';
          }

          if (
            id.includes('/src/EngineeringToolkit.tsx') ||
            id.includes('/src/ZyTutor.tsx')
          ) {
            return 'workspace-tools';
          }
        },
      },
    },
  },
});
