const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver for better web support
config.resolver = {
  ...config.resolver,
  platforms: ['web', 'ios', 'android', 'native'],
  sourceExts: [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'cjs'],
  assetExts: [...config.resolver.assetExts, 'bin'],
};

// Web-specific transformer options
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

// Configure web server options to fix MIME type issues
config.server = {
  enhanceMiddleware: (middleware, metroServer) => {
    return (req, res, next) => {
      // Fix MIME type for JavaScript bundles
      if (req.url && (req.url.includes('.bundle') || req.url.endsWith('.js'))) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      
      // Fix MIME type for source maps
      if (req.url && req.url.includes('.map')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      
      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
