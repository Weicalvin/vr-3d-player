import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export interface PickedVideo {
  uri: string;
  name: string;
  type: string;
  size?: number;
  duration?: number;
}

export function useVideoPicker() {
  const [selectedVideo, setSelectedVideo] = useState<PickedVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 從文件選擇器選擇影片
  const pickVideoFromFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });

      if ((result as any).type === 'success') {
        const video: PickedVideo = {
          uri: (result as any).uri,
          name: (result as any).name || 'video',
          type: (result as any).mimeType || 'video/mp4',
          size: (result as any).size,
        };
        setSelectedVideo(video);
        return video;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '選擇影片失敗';
      setError(errorMessage);
      console.error('選擇影片失敗:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 從相冊選擇影片
  const pickVideoFromGallery = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 請求權限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('需要相冊訪問權限');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const video: PickedVideo = {
          uri: asset.uri,
          name: asset.uri.split('/').pop() || 'video',
          type: asset.type || 'video/mp4',
          duration: asset.duration || undefined,
        };
        setSelectedVideo(video);
        return video;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '選擇影片失敗';
      setError(errorMessage);
      console.error('選擇影片失敗:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 清除選擇
  const clearSelection = useCallback(() => {
    setSelectedVideo(null);
    setError(null);
  }, []);

  return {
    selectedVideo,
    isLoading,
    error,
    pickVideoFromFiles,
    pickVideoFromGallery,
    clearSelection,
  };
}
