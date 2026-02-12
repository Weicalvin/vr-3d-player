import { describe, it, expect } from 'vitest';
import { optimizeFrameExtraction } from '../use-video-frame-processor';

describe('Video Frame Processor Utilities', () => {
  describe('optimizeFrameExtraction', () => {
    it('應該為小型影片返回合理的採樣率', () => {
      const videoSize = 100 * 1024 * 1024; // 100MB
      const duration = 60; // 60 秒
      const result = optimizeFrameExtraction(videoSize, duration);

      // 採樣率應該是正整數
      expect(result.samplingRate).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(result.samplingRate)).toBe(true);
    });

    it('應該為大型影片返回更高的採樣率', () => {
      const videoSize = 1000 * 1024 * 1024; // 1GB
      const duration = 300; // 5 分鐘
      const result = optimizeFrameExtraction(videoSize, duration);

      expect(result.samplingRate).toBeGreaterThan(1);
    });

    it('應該計算正確的有效幀數', () => {
      const videoSize = 500 * 1024 * 1024; // 500MB
      const duration = 120; // 2 分鐘
      const fps = 30;
      const result = optimizeFrameExtraction(videoSize, duration, fps);

      const totalFrames = Math.round(duration * fps);
      const expectedEffectiveFrames = Math.ceil(totalFrames / result.samplingRate);

      expect(result.effectiveFrames).toBe(expectedEffectiveFrames);
    });

    it('應該估算合理的內存使用', () => {
      const videoSize = 100 * 1024 * 1024; // 100MB
      const duration = 60; // 60 秒
      const result = optimizeFrameExtraction(videoSize, duration);

      // 內存使用應該小於 500MB
      expect(result.estimatedMemory).toBeLessThan(500);
    });

    it('應該支援自定義 FPS', () => {
      const videoSize = 100 * 1024 * 1024;
      const duration = 60;
      
      const result24fps = optimizeFrameExtraction(videoSize, duration, 24);
      const result60fps = optimizeFrameExtraction(videoSize, duration, 60);

      // 60fps 應該有更多幀
      expect(result60fps.effectiveFrames).toBeGreaterThanOrEqual(result24fps.effectiveFrames);
    });

    it('應該處理邊界情況', () => {
      // 非常短的影片
      const result1 = optimizeFrameExtraction(10 * 1024 * 1024, 1);
      expect(result1.samplingRate).toBeGreaterThan(0);

      // 非常長的影片
      const result2 = optimizeFrameExtraction(5000 * 1024 * 1024, 3600);
      expect(result2.samplingRate).toBeGreaterThan(0);
    });

    it('應該在不同視頻大小下返回不同的採樣率', () => {
      const duration = 120;
      const fps = 30;

      const small = optimizeFrameExtraction(100 * 1024 * 1024, duration, fps);
      const medium = optimizeFrameExtraction(500 * 1024 * 1024, duration, fps);
      const large = optimizeFrameExtraction(1000 * 1024 * 1024, duration, fps);

      // 更大的檔案應該有更高的採樣率
      expect(small.samplingRate).toBeLessThanOrEqual(medium.samplingRate);
      expect(medium.samplingRate).toBeLessThanOrEqual(large.samplingRate);
    });
  });
});
