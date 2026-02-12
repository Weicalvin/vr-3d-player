import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  GestureResponderEvent,
  Animated,
  PanResponder,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

export type PlaybackMode = "2D" | "3D" | "360°";

interface VideoPlayerProps {
  title: string;
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  onClose: () => void;
}

export function VideoPlayer({
  title,
  mode,
  onModeChange,
  onClose,
}: VideoPlayerProps) {
  const colors = useColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [pupilDistance, setPupilDistance] = useState(65); // mm
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 手勢識別器
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // 垂直滑動調整亮度
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
          const delta = gestureState.dy / screenHeight;
          const newBrightness = Math.max(0.3, Math.min(1, brightness - delta));
          setBrightness(newBrightness);
        }
        // 水平滑動調整進度
        else {
          const delta = gestureState.dx / screenWidth;
          const newProgress = Math.max(0, Math.min(1, progress + delta * 0.5));
          setProgress(newProgress);
        }
      },
      onPanResponderRelease: () => {
        showControlsTemporarily();
      },
    })
  ).current;

  // 暫時顯示控制條
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // 切換控制條可見性
  const toggleControls = () => {
    if (showControls) {
      setShowControls(false);
    } else {
      showControlsTemporarily();
    }
  };

  // 格式化時間
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = progress * 600; // 假設總時長 600 秒
  const totalTime = 600;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      {...panResponder.panHandlers}
    >
      {/* 影片顯示區 */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: colors.background,
          opacity: brightness,
        }}
      >
        {/* 播放模式指示器 */}
        <View className="absolute top-4 left-4 z-10">
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-xs font-bold text-background">{mode}</Text>
          </View>
        </View>

        {/* 播放/暫停按鈕 */}
        <TouchableOpacity
          onPress={() => setIsPlaying(!isPlaying)}
          className="items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary,
            opacity: 0.8,
          }}
        >
          <Text className="text-3xl text-background">
            {isPlaying ? "⏸" : "▶"}
          </Text>
        </TouchableOpacity>

        {/* 標題 */}
        <Text className="text-lg font-bold text-foreground mt-6 text-center px-4">
          {title}
        </Text>
        <Text className="text-sm text-muted mt-2">
          {isPlaying ? "正在播放" : "已暫停"} • {mode} 模式
        </Text>
      </TouchableOpacity>

      {/* 控制條 */}
      {showControls && (
        <Animated.View
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{
            backgroundColor: `${colors.background}dd`,
            opacity: controlsOpacity,
          }}
        >
          {/* 進度條 */}
          <View className="mb-3">
            <View
              className="h-1 rounded-full overflow-hidden"
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
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-muted">
                {formatTime(currentTime)}
              </Text>
              <Text className="text-xs text-muted">
                {formatTime(totalTime)}
              </Text>
            </View>
          </View>

          {/* 播放模式切換 */}
          <View className="flex-row gap-2 mb-3">
            {(["2D", "3D", "360°"] as PlaybackMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => onModeChange(m)}
                className="flex-1 py-2 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: mode === m ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: mode === m ? colors.background : colors.foreground,
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 設置選項 */}
          <View className="flex-row gap-2 mb-3">
            {/* 亮度 */}
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-xs text-foreground">
                💡 {Math.round(brightness * 100)}%
              </Text>
            </TouchableOpacity>

            {/* 播放速度 */}
            <TouchableOpacity
              onPress={() =>
                setPlaybackSpeed(playbackSpeed === 2 ? 0.5 : playbackSpeed + 0.5)
              }
              className="flex-1 py-2 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-xs text-foreground">{playbackSpeed}x</Text>
            </TouchableOpacity>

            {/* 瞳距調節（3D 模式） */}
            {mode === "3D" && (
              <TouchableOpacity
                className="flex-1 py-2 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-xs text-foreground">
                  👁 {pupilDistance}mm
                </Text>
              </TouchableOpacity>
            )}

            {/* 關閉 */}
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-2 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.error, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-xs text-background font-semibold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* 提示文本 */}
          <Text className="text-xs text-muted text-center">
            滑動調整亮度 • 水平滑動調整進度
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
