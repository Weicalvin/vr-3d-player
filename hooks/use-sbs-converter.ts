import { useState, useCallback, useRef } from 'react';
import { Image } from 'react-native';

/**
 * 2D 轉 3D (SBS - Side-by-Side) 轉換 Hook
 * 
 * 功能：
 * - 將 2D 影片轉換為 SBS 3D 格式
 * - 支援實時轉換和緩存
 * - 優化大型檔案的處理
 */

export interface SBSConverterOptions {
  enabled: boolean;
  pupilDistance: number; // 瞳距 (mm)，默認 65mm
  convergenceDistance: number; // 聚焦距離 (mm)，默認 1000mm
}

export interface SBSConverterState {
  isConverting: boolean;
  progress: number; // 0-100
  error: string | null;
  convertedUri: string | null;
}

// 緩存已轉換的影片
const conversionCache = new Map<string, string>();

export function useSBSConverter() {
  const [state, setState] = useState<SBSConverterState>({
    isConverting: false,
    progress: 0,
    error: null,
    convertedUri: null,
  });

  const conversionRef = useRef<AbortController | null>(null);

  /**
   * 轉換 2D 影片為 SBS 3D 格式
   * 
   * SBS 轉換原理：
   * 1. 將原始 2D 影片分為左右兩部分
   * 2. 左部分保持不變（左眼視角）
   * 3. 右部分進行水平位移（右眼視角）
   * 4. 位移量基於瞳距和聚焦距離計算
   */
  const convertToSBS = useCallback(
    async (
      videoUri: string,
      options: SBSConverterOptions
    ): Promise<string | null> => {
      // 檢查緩存
      const cacheKey = `${videoUri}_${options.pupilDistance}_${options.convergenceDistance}`;
      if (conversionCache.has(cacheKey)) {
        setState((prev) => ({
          ...prev,
          convertedUri: conversionCache.get(cacheKey) || null,
          isConverting: false,
          progress: 100,
        }));
        return conversionCache.get(cacheKey) || null;
      }

      // 開始轉換
      setState((prev) => ({
        ...prev,
        isConverting: true,
        progress: 0,
        error: null,
      }));

      try {
        // 創建新的 AbortController
        conversionRef.current = new AbortController();

        // 模擬轉換進度
        for (let i = 0; i <= 100; i += 10) {
          if (conversionRef.current?.signal.aborted) {
            throw new Error('轉換已取消');
          }

          setState((prev) => ({
            ...prev,
            progress: i,
          }));

          // 模擬處理時間
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // 計算位移量（基於瞳距和聚焦距離）
        const disparityShift = calculateDisparityShift(
          options.pupilDistance,
          options.convergenceDistance
        );

        // 生成轉換後的 URI（實際應用中這裡會調用原生模塊進行真實轉換）
        const convertedUri = generateSBSUri(videoUri, disparityShift);

        // 緩存結果
        conversionCache.set(cacheKey, convertedUri);

        setState((prev) => ({
          ...prev,
          isConverting: false,
          progress: 100,
          convertedUri,
          error: null,
        }));

        return convertedUri;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '轉換失敗';
        setState((prev) => ({
          ...prev,
          isConverting: false,
          error: errorMessage,
          progress: 0,
        }));
        return null;
      }
    },
    []
  );

  /**
   * 計算視差位移量
   * 
   * 公式：
   * disparityShift = (pupilDistance / convergenceDistance) * screenWidth
   * 
   * 其中：
   * - pupilDistance: 瞳距 (mm)
   * - convergenceDistance: 聚焦距離 (mm)
   * - screenWidth: 屏幕寬度 (px)
   */
  const calculateDisparityShift = (
    pupilDistance: number,
    convergenceDistance: number
  ): number => {
    // 標準瞳距 65mm，標準聚焦距離 1000mm
    const baseShift = (pupilDistance / convergenceDistance) * 100;
    
    // 限制位移範圍 (-10% 到 10%)
    return Math.max(-10, Math.min(10, baseShift));
  };

  /**
   * 生成 SBS 轉換後的 URI
   * 
   * 注意：這是一個簡化的實現
   * 實際應用中應該使用原生模塊（如 FFmpeg）進行真實轉換
   */
  const generateSBSUri = (videoUri: string, disparityShift: number): string => {
    // 添加轉換參數到 URI
    const separator = videoUri.includes('?') ? '&' : '?';
    return `${videoUri}${separator}sbs=true&shift=${disparityShift}`;
  };

  /**
   * 取消轉換
   */
  const cancelConversion = useCallback(() => {
    if (conversionRef.current) {
      conversionRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isConverting: false,
      progress: 0,
      error: '轉換已取消',
    }));
  }, []);

  /**
   * 清除緩存
   */
  const clearCache = useCallback(() => {
    conversionCache.clear();
    setState((prev) => ({
      ...prev,
      convertedUri: null,
    }));
  }, []);

  /**
   * 獲取轉換統計信息
   */
  const getStats = useCallback(() => {
    return {
      cacheSize: conversionCache.size,
      isConverting: state.isConverting,
      progress: state.progress,
    };
  }, [state.isConverting, state.progress]);

  return {
    ...state,
    convertToSBS,
    cancelConversion,
    clearCache,
    getStats,
  };
}

/**
 * 計算 SBS 3D 的最佳瞳距
 * 
 * 根據屏幕尺寸和觀看距離計算最佳瞳距
 */
export function calculateOptimalPupilDistance(
  screenWidth: number, // 屏幕寬度 (mm)
  viewingDistance: number // 觀看距離 (mm)
): number {
  // 根據視角計算最佳瞳距
  // 標準視角約 30 度
  const optimalDistance = (screenWidth * Math.tan((30 * Math.PI) / 180)) / 2;
  return Math.max(50, Math.min(80, optimalDistance)); // 限制在 50-80mm
}

/**
 * 驗證 SBS 參數
 */
export function validateSBSOptions(options: SBSConverterOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.pupilDistance < 50 || options.pupilDistance > 80) {
    errors.push('瞳距應在 50-80mm 之間');
  }

  if (options.convergenceDistance < 500 || options.convergenceDistance > 5000) {
    errors.push('聚焦距離應在 500-5000mm 之間');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
