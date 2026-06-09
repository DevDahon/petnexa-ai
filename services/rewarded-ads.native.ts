import Constants, { ExecutionEnvironment } from "expo-constants";
import type { RewardedAdResult } from "./rewarded-ads";

type GoogleMobileAdsModule = typeof import("react-native-google-mobile-ads");

let initialized: Promise<unknown> | null = null;
let adsModulePromise: Promise<GoogleMobileAdsModule | null> | null = null;

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function getAdsModule() {
  if (isExpoGo()) return null;
  adsModulePromise ??= import("react-native-google-mobile-ads").catch(() => null);
  return adsModulePromise;
}

function initializeAds(module: GoogleMobileAdsModule) {
  initialized ??= module.default().initialize();
  return initialized;
}

export async function showRewardedAd(): Promise<RewardedAdResult> {
  const adsModule = await getAdsModule();
  if (!adsModule) {
    return {
      earned: false,
      message: "Rewarded ads require an Android or iOS build, not Expo Go.",
    };
  }

  const { AdEventType, RewardedAd, RewardedAdEventType, TestIds } = adsModule;
  const adUnitId = __DEV__ ? TestIds.REWARDED : process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID;
  if (!adUnitId) {
    return {
      earned: false,
      message: "Rewarded ad is not configured yet.",
    };
  }

  try {
    await initializeAds(adsModule);
  } catch {
    return {
      earned: false,
      message: "Rewarded ad service could not start. Please try again later.",
    };
  }

  return new Promise((resolve) => {
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    let earned = false;
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const unsubscribers: Array<() => void> = [];

    const finish = (result: RewardedAdResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      resolve(result);
    };

    unsubscribers.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show().catch(() => {
          finish({
            earned: false,
            message: "Rewarded ad could not be shown. Please try again.",
          });
        });
      }),
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        finish(
          earned
            ? { earned: true, message: "Reward earned." }
            : { earned: false, message: "Ad closed before the reward was earned." },
        );
      }),
      rewarded.addAdEventListener(AdEventType.ERROR, () => {
        finish({
          earned: false,
          message: "No rewarded ad is available right now. Please try again later.",
        });
      }),
    );

    timeout = setTimeout(() => {
      finish({
        earned: false,
        message: "Rewarded ad is taking too long to load. Please try again.",
      });
    }, 30000);

    rewarded.load();
  });
}
