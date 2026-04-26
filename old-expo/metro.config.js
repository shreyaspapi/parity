const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for tslib issue with Apollo Client on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return {
      filePath: require.resolve('tslib'),
      type: 'sourceFile',
    };
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

