const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// graphql / graphql-request ship dual CJS+ESM packages; without this Metro
// resolves the wrong entry on web.
config.resolver.unstable_conditionNames = ["browser", "require", "react-native"];

module.exports = config;
