// お気に入り情報の型定義
interface FavoriteItem {
  url: string;
  isConverted: boolean;
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

    // content scriptにメッセージを送信してお気に入り情報を取得
    chrome.tabs.sendMessage(currentTab.id!, { action: 'getFavorites' }, (response) => {
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
