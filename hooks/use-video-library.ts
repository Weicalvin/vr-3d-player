import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface VideoFile {
  id: string;
  filename: string;
  path: string;
  type: "2D" | "3D" | "360°";
  duration: number; // 秒
  size: number; // 字節
  addedDate: number; // 時間戳
  lastPlayedDate?: number;
  lastPlayedPosition?: number; // 秒
  thumbnail?: string;
}

export interface VideoLibrary {
  videos: VideoFile[];
  totalSize: number;
  lastUpdated: number;
}

const STORAGE_KEY = "vr_video_library";
const RECENT_VIDEOS_KEY = "vr_recent_videos";

/**
 * 本地影片庫管理 Hook
 */
export function useVideoLibrary() {
  const [library, setLibrary] = useState<VideoLibrary>({
    videos: [],
    totalSize: 0,
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化影片庫
  useEffect(() => {
    loadLibrary();
  }, []);

  /**
   * 從存儲加載影片庫
   */
  const loadLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as VideoLibrary;
        setLibrary(parsed);
      }
      setError(null);
    } catch (err) {
      setError(`加載影片庫失敗: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 保存影片庫到存儲
   */
  const saveLibrary = useCallback(async (newLibrary: VideoLibrary) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
      setLibrary(newLibrary);
    } catch (err) {
      setError(`保存影片庫失敗: ${err}`);
    }
  }, []);

  /**
   * 添加影片到庫
   */
  const addVideo = useCallback(
    async (video: Omit<VideoFile, "id">) => {
      const id = `video_${Date.now()}_${Math.random()}`;
      const newVideo: VideoFile = { ...video, id };
      const newLibrary: VideoLibrary = {
        videos: [...library.videos, newVideo],
        totalSize: library.totalSize + video.size,
        lastUpdated: Date.now(),
      };
      await saveLibrary(newLibrary);
      return newVideo;
    },
    [library, saveLibrary]
  );

  /**
   * 移除影片
   */
  const removeVideo = useCallback(
    async (videoId: string) => {
      const video = library.videos.find((v) => v.id === videoId);
      if (!video) return;

      const newLibrary: VideoLibrary = {
        videos: library.videos.filter((v) => v.id !== videoId),
        totalSize: Math.max(0, library.totalSize - video.size),
        lastUpdated: Date.now(),
      };
      await saveLibrary(newLibrary);
    },
    [library, saveLibrary]
  );

  /**
   * 更新影片信息
   */
  const updateVideo = useCallback(
    async (videoId: string, updates: Partial<VideoFile>) => {
      const newLibrary: VideoLibrary = {
        ...library,
        videos: library.videos.map((v) =>
          v.id === videoId ? { ...v, ...updates } : v
        ),
        lastUpdated: Date.now(),
      };
      await saveLibrary(newLibrary);
    },
    [library, saveLibrary]
  );

  /**
   * 獲取最近播放的影片
   */
  const getRecentVideos = useCallback(async (limit: number = 5) => {
    try {
      const data = await AsyncStorage.getItem(RECENT_VIDEOS_KEY);
      if (data) {
        const recentIds = JSON.parse(data) as string[];
        return library.videos
          .filter((v) => recentIds.includes(v.id))
          .slice(0, limit);
      }
      return [];
    } catch (err) {
      console.error("獲取最近播放失敗:", err);
      return [];
    }
  }, [library.videos]);

  /**
   * 記錄播放歷史
   */
  const recordPlayback = useCallback(
    async (videoId: string, position: number) => {
      try {
        // 更新影片的最後播放信息
        await updateVideo(videoId, {
          lastPlayedDate: Date.now(),
          lastPlayedPosition: position,
        });

        // 更新最近播放列表
        const recentData = await AsyncStorage.getItem(RECENT_VIDEOS_KEY);
        let recentIds: string[] = recentData ? JSON.parse(recentData) : [];

        // 將當前影片移到最前面
        recentIds = [videoId, ...recentIds.filter((id) => id !== videoId)];

        // 只保留最近 20 個
        recentIds = recentIds.slice(0, 20);

        await AsyncStorage.setItem(RECENT_VIDEOS_KEY, JSON.stringify(recentIds));
      } catch (err) {
        console.error("記錄播放歷史失敗:", err);
      }
    },
    [updateVideo]
  );

  /**
   * 按類型篩選影片
   */
  const filterByType = useCallback(
    (type: "2D" | "3D" | "360°") => {
      return library.videos.filter((v) => v.type === type);
    },
    [library.videos]
  );

  /**
   * 搜尋影片
   */
  const searchVideos = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return library.videos.filter((v) =>
        v.filename.toLowerCase().includes(lowerQuery)
      );
    },
    [library.videos]
  );

  /**
   * 排序影片
   */
  const sortVideos = useCallback(
    (
      by: "name" | "date" | "size" | "duration",
      ascending: boolean = true
    ) => {
      const sorted = [...library.videos];
      const multiplier = ascending ? 1 : -1;

      switch (by) {
        case "name":
          sorted.sort((a, b) =>
            a.filename.localeCompare(b.filename) * multiplier
          );
          break;
        case "date":
          sorted.sort((a, b) => (a.addedDate - b.addedDate) * multiplier);
          break;
        case "size":
          sorted.sort((a, b) => (a.size - b.size) * multiplier);
          break;
        case "duration":
          sorted.sort((a, b) => (a.duration - b.duration) * multiplier);
          break;
      }

      return sorted;
    },
    [library.videos]
  );

  /**
   * 計算總時長
   */
  const getTotalDuration = useCallback(() => {
    return library.videos.reduce((sum, v) => sum + v.duration, 0);
  }, [library.videos]);

  /**
   * 格式化存儲大小
   */
  const formatSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }, []);

  return {
    library,
    isLoading,
    error,
    addVideo,
    removeVideo,
    updateVideo,
    getRecentVideos,
    recordPlayback,
    filterByType,
    searchVideos,
    sortVideos,
    getTotalDuration,
    formatSize,
    reload: loadLibrary,
  };
}
