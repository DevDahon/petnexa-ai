export type RewardedAdResult = {
  earned: boolean;
  message: string;
};

export async function showRewardedAd(): Promise<RewardedAdResult> {
  return {
    earned: false,
    message: "Rewarded ads are available only in Android or iOS builds.",
  };
}
