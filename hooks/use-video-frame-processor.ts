import { useState, useCallback, useRef } from 'react';

/**
 * 影片幀處理 Hook
 * 
 * 功能：
 * - 提取影片幀
 * - 處理 2D 轉 3D 轉換
 * - 優化大型檔案處理
 * - 支援實時預覽
 */

export interface FrameProcessorOptions {
  width: number;
  height: number;
  format: 'rgba' | 'yuv';
}

export interface FrameProcessorState {
  isProcessing: boolean;
  currentFrame: number;
  totalFrames: number;
  progress: number;
  error: string | null;
}

export interface ProcessedFrame {
  data: Uint8Array;
  width: number;
  height: number;
  timestamp: number;
}

export function useVideoFrameProcessor() {
  const [state, setState] = useState<FrameProcessorState>({
    isProcessing: false,
    currentFrame: 0,
    totalFrames: 0,
    progress: 0,
    error: null,
  });

  const processorRef = useRef<AbortController | null>(null);
  const frameBufferRef = useRef<Map<number, ProcessedFrame>>(new Map());

  /**
   * 提取影片幀
   */
  const extractFrame = useCallback(
    async (
      videoUri: string,
      frameIndex: number,
      options: FrameProcessorOptions
    ): Promise<ProcessedFrame | null> => {
      try {
        // 檢查緩存
        if (frameBufferRef.current.has(frameIndex)) {
          return frameBufferRef.current.get(frameIndex) || null;
        }

        setState((prev) => ({
          ...prev,
          isProcessing: true,
          currentFrame: frameIndex,
        }));

        // 模擬幀提取（實際應用中使用原生模塊）
        const frame = await simulateFrameExtraction(
          videoUri,
          frameIndex,
          options
        );

        // 緩存幀
        frameBufferRef.current.set(frameIndex, frame);

        // 限制緩存大小（最多保存 100 幀）
        if (frameBufferRef.current.size > 100) {
          const firstKey = frameBufferRef.current.keys().next().value as number | undefined;
          if (firstKey !== undefined) {
            frameBufferRef.current.delete(firstKey);
          }
        }

        setState((prev) => ({
          ...prev,
          isProcessing: false,
        }));

        return frame;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '幀提取失敗';
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    []
  );

  /**
   * 模擬幀提取
   */
  const simulateFrameExtraction = async (
    videoUri: string,
    frameIndex: number,
    options: FrameProcessorOptions
  ): Promise<ProcessedFrame> => {
    // 模擬處理延遲
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 創建模擬幀數據
    const pixelCount = options.width * options.height;
    const bytesPerPixel = options.format === 'rgba' ? 4 : 3;
    const frameData = new Uint8Array(pixelCount * bytesPerPixel);

    // 填充模擬數據
    for (let i = 0; i < frameData.length; i++) {
      frameData[i] = Math.random() * 255;
    }

    return {
      data: frameData,
      width: options.width,
      height: options.height,
      timestamp: frameIndex * (1000 / 30), // 假設 30fps
    };
  };

  /**
   * 將 2D 幀轉換為 SBS 3D
   * 
   * 轉換方法：
   * 1. 將原始幀分為左右兩部分
   * 2. 左部分保持不變（左眼視角）
   * 3. 右部分進行水平位移（右眼視角）
   */
  const convertFrameToSBS = useCallback(
    (
      frame: ProcessedFrame,
      disparityShift: number
    ): ProcessedFrame => {
      const { data, width, height } = frame;
      const bytesPerPixel = 4; // RGBA

      // 創建新的 SBS 幀（寬度翻倍）
      const sbsData = new Uint8Array(width * 2 * height * bytesPerPixel);

      // 複製左眼視角（原始幀）
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = (y * width + x) * bytesPerPixel;
          const dstIdx = (y * (width * 2) + x) * bytesPerPixel;

          sbsData[dstIdx] = data[srcIdx];
          sbsData[dstIdx + 1] = data[srcIdx + 1];
          sbsData[dstIdx + 2] = data[srcIdx + 2];
          sbsData[dstIdx + 3] = data[srcIdx + 3];
        }
      }

      // 複製右眼視角（應用位移）
      const shiftPixels = Math.round((disparityShift / 100) * width);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = Math.max(0, Math.min(width - 1, x + shiftPixels));
          const srcIdx = (y * width + srcX) * bytesPerPixel;
          const dstIdx = (y * (width * 2) + (width + x)) * bytesPerPixel;

          sbsData[dstIdx] = data[srcIdx];
          sbsData[dstIdx + 1] = data[srcIdx + 1];
          sbsData[dstIdx + 2] = data[srcIdx + 2];
          sbsData[dstIdx + 3] = data[srcIdx + 3];
        }
      }

      return {
        data: sbsData,
        width: width * 2,
        height,
        timestamp: frame.timestamp,
      };
    },
    []
  );

  /**
   * 批量處理幀
   */
  const processBatch = useCallback(
    async (
      videoUri: string,
      startFrame: number,
      endFrame: number,
      options: FrameProcessorOptions,
      onProgress?: (progress: number) => void
    ): Promise<ProcessedFrame[]> => {
      const frames: ProcessedFrame[] = [];
      processorRef.current = new AbortController();

      try {
        const totalFrames = endFrame - startFrame;

        for (let i = startFrame; i < endFrame; i++) {
          if (processorRef.current?.signal.aborted) {
            throw new Error('處理已取消');
          }

          const frame = await extractFrame(videoUri, i, options);
          if (frame) {
            frames.push(frame);
          }

          const progress = ((i - startFrame + 1) / (totalFrames || 1)) * 100;
          setState((prev) => ({
            ...prev,
            progress,
            currentFrame: i,
          }));

          onProgress?.(progress);
        }

        return frames;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '批量處理失敗';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return frames;
      }
    },
    [extractFrame]
  );

  /**
   * 取消處理
   */
  const cancelProcessing = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      error: '處理已取消',
    }));
  }, []);

  /**
   * 清除幀緩存
   */
  const clearFrameBuffer = useCallback(() => {
    frameBufferRef.current.clear();
    setState((prev) => ({
      ...prev,
      currentFrame: 0,
      totalFrames: 0,
    }));
  }, []);

  /**
   * 獲取緩存統計
   */
  const getBufferStats = useCallback(() => {
    return {
      cachedFrames: frameBufferRef.current.size,
      estimatedMemory: frameBufferRef.current.size * (1920 * 1080 * 4), // 估算內存使用
    };
  }, []);

  return {
    ...state,
    extractFrame,
    convertFrameToSBS,
    processBatch,
    cancelProcessing,
    clearFrameBuffer,
    getBufferStats,
  };
}

/**
 * 優化大型影片的幀提取
 */
export function optimizeFrameExtraction(
  videoSize: number, // 檔案大小 (bytes)
  duration: number, // 影片時長 (seconds)
  fps: number = 30
) {
  // 計算最佳採樣率
  const totalFrames = Math.round(duration * fps);
  const estimatedMemoryPerFrame = 1920 * 1080 * 4; // RGBA
  const totalMemory = totalFrames * estimatedMemoryPerFrame;

  // 如果內存超過 500MB，使用採樣
  const maxMemory = 500 * 1024 * 1024;
  const samplingRate = Math.max(1, Math.ceil(totalMemory / maxMemory));

  return {
    samplingRate,
    effectiveFrames: Math.ceil(totalFrames / samplingRate),
    estimatedMemory: (totalMemory / samplingRate) / (1024 * 1024), // MB
  };
}
