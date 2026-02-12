/**
 * 藍牙遙控器映射與管理系統
 * 支援多種 VR 遙控器與藍牙設備
 */

export type ControllerButtonAction =
  | "play-pause"
  | "next"
  | "previous"
  | "volume-up"
  | "volume-down"
  | "brightness-up"
  | "brightness-down"
  | "menu"
  | "back"
  | "select"
  | "2d-to-3d"
  | "mode-switch"
  | "pupil-distance-increase"
  | "pupil-distance-decrease";

export interface BluetoothControllerButton {
  name: string;
  keyCode: number;
  action: ControllerButtonAction;
  description: string;
}

export interface BluetoothControllerMapping {
  deviceName: string;
  deviceId: string;
  buttons: BluetoothControllerButton[];
  isConnected: boolean;
  lastConnectedTime?: number;
  customMappings?: Record<number, ControllerButtonAction>;
}

/**
 * 預設的遙控器按鍵映射
 */
export const DEFAULT_CONTROLLER_MAPPINGS: Record<
  string,
  BluetoothControllerButton[]
> = {
  // 大朋 VR 遙控器
  "Pico Controller": [
    {
      name: "主頁鍵",
      keyCode: 3,
      action: "menu",
      description: "打開主菜單",
    },
    {
      name: "返回鍵",
      keyCode: 4,
      action: "back",
      description: "返回上一級",
    },
    {
      name: "觸控板上",
      keyCode: 19,
      action: "volume-up",
      description: "增加音量",
    },
    {
      name: "觸控板下",
      keyCode: 20,
      action: "volume-down",
      description: "減少音量",
    },
    {
      name: "觸控板左",
      keyCode: 21,
      action: "previous",
      description: "上一個影片",
    },
    {
      name: "觸控板右",
      keyCode: 22,
      action: "next",
      description: "下一個影片",
    },
    {
      name: "觸控板按下",
      keyCode: 23,
      action: "play-pause",
      description: "播放/暫停",
    },
    {
      name: "扳機鍵",
      keyCode: 24,
      action: "select",
      description: "選擇/確認",
    },
  ],

  // 小米 VR 遙控器
  "Xiaomi VR Remote": [
    {
      name: "主頁鍵",
      keyCode: 3,
      action: "menu",
      description: "打開主菜單",
    },
    {
      name: "返回鍵",
      keyCode: 4,
      action: "back",
      description: "返回上一級",
    },
    {
      name: "方向鍵上",
      keyCode: 19,
      action: "brightness-up",
      description: "增加亮度",
    },
    {
      name: "方向鍵下",
      keyCode: 20,
      action: "brightness-down",
      description: "減少亮度",
    },
    {
      name: "方向鍵左",
      keyCode: 21,
      action: "previous",
      description: "上一個影片",
    },
    {
      name: "方向鍵右",
      keyCode: 22,
      action: "next",
      description: "下一個影片",
    },
    {
      name: "確認鍵",
      keyCode: 23,
      action: "play-pause",
      description: "播放/暫停",
    },
  ],

  // 通用藍牙遙控器
  "Generic Bluetooth Remote": [
    {
      name: "播放/暫停",
      keyCode: 85,
      action: "play-pause",
      description: "播放或暫停影片",
    },
    {
      name: "下一曲",
      keyCode: 87,
      action: "next",
      description: "下一個影片",
    },
    {
      name: "上一曲",
      keyCode: 88,
      action: "previous",
      description: "上一個影片",
    },
    {
      name: "音量+",
      keyCode: 24,
      action: "volume-up",
      description: "增加音量",
    },
    {
      name: "音量-",
      keyCode: 25,
      action: "volume-down",
      description: "減少音量",
    },
    {
      name: "菜單",
      keyCode: 82,
      action: "menu",
      description: "打開菜單",
    },
    {
      name: "返回",
      keyCode: 4,
      action: "back",
      description: "返回",
    },
  ],
};

/**
 * 按鍵代碼常量
 */
export const KEYCODE = {
  BACK: 4,
  HOME: 3,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  MEDIA_PLAY_PAUSE: 85,
  MEDIA_NEXT: 87,
  MEDIA_PREVIOUS: 88,
  MENU: 82,
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  ENTER: 23,
  BUTTON_A: 96,
  BUTTON_B: 97,
  BUTTON_X: 99,
  BUTTON_Y: 100,
  BUTTON_L1: 102,
  BUTTON_R1: 103,
  BUTTON_THUMBL: 106,
  BUTTON_THUMBR: 107,
};

/**
 * 遙控器管理類
 */
export class BluetoothControllerManager {
  private connectedControllers: Map<string, BluetoothControllerMapping> =
    new Map();
  private customMappings: Map<string, Record<number, ControllerButtonAction>> =
    new Map();
  private listeners: ((action: ControllerButtonAction) => void)[] = [];

  /**
   * 添加連接的遙控器
   */
  addController(
    deviceName: string,
    deviceId: string,
    mapping?: BluetoothControllerButton[]
  ): void {
    const buttons =
      mapping || DEFAULT_CONTROLLER_MAPPINGS[deviceName] || [];

    this.connectedControllers.set(deviceId, {
      deviceName,
      deviceId,
      buttons,
      isConnected: true,
      lastConnectedTime: Date.now(),
    });
  }

  /**
   * 移除遙控器
   */
  removeController(deviceId: string): void {
    this.connectedControllers.delete(deviceId);
    this.customMappings.delete(deviceId);
  }

  /**
   * 獲取所有連接的遙控器
   */
  getConnectedControllers(): BluetoothControllerMapping[] {
    return Array.from(this.connectedControllers.values());
  }

  /**
   * 自訂按鍵映射
   */
  setCustomMapping(
    deviceId: string,
    keyCode: number,
    action: ControllerButtonAction
  ): void {
    if (!this.customMappings.has(deviceId)) {
      this.customMappings.set(deviceId, {});
    }
    this.customMappings.get(deviceId)![keyCode] = action;

    // 更新遙控器映射
    const controller = this.connectedControllers.get(deviceId);
    if (controller) {
      controller.customMappings = this.customMappings.get(deviceId);
    }
  }

  /**
   * 處理按鍵事件
   */
  handleKeyEvent(deviceId: string, keyCode: number): void {
    const controller = this.connectedControllers.get(deviceId);
    if (!controller) return;

    // 優先檢查自訂映射
    let action: ControllerButtonAction | undefined;
    if (controller.customMappings && controller.customMappings[keyCode]) {
      action = controller.customMappings[keyCode];
    } else {
      // 使用預設映射
      const button = controller.buttons.find((b) => b.keyCode === keyCode);
      action = button?.action;
    }

    if (action) {
      this.notifyListeners(action);
    }
  }

  /**
   * 訂閱按鍵事件
   */
  subscribe(listener: (action: ControllerButtonAction) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(action: ControllerButtonAction): void {
    this.listeners.forEach((listener) => listener(action));
  }

  /**
   * 獲取遙控器的按鍵列表
   */
  getControllerButtons(deviceId: string): BluetoothControllerButton[] {
    return this.connectedControllers.get(deviceId)?.buttons || [];
  }

  /**
   * 清空所有遙控器
   */
  clear(): void {
    this.connectedControllers.clear();
    this.customMappings.clear();
  }
}

/**
 * 全局遙控器管理器實例
 */
export const controllerManager = new BluetoothControllerManager();
