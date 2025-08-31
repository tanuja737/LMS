const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Ensure proper MIME types
  config.devServer = {
    ...config.devServer,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
    },
    before: function(app, server) {
      app.use('*.js', (req, res, next) => {
        res.set('Content-Type', 'application/javascript; charset=utf-8');
        next();
      });
      
      app.use('*.bundle', (req, res, next) => {
        res.set('Content-Type', 'application/javascript; charset=utf-8');
        next();
      });
    },
  };
  
  return config;
};
