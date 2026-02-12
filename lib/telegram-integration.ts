/**
 * Telegram 串流集成系統
 * 支援從 Telegram 頻道與群組串流播放影片
 */

export interface TelegramChannel {
  id: string;
  title: string;
  username?: string;
  description?: string;
  memberCount?: number;
  photoUrl?: string;
  isPrivate: boolean;
}

export interface TelegramMessage {
  id: string;
  messageId: number;
  channelId: string;
  text?: string;
  caption?: string;
  timestamp: number;
  video?: {
    fileId: string;
    fileSize: number;
    duration: number;
    width: number;
    height: number;
    mimeType: string;
  };
  document?: {
    fileId: string;
    fileSize: number;
    fileName: string;
    mimeType: string;
  };
}

export interface TelegramStreamConfig {
  botToken: string;
  apiEndpoint: string;
  maxRetries: number;
  timeout: number;
}

/**
 * Telegram 集成管理器
 */
export class TelegramIntegrationManager {
  private config: TelegramStreamConfig;
  private isAuthenticated: boolean = false;
  private userToken?: string;
  private cachedChannels: Map<string, TelegramChannel> = new Map();
  private listeners: ((event: string, data: any) => void)[] = [];

  constructor(config: TelegramStreamConfig) {
    this.config = config;
  }

  /**
   * 驗證 Telegram 帳戶
   */
  async authenticate(phoneNumber: string): Promise<boolean> {
    try {
      // 發送驗證碼請求
      const response = await fetch(`${this.config.apiEndpoint}/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error("發送驗證碼失敗");
      }

      this.notifyListeners("auth-code-sent", { phoneNumber });
      return true;
    } catch (err) {
      console.error("驗證失敗:", err);
      return false;
    }
  }

  /**
   * 驗證驗證碼
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code }),
      });

      if (!response.ok) {
        throw new Error("驗證碼驗證失敗");
      }

      const data = await response.json();
      this.userToken = data.token;
      this.isAuthenticated = true;
      this.notifyListeners("authenticated", {});
      return true;
    } catch (err) {
      console.error("驗證碼驗證失敗:", err);
      return false;
    }
  }

  /**
   * 檢查是否已驗證
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated && !!this.userToken;
  }

  /**
   * 登出
   */
  logout(): void {
    this.isAuthenticated = false;
    this.userToken = undefined;
    this.cachedChannels.clear();
    this.notifyListeners("logged-out", {});
  }

  /**
   * 搜尋頻道
   */
  async searchChannels(query: string): Promise<TelegramChannel[]> {
    if (!this.isLoggedIn()) {
      throw new Error("未登入");
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/channels/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.userToken}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("搜尋失敗");
      }

      const channels = await response.json();
      channels.forEach((ch: TelegramChannel) => {
        this.cachedChannels.set(ch.id, ch);
      });

      return channels;
    } catch (err) {
      console.error("搜尋頻道失敗:", err);
      return [];
    }
  }

  /**
   * 獲取用戶的頻道列表
   */
  async getUserChannels(): Promise<TelegramChannel[]> {
    if (!this.isLoggedIn()) {
      throw new Error("未登入");
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/channels/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("獲取頻道列表失敗");
      }

      const channels = await response.json();
      channels.forEach((ch: TelegramChannel) => {
        this.cachedChannels.set(ch.id, ch);
      });

      return channels;
    } catch (err) {
      console.error("獲取頻道列表失敗:", err);
      return [];
    }
  }

  /**
   * 獲取頻道中的影片
   */
  async getChannelVideos(
    channelId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TelegramMessage[]> {
    if (!this.isLoggedIn()) {
      throw new Error("未登入");
    }

    try {
      const response = await fetch(
        `${this.config.apiEndpoint}/channels/${channelId}/videos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.userToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("獲取影片失敗");
      }

      const messages = await response.json();
      return messages.slice(offset, offset + limit);
    } catch (err) {
      console.error("獲取頻道影片失敗:", err);
      return [];
    }
  }

  /**
   * 獲取影片串流 URL
   */
  async getVideoStreamUrl(messageId: string, fileId: string): Promise<string> {
    if (!this.isLoggedIn()) {
      throw new Error("未登入");
    }

    try {
      const response = await fetch(
        `${this.config.apiEndpoint}/videos/stream-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.userToken}`,
          },
          body: JSON.stringify({ messageId, fileId }),
        }
      );

      if (!response.ok) {
        throw new Error("獲取串流 URL 失敗");
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error("獲取串流 URL 失敗:", err);
      throw err;
    }
  }

  /**
   * 下載影片
   */
  async downloadVideo(
    messageId: string,
    fileId: string,
    savePath: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    if (!this.isLoggedIn()) {
      throw new Error("未登入");
    }

    try {
      const streamUrl = await this.getVideoStreamUrl(messageId, fileId);
      
      // 實際下載邏輯應在原生層實現
      this.notifyListeners("download-started", { messageId, fileId });
      
      // 模擬下載進度
      for (let i = 0; i <= 100; i += 10) {
        onProgress?.(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.notifyListeners("download-completed", { messageId, fileId, savePath });
      return true;
    } catch (err) {
      console.error("下載失敗:", err);
      this.notifyListeners("download-failed", { messageId, fileId, error: err });
      return false;
    }
  }

  /**
   * 訂閱事件
   */
  subscribe(listener: (event: string, data: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 通知監聽器
   */
  private notifyListeners(event: string, data: any): void {
    this.listeners.forEach((listener) => listener(event, data));
  }

  /**
   * 獲取快取的頻道
   */
  getCachedChannel(channelId: string): TelegramChannel | undefined {
    return this.cachedChannels.get(channelId);
  }

  /**
   * 清空快取
   */
  clearCache(): void {
    this.cachedChannels.clear();
  }
}

/**
 * Telegram 串流播放器
 */
export class TelegramStreamPlayer {
  private manager: TelegramIntegrationManager;
  private currentStreamUrl?: string;
  private currentMessage?: TelegramMessage;

  constructor(manager: TelegramIntegrationManager) {
    this.manager = manager;
  }

  /**
   * 播放 Telegram 影片
   */
  async playMessage(message: TelegramMessage): Promise<string> {
    if (!message.video) {
      throw new Error("訊息不包含影片");
    }

    try {
      const streamUrl = await this.manager.getVideoStreamUrl(
        message.id,
        message.video.fileId
      );
      this.currentStreamUrl = streamUrl;
      this.currentMessage = message;
      return streamUrl;
    } catch (err) {
      console.error("播放失敗:", err);
      throw err;
    }
  }

  /**
   * 獲取當前播放的訊息
   */
  getCurrentMessage(): TelegramMessage | undefined {
    return this.currentMessage;
  }

  /**
   * 獲取當前串流 URL
   */
  getCurrentStreamUrl(): string | undefined {
    return this.currentStreamUrl;
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.currentStreamUrl = undefined;
    this.currentMessage = undefined;
  }
}

/**
 * 建立 Telegram 集成管理器
 */
export function createTelegramIntegration(
  botToken: string
): TelegramIntegrationManager {
  const config: TelegramStreamConfig = {
    botToken,
    apiEndpoint: "https://api.telegram.org",
    maxRetries: 3,
    timeout: 30000,
  };

  return new TelegramIntegrationManager(config);
}
