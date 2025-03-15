import type { Favorite } from './types';

// FavoriteItemという名前で使用するためのエイリアス
type FavoriteItem = Favorite;

// Chrome storage.syncの容量制限（バイト単位）
const SYNC_STORAGE_LIMIT_BYTES = 102400; // 100KB

// 1つのお気に入り項目のおおよそのサイズを計算する関数
function calculateFavoriteItemSize(favorite: FavoriteItem): number {
  // JSONとして文字列化したサイズを計算
  const jsonString = JSON.stringify(favorite);
  // UTF-16文字列のバイト数（2バイト/文字）+ オーバーヘッド
  return jsonString.length * 2 + 8; // 8バイトは保守的なオーバーヘッド
}

// 登録可能な最大項目数を計算する関数
function calculateMaxItems(sampleItem?: FavoriteItem): number {
  // サンプル項目がない場合のデフォルト値
  const defaultItem: FavoriteItem = {
    url: 'https://image.lgtmoon.dev/123456',
    isConverted: true
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

// ストレージ使用状況を表示する関数
function displayStorageUsage(favorites: FavoriteItem[] | undefined): void {
  const storageUsageElement = document.getElementById('storage-usage');
  if (!storageUsageElement) return;

  if (!favorites || favorites.length === 0) {
    storageUsageElement.textContent = `0 / ${calculateMaxItems()} 件`;
    return;
  }

  // 実際のお気に入り項目を使って最大数を計算
  const maxItems = calculateMaxItems(favorites[0]);
  storageUsageElement.textContent = `${favorites.length} / ${maxItems} 件`;

  // 80%以上使用している場合は警告色に
  if (favorites.length >= maxItems * 0.8) {
    storageUsageElement.style.color = favorites.length >= maxItems * 0.95 ? 'red' : 'orange';
  } else {
    storageUsageElement.style.color = '#666';
  }
}

function showStatus(message: string, isError = false): void {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? 'red' : 'green';
  }
}

function uploadLocalFavoritesToSync(): void {
  // アクティブなタブを取得
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    // LGTMoonのサイトでない場合はエラーを表示
    if (!currentTab.url?.includes('lgtmoon.')) {
      showStatus('LGTMoonサイトでのみ使用できます。', true);
      return;
    }

    // タブIDが存在することを確認
    if (!currentTab.id) {
      showStatus('タブIDが取得できませんでした。', true);
      return;
    }

    // content scriptにメッセージを送信してお気に入り情報を取得
    chrome.tabs.sendMessage(currentTab.id, { action: 'getFavorites' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to content script:', chrome.runtime.lastError);
        showStatus('コンテンツスクリプトとの通信に失敗しました。', true);
        return;
      }

      if (!response || !response.success) {
        console.log('Failed to get favorites:', response?.error || 'Unknown error');
        showStatus('お気に入りの取得に失敗しました。', true);
        return;
      }

      const localFavorites = response.favorites;

      // chrome.storage.sync にアップロード
      chrome.storage.sync.set({ favorites: localFavorites }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to save favorites to storage.sync:', chrome.runtime.lastError);
          showStatus('同期ストレージへの保存に失敗しました。', true);
        } else {
          console.log('Successfully uploaded favorites to storage.sync.');
          showStatus('お気に入りを同期ストレージにアップロードしました！');
        }
      });
    });
  });
}

// storage.syncからお気に入り情報を取得して表示する
function displayFavoritesFromSync(): void {
  chrome.storage.sync.get('favorites', (result) => {
    const favoritesContainer = document.getElementById('favorites-container');
    const noFavoritesElement = document.getElementById('no-favorites');

    if (!favoritesContainer || !noFavoritesElement) {
      console.error('Required DOM elements not found');
      return;
    }

    // コンテナをクリア
    favoritesContainer.innerHTML = '';

    const favorites = result.favorites as FavoriteItem[] | undefined;

    // ストレージ使用状況を表示
    displayStorageUsage(favorites);

    if (!favorites || favorites.length === 0) {
      // お気に入りがない場合
      favoritesContainer.style.display = 'none';
      noFavoritesElement.style.display = 'block';
      return;
    }

    // お気に入りがある場合
    noFavoritesElement.style.display = 'none';
    favoritesContainer.style.display = 'grid';

    // 各お気に入りを表示
    favorites.forEach((favorite) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'favorite-item';

      const imgElement = document.createElement('img');
      imgElement.src = favorite.url;
      imgElement.alt = 'LGTM画像';
      imgElement.loading = 'lazy';

      itemElement.appendChild(imgElement);
      favoritesContainer.appendChild(itemElement);
    });
  });
}

// ポップアップが読み込まれたタイミングでボタンを取得し、関数と紐付ける
document.addEventListener('DOMContentLoaded', () => {
  const uploadButton = document.getElementById('upload-favorites-button');
  if (uploadButton) {
    uploadButton.addEventListener('click', uploadLocalFavoritesToSync);
  }

  // お気に入り情報を表示
  displayFavoritesFromSync();
});

// アップロード成功後に表示を更新する
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.favorites) {
    // お気に入りが更新されたら表示を更新
    displayFavoritesFromSync();
  }
});
