import { useState, useEffect, useCallback } from 'react';
import type { Favorite } from '../types';
import { calculateMaxItems } from '../utils/storageUtils';

/**
 * お気に入り情報を管理するカスタムフック
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [storageUsage, setStorageUsage] = useState({ current: 0, max: 0 });

  /**
   * ステータスメッセージを設定する
   */
  const setStatusMessage = useCallback((message: string, isError = false) => {
    setStatus({ message, isError });

    // 3秒後にステータスメッセージをクリア
    if (!isError) {
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    }
  }, []);

  // storage.syncからお気に入り情報を取得する
  const fetchFavoritesFromSync = () => {
    chrome.storage.sync.get('favorites', (result) => {
      const syncedFavorites = result.favorites as Favorite[] | undefined;

      if (syncedFavorites) {
        setFavorites(syncedFavorites);

        // ストレージ使用状況を計算
        const maxItems = calculateMaxItems(syncedFavorites[0] || undefined);
        setStorageUsage({
          current: syncedFavorites.length,
          max: maxItems,
        });
      } else {
        setFavorites([]);
        setStorageUsage({
          current: 0,
          max: calculateMaxItems(),
        });
      }
    });
  };

  // ローカルのお気に入りをstorage.syncにアップロードする
  const uploadLocalFavoritesToSync = () => {
    // アクティブなタブを取得
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];

      // LGTMoonのサイトでない場合はエラーを表示
      if (!currentTab.url?.includes('lgtmoon.')) {
        setStatus({
          message: 'LGTMoonサイトでのみ使用できます。',
          isError: true,
        });
        return;
      }

      // タブIDが存在することを確認
      if (!currentTab.id) {
        setStatus({
          message: 'タブIDが取得できませんでした。',
          isError: true,
        });
        return;
      }

      // content scriptにメッセージを送信してお気に入り情報を取得
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: 'getFavorites' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error sending message to content script:',
              chrome.runtime.lastError
            );
            setStatus({
              message: 'コンテンツスクリプトとの通信に失敗しました。',
              isError: true,
            });
            return;
          }

          if (!response || !response.success) {
            console.log(
              'Failed to get favorites:',
              response?.error || 'Unknown error'
            );
            setStatus({
              message: 'お気に入りの取得に失敗しました。',
              isError: true,
            });
            return;
          }

          const localFavorites = response.favorites;

          // chrome.storage.sync にアップロード
          chrome.storage.sync.set({ favorites: localFavorites }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                'Failed to save favorites to storage.sync:',
                chrome.runtime.lastError
              );
              setStatus({
                message: '同期ストレージへの保存に失敗しました。',
                isError: true,
              });
            } else {
              console.log('Successfully uploaded favorites to storage.sync.');
              setStatus({
                message: 'お気に入りを同期ストレージにアップロードしました！',
                isError: false,
              });
            }
          });
        }
      );
    });
  };

  // 初回レンダリング時にお気に入り情報を取得
  useEffect(() => {
    fetchFavoritesFromSync();

    // storage.syncの変更を監視
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.favorites) {
        fetchFavoritesFromSync();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // クリーンアップ関数
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    favorites,
    status,
    storageUsage,
    uploadLocalFavoritesToSync,
    setStatusMessage,
  };
};
