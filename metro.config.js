const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro Configuration for SVG Support
 * 
 * This configuration enables importing SVG files as React components
 * using react-native-svg-transformer
 * 
 * After installing dependencies:
 * npm install react-native-svg react-native-svg-transformer
 * 
 * Then restart metro bundler:
 * npm start -- --reset-cache
 */

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();
