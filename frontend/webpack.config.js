// webpack.config.js
module.exports = {
  webpack: function (config, env) {
    // Disable source-map-loader for face-api.js to remove warnings
    config.module.rules.forEach((rule) => {
      if (
        rule.use &&
        rule.use.some(
          (use) => use.loader && use.loader.includes("source-map-loader")
        )
      ) {
        rule.exclude = /node_modules\/face-api\.js/;
      }
    });

    return config;
  },
};
