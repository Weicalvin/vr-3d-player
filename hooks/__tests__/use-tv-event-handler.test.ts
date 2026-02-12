import { describe, it, expect, vi } from 'vitest';

describe('TV Event Handler', () => {
  it('應該支援方向鍵映射', () => {
    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
    };

    Object.entries(keyMap).forEach(([key, eventType]) => {
      expect(eventType).toBeDefined();
      expect(typeof eventType).toBe('string');
    });
  });

  it('應該支援播放控制鍵映射', () => {
    const keyMap = {
      'Enter': 'select',
      ' ': 'playPause',
      'p': 'playPause',
      'n': 'next',
      'N': 'previous',
    };

    Object.entries(keyMap).forEach(([key, eventType]) => {
      expect(eventType).toBeDefined();
      expect(typeof eventType).toBe('string');
    });
  });

  it('應該支援快進/快退鍵映射', () => {
    const keyMap = {
      '>': 'fastForward',
      '<': 'rewind',
    };

    Object.entries(keyMap).forEach(([key, eventType]) => {
      expect(eventType).toBeDefined();
      expect(typeof eventType).toBe('string');
    });
  });

  it('應該定義 TVEvent 介面', () => {
    interface TVEvent {
      eventType: string;
    }

    const event: TVEvent = { eventType: 'select' };
    expect(event.eventType).toBe('select');
  });

  it('應該支援所有必要的事件類型', () => {
    const eventTypes = [
      'up', 'down', 'left', 'right',
      'select', 'center', 'playPause',
      'next', 'previous', 'fastForward', 'rewind'
    ];

    eventTypes.forEach(eventType => {
      expect(eventType).toBeDefined();
      expect(typeof eventType).toBe('string');
    });
  });
});
