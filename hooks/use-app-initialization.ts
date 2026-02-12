import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';

/**
 * 應用初始化 Hook
 * 
 * 功能：
 * - 管理啟動畫面顯示/隱藏
 * - 初始化應用資源
 * - 處理路由導航
 */

export function useAppInitialization() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function initializeApp() {
      try {
        // 保持啟動畫面顯示
        await SplashScreen.preventAutoHideAsync();

        // 模擬應用初始化（加載資源、設置等）
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 500); // 最少顯示 500ms 啟動畫面
        });

        // 初始化完成
        setIsReady(true);

        // 隱藏啟動畫面
        await SplashScreen.hideAsync();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '初始化失敗';
        console.error('應用初始化錯誤:', errorMessage);
        setError(errorMessage);
        setIsReady(true);
        
        // 即使出錯也隱藏啟動畫面
        try {
          await SplashScreen.hideAsync();
        } catch (hideErr) {
          console.error('隱藏啟動畫面失敗:', hideErr);
        }
      }
    }

    initializeApp();
  }, []);

  return {
    isReady,
    error,
  };
}

/**
 * 應用啟動管理器
 * 
 * 在根布局中使用此 Hook 確保正確的初始化順序
 */
export function useAppStartup() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 保持啟動畫面
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.warn('無法保持啟動畫面:', e);
      }
    }

    prepare();
  }, []);

  const finishStartup = async () => {
    try {
      await SplashScreen.hideAsync();
      setIsAppReady(true);
    } catch (e) {
      console.warn('無法隱藏啟動畫面:', e);
      setIsAppReady(true);
    }
  };

  return {
    isAppReady,
    finishStartup,
  };
}
