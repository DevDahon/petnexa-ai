const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

function escapePathForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function blockProjectFolder(folderName) {
  return new RegExp(`${escapePathForRegex(path.join(__dirname, folderName))}[\\\\/].*`);
}

function blockNodeModulePackage(packagePath) {
  return new RegExp(`${escapePathForRegex(path.join(__dirname, "node_modules", ...packagePath.split("/")))}(?:[\\\\/].*)?$`);
}

if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

config.resolver.blockList = [
  blockProjectFolder("dist"),
  blockProjectFolder("web-build"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-darwin-arm64"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-darwin-x64"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-linux-arm"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-linux-arm64"),
  blockNodeModulePackage("@msgpackr-extract/msgpackr-extract-linux-x64"),
];

module.exports = config;
