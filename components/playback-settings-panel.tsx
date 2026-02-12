import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import {
  BRIGHTNESS_PRESETS,
  CONTRAST_PRESETS,
  PLAYBACK_SPEEDS,
  VR_DEVICE_PUPIL_DISTANCES,
} from "@/lib/video-processing";

interface PlaybackSettingsPanelProps {
  brightness: number;
  onBrightnessChange: (value: number) => void;
  contrast: number;
  onContrastChange: (value: number) => void;
  saturation: number;
  onSaturationChange: (value: number) => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (value: number) => void;
  pupilDistance: number;
  onPupilDistanceChange: (value: number) => void;
  selectedVRDevice: string;
  onVRDeviceChange: (device: string) => void;
  onClose: () => void;
}

export function PlaybackSettingsPanel({
  brightness,
  onBrightnessChange,
  contrast,
  onContrastChange,
  saturation,
  onSaturationChange,
  playbackSpeed,
  onPlaybackSpeedChange,
  pupilDistance,
  onPupilDistanceChange,
  selectedVRDevice,
  onVRDeviceChange,
  onClose,
}: PlaybackSettingsPanelProps) {
  const colors = useColors();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const SettingSection = ({
    title,
    sectionId,
    children,
  }: {
    title: string;
    sectionId: string;
    children: React.ReactNode;
  }) => (
    <View className="mb-4 rounded-lg overflow-hidden" style={{ backgroundColor: colors.surface }}>
      <TouchableOpacity
        onPress={() =>
          setExpandedSection(expandedSection === sectionId ? null : sectionId)
        }
        className="flex-row items-center justify-between p-4"
        style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}
      >
        <Text className="font-semibold text-foreground">{title}</Text>
        <Text className="text-primary">
          {expandedSection === sectionId ? "▼" : "▶"}
        </Text>
      </TouchableOpacity>
      {expandedSection === sectionId && (
        <View className="p-4 gap-3">{children}</View>
      )}
    </View>
  );

  const SliderSetting = ({
    label,
    value,
    onValueChange,
    min,
    max,
    step,
    unit,
  }: {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    unit: string;
  }) => (
    <View className="gap-2">
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-muted">{label}</Text>
        <Text className="text-sm font-semibold text-foreground">
          {value.toFixed(2)} {unit}
        </Text>
      </View>
      <View
        className="h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: colors.surface }}
      >
        <Text className="text-xs text-muted">
          滑塊：{value.toFixed(2)} / {max.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const PresetButton = ({
    label,
    value,
    isSelected,
    onPress,
  }: {
    label: string;
    value: number;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 py-2 rounded-lg items-center justify-center"
      style={{
        backgroundColor: isSelected ? colors.primary : colors.background,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <Text
        className="text-xs font-semibold"
        style={{
          color: isSelected ? colors.background : colors.foreground,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* 頂部標題 */}
      <View
        className="flex-row items-center justify-between p-4"
        style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}
      >
        <Text className="text-lg font-bold text-foreground">播放設置</Text>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-lg text-primary">✕</Text>
        </TouchableOpacity>
      </View>

      {/* 設置內容 */}
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* 亮度設置 */}
        <SettingSection title="💡 亮度" sectionId="brightness">
          <SliderSetting
            label="亮度調整"
            value={brightness}
            onValueChange={onBrightnessChange}
            min={0.3}
            max={1.5}
            step={0.1}
            unit="%"
          />
          <View className="flex-row gap-2">
            {Object.entries(BRIGHTNESS_PRESETS).map(([label, value]) => (
              <PresetButton
                key={label}
                label={label}
                value={value}
                isSelected={Math.abs(brightness - value) < 0.1}
                onPress={() => onBrightnessChange(value)}
              />
            ))}
          </View>
        </SettingSection>

        {/* 對比度設置 */}
        <SettingSection title="⚙️ 對比度" sectionId="contrast">
          <SliderSetting
            label="對比度調整"
            value={contrast}
            onValueChange={onContrastChange}
            min={0.5}
            max={2.0}
            step={0.1}
            unit=""
          />
          <View className="flex-row gap-2">
            {Object.entries(CONTRAST_PRESETS).map(([label, value]) => (
              <PresetButton
                key={label}
                label={label}
                value={value}
                isSelected={Math.abs(contrast - value) < 0.1}
                onPress={() => onContrastChange(value)}
              />
            ))}
          </View>
        </SettingSection>

        {/* 飽和度設置 */}
        <SettingSection title="🎨 飽和度" sectionId="saturation">
          <SliderSetting
            label="飽和度調整"
            value={saturation}
            onValueChange={onSaturationChange}
            min={0}
            max={2.0}
            step={0.1}
            unit=""
          />
        </SettingSection>

        {/* 播放速度 */}
        <SettingSection title="⏱️ 播放速度" sectionId="speed">
          <View className="flex-row gap-2 flex-wrap">
            {PLAYBACK_SPEEDS.map((speed) => (
              <TouchableOpacity
                key={speed}
                onPress={() => onPlaybackSpeedChange(speed)}
                className="px-3 py-2 rounded-lg"
                style={{
                  backgroundColor:
                    Math.abs(playbackSpeed - speed) < 0.01
                      ? colors.primary
                      : colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color:
                      Math.abs(playbackSpeed - speed) < 0.01
                        ? colors.background
                        : colors.foreground,
                  }}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingSection>

        {/* 瞳距調節 */}
        <SettingSection title="👁️ 瞳距調節" sectionId="pupil">
          <SliderSetting
            label="瞳距距離"
            value={pupilDistance}
            onValueChange={onPupilDistanceChange}
            min={50}
            max={75}
            step={1}
            unit="mm"
          />
          <Text className="text-xs text-muted">
            標準瞳距範圍：50-75mm
          </Text>
        </SettingSection>

        {/* VR 設備選擇 */}
        <SettingSection title="🥽 VR 設備" sectionId="vr-device">
          <View className="gap-2">
            {Object.entries(VR_DEVICE_PUPIL_DISTANCES).map(
              ([device, distance]) => (
                <TouchableOpacity
                  key={device}
                  onPress={() => {
                    onVRDeviceChange(device);
                    onPupilDistanceChange(distance);
                  }}
                  className="p-3 rounded-lg flex-row items-center justify-between"
                  style={{
                    backgroundColor:
                      selectedVRDevice === device
                        ? colors.primary
                        : colors.background,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  <View>
                    <Text
                      className="font-semibold"
                      style={{
                        color:
                          selectedVRDevice === device
                            ? colors.background
                            : colors.foreground,
                      }}
                    >
                      {device}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{
                        color:
                          selectedVRDevice === device
                            ? colors.background
                            : colors.muted,
                      }}
                    >
                      瞳距: {distance}mm
                    </Text>
                  </View>
                  {selectedVRDevice === device && (
                    <Text className="text-lg">✓</Text>
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        </SettingSection>

        {/* 底部空間 */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
