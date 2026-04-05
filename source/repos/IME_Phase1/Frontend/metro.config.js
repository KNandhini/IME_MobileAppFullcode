const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Restrict watched folders to only the project source
config.watchFolders = [__dirname];

// Use 'node' watcher explicitly (avoids Watchman issues on Windows)
config.watcher = {
  watchman: {
    deferStates: [],
  },
};

// Block nested node_modules and other heavy directories from being watched
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
  new RegExp(
    `${path.resolve(__dirname, 'android').replace(/\\/g, '\\\\')}.*`
  ),
  new RegExp(
    `${path.resolve(__dirname, 'ios').replace(/\\/g, '\\\\')}.*`
  ),
];

module.exports = config;
