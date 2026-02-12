import { describe, it, expect, beforeEach } from 'vitest';
import { calculateOptimalPupilDistance, validateSBSOptions } from '../use-sbs-converter';

describe('SBS Converter Utilities', () => {
  describe('calculateOptimalPupilDistance', () => {
    it('應該計算合理的瞳距', () => {
      const screenWidth = 150; // 150mm
      const viewingDistance = 600; // 600mm
      const distance = calculateOptimalPupilDistance(screenWidth, viewingDistance);

      expect(distance).toBeGreaterThanOrEqual(50);
      expect(distance).toBeLessThanOrEqual(80);
    });

    it('應該在不同屏幕尺寸下計算不同的瞳距', () => {
      const small = calculateOptimalPupilDistance(100, 600);
      const large = calculateOptimalPupilDistance(200, 600);

      expect(small).toBeLessThan(large);
    });

    it('應該限制瞳距在 50-80mm 範圍內', () => {
      const distance1 = calculateOptimalPupilDistance(50, 100);
      const distance2 = calculateOptimalPupilDistance(500, 5000);

      expect(distance1).toBeGreaterThanOrEqual(50);
      expect(distance1).toBeLessThanOrEqual(80);
      expect(distance2).toBeGreaterThanOrEqual(50);
      expect(distance2).toBeLessThanOrEqual(80);
    });
  });

  describe('validateSBSOptions', () => {
    it('應該驗證有效的 SBS 選項', () => {
      const result = validateSBSOptions({
        enabled: true,
        pupilDistance: 65,
        convergenceDistance: 1000,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該拒絕瞳距超出範圍的選項', () => {
      const result = validateSBSOptions({
        enabled: true,
        pupilDistance: 100, // 超過 80mm
        convergenceDistance: 1000,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('瞳距應在 50-80mm 之間');
    });

    it('應該拒絕聚焦距離超出範圍的選項', () => {
      const result = validateSBSOptions({
        enabled: true,
        pupilDistance: 65,
        convergenceDistance: 10000, // 超過 5000mm
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('聚焦距離應在 500-5000mm 之間');
    });

    it('應該檢測多個錯誤', () => {
      const result = validateSBSOptions({
        enabled: true,
        pupilDistance: 30, // 太小
        convergenceDistance: 100, // 太小
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('應該接受邊界值', () => {
      const result1 = validateSBSOptions({
        enabled: true,
        pupilDistance: 50, // 最小值
        convergenceDistance: 500, // 最小值
      });

      const result2 = validateSBSOptions({
        enabled: true,
        pupilDistance: 80, // 最大值
        convergenceDistance: 5000, // 最大值
      });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });
});
