/**
 * 陀螺儀與頭部追蹤系統
 * 支援 360° 全景影片的自動視角追蹤
 */

export interface GyroscopeData {
  x: number; // 繞 X 軸旋轉（俯仰角 - Pitch）
  y: number; // 繞 Y 軸旋轉（偏航角 - Yaw）
  z: number; // 繞 Z 軸旋轉（滾轉角 - Roll）
  timestamp: number;
}

export interface EulerAngles {
  pitch: number; // 俯仰角 (-90 ~ 90 度)
  yaw: number; // 偏航角 (-180 ~ 180 度)
  roll: number; // 滾轉角 (-180 ~ 180 度)
}

export interface ViewportTransform {
  /** 水平視角 (度) */
  horizontalFOV: number;
  /** 垂直視角 (度) */
  verticalFOV: number;
  /** 中心點水平位置 (0-1) */
  centerX: number;
  /** 中心點垂直位置 (0-1) */
  centerY: number;
  /** 旋轉矩陣 */
  rotationMatrix: number[][];
}

/**
 * 陀螺儀追蹤器
 */
export class GyroscopeTracker {
  private currentEulerAngles: EulerAngles = { pitch: 0, yaw: 0, roll: 0 };
  private smoothedAngles: EulerAngles = { pitch: 0, yaw: 0, roll: 0 };
  private listeners: ((angles: EulerAngles) => void)[] = [];
  private isEnabled: boolean = false;
  private smoothingFactor: number = 0.8; // 平滑係數 (0-1)
  private maxPitch: number = 85; // 最大俯仰角
  private minPitch: number = -85; // 最小俯仰角

  /**
   * 啟用陀螺儀追蹤
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * 禁用陀螺儀追蹤
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * 檢查是否啟用
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * 更新陀螺儀數據
   */
  updateGyroscopeData(data: GyroscopeData): void {
    if (!this.isEnabled) return;

    // 將陀螺儀數據轉換為歐拉角
    this.currentEulerAngles = this.gyroscopeToEulerAngles(data);

    // 應用平滑濾波
    this.smoothedAngles = this.applySmoothingFilter(
      this.smoothedAngles,
      this.currentEulerAngles,
      this.smoothingFactor
    );

    // 限制角度範圍
    this.smoothedAngles = this.clampAngles(this.smoothedAngles);

    // 通知監聽器
    this.notifyListeners(this.smoothedAngles);
  }

  /**
   * 將陀螺儀數據轉換為歐拉角
   */
  private gyroscopeToEulerAngles(data: GyroscopeData): EulerAngles {
    // 簡化的轉換（實際應用中應使用四元數以避免萬向鎖）
    return {
      pitch: data.x * (180 / Math.PI),
      yaw: data.y * (180 / Math.PI),
      roll: data.z * (180 / Math.PI),
    };
  }

  /**
   * 應用平滑濾波
   */
  private applySmoothingFilter(
    previous: EulerAngles,
    current: EulerAngles,
    factor: number
  ): EulerAngles {
    return {
      pitch: previous.pitch * factor + current.pitch * (1 - factor),
      yaw: previous.yaw * factor + current.yaw * (1 - factor),
      roll: previous.roll * factor + current.roll * (1 - factor),
    };
  }

  /**
   * 限制角度範圍
   */
  private clampAngles(angles: EulerAngles): EulerAngles {
    return {
      pitch: Math.max(this.minPitch, Math.min(this.maxPitch, angles.pitch)),
      yaw: ((angles.yaw + 180) % 360) - 180, // 限制在 -180 ~ 180
      roll: ((angles.roll + 180) % 360) - 180,
    };
  }

  /**
   * 獲取當前歐拉角
   */
  getEulerAngles(): EulerAngles {
    return { ...this.smoothedAngles };
  }

  /**
   * 計算視口轉換
   */
  calculateViewportTransform(
    horizontalFOV: number = 90,
    verticalFOV: number = 60
  ): ViewportTransform {
    const angles = this.smoothedAngles;

    // 計算旋轉矩陣
    const rotationMatrix = this.calculateRotationMatrix(angles);

    // 計算視口中心位置
    const centerX = (angles.yaw + 180) / 360; // 0-1
    const centerY = (angles.pitch + 90) / 180; // 0-1

    return {
      horizontalFOV,
      verticalFOV,
      centerX,
      centerY,
      rotationMatrix,
    };
  }

  /**
   * 計算旋轉矩陣（Z-Y-X 歐拉角順序）
   */
  private calculateRotationMatrix(angles: EulerAngles): number[][] {
    const pitch = (angles.pitch * Math.PI) / 180;
    const yaw = (angles.yaw * Math.PI) / 180;
    const roll = (angles.roll * Math.PI) / 180;

    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);

    // Z-Y-X 旋轉矩陣
    return [
      [
        cosY * cosR - sinY * sinP * sinR,
        -cosY * sinR - sinY * sinP * cosR,
        -sinY * cosP,
      ],
      [sinR * cosP, cosR * cosP, sinP],
      [
        sinY * cosR + cosY * sinP * sinR,
        -sinY * sinR + cosY * sinP * cosR,
        cosY * cosP,
      ],
    ];
  }

  /**
   * 設置平滑係數
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * 重置追蹤
   */
  reset(): void {
    this.currentEulerAngles = { pitch: 0, yaw: 0, roll: 0 };
    this.smoothedAngles = { pitch: 0, yaw: 0, roll: 0 };
  }

  /**
   * 訂閱角度變化
   */
  subscribe(listener: (angles: EulerAngles) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(angles: EulerAngles): void {
    this.listeners.forEach((listener) => listener(angles));
  }

  /**
   * 清理資源
   */
  destroy(): void {
    this.listeners = [];
    this.disable();
  }
}

/**
 * 全景影片視角計算器
 */
export class PanoramicViewCalculator {
  /**
   * 計算 360° 全景影片的裁剪區域
   */
  static calculateCropRegion(
    imageWidth: number,
    imageHeight: number,
    transform: ViewportTransform
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { horizontalFOV, verticalFOV, centerX, centerY } = transform;

    // 計算視角占全景的比例
    const horizontalRatio = horizontalFOV / 360;
    const verticalRatio = verticalFOV / 180;

    // 計算裁剪區域
    const cropWidth = Math.round(imageWidth * horizontalRatio);
    const cropHeight = Math.round(imageHeight * verticalRatio);

    const x = Math.round(centerX * imageWidth - cropWidth / 2);
    const y = Math.round(centerY * imageHeight - cropHeight / 2);

    return {
      x: Math.max(0, Math.min(imageWidth - cropWidth, x)),
      y: Math.max(0, Math.min(imageHeight - cropHeight, y)),
      width: cropWidth,
      height: cropHeight,
    };
  }

  /**
   * 計算立方體貼圖的面與坐標
   */
  static calculateCubemapFace(
    angles: EulerAngles
  ): {
    face: "front" | "back" | "left" | "right" | "top" | "bottom";
    u: number;
    v: number;
  } {
    const pitch = angles.pitch;
    const yaw = angles.yaw;

    // 判斷主要面
    let face: "front" | "back" | "left" | "right" | "top" | "bottom";
    let u: number;
    let v: number;

    if (Math.abs(pitch) > 45) {
      // 上或下
      face = pitch > 0 ? "top" : "bottom";
      u = (yaw + 180) / 360;
      v = (Math.abs(pitch) - 45) / 45;
    } else if (Math.abs(yaw) > 45) {
      // 左或右
      face = yaw > 0 ? "right" : "left";
      u = ((yaw % 90) + 90) / 180;
      v = (pitch + 45) / 90;
    } else {
      // 前
      face = "front";
      u = (yaw + 45) / 90;
      v = (pitch + 45) / 90;
    }

    return { face, u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
  }
}

/**
 * 全局陀螺儀追蹤器實例
 */
export const gyroscopeTracker = new GyroscopeTracker();
