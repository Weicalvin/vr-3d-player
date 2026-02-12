import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { deviceModeManager, type DeviceMode } from "@/lib/device-mode";

interface AdaptivePlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSettings: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
  currentTime: number;
  duration: number;
  title: string;
}

export function AdaptivePlayerControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onSettings,
  progress,
  onProgressChange,
  currentTime,
  duration,
  title,
}: AdaptivePlayerControlsProps) {
  const colors = useColors();
  const dimensions = useWindowDimensions();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("phone");
  const [uiConfig, setUiConfig] = useState(deviceModeManager.getUIConfig());

  useEffect(() => {
    // 訂閱設備模式變化
    const unsubscribe = deviceModeManager.subscribe((mode) => {
      setDeviceMode(mode);
      setUiConfig(deviceModeManager.getUIConfig());
    });

    // 初始化設備模式
    setDeviceMode(deviceModeManager.getMode());
    setUiConfig(deviceModeManager.getUIConfig());

    return unsubscribe;
  }, []);

  const isTV = deviceMode === "tv";
  const isTablet = deviceMode === "tablet";
  const controlConfig = deviceModeManager.getPlayerControlConfig();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 電視模式：側邊欄布局
  if (isTV) {
    return (
      <View
        className="absolute right-0 top-0 bottom-0 flex-col justify-between p-4"
        style={{
          width: 120,
          backgroundColor: `${colors.background}cc`,
        }}
      >
        {/* 標題 */}
        <Text
          numberOfLines={3}
          className="text-xs font-bold text-foreground mb-4"
        >
          {title}
        </Text>

        {/* 主要控制按鈕 */}
        <View className="gap-4 flex-1 justify-center">
          {/* 上一個 */}
          <TouchableOpacity
            onPress={onPrevious}
            className="items-center justify-center rounded-lg"
            style={{
              width: 80,
              height: 80,
              backgroundColor: colors.primary,
            }}
          >
            <Text className="text-3xl">⏮</Text>
          </TouchableOpacity>

          {/* 播放/暫停 */}
          <TouchableOpacity
            onPress={onPlayPause}
            className="items-center justify-center rounded-lg"
            style={{
              width: 80,
              height: 80,
              backgroundColor: colors.primary,
            }}
          >
            <Text className="text-4xl">
              {isPlaying ? "⏸" : "▶"}
            </Text>
          </TouchableOpacity>

          {/* 下一個 */}
          <TouchableOpacity
            onPress={onNext}
            className="items-center justify-center rounded-lg"
            style={{
              width: 80,
              height: 80,
              backgroundColor: colors.primary,
            }}
          >
            <Text className="text-3xl">⏭</Text>
          </TouchableOpacity>
        </View>

        {/* 設置按鈕 */}
        <TouchableOpacity
          onPress={onSettings}
          className="items-center justify-center rounded-lg"
          style={{
            width: 80,
            height: 60,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <Text className="text-2xl">⚙️</Text>
        </TouchableOpacity>

        {/* 進度信息 */}
        <View className="gap-2 mt-4">
          <Text className="text-xs text-muted text-center">
            {formatTime(currentTime)}
          </Text>
          <View
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.border }}
          >
            <View
              className="h-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
          <Text className="text-xs text-muted text-center">
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    );
  }

  // 手機/平板模式：底部控制條
  return (
    <View
      className="absolute bottom-0 left-0 right-0 p-4"
      style={{
        backgroundColor: `${colors.background}dd`,
        paddingBottom: isTablet ? 24 : 16,
      }}
    >
      {/* 進度條 */}
      <View className="mb-3">
        <View
          className="rounded-full overflow-hidden"
          style={{
            height: isTablet ? 8 : 4,
            backgroundColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              const percentage = locationX / (dimensions.width - 32);
              onProgressChange(Math.max(0, Math.min(1, percentage)));
            }}
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: colors.primary,
            }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-muted">
            {formatTime(currentTime)}
          </Text>
          <Text className="text-xs text-muted">
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* 控制按鈕 */}
      <View className="flex-row items-center justify-between gap-2">
        {/* 上一個 */}
        <TouchableOpacity
          onPress={onPrevious}
          className="items-center justify-center rounded-lg"
          style={{
            width: isTablet ? 60 : 48,
            height: isTablet ? 60 : 48,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <Text className="text-2xl">⏮</Text>
        </TouchableOpacity>

        {/* 播放/暫停 */}
        <TouchableOpacity
          onPress={onPlayPause}
          className="flex-1 items-center justify-center rounded-lg"
          style={{
            height: isTablet ? 60 : 48,
            backgroundColor: colors.primary,
          }}
        >
          <Text className="text-3xl text-background">
            {isPlaying ? "⏸" : "▶"}
          </Text>
        </TouchableOpacity>

        {/* 下一個 */}
        <TouchableOpacity
          onPress={onNext}
          className="items-center justify-center rounded-lg"
          style={{
            width: isTablet ? 60 : 48,
            height: isTablet ? 60 : 48,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <Text className="text-2xl">⏭</Text>
        </TouchableOpacity>

        {/* 設置 */}
        <TouchableOpacity
          onPress={onSettings}
          className="items-center justify-center rounded-lg"
          style={{
            width: isTablet ? 60 : 48,
            height: isTablet ? 60 : 48,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <Text className="text-xl">⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
