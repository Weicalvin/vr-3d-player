/**
 * VR 3D 影片處理工具
 * 支援 2D 轉 3D (SBS) 轉換、瞳距調節等功能
 */

export interface VideoProcessingOptions {
  /** 瞳距距離 (毫米) */
  pupilDistance: number;
  /** 亮度調整 (0.3 - 1.0) */
  brightness: number;
  /** 對比度調整 (0.5 - 2.0) */
  contrast: number;
  /** 飽和度調整 (0 - 2.0) */
  saturation: number;
}

export interface SBSConversionOptions extends VideoProcessingOptions {
  /** 分離強度 (0 - 1.0) */
  separationStrength: number;
  /** 視差調整 (0 - 100) */
  parallax: number;
}

/**
 * 2D 轉 3D (SBS - Side-by-Side) 轉換
 * 
 * 演算法說明：
 * 1. 將原始 2D 影像複製為左右兩份
 * 2. 根據瞳距和視差參數應用水平位移
 * 3. 左眼影像向左移動，右眼影像向右移動
 * 4. 根據分離強度調整位移量
 * 
 * @param imageData 原始影像數據
 * @param options 轉換選項
 * @returns SBS 3D 影像數據
 */
export function convertTo2DTo3D(
  imageData: ImageData,
  options: SBSConversionOptions
): ImageData {
  const { width, height } = imageData;
  const sbsWidth = width * 2; // SBS 格式寬度加倍
  const sbsData = new Uint8ClampedArray(sbsWidth * height * 4);

  // 計算位移量（基於瞳距和視差）
  const displacement = Math.round(
    (options.pupilDistance / 65) * (options.parallax / 100) * 10
  );
  const separation = options.separationStrength;

  // 處理每個像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const [r, g, b, a] = [
        imageData.data[srcIdx],
        imageData.data[srcIdx + 1],
        imageData.data[srcIdx + 2],
        imageData.data[srcIdx + 3],
      ];

      // 應用亮度、對比度、飽和度調整
      const [adjR, adjG, adjB] = applyColorAdjustments(
        [r, g, b],
        options
      );

      // 左眼（左側）- 向左移動
      const leftX = Math.max(0, x - Math.round(displacement * separation));
      if (leftX < width) {
        const leftIdx = (y * sbsWidth + leftX) * 4;
        sbsData[leftIdx] = adjR;
        sbsData[leftIdx + 1] = adjG;
        sbsData[leftIdx + 2] = adjB;
        sbsData[leftIdx + 3] = a;
      }

      // 右眼（右側）- 向右移動
      const rightX = Math.min(width - 1, x + Math.round(displacement * separation));
      if (rightX < width) {
        const rightIdx = (y * sbsWidth + width + rightX) * 4;
        sbsData[rightIdx] = adjR;
        sbsData[rightIdx + 1] = adjG;
        sbsData[rightIdx + 2] = adjB;
        sbsData[rightIdx + 3] = a;
      }
    }
  }

  return new ImageData(sbsData, sbsWidth, height);
}

/**
 * 應用顏色調整（亮度、對比度、飽和度）
 * 
 * @param rgb RGB 顏色值
 * @param options 調整選項
 * @returns 調整後的 RGB 值
 */
export function applyColorAdjustments(
  [r, g, b]: [number, number, number],
  options: VideoProcessingOptions
): [number, number, number] {
  // 應用亮度
  let adjR = r * options.brightness;
  let adjG = g * options.brightness;
  let adjB = b * options.brightness;

  // 應用對比度
  const center = 128;
  adjR = center + (adjR - center) * options.contrast;
  adjG = center + (adjG - center) * options.contrast;
  adjB = center + (adjB - center) * options.contrast;

  // 應用飽和度
  const gray = (adjR + adjG + adjB) / 3;
  adjR = gray + (adjR - gray) * options.saturation;
  adjG = gray + (adjG - gray) * options.saturation;
  adjB = gray + (adjB - gray) * options.saturation;

  // 限制範圍
  return [
    Math.max(0, Math.min(255, adjR)),
    Math.max(0, Math.min(255, adjG)),
    Math.max(0, Math.min(255, adjB)),
  ];
}

/**
 * 計算瞳距調節的水平位移
 * 
 * @param pupilDistance 瞳距 (毫米)
 * @param screenWidth 螢幕寬度 (像素)
 * @param viewingDistance 觀看距離 (釐米)
 * @returns 位移量 (像素)
 */
export function calculatePupilDistanceShift(
  pupilDistance: number,
  screenWidth: number,
  viewingDistance: number = 50
): number {
  // 基於視角計算位移
  // 標準瞳距 65mm，觀看距離 50cm
  const standardPupilDistance = 65;
  const basePupilShift = screenWidth * 0.02; // 基礎位移為螢幕寬度的 2%

  const shift = (pupilDistance / standardPupilDistance) * basePupilShift;
  return Math.round(shift);
}

/**
 * 驗證瞳距值是否在有效範圍內
 * 
 * @param pupilDistance 瞳距 (毫米)
 * @returns 是否有效
 */
export function isValidPupilDistance(pupilDistance: number): boolean {
  // 正常瞳距範圍：50-75mm
  return pupilDistance >= 50 && pupilDistance <= 75;
}

/**
 * 計算 360° 全景影片的視角轉換
 * 
 * @param yaw 水平旋轉角度 (度)
 * @param pitch 垂直旋轉角度 (度)
 * @param roll 滾轉角度 (度)
 * @returns 轉換矩陣
 */
export function calculatePanoramicTransform(
  yaw: number,
  pitch: number,
  roll: number
): number[][] {
  // 轉換為弧度
  const y = (yaw * Math.PI) / 180;
  const p = (pitch * Math.PI) / 180;
  const r = (roll * Math.PI) / 180;

  // 旋轉矩陣計算
  const cosY = Math.cos(y);
  const sinY = Math.sin(y);
  const cosP = Math.cos(p);
  const sinP = Math.sin(p);
  const cosR = Math.cos(r);
  const sinR = Math.sin(r);

  // 組合旋轉矩陣 (Z-Y-X 歐拉角)
  return [
    [
      cosY * cosP,
      cosY * sinP * sinR - sinY * cosR,
      cosY * sinP * cosR + sinY * sinR,
    ],
    [
      sinY * cosP,
      sinY * sinP * sinR + cosY * cosR,
      sinY * sinP * cosR - cosY * sinR,
    ],
    [-sinP, cosP * sinR, cosP * cosR],
  ];
}

/**
 * 獲取預設的 VR 設備瞳距配置
 */
export const VR_DEVICE_PUPIL_DISTANCES: Record<string, number> = {
  "大朋 VR": 65,
  "小米 VR": 62,
  "魔風暴鏡": 64,
  "千幻鏡": 63,
  "精靈鏡": 65,
  "小寨魔鏡": 64,
  "標準 VR": 65,
};

/**
 * 播放速度預設值
 */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/**
 * 亮度調整預設值
 */
export const BRIGHTNESS_PRESETS = {
  暗: 0.6,
  標準: 1.0,
  亮: 1.4,
};

/**
 * 對比度調整預設值
 */
export const CONTRAST_PRESETS = {
  低: 0.8,
  標準: 1.0,
  高: 1.2,
};
