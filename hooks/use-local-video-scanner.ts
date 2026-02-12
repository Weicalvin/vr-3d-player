import { useState, useCallback, useEffect } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

export interface LocalVideo {
  id: string;
  uri: string;
  filename: string;
  size: number;
  duration?: number;
  type: "2D" | "3D" | "360°";
  createdAt: number;
  modifiedAt: number;
}

const SUPPORTED_VIDEO_EXTENSIONS = [
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".flv",
  ".wmv",
  ".webm",
  ".m3u8",
];

const VIDEO_TYPE_KEYWORDS = {
  "3D": ["3d", "sbs", "side-by-side", "half-sbs"],
  "360°": ["360", "panorama", "vr", "equirectangular"],
};

/**
 * 根據文件名檢測影片類型
 */
function detectVideoType(filename: string): "2D" | "3D" | "360°" {
  const lowerName = filename.toLowerCase();

  for (const keyword of VIDEO_TYPE_KEYWORDS["360°"]) {
    if (lowerName.includes(keyword)) {
      return "360°";
    }
  }

  for (const keyword of VIDEO_TYPE_KEYWORDS["3D"]) {
    if (lowerName.includes(keyword)) {
      return "3D";
    }
  }

  return "2D";
}

/**
 * 檢查文件是否是支援的影片格式
 */
function isSupportedVideoFormat(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return SUPPORTED_VIDEO_EXTENSIONS.includes(ext);
}

/**
 * 本地影片掃描 Hook
 */
export function useLocalVideoScanner() {
  const [videos, setVideos] = useState<LocalVideo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 掃描媒體庫中的影片
   */
  const scanMediaLibrary = useCallback(async () => {
    try {
      setIsScanning(true);
      setError(null);

      // 請求媒體庫權限
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setError("需要存儲權限才能訪問本地影片");
        return;
      }

      // 獲取所有影片資產
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: "video",
        first: 1000, // 最多掃描 1000 個影片
      });

      const scannedVideos: LocalVideo[] = [];

      for (const asset of assets.assets) {
        // 獲取影片詳細信息
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);

        if (assetInfo.localUri) {
          const video: LocalVideo = {
            id: asset.id,
            uri: assetInfo.localUri,
            filename: asset.filename || `Video_${asset.id}`,
            size: (assetInfo as any).size || 0,
            duration: asset.duration,
            type: detectVideoType(asset.filename || ""),
            createdAt: asset.creationTime,
            modifiedAt: asset.modificationTime || asset.creationTime,
          };
          scannedVideos.push(video);
        }
      }

      // 按修改時間排序（最新的在前）
      scannedVideos.sort((a, b) => b.modifiedAt - a.modifiedAt);

      setVideos(scannedVideos);
    } catch (err) {
      console.error("掃描媒體庫失敗:", err);
      setError(err instanceof Error ? err.message : "掃描失敗");
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * 掃描特定目錄中的影片
   */
  const scanDirectory = useCallback(
    async (dirPath: string) => {
      try {
        setIsScanning(true);
        setError(null);

        const files = await FileSystem.readDirectoryAsync(dirPath);
        const scannedVideos: LocalVideo[] = [];

        for (const file of files) {
          if (isSupportedVideoFormat(file)) {
            const filePath = `${dirPath}/${file}`;
            try {
              const fileInfo = await FileSystem.getInfoAsync(filePath);

              if (fileInfo.exists && fileInfo.isDirectory === false) {
                const video: LocalVideo = {
                  id: filePath,
                  uri: filePath,
                  filename: file,
                  size: fileInfo.size || 0,
                  type: detectVideoType(file),
                  createdAt: fileInfo.modificationTime
                    ? fileInfo.modificationTime * 1000
                    : Date.now(),
                  modifiedAt: fileInfo.modificationTime
                    ? fileInfo.modificationTime * 1000
                    : Date.now(),
                };
                scannedVideos.push(video);
              }
            } catch (err) {
              console.warn(`無法讀取文件 ${filePath}:`, err);
            }
          }
        }

        // 按修改時間排序
        scannedVideos.sort((a, b) => b.modifiedAt - a.modifiedAt);

        setVideos(scannedVideos);
      } catch (err) {
        console.error("掃描目錄失敗:", err);
        setError(err instanceof Error ? err.message : "掃描失敗");
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  /**
   * 掃描常見影片目錄
   */
  const scanCommonDirectories = useCallback(async () => {
    try {
      setIsScanning(true);
      setError(null);

      const commonDirs = [
        `${FileSystem.documentDirectory}`,
        `${FileSystem.cacheDirectory}`,
        // 在 Android 上，可以掃描 Downloads 和 Movies 目錄
        ...(FileSystem.documentDirectory
          ? [
              `${FileSystem.documentDirectory}../Downloads`,
              `${FileSystem.documentDirectory}../Movies`,
            ]
          : []),
      ];

      const allVideos: LocalVideo[] = [];

      for (const dir of commonDirs) {
        try {
          const files = await FileSystem.readDirectoryAsync(dir);

          for (const file of files) {
            if (isSupportedVideoFormat(file)) {
              const filePath = `${dir}/${file}`;
              try {
                const fileInfo = await FileSystem.getInfoAsync(filePath);

                if (fileInfo.exists && fileInfo.isDirectory === false) {
                  const video: LocalVideo = {
                    id: filePath,
                    uri: filePath,
                    filename: file,
                    size: fileInfo.size || 0,
                    type: detectVideoType(file),
                    createdAt: fileInfo.modificationTime
                      ? fileInfo.modificationTime * 1000
                      : Date.now(),
                    modifiedAt: fileInfo.modificationTime
                      ? fileInfo.modificationTime * 1000
                      : Date.now(),
                  };
                  allVideos.push(video);
                }
              } catch (err) {
                console.warn(`無法讀取文件 ${filePath}:`, err);
              }
            }
          }
        } catch (err) {
          console.warn(`無法掃描目錄 ${dir}:`, err);
        }
      }

      // 去重並排序
      const uniqueVideos = Array.from(
        new Map(allVideos.map((v) => [v.id, v])).values()
      );
      uniqueVideos.sort((a, b) => b.modifiedAt - a.modifiedAt);

      setVideos(uniqueVideos);
    } catch (err) {
      console.error("掃描常見目錄失敗:", err);
      setError(err instanceof Error ? err.message : "掃描失敗");
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * 初始化時自動掃描
   */
  useEffect(() => {
    // 優先使用媒體庫掃描（更可靠）
    scanMediaLibrary();
  }, [scanMediaLibrary]);

  /**
   * 格式化文件大小
   */
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  /**
   * 格式化時長
   */
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "未知";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    videos,
    isScanning,
    error,
    scanMediaLibrary,
    scanDirectory,
    scanCommonDirectories,
    formatSize,
    formatDuration,
  };
}
