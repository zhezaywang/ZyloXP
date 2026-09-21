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
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
];
const productionContentSecurityDirectives = [
  ...contentSecurityDirectives,
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
  'upgrade-insecure-requests',
];
const strictContentSecurityPolicy =
  productionContentSecurityDirectives.join('; ');
const staticContentSecurityPolicy = productionContentSecurityDirectives
  .filter((directive) => !directive.startsWith('frame-ancestors'))
  .join('; ');
const developmentContentSecurityPolicy = contentSecurityDirectives
  .join('; ')
  .replace("connect-src 'self'", "connect-src 'self' ws: wss:")
  .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");

const securityHeaders = {
  'Content-Security-Policy': strictContentSecurityPolicy,
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'Permissions-Policy':
    'accelerometer=(), browsing-topics=(), camera=(), clipboard-read=(), clipboard-write=(self), display-capture=(), gamepad=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-get=(), serial=(), speaker-selection=(), usb=(), web-share=(), xr-spatial-tracking=()',
  'Referrer-Policy': 'no-referrer',
  'X-DNS-Prefetch-Control': 'off',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-XSS-Protection': '0',
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
            id.includes('/src/authSession.ts') ||
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
