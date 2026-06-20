const baseConfig = require("./app.json");

const TEST_ANDROID_ADMOB_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const TEST_IOS_ADMOB_APP_ID = "ca-app-pub-3940256099942544~1458002511";

const androidAdMobAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ANDROID_ADMOB_APP_ID;
const iosAdMobAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || TEST_IOS_ADMOB_APP_ID;

function withAdMobAppIds(plugins = []) {
  return plugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "react-native-google-mobile-ads") {
      return [
        plugin[0],
        {
          ...plugin[1],
          androidAppId: androidAdMobAppId,
          iosAppId: iosAdMobAppId,
        },
      ];
    }
    return plugin;
  });
}

module.exports = ({ config }) => {
  const expo = baseConfig.expo;
  return {
    ...config,
    ...expo,
    plugins: withAdMobAppIds(expo.plugins),
    extra: {
      ...expo.extra,
      adsUsingTestAppIds: androidAdMobAppId === TEST_ANDROID_ADMOB_APP_ID || iosAdMobAppId === TEST_IOS_ADMOB_APP_ID,
    },
  };
};
