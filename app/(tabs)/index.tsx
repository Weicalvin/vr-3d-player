import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

const { width, height } = Dimensions.get('window');

export default function App() {
  const videoRef = useRef(null);
  const [videoSource, setVideoSource] = useState(null);
  const [status, setStatus] = useState({});
  
  // 1. 選擇影片
  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
      });
      
      if (result.assets && result.assets.length > 0) {
        setVideoSource({ uri: result.assets[0].uri });
      } else if (result.uri) {
         // 相容舊版 API
         setVideoSource({ uri: result.uri });
      }
    } catch (err) {
      console.log('Error picking video:', err);
    }
  };

  // 2. 切換播放/暫停
  const togglePlay = () => {
    if (videoRef.current) {
      status.isPlaying ? videoRef.current.pauseAsync() : videoRef.current.playAsync();
    }
  };

  // 首頁：選擇影片
  if (!videoSource) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Text style={styles.title}>VR Player Demo</Text>
        <Text style={styles.subtitle}>Expo Go Version</Text>
        
        <TouchableOpacity style={styles.button} onPress={pickVideo}>
          <Text style={styles.buttonText}>📂 Select Video</Text>
        </TouchableOpacity>
        
        <Text style={styles.hint}>Please pick a landscape video</Text>
      </View>
    );
  }

  // VR 模式：雙眼畫面
  return (
    <View style={styles.vrContainer}>
      <StatusBar hidden />
      
      {/* 左眼 */}
      <View style={styles.eyeContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={videoSource}
          useNativeControls={false}
          resizeMode="contain"
          isLooping
          shouldPlay
          onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
        <View style={styles.vignette} pointerEvents="none" />
      </View>

      {/* 分隔線 */}
      <View style={styles.divider} />

      {/* 右眼 */}
      <View style={styles.eyeContainer}>
         <Video
          style={styles.video}
          source={videoSource}
          useNativeControls={false}
          resizeMode="contain"
          isLooping
          shouldPlay={status.isPlaying}
          positionMillis={status.positionMillis}
        />
        <View style={styles.vignette} pointerEvents="none" />
      </View>

      {/* 點擊螢幕暫停 */}
      <TouchableOpacity style={styles.overlayControl} onPress={togglePlay} />
      
      {/* 關閉按鈕 */}
      <TouchableOpacity style={styles.backButton} onPress={() => setVideoSource(null)}>
        <Text style={styles.backText}>❌ Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vrContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'black',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  buttonText: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    color: '#666',
    marginTop: 20,
    fontSize: 12,
  },
  eyeContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '120%',
    height: '100%',
  },
  divider: {
    width: 2,
    backgroundColor: '#222',
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderWidth: 30,
    borderColor: 'rgba(0,0,0,0.4)',
    borderRadius: 60, 
  },
  overlayControl: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: width / 2 - 30,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  backText: {
    color: 'white',
    fontSize: 12,
  },
});
