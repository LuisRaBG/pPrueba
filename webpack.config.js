// c:\Users\Prueb\Documents\projects\proyecto\webpack.config.js
// No MUI changes needed in webpack config. Keeping the original content.
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Make sure this path is correct
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/', // Important for devServer and routing
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['@babel/preset-env', '@babel/preset-react'] // Ensure React preset is included
            }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      { // Rule for images/assets if needed
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Make sure this path is correct
      favicon: './public/favicon.ico' // Optional: Add favicon path
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'] // Keep resolving both
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Serve from public for assets
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true, // Important for single-page apps using React Router
  },
  mode: 'development', // Explicitly set mode (or 'production')
  devtool: 'eval-source-map', // Good source maps for development
};
