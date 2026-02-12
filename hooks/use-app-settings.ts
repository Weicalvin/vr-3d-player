import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AppSettings {
  // 播放器設置
  defaultPlaybackMode: "2D" | "3D" | "360°";
  defaultBrightness: number;
  defaultContrast: number;
  defaultSaturation: number;
  defaultPlaybackSpeed: number;
  defaultPupilDistance: number;
  selectedVRDevice: string;

  // 界面設置
  language: "zh-TW" | "zh-CN" | "en";
  theme: "light" | "dark" | "auto";
  showControlsOnStart: boolean;
  controlsAutoHideDelay: number; // 毫秒

  // 功能設置
  enableGestureControl: boolean;
  enableBluetoothControl: boolean;
  enableGyroscope: boolean;
  enableHeadTracking: boolean;

  // 存儲設置
  autoDeleteWatchedVideos: boolean;
  maxCacheSize: number; // MB

  // 其他
  lastUpdated: number;
}

const STORAGE_KEY = "vr_app_settings";

const DEFAULT_SETTINGS: AppSettings = {
  defaultPlaybackMode: "2D",
  defaultBrightness: 1.0,
  defaultContrast: 1.0,
  defaultSaturation: 1.0,
  defaultPlaybackSpeed: 1.0,
  defaultPupilDistance: 65,
  selectedVRDevice: "標準 VR",

  language: "zh-TW",
  theme: "auto",
  showControlsOnStart: true,
  controlsAutoHideDelay: 3000,

  enableGestureControl: true,
  enableBluetoothControl: true,
  enableGyroscope: true,
  enableHeadTracking: false,

  autoDeleteWatchedVideos: false,
  maxCacheSize: 5000,

  lastUpdated: 0,
};

/**
 * 應用設置管理 Hook
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化設置
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * 從存儲加載設置
   */
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as AppSettings;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error("加載設置失敗:", err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 保存設置
   */
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      const toSave = {
        ...newSettings,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setSettings(toSave);
    } catch (err) {
      console.error("保存設置失敗:", err);
    }
  }, []);

  /**
   * 更新單個設置
   */
  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  /**
   * 更新多個設置
   */
  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const newSettings = { ...settings, ...updates };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  /**
   * 重置為默認設置
   */
  const resetToDefaults = useCallback(async () => {
    await saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  /**
   * 獲取播放器默認設置
   */
  const getPlaybackDefaults = useCallback(() => {
    return {
      brightness: settings.defaultBrightness,
      contrast: settings.defaultContrast,
      saturation: settings.defaultSaturation,
      playbackSpeed: settings.defaultPlaybackSpeed,
      pupilDistance: settings.defaultPupilDistance,
      playbackMode: settings.defaultPlaybackMode,
      vrDevice: settings.selectedVRDevice,
    };
  }, [settings]);

  /**
   * 獲取界面設置
   */
  const getUISettings = useCallback(() => {
    return {
      language: settings.language,
      theme: settings.theme,
      showControlsOnStart: settings.showControlsOnStart,
      controlsAutoHideDelay: settings.controlsAutoHideDelay,
    };
  }, [settings]);

  /**
   * 獲取功能開關
   */
  const getFeatureFlags = useCallback(() => {
    return {
      gestureControl: settings.enableGestureControl,
      bluetoothControl: settings.enableBluetoothControl,
      gyroscope: settings.enableGyroscope,
      headTracking: settings.enableHeadTracking,
    };
  }, [settings]);

  /**
   * 導出設置為 JSON
   */
  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  /**
   * 導入設置
   */
  const importSettings = useCallback(
    async (jsonString: string) => {
      try {
        const imported = JSON.parse(jsonString) as Partial<AppSettings>;
        const merged = { ...settings, ...imported };
        await saveSettings(merged);
        return true;
      } catch (err) {
        console.error("導入設置失敗:", err);
        return false;
      }
    },
    [settings, saveSettings]
  );

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetToDefaults,
    getPlaybackDefaults,
    getUISettings,
    getFeatureFlags,
    exportSettings,
    importSettings,
    reload: loadSettings,
  };
}
