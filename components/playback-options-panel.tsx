import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PLAYBACK_SPEEDS } from "@/lib/video-processing";

export interface Subtitle {
  id: string;
  name: string;
  language: string;
  isExternal?: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  language: string;
  codec: string;
}

interface PlaybackOptionsPanelProps {
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  subtitles: Subtitle[];
  selectedSubtitleId?: string;
  onSubtitleChange: (subtitleId?: string) => void;
  audioTracks: AudioTrack[];
  selectedAudioTrackId: string;
  onAudioTrackChange: (trackId: string) => void;
  onClose: () => void;
}

export function PlaybackOptionsPanel({
  playbackSpeed,
  onPlaybackSpeedChange,
  subtitles,
  selectedSubtitleId,
  onSubtitleChange,
  audioTracks,
  selectedAudioTrackId,
  onAudioTrackChange,
  onClose,
}: PlaybackOptionsPanelProps) {
  const colors = useColors();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const OptionSection = ({
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
        <Text className="font-semibold text-foreground">{title}</Text>
        <Text className="text-primary">
          {expandedSection === sectionId ? "▼" : "▶"}
        </Text>
      </TouchableOpacity>
      {expandedSection === sectionId && (
        <View className="p-4 gap-2">{children}</View>
      )}
    </View>
  );

  const OptionButton = ({
    label,
    isSelected,
    onPress,
  }: {
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="py-3 px-4 rounded-lg flex-row items-center justify-between"
      style={{
        backgroundColor: isSelected ? colors.primary : colors.background,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <Text
        className="text-sm font-semibold"
        style={{
          color: isSelected ? colors.background : colors.foreground,
        }}
      >
        {label}
      </Text>
      {isSelected && (
        <Text
          style={{
            color: isSelected ? colors.background : colors.foreground,
          }}
        >
          ✓
        </Text>
      )}
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
        <Text className="text-lg font-bold text-foreground">播放選項</Text>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-lg text-primary">✕</Text>
        </TouchableOpacity>
      </View>

      {/* 選項內容 */}
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* 播放速度 */}
        <OptionSection title="⏱️ 播放速度" sectionId="speed">
          <View className="flex-row flex-wrap gap-2">
            {PLAYBACK_SPEEDS.map((speed) => (
              <TouchableOpacity
                key={speed}
                onPress={() => onPlaybackSpeedChange(speed)}
                className="flex-1 min-w-[30%] py-2 rounded-lg items-center justify-center"
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
                  className="text-sm font-semibold"
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
        </OptionSection>

        {/* 字幕選擇 */}
        <OptionSection title="📝 字幕" sectionId="subtitles">
          <OptionButton
            label="無字幕"
            isSelected={!selectedSubtitleId}
            onPress={() => onSubtitleChange(undefined)}
          />
          {subtitles.length === 0 ? (
            <Text className="text-xs text-muted text-center py-4">
              此影片沒有可用的字幕
            </Text>
          ) : (
            subtitles.map((subtitle) => (
              <OptionButton
                key={subtitle.id}
                label={`${subtitle.name} (${subtitle.language})`}
                isSelected={selectedSubtitleId === subtitle.id}
                onPress={() => onSubtitleChange(subtitle.id)}
              />
            ))
          )}
        </OptionSection>

        {/* 音軌選擇 */}
        <OptionSection title="🔊 音軌" sectionId="audio">
          {audioTracks.length === 0 ? (
            <Text className="text-xs text-muted text-center py-4">
              此影片沒有可用的音軌
            </Text>
          ) : (
            audioTracks.map((track) => (
              <OptionButton
                key={track.id}
                label={`${track.name} (${track.language})`}
                isSelected={selectedAudioTrackId === track.id}
                onPress={() => onAudioTrackChange(track.id)}
              />
            ))
          )}
        </OptionSection>

        {/* 底部空間 */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
