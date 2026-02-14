import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "真實 VR 播放器",
  slug: "vr-3d-player",
  version: "1.0.0",
  orientation: "landscape",
  userInterfaceStyle: "dark",
  android: {
    package: "com.vr.pro.player",
    versionCode: 1,
    permissions: [
      "READ_EXTERNAL_STORAGE",
      "READ_MEDIA_VIDEO"
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000"
    }
  },
  extra: {
    eas: {
      // 👇 請將你在網頁上找到的 Project ID 貼在引號內 👇
      projectId: "8c02e732-ab2f-481c-8b11-2fac3bd1c6e5" 
    }
  }
});

