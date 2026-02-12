import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLocalVideoScanner } from "@/hooks/use-local-video-scanner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useEffect } from "react";

export default function LibraryTabScreen() {
  const colors = useColors();
  const { videos, isScanning, error, scanMediaLibrary, formatSize, formatDuration } = useLocalVideoScanner();

  useEffect(() => {
    // 進入頁面時掃描影片
    scanMediaLibrary();
  }, [scanMediaLibrary]);

  const VideoItem = ({ video }: { video: any }) => (
    <TouchableOpacity
      className="mb-3 rounded-lg overflow-hidden p-3"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <View className="flex-row gap-3">
        {/* 影片縮圖區域 */}
        <View
          className="w-20 h-20 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <IconSymbol name="paperplane.fill" size={24} color={colors.background} />
        </View>

        {/* 影片信息 */}
        <View className="flex-1 justify-between">
          <View>
            <Text numberOfLines={1} className="font-semibold text-foreground text-sm">
              {video.filename}
            </Text>
            <View className="flex-row gap-2 mt-1">
              <Text className="text-xs text-primary font-semibold">{video.type}</Text>
              <Text className="text-xs text-muted">{formatSize(video.size)}</Text>
            </View>
          </View>
          <Text className="text-xs text-muted">{formatDuration(video.duration)}</Text>
        </View>

        {/* 播放按鈕 */}
        <View className="justify-center">
          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <IconSymbol name="paperplane.fill" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 頂部標題區 */}
        <View
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: colors.background }}
        >
          <Text className="text-3xl font-bold text-foreground">本地影片庫</Text>
          <Text className="text-sm text-muted mt-1">
            {videos.length} 個影片 • {formatSize(videos.reduce((sum, v) => sum + v.size, 0))}
          </Text>
        </View>

        {/* 掃描按鈕 */}
        <View className="px-6 py-4">
          <TouchableOpacity
            onPress={scanMediaLibrary}
            disabled={isScanning}
            className="rounded-lg py-3 items-center justify-center"
            style={{
              backgroundColor: colors.primary,
              opacity: isScanning ? 0.6 : 1,
            }}
          >
            <View className="flex-row items-center gap-2">
              {isScanning ? (
                <>
                  <ActivityIndicator color={colors.background} />
                  <Text className="font-semibold text-background">掃描中...</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="chevron.right" size={18} color={colors.background} />
                  <Text className="font-semibold text-background">重新掃描</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* 錯誤提示 */}
        {error && (
          <View className="mx-6 mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.error }}>
            <Text className="text-sm text-background">{error}</Text>
          </View>
        )}

        {/* 影片列表 */}
        {videos.length > 0 ? (
          <View className="px-6 pb-6">
            <FlatList
              data={videos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <VideoItem video={item} />}
              scrollEnabled={false}
            />
          </View>
        ) : !isScanning ? (
          <View className="flex-1 items-center justify-center px-6">
            <IconSymbol name="paperplane.fill" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">沒有找到影片</Text>
            <Text className="text-sm text-muted text-center mt-2">
              請確保您的設備上有支援的影片檔案，或點擊「重新掃描」按鈕
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm text-muted mt-4">正在掃描影片...</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
