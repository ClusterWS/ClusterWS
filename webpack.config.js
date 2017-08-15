const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPkgJsonPlugin = require("copy-pkg-json-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const exec = require('child_process').exec;
const env = process.env.WEBPACK_ENV;

// Make git tag be the same version as project
const version = require('./package.json').version;
exec("git tag -a "+ version + " -m \"Update version\"", function(err, stdout, stderr){});

var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

var loaders = [];
if(env === 'debug'){
    loaders.push({
        test: /\.ts$/,
        loader: 'ts-loader?'+ JSON.stringify({
            transpileOnly: true
        }),
        exclude: /node_modules/
    })
} else {
    loaders.push({
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/
    })
}

module.exports = {
    entry: {
        'index': './src/index.ts'
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs2'
    },
    target: 'node',
    externals: nodeModules,
    module: {
        loaders: loaders
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        // new webpack.optimize.UglifyJsPlugin({
        //     comments: false,
        //     beautify: true
        // }),
        new CopyPkgJsonPlugin({
            remove: ['devDependencies', 'scripts']
        }),
        new CopyWebpackPlugin([{from:'README.md'}])
    ]
};