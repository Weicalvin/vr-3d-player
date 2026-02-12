import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Platform, ToastAndroid, ScrollView, type ViewStyle } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useSafeTVEventHandler } from '@/hooks/use-tv-event-handler';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

// 動態導入 expo-video（替代 expo-av）
const Video = require('expo-video').Video || (() => null);
const ResizeMode = require('expo-video').ResizeMode || {};

interface VideoAsset {
  uri: string;
  name: string;
  type?: string;
}

export default function VRPlayerScreen() {
  const colors = useColors();
  const leftVideoRef = useRef<any>(null);
  const rightVideoRef = useRef<any>(null);
  
  const [playlist, setPlaylist] = useState<VideoAsset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'2D' | 'SBS' | '360'>('SBS'); 
  const [ipdOffset, setIpdOffset] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [lastEvent, setLastEvent] = useState('等待訊號...');

  // TV 事件處理器
  useSafeTVEventHandler((evt) => {
    if (!evt) return;
    
    setLastEvent(evt.eventType);
    setShowControls(true);

    switch (evt.eventType) {
      case 'select':
      case 'center':
      case 'playPause':
        togglePlay();
        break;
        
      case 'right':
        if (viewMode === '360') handleDirection('RIGHT');
        else seekVideo(10);
        break;
        
      case 'left':
        if (viewMode === '360') handleDirection('LEFT');
        else seekVideo(-10);
        break;
        
      case 'up':
        if (viewMode === '360') handleDirection('UP');
        else adjustIPD(5);
        break;
        
      case 'down':
        if (viewMode === '360') handleDirection('DOWN');
        else adjustIPD(-5);
        break;
        
      case 'fastForward':
      case 'next':
        playNext();
        break;

      case 'rewind':
      case 'previous':
        playPrev();
        break;
    }
  });

  // 掃描本地影片
  const scanLocalVideos = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: 'video',
          first: 100,
        });
        
        const videos = await Promise.all(
          media.assets.map(async (asset) => {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            return {
              uri: info.localUri || asset.uri,
              name: asset.filename || `影片 ${asset.id}`,
              type: 'video',
            };
          })
        );
        
        setPlaylist(videos);
        if (videos.length > 0) {
          setCurrentIndex(0);
        }
      }
    } catch (err) {
      console.error('掃描影片失敗:', err);
      showToast('無法掃描影片');
    }
  };

  // 選擇影片从相冊
  const pickVideo = async () => {
    try {
      // 要求數一權限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('需要相冊數一權限');
        return;
      }

      // 使用 ImagePicker 選擇影片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newVideos = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop() || '未命名影片',
          type: 'video',
        }));
        setPlaylist(prev => [...prev, ...newVideos]);
        if (playlist.length === 0) {
          setCurrentIndex(0);
        }
        showToast(`已添加 ${newVideos.length} 個影片`);
      }
    } catch (err) {
      console.error('選擇影片失敗:', err);
      showToast('選擇影片失敗');
    }
  };

  // 播放/暫停
  const togglePlay = async () => {
    if (!leftVideoRef.current) return;
    try {
      if (isPlaying) {
        if (leftVideoRef.current?.pauseAsync) await leftVideoRef.current.pauseAsync();
        if (rightVideoRef.current?.pauseAsync) rightVideoRef.current.pauseAsync();
      } else {
        if (leftVideoRef.current?.playAsync) await leftVideoRef.current.playAsync();
        if (rightVideoRef.current?.playAsync) rightVideoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('播放控制失敗:', err);
    }
  };

  // 指指控制（360° 模式）
  // 從相冊選擇影片
  const pickVideoFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('需要相冊數一權限');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newVideos = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop() || '未命名影片',
          type: 'video',
        }));
        setPlaylist(prev => [...prev, ...newVideos]);
        if (playlist.length === 0) {
          setCurrentIndex(0);
        }
        showToast(`已添加 ${newVideos.length} 個影片`);
      }
    } catch (err) {
      console.error('從相冊選擇影片失敗:', err);
      showToast('從相冊選擇影片失敗');
    }
  }
  const handleDirection = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const step = 20;
    if (dir === 'UP') setPanY(p => p + step);
    if (dir === 'DOWN') setPanY(p => p - step);
    if (dir === 'LEFT') setPanX(p => p + step);
    if (dir === 'RIGHT') setPanX(p => p - step);
  };

  // 快進/快退
  const seekVideo = async (seconds: number) => {
    if (!leftVideoRef.current) return;
    try {
      const status = await leftVideoRef.current.getStatusAsync();
      if (status.isLoaded) {
        const newPos = Math.max(0, (status.positionMillis || 0) + (seconds * 1000));
        await leftVideoRef.current.setPositionAsync(newPos);
        rightVideoRef.current?.setPositionAsync(newPos);
      }
    } catch (err) {
      console.error('快進失敗:', err);
    }
  };

  // 改變播放速度
  const changeSpeed = async () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.5];
    const newSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(newSpeed);
    try {
      if (leftVideoRef.current) await leftVideoRef.current.setRateAsync(newSpeed, true);
      if (rightVideoRef.current) await rightVideoRef.current.setRateAsync(newSpeed, true);
    } catch (err) {
      console.error('改變速度失敗:', err);
    }
  };

  // 播放列表控制
  const playNext = () => {
    if (playlist.length > 0) {
      setCurrentIndex(p => (p + 1) % playlist.length);
    }
  };

  const playPrev = () => {
    if (playlist.length > 0) {
      setCurrentIndex(p => p > 0 ? p - 1 : 0);
    }
  };

  // 調整瞳距
  const adjustIPD = (n: number) => {
    if (viewMode !== '2D') {
      setIpdOffset(prev => Math.max(-50, Math.min(50, prev + n)));
    }
  };

  // 顯示提示
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  // 空播放列表界面
  if (playlist.length === 0) {
    return (
      <ScreenContainer className="p-6 justify-center items-center gap-6">
        <View className="bg-surface rounded-lg p-6 items-center gap-4">
          <Text className="text-4xl">🎬</Text>
          <Text className="text-2xl font-bold text-foreground">VR 播放器</Text>
          <Text className="text-sm text-muted text-center">
            選擇或掃描影片開始播放
          </Text>
        </View>

        {/* 除錯訊息 */}
        <View className="bg-error/20 rounded-lg p-4 w-full border border-error">
          <Text className="text-sm text-error font-semibold">目前訊號: {lastEvent}</Text>
        </View>

        {/* 操作按鈕 */}
        <View className="w-full gap-3">
          <TouchableOpacity 
            className="bg-primary rounded-lg py-4 items-center"
            onPress={pickVideo}
          >
            <Text className="text-lg font-semibold text-background">📂 選擇影片</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-surface border border-primary rounded-lg py-4 items-center"
            onPress={scanLocalVideos}
          >
            <Text className="text-lg font-semibold text-primary">🔍 掃描本地影片</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-muted text-center mt-4">
          鍵盤控制：↑↓←→ 方向 | Enter 播放 | N/P 上/下一首
        </Text>
      </ScreenContainer>
    );
  }

  const currentVideo = playlist[currentIndex];

  // VR 播放模式
  return (
    <View style={[styles.vrContainer, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      
      {/* 左眼 */}
      <View 
        style={[
          styles.eye, 
          viewMode === '2D' ? { width: '100%' } : { width: '50%' },
          {
            transform: [
              { translateX: viewMode === '360' ? panX : -ipdOffset },
              { translateY: viewMode === '360' ? panY : 0 },
              { scale: viewMode === '360' ? 2.5 : 1 }
            ]
          }
        ]}
      >
        <Video 
          ref={leftVideoRef} 
          style={styles.vid} 
          source={{ uri: currentVideo.uri }}
          resizeMode={viewMode === '360' ? ResizeMode.COVER : ResizeMode.CONTAIN}
          shouldPlay={true}
          rate={playbackSpeed}
          isLooping={false}
          onPlaybackStatusUpdate={(s: any) => {
            if (s?.didJustFinish) playNext();
          }}
        />
      </View>

      {/* 右眼 */}
      <View 
        style={[
          styles.eye, 
          viewMode === '2D' ? { width: 0, opacity: 0 } : { width: '50%' },
          {
            transform: [
              { translateX: viewMode === '360' ? panX : ipdOffset },
              { translateY: viewMode === '360' ? panY : 0 },
              { scale: viewMode === '360' ? 2.5 : 1 }
            ]
          }
        ]}
      >
        <Video 
          ref={rightVideoRef} 
          style={styles.vid} 
          source={{ uri: currentVideo.uri }}
          resizeMode={viewMode === '360' ? ResizeMode.COVER : ResizeMode.CONTAIN}
          shouldPlay={true}
          rate={playbackSpeed}
          isLooping={false}
          isMuted={true}
        />
      </View>

      {/* 控制面板 */}
      {showControls && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={styles.topBar}>
            <Text style={styles.txt}>{currentVideo.name}</Text>
            <Text style={[styles.txt, { fontSize: 14, color: '#ff6b6b' }]}>
              訊號: {lastEvent}
            </Text>
          </View>

          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setShowControls(false)} 
          />
          
          <View style={styles.btmBar}>
            <TouchableOpacity onPress={playPrev} style={styles.sBtn}>
              <Text style={styles.btnTxt}>⏮️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlay} style={styles.sBtn}>
              <Text style={styles.btnTxt}>{isPlaying ? '⏸️' : '▶️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={playNext} style={styles.sBtn}>
              <Text style={styles.btnTxt}>⏭️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                const modes: ('2D' | 'SBS' | '360')[] = ['2D', 'SBS', '360'];
                setViewMode(modes[(modes.indexOf(viewMode) + 1) % 3]);
                setPanX(0);
                setPanY(0);
                setIpdOffset(0);
              }} 
              style={styles.sBtn}
            >
              <Text style={styles.btnTxt}>{viewMode}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={changeSpeed} style={styles.sBtn}>
              <Text style={styles.btnTxt}>{playbackSpeed}x</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideo} style={styles.sBtn}>
              <Text style={styles.btnTxt}>📂</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 喚醒區域 */}
      {!showControls && (
        <TouchableOpacity 
          style={styles.wake} 
          activeOpacity={1} 
          onPress={() => setShowControls(true)}
        >
          <View style={{ width: '100%', height: '100%' }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  vrContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: '#000' 
  },
  eye: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    backgroundColor: '#000' 
  },
  vid: { 
    width: '100%', 
    height: '100%' 
  },
  overlay: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    zIndex: 10, 
    justifyContent: 'space-between' 
  },
  topBar: { 
    padding: 10, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    alignItems: 'center' 
  },
  btmBar: { 
    padding: 10, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    flexDirection: 'row', 
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  sBtn: { 
    padding: 10, 
    margin: 5, 
    backgroundColor: '#333', 
    borderRadius: 5 
  },
  btnTxt: { 
    color: '#0ff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  txt: { 
    color: '#0ff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  wake: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    zIndex: 20 
  }
});
