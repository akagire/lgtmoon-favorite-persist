import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Favorite } from './types';

// Chrome storage.syncの容量制限（バイト単位）
const SYNC_STORAGE_LIMIT_BYTES = 102400; // 100KB

// 1つのお気に入り項目のおおよそのサイズを計算する関数
function calculateFavoriteItemSize(favorite: Favorite): number {
  // JSONとして文字列化したサイズを計算
  const jsonString = JSON.stringify(favorite);
  // UTF-16文字列のバイト数（2バイト/文字）+ オーバーヘッド
  return jsonString.length * 2 + 8; // 8バイトは保守的なオーバーヘッド
}

// 登録可能な最大項目数を計算する関数
function calculateMaxItems(sampleItem?: Favorite): number {
  // サンプル項目がない場合のデフォルト値
  const defaultItem: Favorite = {
    url: 'https://image.lgtmoon.dev/123456',
    isConverted: true,
  };

  // サンプル項目またはデフォルト項目のサイズを計算
  const itemSize = sampleItem
    ? calculateFavoriteItemSize(sampleItem)
    : calculateFavoriteItemSize(defaultItem);

  // 配列のオーバーヘッドを考慮（保守的に見積もって50バイト）
  const arrayOverhead = 50;

  // 利用可能な容量から最大項目数を計算
  return Math.floor((SYNC_STORAGE_LIMIT_BYTES - arrayOverhead) / itemSize);
}

// Popup コンポーネント
function Popup() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [storageUsage, setStorageUsage] = useState({ current: 0, max: 0 });

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

  // ストレージ使用状況のスタイルを計算
  const getStorageUsageStyle = () => {
    const { current, max } = storageUsage;
    if (current >= max * 0.95) return { color: 'red' };
    if (current >= max * 0.8) return { color: 'orange' };
    return { color: '#666' };
  };

  return (
    <div className="popup-container">
      <h1>LGTMoon お気に入り同期</h1>

      <button onClick={uploadLocalFavoritesToSync}>
        お気に入りをアップロード
      </button>

      {status && (
        <div className="status" style={{ color: status.isError ? 'red' : 'green' }}>
          {status.message}
        </div>
      )}

      <div className="storage-usage" style={getStorageUsageStyle()}>
        {storageUsage.current} / {storageUsage.max} 件
      </div>

      {favorites.length > 0 ? (
        <div className="favorites-container">
          {favorites.map((favorite, index) => (
            <div key={`${favorite.url}-${index}`} className="favorite-item">
              <img src={favorite.url} alt="LGTM画像" loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div className="no-favorites">お気に入りがありません</div>
      )}
    </div>
  );
}

// スタイル定義
const styles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    width: 400px;
    padding: 16px;
    margin: 0;
  }

  h1 {
    font-size: 18px;
    margin-bottom: 15px;
  }

  button {
    background-color: #4285f4;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover {
    background-color: #3367d6;
  }

  .status {
    margin-top: 10px;
    font-size: 14px;
  }

  .storage-usage {
    margin-top: 5px;
    font-size: 14px;
  }

  .favorites-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 16px;
  }

  .favorite-item {
    width: 128px;
    height: auto;
    border-radius: 4px;
    overflow: hidden;
  }

  .favorite-item img {
    width: 100%;
    height: auto;
    display: block;
  }

  .no-favorites {
    margin-top: 16px;
    color: #666;
    font-style: italic;
  }
`;

// DOMが読み込まれたらReactコンポーネントをレンダリング
document.addEventListener('DOMContentLoaded', () => {
  // スタイルを適用
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  // Reactコンポーネントをレンダリング
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<Popup />);
  }
});
