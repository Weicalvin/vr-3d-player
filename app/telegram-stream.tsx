import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface TelegramChannel {
  id: string;
  title: string;
  username?: string;
  memberCount?: number;
}

interface TelegramVideo {
  id: string;
  title: string;
  duration: string;
  channelId: string;
  channelTitle: string;
}

export default function TelegramStreamScreen() {
  const colors = useColors();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [videos, setVideos] = useState<TelegramVideo[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<TelegramChannel | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 模擬登入流程
  const handleLogin = async () => {
    if (!phoneNumber) return;
    setIsLoading(true);
    // 模擬發送驗證碼
    setTimeout(() => {
      setShowCodeInput(true);
      setIsLoading(false);
    }, 1000);
  };

  // 模擬驗證碼驗證
  const handleVerifyCode = async () => {
    if (!verificationCode) return;
    setIsLoading(true);
    // 模擬驗證
    setTimeout(() => {
      setIsLoggedIn(true);
      setShowCodeInput(false);
      setPhoneNumber("");
      setVerificationCode("");
      // 加載用戶的頻道
      loadUserChannels();
      setIsLoading(false);
    }, 1000);
  };

  // 模擬加載用戶頻道
  const loadUserChannels = () => {
    const mockChannels: TelegramChannel[] = [
      {
        id: "1",
        title: "VR 影片分享",
        username: "vr_videos",
        memberCount: 15000,
      },
      {
        id: "2",
        title: "3D 電影預告",
        username: "3d_movies",
        memberCount: 8000,
      },
      {
        id: "3",
        title: "360° 全景視頻",
        username: "panoramic_videos",
        memberCount: 5000,
      },
    ];
    setChannels(mockChannels);
  };

  // 模擬搜尋頻道
  const handleSearchChannels = async () => {
    if (!searchQuery) return;
    setIsLoading(true);
    // 模擬搜尋
    setTimeout(() => {
      const mockResults: TelegramChannel[] = [
        {
          id: "4",
          title: `搜尋結果: ${searchQuery}`,
          username: searchQuery,
          memberCount: 3000,
        },
      ];
      setChannels(mockResults);
      setIsLoading(false);
    }, 1000);
  };

  // 模擬加載頻道影片
  const handleSelectChannel = (channel: TelegramChannel) => {
    setSelectedChannel(channel);
    setIsLoading(true);
    // 模擬加載影片
    setTimeout(() => {
      const mockVideos: TelegramVideo[] = [
        {
          id: "v1",
          title: "VR 風景探索",
          duration: "20:15",
          channelId: channel.id,
          channelTitle: channel.title,
        },
        {
          id: "v2",
          title: "3D 電影預告片",
          duration: "02:30",
          channelId: channel.id,
          channelTitle: channel.title,
        },
        {
          id: "v3",
          title: "360° 全景旅遊",
          duration: "15:45",
          channelId: channel.id,
          channelTitle: channel.title,
        },
      ];
      setVideos(mockVideos);
      setIsLoading(false);
    }, 1000);
  };

  // 播放影片
  const handlePlayVideo = (video: TelegramVideo) => {
    alert(`播放: ${video.title}\n來自: ${video.channelTitle}`);
  };

  // 登入頁面
  if (!isLoggedIn) {
    return (
      <ScreenContainer className="p-6 justify-center">
        <View className="gap-6">
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Telegram 串流
            </Text>
            <Text className="text-sm text-muted text-center">
              連接 Telegram 帳戶以串流播放影片
            </Text>
          </View>

          {!showCodeInput ? (
            <>
              <View className="gap-3">
                <Text className="text-sm font-semibold text-foreground">
                  電話號碼
                </Text>
                <TextInput
                  placeholder="+886912345678"
                  placeholderTextColor={colors.muted}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  className="px-4 py-3 rounded-lg text-foreground"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={!phoneNumber || isLoading}
                className="py-3 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: phoneNumber && !isLoading ? colors.primary : colors.border,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="font-semibold text-background">
                    發送驗證碼
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="gap-3">
                <Text className="text-sm font-semibold text-foreground">
                  驗證碼
                </Text>
                <TextInput
                  placeholder="輸入驗證碼"
                  placeholderTextColor={colors.muted}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  className="px-4 py-3 rounded-lg text-foreground"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  editable={!isLoading}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                onPress={handleVerifyCode}
                disabled={!verificationCode || isLoading}
                className="py-3 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: verificationCode && !isLoading ? colors.primary : colors.border,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="font-semibold text-background">驗證</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowCodeInput(false)}>
                <Text className="text-sm text-primary text-center">
                  返回
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // 頻道選擇頁面
  if (!selectedChannel) {
    return (
      <ScreenContainer className="p-0">
        <View
          className="px-6 pt-6 pb-4"
          style={{ backgroundColor: colors.background }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-foreground">
              我的頻道
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsLoggedIn(false);
                setChannels([]);
              }}
            >
              <Text className="text-primary font-semibold">登出</Text>
            </TouchableOpacity>
          </View>

          {/* 搜尋框 */}
          <View className="flex-row gap-2 mb-4">
            <TextInput
              placeholder="搜尋頻道..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 px-4 py-2 rounded-lg text-foreground"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            />
            <TouchableOpacity
              onPress={handleSearchChannels}
              disabled={!searchQuery || isLoading}
              className="px-4 py-2 rounded-lg items-center justify-center"
              style={{
                backgroundColor: searchQuery && !isLoading ? colors.primary : colors.border,
              }}
            >
              <IconSymbol name="chevron.right" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 頻道列表 */}
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectChannel(item)}
              className="mx-6 mb-3 p-4 rounded-lg flex-row items-center justify-between"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  {item.title}
                </Text>
                {item.username && (
                  <Text className="text-xs text-muted mt-1">
                    @{item.username}
                  </Text>
                )}
                {item.memberCount && (
                  <Text className="text-xs text-muted mt-1">
                    成員: {item.memberCount.toLocaleString()}
                  </Text>
                )}
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-muted">沒有找到頻道</Text>
            </View>
          }
        />
      </ScreenContainer>
    );
  }

  // 影片列表頁面
  return (
    <ScreenContainer className="p-0">
      <View
        className="px-6 pt-6 pb-4 flex-row items-center justify-between"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1">
          <TouchableOpacity onPress={() => setSelectedChannel(null)}>
            <Text className="text-primary font-semibold">← 返回</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground mt-2">
            {selectedChannel.title}
          </Text>
        </View>
      </View>

      {/* 影片列表 */}
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlayVideo(item)}
            className="mx-6 mb-3 p-4 rounded-lg"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.primary,
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View
                className="w-16 h-16 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-2xl">▶</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  {item.title}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  時長: {item.duration}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">沒有找到影片</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
