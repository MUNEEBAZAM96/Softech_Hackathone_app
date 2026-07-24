const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// macOS creates "._*" AppleDouble metadata files on non-APFS volumes (this
// repo lives on an external SSD). Without this, Metro/expo-router picks them
// up as source files (e.g. "._profile.tsx") and bundling fails.
const appleDoublePattern = /(^|\/)\._[^/]*$/;
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  appleDoublePattern,
];

module.exports = config;
