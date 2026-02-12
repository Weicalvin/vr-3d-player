import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * TV 事件類型定義
 */
export interface TVEvent {
  eventType: string;
}

/**
 * 相容的 TV 事件處理 Hook
 * 
 * 功能：
 * - 提供統一的 TV 遙控器事件監聽
 * - 在不支援 useTVEventHandler 的環境中提供備用方案
 * - 支援鍵盤事件模擬（用於測試）
 */
export function useTVEventHandler(callback: (evt: TVEvent) => void) {
  useEffect(() => {
    // 只在 TV 平台上才嘗試使用原生 useTVEventHandler
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    try {
      // 嘗試從 react-native 導入 useTVEventHandler
      const { useTVEventHandler: nativeUseTVEventHandler } = require('react-native');
      
      if (typeof nativeUseTVEventHandler === 'function') {
        // 如果可用，使用原生實現
        nativeUseTVEventHandler(callback);
        return;
      }
    } catch (err) {
      console.warn('useTVEventHandler 不可用，使用備用方案');
    }

    // 備用方案：監聽鍵盤事件
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMap: { [key: string]: string } = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'Enter': 'select',
        ' ': 'playPause',
        'p': 'playPause',
        'n': 'next',
        'N': 'previous',
        '>': 'fastForward',
        '<': 'rewind',
      };

      const eventType = keyMap[event.key];
      if (eventType) {
        event.preventDefault();
        callback({ eventType });
      }
    };

    // 添加鍵盤監聽（用於測試）
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [callback]);
}

/**
 * 安全的 TV 事件處理 Hook
 * 
 * 這個版本完全避免使用 useTVEventHandler，
 * 而是提供一個通用的事件系統
 */
export function useSafeTVEventHandler(callback: (evt: TVEvent) => void) {
  useEffect(() => {
    // 鍵盤事件映射
    const keyMap: { [key: string]: string } = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Enter': 'select',
      ' ': 'playPause',
      'p': 'playPause',
      'P': 'playPause',
      'n': 'next',
      'N': 'previous',
      '>': 'fastForward',
      '<': 'rewind',
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const eventType = keyMap[event.key];
      if (eventType) {
        event.preventDefault();
        callback({ eventType });
      }
    };

    // 添加鍵盤監聽
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [callback]);
}
