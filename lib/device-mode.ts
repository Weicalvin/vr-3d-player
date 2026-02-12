import { Dimensions, Platform } from "react-native";

export type DeviceMode = "phone" | "tablet" | "tv";

/**
 * 設備模式檢測與適應系統
 */
export class DeviceModeManager {
  private static instance: DeviceModeManager;
  private currentMode: DeviceMode = "phone";
  private screenWidth: number = Dimensions.get("window").width;
  private screenHeight: number = Dimensions.get("window").height;
  private listeners: ((mode: DeviceMode) => void)[] = [];

  private constructor() {
    this.detectMode();
    // React Native 的 Dimensions 不支援 addEventListener，改用 useWindowDimensions Hook
  }

  static getInstance(): DeviceModeManager {
    if (!DeviceModeManager.instance) {
      DeviceModeManager.instance = new DeviceModeManager();
    }
    return DeviceModeManager.instance;
  }

  /**
   * 偵測設備模式
   */
  private detectMode(): void {
    const { width, height } = Dimensions.get("window");
    this.screenWidth = width;
    this.screenHeight = height;

    // 計算對角線尺寸（英寸）
    const pixelDensity = Platform.OS === "android" ? 2 : 3; // 粗略估計
    const diagonalInches = Math.sqrt(width ** 2 + height ** 2) / (160 * pixelDensity);

    // 根據螢幕尺寸判斷設備類型
    if (diagonalInches >= 10) {
      this.currentMode = "tv";
    } else if (diagonalInches >= 7) {
      this.currentMode = "tablet";
    } else {
      this.currentMode = "phone";
    }
  }

  /**
   * 處理螢幕尺寸變化
   */
  private handleDimensionChange = ({ window }: { window: any }) => {
    const oldMode = this.currentMode;
    this.screenWidth = window.width;
    this.screenHeight = window.height;
    this.detectMode();

    if (oldMode !== this.currentMode) {
      this.notifyListeners();
    }
  };

  /**
   * 獲取當前設備模式
   */
  getMode(): DeviceMode {
    return this.currentMode;
  }

  /**
   * 檢查是否為電視模式
   */
  isTV(): boolean {
    return this.currentMode === "tv";
  }

  /**
   * 檢查是否為平板模式
   */
  isTablet(): boolean {
    return this.currentMode === "tablet";
  }

  /**
   * 檢查是否為手機模式
   */
  isPhone(): boolean {
    return this.currentMode === "phone";
  }

  /**
   * 獲取螢幕尺寸
   */
  getScreenDimensions() {
    return {
      width: this.screenWidth,
      height: this.screenHeight,
      isLandscape: this.screenWidth > this.screenHeight,
      isPortrait: this.screenHeight > this.screenWidth,
    };
  }

  /**
   * 訂閱設備模式變化
   */
  subscribe(listener: (mode: DeviceMode) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentMode));
  }

  /**
   * 獲取設備特定的 UI 配置
   */
  getUIConfig() {
    const isTV = this.isTV();
    const isTablet = this.isTablet();

    return {
      // 字體大小
      fontSize: {
        title: isTV ? 32 : isTablet ? 24 : 20,
        subtitle: isTV ? 20 : isTablet ? 16 : 14,
        body: isTV ? 18 : isTablet ? 14 : 12,
        small: isTV ? 14 : isTablet ? 12 : 10,
      },

      // 按鈕大小
      buttonSize: {
        large: isTV ? 80 : isTablet ? 60 : 48,
        medium: isTV ? 60 : isTablet ? 48 : 40,
        small: isTV ? 40 : isTablet ? 32 : 24,
      },

      // 間距
      spacing: {
        xs: isTV ? 16 : isTablet ? 12 : 8,
        sm: isTV ? 24 : isTablet ? 16 : 12,
        md: isTV ? 32 : isTablet ? 24 : 16,
        lg: isTV ? 48 : isTablet ? 32 : 24,
        xl: isTV ? 64 : isTablet ? 48 : 32,
      },

      // 圓角
      borderRadius: {
        sm: isTV ? 12 : isTablet ? 8 : 6,
        md: isTV ? 16 : isTablet ? 12 : 8,
        lg: isTV ? 24 : isTablet ? 16 : 12,
      },

      // 控制條配置
      controls: {
        autoHideDelay: isTV ? 5000 : 3000,
        showOnStart: isTV ? true : true,
        enableGestures: !isTV,
        enableRemote: isTV ? true : false,
      },

      // 播放器配置
      player: {
        controlBarHeight: isTV ? 120 : 80,
        showThumbnails: !isTV,
        enablePictureInPicture: !isTV,
      },

      // 列表配置
      list: {
        itemHeight: isTV ? 200 : isTablet ? 150 : 100,
        columnsPerRow: isTV ? 4 : isTablet ? 3 : 2,
        itemSpacing: isTV ? 16 : isTablet ? 12 : 8,
      },
    };
  }

  /**
   * 獲取導航配置
   */
  getNavigationConfig() {
    const isTV = this.isTV();

    return {
      // 標籤欄配置
      tabBar: {
        height: isTV ? 100 : 56,
        labelSize: isTV ? 16 : 12,
        iconSize: isTV ? 40 : 28,
        visible: !isTV, // 電視模式隱藏標籤欄
      },

      // 側邊欄配置
      sidebar: {
        width: isTV ? 300 : 250,
        visible: isTV, // 電視模式顯示側邊欄
        itemHeight: isTV ? 80 : 60,
      },

      // 菜單配置
      menu: {
        itemHeight: isTV ? 60 : 48,
        itemPadding: isTV ? 20 : 16,
      },
    };
  }

  /**
   * 獲取播放器控制配置
   */
  getPlayerControlConfig() {
    const isTV = this.isTV();

    return {
      // 按鈕配置
      buttons: {
        playPause: {
          size: isTV ? 120 : 80,
          visible: true,
        },
        nextPrevious: {
          size: isTV ? 80 : 60,
          visible: true,
        },
        settings: {
          size: isTV ? 60 : 48,
          visible: true,
        },
        fullscreen: {
          size: isTV ? 60 : 48,
          visible: !isTV,
        },
      },

      // 進度條配置
      progressBar: {
        height: isTV ? 20 : 4,
        thumbSize: isTV ? 30 : 12,
        visible: true,
      },

      // 時間顯示
      timeDisplay: {
        visible: true,
        format: isTV ? "HH:MM:SS / HH:MM:SS" : "MM:SS / MM:SS",
      },

      // 控制方式
      controlMethod: isTV ? "remote" : "touch",
    };
  }

  /**
   * 清理資源
   */
  destroy(): void {
    this.listeners = [];
  }
}

/**
 * 全局設備模式管理器實例
 */
export const deviceModeManager = DeviceModeManager.getInstance();
