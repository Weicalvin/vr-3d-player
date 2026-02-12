import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdDate: number;
  updatedDate: number;
  isFavorite: boolean;
}

const STORAGE_KEY = "vr_playlists";

/**
 * 播放列表管理 Hook
 */
export function usePlaylist() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 加載播放列表
   */
  const loadPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as Playlist[];
        setPlaylists(parsed);
      }
    } catch (err) {
      console.error("加載播放列表失敗:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 保存播放列表
   */
  const savePlaylists = useCallback(async (newPlaylists: Playlist[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaylists));
      setPlaylists(newPlaylists);
    } catch (err) {
      console.error("保存播放列表失敗:", err);
    }
  }, []);

  /**
   * 建立新播放列表
   */
  const createPlaylist = useCallback(
    async (name: string, description?: string) => {
      const id = `playlist_${Date.now()}_${Math.random()}`;
      const newPlaylist: Playlist = {
        id,
        name,
        description,
        videoIds: [],
        createdDate: Date.now(),
        updatedDate: Date.now(),
        isFavorite: false,
      };
      const newPlaylists = [...playlists, newPlaylist];
      await savePlaylists(newPlaylists);
      return newPlaylist;
    },
    [playlists, savePlaylists]
  );

  /**
   * 刪除播放列表
   */
  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      const newPlaylists = playlists.filter((p) => p.id !== playlistId);
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 更新播放列表信息
   */
  const updatePlaylist = useCallback(
    async (playlistId: string, updates: Partial<Playlist>) => {
      const newPlaylists = playlists.map((p) =>
        p.id === playlistId
          ? { ...p, ...updates, updatedDate: Date.now() }
          : p
      );
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 添加影片到播放列表
   */
  const addVideoToPlaylist = useCallback(
    async (playlistId: string, videoId: string) => {
      const newPlaylists = playlists.map((p) => {
        if (p.id === playlistId && !p.videoIds.includes(videoId)) {
          return {
            ...p,
            videoIds: [...p.videoIds, videoId],
            updatedDate: Date.now(),
          };
        }
        return p;
      });
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 從播放列表移除影片
   */
  const removeVideoFromPlaylist = useCallback(
    async (playlistId: string, videoId: string) => {
      const newPlaylists = playlists.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              videoIds: p.videoIds.filter((id) => id !== videoId),
              updatedDate: Date.now(),
            }
          : p
      );
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 批量添加影片
   */
  const addVideosToPlaylist = useCallback(
    async (playlistId: string, videoIds: string[]) => {
      const newPlaylists = playlists.map((p) => {
        if (p.id === playlistId) {
          const existingIds = new Set(p.videoIds);
          const newIds = videoIds.filter((id) => !existingIds.has(id));
          return {
            ...p,
            videoIds: [...p.videoIds, ...newIds],
            updatedDate: Date.now(),
          };
        }
        return p;
      });
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 重新排序播放列表中的影片
   */
  const reorderVideos = useCallback(
    async (playlistId: string, videoIds: string[]) => {
      const newPlaylists = playlists.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              videoIds,
              updatedDate: Date.now(),
            }
          : p
      );
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 切換收藏狀態
   */
  const toggleFavorite = useCallback(
    async (playlistId: string) => {
      const newPlaylists = playlists.map((p) =>
        p.id === playlistId
          ? { ...p, isFavorite: !p.isFavorite, updatedDate: Date.now() }
          : p
      );
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 獲取收藏的播放列表
   */
  const getFavoritePlaylists = useCallback(() => {
    return playlists.filter((p) => p.isFavorite);
  }, [playlists]);

  /**
   * 搜尋播放列表
   */
  const searchPlaylists = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return playlists.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description?.toLowerCase().includes(lowerQuery)
      );
    },
    [playlists]
  );

  /**
   * 清空播放列表
   */
  const clearPlaylist = useCallback(
    async (playlistId: string) => {
      const newPlaylists = playlists.map((p) =>
        p.id === playlistId
          ? { ...p, videoIds: [], updatedDate: Date.now() }
          : p
      );
      await savePlaylists(newPlaylists);
    },
    [playlists, savePlaylists]
  );

  /**
   * 刪除所有播放列表
   */
  const deleteAllPlaylists = useCallback(async () => {
    await savePlaylists([]);
  }, [savePlaylists]);

  return {
    playlists,
    isLoading,
    loadPlaylists,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    addVideosToPlaylist,
    reorderVideos,
    toggleFavorite,
    getFavoritePlaylists,
    searchPlaylists,
    clearPlaylist,
    deleteAllPlaylists,
  };
}
