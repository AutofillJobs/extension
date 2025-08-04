const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const config = require('./webpack.prod.js');

// Add bundle analyzer plugin
config.plugins.push(
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: true,
    generateStatsFile: true,
    statsFilename: 'bundle-stats.json',
  })
);

// Run webpack with analyzer
webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error('Webpack build failed:', err || stats.toString());
    process.exit(1);
  }
  
  console.log('Bundle analysis complete!');
}); 