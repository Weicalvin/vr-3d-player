import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ScreenContainer } from '@/components/screen-container';
import { useVideoPicker } from '@/hooks/use-video-picker';
import { useColors } from '@/hooks/use-colors';
import { useSBSConverter } from '@/hooks/use-sbs-converter';
import { useVideoFrameProcessor } from '@/hooks/use-video-frame-processor';
import { cn } from '@/lib/utils';

// 示例影片數據
const SAMPLE_VIDEOS = [
  {
    id: '1',
    name: '示例 3D 影片',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    type: '3D',
    duration: '12:34',
  },
  {
    id: '2',
    name: '示例 360° 全景',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4',
    type: '360°',
    duration: '08:45',
  },
  {
    id: '3',
    name: '示例 2D 影片',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4',
    type: '2D',
    duration: '15:02',
  },
];

export default function PlayerScreen() {
  const router = useRouter();
  const colors = useColors();
  const [currentVideo, setCurrentVideo] = useState(SAMPLE_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<'2D' | '3D' | '360°'>('2D');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [volume, setVolume] = useState(1);
  const [pupilDistance, setPupilDistance] = useState(65); // 瞳距 (mm)
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  const { selectedVideo, pickVideoFromFiles, pickVideoFromGallery, error } = useVideoPicker();
  const { convertToSBS, progress: sbsProgress, isConverting: sbsConverting } = useSBSConverter();
  const { convertFrameToSBS, getBufferStats } = useVideoFrameProcessor();
  
  const player = useVideoPlayer(currentVideo.uri);
  const conversionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 當選擇新影片時更新
  useEffect(() => {
    if (selectedVideo) {
      setCurrentVideo({
        id: 'custom',
        name: selectedVideo.name,
        uri: selectedVideo.uri,
        type: '2D',
        duration: '00:00',
      });
      setPlaybackMode('2D'); // 重置為 2D 模式
    }
  }, [selectedVideo]);

  // 監聽轉換進度
  useEffect(() => {
    setConversionProgress(sbsProgress);
    setIsConverting(sbsConverting);
  }, [sbsProgress, sbsConverting]);

  const handlePlayPause = () => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('播放控制錯誤:', err);
    }
  };

  const handleSelectSampleVideo = (video: typeof SAMPLE_VIDEOS[0]) => {
    setCurrentVideo(video);
    setIsPlaying(false);
    setPlaybackMode('2D'); // 重置為 2D 模式
  };

  const handlePlaybackModeChange = async (mode: '2D' | '3D' | '360°') => {
    setPlaybackMode(mode);

    // 如果選擇 3D 模式，進行 SBS 轉換
    if (mode === '3D') {
      setIsConverting(true);
      setConversionProgress(0);

      try {
        // 模擬轉換過程
        const result = await convertToSBS(currentVideo.uri, {
          enabled: true,
          pupilDistance,
          convergenceDistance: 1000,
        });

        if (result) {
          // 轉換成功，顯示提示
          Alert.alert('轉換完成', `已將影片轉換為 SBS 3D 格式\n瞳距: ${pupilDistance}mm`);
        } else {
          Alert.alert('轉換失敗', '無法轉換影片為 3D 格式');
          setPlaybackMode('2D');
        }
      } catch (err) {
        console.error('3D 轉換錯誤:', err);
        Alert.alert('錯誤', '轉換過程中出現錯誤');
        setPlaybackMode('2D');
      } finally {
        setIsConverting(false);
      }
    }
  };

  const handlePupilDistanceChange = (direction: 'increase' | 'decrease') => {
    const step = 2; // 每次調整 2mm
    const newDistance = direction === 'increase' 
      ? Math.min(80, pupilDistance + step)
      : Math.max(50, pupilDistance - step);
    
    setPupilDistance(newDistance);

    // 如果已經在 3D 模式，重新轉換
    if (playbackMode === '3D') {
      handlePlaybackModeChange('3D');
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {/* 影片播放器 */}
        <View className="w-full bg-black rounded-lg overflow-hidden mb-4 aspect-video relative">
          <VideoView
            style={{ width: '100%', height: '100%' }}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
          />
          
          {/* 轉換進度指示器 */}
          {isConverting && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center rounded-lg">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-white mt-3 font-semibold">
                正在轉換... {Math.round(conversionProgress)}%
              </Text>
            </View>
          )}

          {/* 播放模式標籤 */}
          <View className="absolute top-3 left-3 bg-primary/90 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-background">
              {playbackMode}
              {playbackMode === '3D' && ` (${pupilDistance}mm)`}
            </Text>
          </View>
        </View>

        {/* 影片信息 */}
        <View className="px-4 mb-4">
          <Text className="text-xl font-bold text-foreground mb-2">
            {currentVideo.name}
          </Text>
          <View className="flex-row gap-2 mb-4">
            <View className="bg-primary px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-background">
                {currentVideo.type}
              </Text>
            </View>
            <Text className="text-sm text-muted">
              時長: {currentVideo.duration}
            </Text>
          </View>
        </View>

        {/* 播放控制 */}
        <View className="px-4 mb-6 gap-3">
          {/* 播放/暫停按鈕 */}
          <Pressable
            onPress={handlePlayPause}
            disabled={isConverting}
            style={({ pressed }) => [
              {
                backgroundColor: isConverting ? colors.muted : colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            className="py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold text-lg">
              {isPlaying ? '⏸ 暫停' : '▶ 播放'}
            </Text>
          </Pressable>

          {/* 播放模式選擇 */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">播放模式</Text>
            <View className="flex-row gap-2">
              {(['2D', '3D', '360°'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => handlePlaybackModeChange(mode)}
                  disabled={isConverting}
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        playbackMode === mode ? colors.primary : colors.surface,
                      opacity: pressed ? 0.8 : isConverting ? 0.5 : 1,
                    },
                  ]}
                  className="flex-1 py-2 rounded-lg items-center"
                >
                  <Text
                    className={cn(
                      'font-semibold text-sm',
                      playbackMode === mode ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {mode}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 瞳距調節（3D 模式） */}
          {playbackMode === '3D' && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                瞳距: {pupilDistance}mm
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handlePupilDistanceChange('decrease')}
                  disabled={isConverting || pupilDistance <= 50}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="flex-1 py-2 rounded-lg items-center"
                >
                  <Text className="text-foreground font-semibold">− 減小</Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePupilDistanceChange('increase')}
                  disabled={isConverting || pupilDistance >= 80}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="flex-1 py-2 rounded-lg items-center"
                >
                  <Text className="text-foreground font-semibold">+ 增大</Text>
                </Pressable>
              </View>
              <Text className="text-xs text-muted text-center">
                調整瞳距以獲得最佳 3D 效果
              </Text>
            </View>
          )}

          {/* 播放速度 */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              播放速度: {playbackSpeed.toFixed(1)}x
            </Text>
            <View className="flex-row gap-2">
              {[0.5, 1, 1.5, 2].map((speed) => (
                <Pressable
                  key={speed}
                  onPress={() => setPlaybackSpeed(speed)}
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        playbackSpeed === speed ? colors.primary : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="flex-1 py-2 rounded-lg items-center"
                >
                  <Text
                    className={cn(
                      'font-semibold text-sm',
                      playbackSpeed === speed ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {speed}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 亮度調整 */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              亮度: {Math.round(brightness * 100)}%
            </Text>
            <View className="flex-row gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5].map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setBrightness(level)}
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        brightness === level ? colors.primary : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="flex-1 py-2 rounded-lg items-center"
                >
                  <Text
                    className={cn(
                      'font-semibold text-xs',
                      brightness === level ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {Math.round(level * 100)}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* 選擇影片部分 */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">選擇影片</Text>

          {/* 選擇按鈕 */}
          <View className="gap-2 mb-4">
            <Pressable
              onPress={pickVideoFromFiles}
              disabled={isConverting}
              style={({ pressed }) => [
                {
                  backgroundColor: isConverting ? colors.muted : colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">📁 從文件選擇</Text>
            </Pressable>

            <Pressable
              onPress={pickVideoFromGallery}
              disabled={isConverting}
              style={({ pressed }) => [
                {
                  backgroundColor: isConverting ? colors.muted : colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">🖼 從相冊選擇</Text>
            </Pressable>
          </View>

          {/* 錯誤提示 */}
          {error && (
            <View className="bg-error/20 border border-error rounded-lg p-3 mb-4">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          )}

          {/* 示例影片列表 */}
          <Text className="text-sm font-semibold text-foreground mb-2">
            示例影片
          </Text>
          <View className="gap-2">
            {SAMPLE_VIDEOS.map((video) => (
              <Pressable
                key={video.id}
                onPress={() => handleSelectSampleVideo(video)}
                disabled={isConverting}
                style={({ pressed }) => [
                  {
                    backgroundColor:
                      currentVideo.id === video.id
                        ? colors.primary
                        : colors.surface,
                    opacity: pressed ? 0.8 : isConverting ? 0.5 : 1,
                  },
                ]}
                className="p-3 rounded-lg"
              >
                <Text
                  className={cn(
                    'font-semibold',
                    currentVideo.id === video.id
                      ? 'text-background'
                      : 'text-foreground'
                  )}
                >
                  {video.name}
                </Text>
                <Text
                  className={cn(
                    'text-xs mt-1',
                    currentVideo.id === video.id
                      ? 'text-background/70'
                      : 'text-muted'
                  )}
                >
                  {video.type} • {video.duration}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 3D 轉換提示 */}
        {playbackMode === '3D' && !isConverting && (
          <View className="px-4 mb-4 bg-primary/10 border border-primary rounded-lg p-3">
            <Text className="text-xs text-foreground">
              💡 <Text className="font-semibold">3D 模式提示：</Text>
            </Text>
            <Text className="text-xs text-muted mt-1">
              • 使用 VR 眼鏡獲得最佳效果{'\n'}
              • 調整瞳距以適應您的眼睛{'\n'}
              • 如果感到不適，請返回 2D 模式
            </Text>
          </View>
        )}

        {/* 返回按鈕 */}
        <View className="px-4 mb-4">
          <Pressable
            onPress={() => router.back()}
            disabled={isConverting}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.6 : isConverting ? 0.5 : 1,
              },
            ]}
            className="py-3 rounded-lg items-center border border-border"
          >
            <Text className="text-foreground font-semibold">← 返回</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
