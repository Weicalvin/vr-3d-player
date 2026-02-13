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
    permissions: ["READ_EXTERNAL_STORAGE", "READ_MEDIA_VIDEO"]
  }
});
