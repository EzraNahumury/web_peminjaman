import path from 'node:path';
import type { NextConfig } from 'next';

const stub = path.resolve('./lib/baileys-stub.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['@whiskeysockets/baileys'],
  turbopack: {
    resolveAlias: {
      sharp: stub,
      jimp: stub,
      'link-preview-js': stub,
    },
  },
};

export default nextConfig;
