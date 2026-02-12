import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useVideoLibrary, type VideoFile } from "@/hooks/use-video-library";
import { IconSymbol } from "@/components/ui/icon-symbol";

type SortBy = "name" | "date" | "size" | "duration";
type FilterType = "all" | "2D" | "3D" | "360°";

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    library,
    isLoading,
    addVideo,
    removeVideo,
    updateVideo,
    filterByType,
    searchVideos,
    sortVideos,
    getTotalDuration,
    formatSize,
  } = useVideoLibrary();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(
    new Set()
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // 獲取顯示的影片列表
  const getDisplayedVideos = () => {
    let videos = library.videos;

    // 應用篩選
    if (filterType !== "all") {
      videos = filterByType(filterType);
    }

    // 應用搜尋
    if (searchQuery) {
      videos = searchVideos(searchQuery);
    }

    // 應用排序
    videos = sortVideos(sortBy, sortAscending);

    return videos;
  };

  const displayedVideos = getDisplayedVideos();

  // 切換影片選擇
  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  // 全選
  const selectAll = () => {
    const newSelected = new Set(displayedVideos.map((v) => v.id));
    setSelectedVideos(newSelected);
  };

  // 取消全選
  const deselectAll = () => {
    setSelectedVideos(new Set());
  };

  // 刪除選中的影片
  const deleteSelected = () => {
    if (selectedVideos.size === 0) return;

    Alert.alert(
      "刪除影片",
      `確定要刪除 ${selectedVideos.size} 個影片嗎？`,
      [
        {
          text: "刪除",
          onPress: async () => {
            for (const videoId of selectedVideos) {
              await removeVideo(videoId);
            }
            setSelectedVideos(new Set());
            setIsSelectionMode(false);
            Alert.alert("成功", "影片已刪除");
          },
          style: "destructive",
        },
        { text: "取消", style: "cancel" },
      ]
    );
  };

  // 播放影片
  const playVideo = (video: VideoFile) => {
    alert(`播放: ${video.filename}\n類型: ${video.type}`);
  };

  // 影片卡片
  const VideoCard = ({ video }: { video: VideoFile }) => {
    const isSelected = selectedVideos.has(video.id);

    return (
      <TouchableOpacity
        onPress={() => {
          if (isSelectionMode) {
            toggleVideoSelection(video.id);
          } else {
            playVideo(video);
          }
        }}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleVideoSelection(video.id);
          }
        }}
        className="mx-4 mb-3 p-4 rounded-lg flex-row items-center gap-3"
        style={{
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        }}
      >
        {/* 選擇框 */}
        {isSelectionMode && (
          <View
            className="w-6 h-6 rounded-md items-center justify-center"
            style={{
              backgroundColor: isSelected ? colors.background : colors.border,
            }}
          >
            {isSelected && (
              <Text className="text-sm font-bold text-primary">✓</Text>
            )}
          </View>
        )}

        {/* 縮圖 */}
        <View
          className="w-16 h-16 rounded-lg items-center justify-center"
          style={{
            backgroundColor: colors.background,
          }}
        >
          <Text className="text-2xl">🎬</Text>
        </View>

        {/* 信息 */}
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="font-semibold"
            style={{
              color: isSelected ? colors.background : colors.foreground,
            }}
          >
            {video.filename}
          </Text>
          <View className="flex-row gap-2 mt-1">
            <Text
              className="text-xs"
              style={{
                color: isSelected ? colors.background : colors.muted,
              }}
            >
              {video.type}
            </Text>
            <Text
              className="text-xs"
              style={{
                color: isSelected ? colors.background : colors.muted,
              }}
            >
              •
            </Text>
            <Text
              className="text-xs"
              style={{
                color: isSelected ? colors.background : colors.muted,
              }}
            >
              {Math.floor(video.duration / 60)}:
              {(video.duration % 60).toString().padStart(2, "0")}
            </Text>
            <Text
              className="text-xs"
              style={{
                color: isSelected ? colors.background : colors.muted,
              }}
            >
              •
            </Text>
            <Text
              className="text-xs"
              style={{
                color: isSelected ? colors.background : colors.muted,
              }}
            >
              {formatSize(video.size)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="p-0">
      {/* 頂部標題 */}
      <View
        className="px-6 pt-6 pb-4"
        style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">
            本地影片庫
          </Text>
          {isSelectionMode && (
            <TouchableOpacity
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedVideos(new Set());
              }}
            >
              <Text className="text-primary font-semibold">完成</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 統計信息 */}
        <View className="flex-row gap-4 mb-4">
          <View>
            <Text className="text-xs text-muted">影片數量</Text>
            <Text className="text-lg font-bold text-foreground">
              {library.videos.length}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-muted">總大小</Text>
            <Text className="text-lg font-bold text-foreground">
              {formatSize(library.totalSize)}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-muted">總時長</Text>
            <Text className="text-lg font-bold text-foreground">
              {Math.floor(getTotalDuration() / 3600)}h
            </Text>
          </View>
        </View>

        {/* 搜尋框 */}
        <TextInput
          placeholder="搜尋影片..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="px-4 py-2 rounded-lg text-foreground mb-4"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        />

        {/* 篩選和排序 */}
        <View className="flex-row gap-2 mb-4">
          {/* 篩選按鈕 */}
          {(["all", "2D", "3D", "360°"] as FilterType[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilterType(type)}
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor:
                  filterType === type ? colors.primary : colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color:
                    filterType === type ? colors.background : colors.foreground,
                }}
              >
                {type === "all" ? "全部" : type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 排序選項 */}
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted">排序:</Text>
          <TouchableOpacity
            onPress={() => setSortBy("date")}
            className="px-2 py-1 rounded"
            style={{
              backgroundColor:
                sortBy === "date" ? colors.primary : colors.surface,
            }}
          >
            <Text
              className="text-xs"
              style={{
                color:
                  sortBy === "date" ? colors.background : colors.foreground,
              }}
            >
              日期
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("name")}
            className="px-2 py-1 rounded"
            style={{
              backgroundColor:
                sortBy === "name" ? colors.primary : colors.surface,
            }}
          >
            <Text
              className="text-xs"
              style={{
                color:
                  sortBy === "name" ? colors.background : colors.foreground,
              }}
            >
              名稱
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("size")}
            className="px-2 py-1 rounded"
            style={{
              backgroundColor:
                sortBy === "size" ? colors.primary : colors.surface,
            }}
          >
            <Text
              className="text-xs"
              style={{
                color:
                  sortBy === "size" ? colors.background : colors.foreground,
              }}
            >
              大小
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortAscending(!sortAscending)}
            className="ml-auto px-2 py-1 rounded"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-foreground">
              {sortAscending ? "↑" : "↓"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 影片列表 */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayedVideos.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-center">
            {library.videos.length === 0
              ? "還沒有影片\n點擊「本地影片」按鈕添加"
              : "沒有找到匹配的影片"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedVideos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* 選擇模式操作欄 */}
      {isSelectionMode && selectedVideos.size > 0 && (
        <View
          className="flex-row items-center justify-between px-6 py-4 gap-2"
          style={{
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          }}
        >
          <TouchableOpacity
            onPress={selectedVideos.size === displayedVideos.length ? deselectAll : selectAll}
            className="flex-1 py-2 rounded-lg items-center justify-center"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Text className="text-sm font-semibold text-foreground">
              {selectedVideos.size === displayedVideos.length
                ? "取消全選"
                : "全選"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={deleteSelected}
            className="flex-1 py-2 rounded-lg items-center justify-center"
            style={{
              backgroundColor: colors.error,
            }}
          >
            <Text className="text-sm font-semibold text-background">
              刪除 ({selectedVideos.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}
