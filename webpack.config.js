const path = require('path')
const webpack = require('webpack')
const HtmlWebPackPlugin = require("html-webpack-plugin")
const TerserPlugin = require('terser-webpack-plugin')

module.exports = env => {
	const mode = env.production ? 'production' : 'development';
	const isDevelopment = mode !== 'production';

	return {
		mode,
		devtool: 'source-map',
		entry: {
			app: './src/js/app.js',
		},
		output: {
			path: path.join(__dirname, './dist'),
			publicPath: '',
			filename: '[name].js'
		},
		module: {
			rules: [
				{
					test: /\.m?js$/,
					exclude: /node_modules/,
					loader: 'babel-loader',
				}
			]
		},
		plugins: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					ecma: 6,
					output: {
						comments: false
					},
					compress: {
						drop_console: true
					}
				},
				extractComments: false,
				parallel: true,
				sourceMap: true
			}),
			new HtmlWebPackPlugin({
				template: "./src/index.html",
				filename: "./index.html",
				hash: true
			})
		]
	}

};

