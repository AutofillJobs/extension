const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = merge(common, {
  mode: "production",
  plugins: [
    // Copy manifest with Edge-specific modifications if needed
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve("src/static/manifest.json"),
          to: path.resolve("dist/manifest.json"),
          transform(content) {
            const manifest = JSON.parse(content.toString());
            // Add any Edge-specific manifest modifications here
            // For now, just ensure proper formatting
            return JSON.stringify(manifest, null, 2);
          },
        },
      ],
    }),
  ],
});