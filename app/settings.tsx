import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useAppSettings } from "@/hooks/use-app-settings";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    settings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    getPlaybackDefaults,
  } = useAppSettings();

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
    <View
      className="mb-4 rounded-lg overflow-hidden"
      style={{ backgroundColor: colors.surface }}
    >
      <TouchableOpacity
        onPress={() =>
          setExpandedSection(expandedSection === sectionId ? null : sectionId)
        }
        className="flex-row items-center justify-between p-4"
        style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}
      >
        <Text className="font-semibold text-foreground text-base">{title}</Text>
        <Text className="text-primary">
          {expandedSection === sectionId ? "▼" : "▶"}
        </Text>
      </TouchableOpacity>
      {expandedSection === sectionId && (
        <View className="p-4 gap-4">{children}</View>
      )}
    </View>
  );

  const SettingRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-2"
    >
      <Text className="text-sm text-foreground">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-muted">{value}</Text>
        {onPress && (
          <IconSymbol name="chevron.right" size={16} color={colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const ToggleSetting = ({
    label,
    description,
    value,
    onValueChange,
  }: {
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {description && (
          <Text className="text-xs text-muted mt-1">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? colors.primary : colors.muted}
      />
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      {/* 頂部標題 */}
      <View
        className="px-6 pt-6 pb-4 flex-row items-center justify-between"
        style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}
      >
        <Text className="text-2xl font-bold text-foreground">設置</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-lg text-primary">✕</Text>
        </TouchableOpacity>
      </View>

      {/* 設置內容 */}
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* 播放器設置 */}
        <SettingSection title="▶️ 播放器設置" sectionId="playback">
          <SettingRow
            label="預設播放模式"
            value={settings.defaultPlaybackMode}
            onPress={() => {
              Alert.alert("選擇播放模式", "", [
                {
                  text: "2D",
                  onPress: () => updateSetting("defaultPlaybackMode", "2D"),
                },
                {
                  text: "3D",
                  onPress: () => updateSetting("defaultPlaybackMode", "3D"),
                },
                {
                  text: "360°",
                  onPress: () =>
                    updateSetting("defaultPlaybackMode", "360°"),
                },
                { text: "取消", style: "cancel" },
              ]);
            }}
          />
          <SettingRow
            label="預設播放速度"
            value={`${settings.defaultPlaybackSpeed}x`}
            onPress={() => {
              Alert.alert("選擇播放速度", "", [
                {
                  text: "0.5x",
                  onPress: () => updateSetting("defaultPlaybackSpeed", 0.5),
                },
                {
                  text: "1x",
                  onPress: () => updateSetting("defaultPlaybackSpeed", 1),
                },
                {
                  text: "1.5x",
                  onPress: () => updateSetting("defaultPlaybackSpeed", 1.5),
                },
                {
                  text: "2x",
                  onPress: () => updateSetting("defaultPlaybackSpeed", 2),
                },
                { text: "取消", style: "cancel" },
              ]);
            }}
          />
          <SettingRow
            label="預設亮度"
            value={`${Math.round(settings.defaultBrightness * 100)}%`}
          />
          <SettingRow
            label="預設對比度"
            value={`${Math.round(settings.defaultContrast * 100)}%`}
          />
          <SettingRow
            label="預設瞳距"
            value={`${settings.defaultPupilDistance}mm`}
          />
          <SettingRow
            label="VR 設備"
            value={settings.selectedVRDevice}
            onPress={() => {
              Alert.alert("選擇 VR 設備", "", [
                {
                  text: "標準 VR",
                  onPress: () => updateSetting("selectedVRDevice", "標準 VR"),
                },
                {
                  text: "大朋 VR",
                  onPress: () => updateSetting("selectedVRDevice", "大朋 VR"),
                },
                {
                  text: "小米 VR",
                  onPress: () => updateSetting("selectedVRDevice", "小米 VR"),
                },
                {
                  text: "魔風暴鏡",
                  onPress: () =>
                    updateSetting("selectedVRDevice", "魔風暴鏡"),
                },
                { text: "取消", style: "cancel" },
              ]);
            }}
          />
        </SettingSection>

        {/* 界面設置 */}
        <SettingSection title="🎨 界面設置" sectionId="ui">
          <SettingRow
            label="語言"
            value={settings.language === "zh-TW" ? "繁體中文" : "簡體中文"}
            onPress={() => {
              Alert.alert("選擇語言", "", [
                {
                  text: "繁體中文",
                  onPress: () => updateSetting("language", "zh-TW"),
                },
                {
                  text: "簡體中文",
                  onPress: () => updateSetting("language", "zh-CN"),
                },
                { text: "取消", style: "cancel" },
              ]);
            }}
          />
          <SettingRow
            label="主題"
            value={
              settings.theme === "light"
                ? "亮色"
                : settings.theme === "dark"
                  ? "暗色"
                  : "自動"
            }
            onPress={() => {
              Alert.alert("選擇主題", "", [
                {
                  text: "亮色",
                  onPress: () => updateSetting("theme", "light"),
                },
                {
                  text: "暗色",
                  onPress: () => updateSetting("theme", "dark"),
                },
                {
                  text: "自動",
                  onPress: () => updateSetting("theme", "auto"),
                },
                { text: "取消", style: "cancel" },
              ]);
            }}
          />
          <ToggleSetting
            label="啟動時顯示控制條"
            value={settings.showControlsOnStart}
            onValueChange={(value) =>
              updateSetting("showControlsOnStart", value)
            }
          />
        </SettingSection>

        {/* 功能設置 */}
        <SettingSection title="⚙️ 功能設置" sectionId="features">
          <ToggleSetting
            label="手勢控制"
            description="啟用滑動調整亮度、音量和進度"
            value={settings.enableGestureControl}
            onValueChange={(value) =>
              updateSetting("enableGestureControl", value)
            }
          />
          <ToggleSetting
            label="藍牙遙控器"
            description="支援 VR 遙控器和藍牙設備"
            value={settings.enableBluetoothControl}
            onValueChange={(value) =>
              updateSetting("enableBluetoothControl", value)
            }
          />
          <ToggleSetting
            label="陀螺儀"
            description="用於 360° 全景影片的頭部追蹤"
            value={settings.enableGyroscope}
            onValueChange={(value) => updateSetting("enableGyroscope", value)}
          />
          <ToggleSetting
            label="頭部追蹤"
            description="啟用完整的頭部動作追蹤（需要 VR 眼鏡）"
            value={settings.enableHeadTracking}
            onValueChange={(value) =>
              updateSetting("enableHeadTracking", value)
            }
          />
        </SettingSection>

        {/* 存儲設置 */}
        <SettingSection title="💾 存儲設置" sectionId="storage">
          <ToggleSetting
            label="自動刪除已觀看影片"
            description="節省存儲空間"
            value={settings.autoDeleteWatchedVideos}
            onValueChange={(value) =>
              updateSetting("autoDeleteWatchedVideos", value)
            }
          />
          <SettingRow
            label="最大快取大小"
            value={`${settings.maxCacheSize}MB`}
          />
        </SettingSection>

        {/* 關於應用 */}
        <SettingSection title="ℹ️ 關於應用" sectionId="about">
          <SettingRow label="應用名稱" value="真實 VR 播放器" />
          <SettingRow label="版本" value="1.0.0" />
          <SettingRow label="開發者" value="Manus Team" />
          <View className="mt-4 pt-4" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
            <Text className="text-xs text-muted text-center">
              支援 2D/3D/360° 影片播放{"\n"}
              相容多種 VR 設備{"\n"}
              全繁體中文介面
            </Text>
          </View>
        </SettingSection>

        {/* 操作按鈕 */}
        <View className="gap-3 mt-6 mb-6">
          <TouchableOpacity
            onPress={() => {
              Alert.alert("重置設置", "確定要重置所有設置為預設值嗎？", [
                {
                  text: "確定",
                  onPress: () => {
                    resetToDefaults();
                    Alert.alert("成功", "設置已重置為預設值");
                  },
                  style: "destructive",
                },
                { text: "取消", style: "cancel" },
              ]);
            }}
            className="py-3 rounded-lg items-center justify-center"
            style={{
              backgroundColor: colors.error,
            }}
          >
            <Text className="font-semibold text-background">重置所有設置</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
