var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: '../public/bundle.js',
    path: path.resolve(__dirname, '../public')
  },
  module: {
    loaders: [
      {
        test: /\.glsl$/,
        use: 'raw-loader'
      },
      {
        test: /\.glsl$/,
        use: 'glslify'
      }
    ]
  }
};
