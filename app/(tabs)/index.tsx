import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface VideoItem {
  id: string;
  title: string;
  type: "2D" | "3D" | "360°";
  duration: string;
  thumbnail?: string;
}

// 模擬最近播放的影片
const recentVideos: VideoItem[] = [
  { id: "1", title: "示例 3D 影片", type: "3D", duration: "12:34" },
  { id: "2", title: "示例 360° 全景", type: "360°", duration: "08:45" },
  { id: "3", title: "示例 2D 影片", type: "2D", duration: "15:20" },
];

// 推薦影片
const recommendedVideos: VideoItem[] = [
  { id: "4", title: "VR 風景探索", type: "360°", duration: "20:15" },
  { id: "5", title: "3D 電影預告", type: "3D", duration: "02:30" },
  { id: "6", title: "4K 紀錄片", type: "2D", duration: "45:00" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const handlePlayVideo = (video: VideoItem) => {
    // 暫時顯示提示，後續實作播放器頁面
    alert(`播放: ${video.title} (${video.type})`);
  };

  const VideoCard = ({ video }: { video: VideoItem }) => (
    <TouchableOpacity
      onPress={() => handlePlayVideo(video)}
      className="mr-3 rounded-lg overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <View className="w-32 h-20 bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center">
        <IconSymbol name="paperplane.fill" size={28} color={colors.primary} />
      </View>
      <View className="p-2">
        <Text
          numberOfLines={1}
          className="text-xs font-semibold text-foreground"
        >
          {video.title}
        </Text>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-xs text-muted">{video.type}</Text>
          <Text className="text-xs text-muted">{video.duration}</Text>
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
          <Text className="text-3xl font-bold text-foreground">
            真實 VR 播放器
          </Text>
          <Text className="text-sm text-muted mt-1">
            沉浸式 2D/3D/360° 影片體驗
          </Text>
        </View>

        {/* 快速操作按鈕 */}
        <View className="flex-row gap-3 px-6 py-4">
          <TouchableOpacity
            className="flex-1 rounded-lg py-3 items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={() => router.push("/player")}
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">▶</Text>
              <Text className="font-semibold text-background">播放器</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 rounded-lg py-3 items-center justify-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }}
            onPress={() => router.push("/telegram-stream")}
          >
            <View className="flex-row items-center gap-2">
              <IconSymbol name="paperplane.fill" size={18} color={colors.primary} />
              <Text className="font-semibold text-primary">Telegram</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 最近播放 */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">最近播放</Text>
            <TouchableOpacity onPress={() => router.push("/library")}>
              <Text className="text-sm text-primary font-semibold">查看全部</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentVideos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <VideoCard video={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* 推薦影片 */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-foreground mb-3">推薦影片</Text>
          <FlatList
            data={recommendedVideos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <VideoCard video={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* 功能介紹 */}
        <View className="px-6 py-6 gap-3">
          <View
            className="rounded-lg p-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }}
          >
            <View className="flex-row items-start gap-3">
              <IconSymbol name="chevron.right" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="font-semibold text-foreground">2D 轉 3D 轉換</Text>
                <Text className="text-xs text-muted mt-1">
                  將普通 2D 影片轉換為 SBS 3D 格式
                </Text>
              </View>
            </View>
          </View>

          <View
            className="rounded-lg p-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }}
          >
            <View className="flex-row items-start gap-3">
              <IconSymbol name="chevron.right" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="font-semibold text-foreground">360° 全景播放</Text>
                <Text className="text-xs text-muted mt-1">
                  支援陀螺儀與手勢控制的沉浸式體驗
                </Text>
              </View>
            </View>
          </View>

          <View
            className="rounded-lg p-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }}
          >
            <View className="flex-row items-start gap-3">
              <IconSymbol name="chevron.right" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="font-semibold text-foreground">藍牙遙控支援</Text>
                <Text className="text-xs text-muted mt-1">
                  相容多種 VR 遙控器與藍牙設備
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部空間 */}
        <View className="h-6" />
      </ScrollView>
    </ScreenContainer>
  );
}
