const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

function escapePathForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pathToRegexSource(...segments) {
  return path.resolve(...segments).split(path.sep).map(escapePathForRegex).join("[\\\\/]");
}

function blockProjectFolder(folderName) {
  const folderPattern = escapePathForRegex(folderName);
  return new RegExp(`(?:^${folderPattern}|^${pathToRegexSource(__dirname, folderName)})(?:[\\\\/].*)?$`);
}

function blockProjectFolderPattern(pattern) {
  return new RegExp(`(?:^${pattern}|^${pathToRegexSource(__dirname)}[\\\\/]${pattern})(?:[\\\\/].*)?$`);
}

function blockNodeModulePackage(packagePath) {
  return new RegExp(`${pathToRegexSource(__dirname, "node_modules", ...packagePath.split("/"))}(?:[\\\\/].*)?$`);
}

if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

const existingBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : [config.resolver.blockList].filter(Boolean);

config.resolver.blockList = [
  ...existingBlockList,
  blockProjectFolder("dist"),
  blockProjectFolder("web-build"),
  blockProjectFolderPattern("\\.expo-[^\\\\/]+-check"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-darwin-arm64"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-darwin-x64"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-linux-arm"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-linux-arm64"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-linux-x64"),
];

module.exports = config;
