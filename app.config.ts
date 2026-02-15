import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "真實 VR 播放器",
  slug: "wei3d", 
  version: "1.0.0",
  orientation: "landscape",
  userInterfaceStyle: "dark",
  android: {
    package: "com.vr.pro.player",
    versionCode: 1,
    permissions: [
      "READ_EXTERNAL_STORAGE",
      "READ_MEDIA_VIDEO"
    ]
    // 我把 adaptiveIcon 刪掉了，這樣它就不會因為找不到圖片而報錯
  },
  extra: {
    eas: {
      projectId: "8c02e732-ab2f-481c-8b11-2fac3bd1c6e5"
    }
  }
});
