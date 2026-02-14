import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "真實 VR 播放器",
  // 👇 這裡一定要改成 mmi3d，因為你的 ID 屬於這個名字 👇
  slug: "mmi3d", 
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
      // 👇 這裡維持你原本填好的 ID，不要動它 👇
      projectId: "請保留你原本填寫的那串 ID"
    }
  }
});
