// LGTMoonサイトのlocalStorageからお気に入り情報を取得し、
// chrome.storage.syncに保存するためのcontent script

import { Favorite } from './types';

// localStorageからお気に入り情報を取得する共通関数
function getFavoritesFromLocalStorage(): Favorite[] | null {
  const localFavoritesStr = localStorage.getItem('favorites');

  if (!localFavoritesStr) {
    console.log('No favorites found in localStorage.');
    return null;
  }

  try {
    return JSON.parse(localFavoritesStr);
  } catch (error) {
    console.error('Failed to parse favorites from localStorage:', error);
    return null;
  }
}

// お気に入り情報をstorage.syncに同期する関数
function syncFavoritesToStorage(): void {
  const localFavorites = getFavoritesFromLocalStorage();

  if (!localFavorites) {
    return;
  }

  // chrome.storage.syncに保存
  chrome.storage.sync.set({ favorites: localFavorites }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to sync favorites to storage:', chrome.runtime.lastError);
    } else {
      console.log('Favorites automatically synced to storage.sync.');
    }
  });
}

// 星ボタンのクリックを監視する関数
function observeStarButtonClicks(): void {
  // 画像コンテナ全体を監視するMutationObserver
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // 新しく追加された.star-buttonを探す
        const starButtons = document.querySelectorAll('.star-button');
        starButtons.forEach((button) => {
          // すでにイベントリスナーが設定されているかチェック
          if (!button.hasAttribute('data-sync-listener')) {
            button.setAttribute('data-sync-listener', 'true');

            // クリックイベントを監視
            button.addEventListener('click', () => {
              // クリック後に少し待ってからlocalStorageの変更を同期
              setTimeout(syncFavoritesToStorage, 100);
            });
          }
        });
      }
    }
  });

  // ドキュメント全体を監視
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
}

// 外部のお気に入り情報をlocalStorageにマージする共通関数
function mergeFavoritesToLocalStorage(
  externalFavorites: Favorite[],
  source: string,
  onComplete?: (hasNewFavorites: boolean) => void
): void {
  if (!externalFavorites || !Array.isArray(externalFavorites)) {
    console.error(`Invalid favorites data received from ${source}`);
    if (onComplete) onComplete(false);
    return;
  }

  // localStorageからお気に入り情報を取得
  const localFavorites = getFavoritesFromLocalStorage() || [];

  // localStorageにないが外部ソースにある画像を見つける
  let hasNewFavorites = false;
  const localFavoritesUrls = new Set(localFavorites.map(item => item.url));

  for (const externalItem of externalFavorites) {
    if (!localFavoritesUrls.has(externalItem.url)) {
      // localStorageにない画像をlocalFavoritesに追加
      localFavorites.push(externalItem);
      hasNewFavorites = true;
      console.log(`新しいお気に入りをlocalStorageに追加しました: ${externalItem.url} (${source}から)`);
    }
  }

  // 新しいお気に入りがあれば、localStorageを更新
  if (hasNewFavorites) {
    try {
      // localStorage.setItemをオーバーライドしているため、
      // 通常のsetItemを使用すると自動的にstorage.syncにも同期される
      // ここでは無限ループを防ぐために、元のsetItemメソッドを使用
      originalSetItem.call(localStorage, 'favorites', JSON.stringify(localFavorites));
      console.log(`localStorageのお気に入りを更新しました (${source}から)`);
    } catch (error) {
      console.error(`Failed to update localStorage with favorites from ${source}:`, error);
    }
  } else {
    console.log(`localStorageに追加する新しいお気に入りはありませんでした (${source}から)`);
  }

  if (onComplete) onComplete(hasNewFavorites);
}

// メッセージリスナーを設定
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getFavorites') {
    // localStorageからお気に入り情報を取得
    const localFavorites = getFavoritesFromLocalStorage();

    if (!localFavorites) {
      // お気に入りが見つからない場合
      sendResponse({ success: false, error: 'No favorites found in localStorage.' });
    } else {
      // 取得したお気に入り情報を返す
      sendResponse({ success: true, favorites: localFavorites });
    }

    return true; // 非同期レスポンスのために必要
  } else if (message.action === 'syncFromStorage') {
    // storage.syncからのお気に入り情報を受け取る
    mergeFavoritesToLocalStorage(message.favorites, 'storage.sync');
    return true;
  }
});

// お気に入りの変更を監視する
// 他のタブでのlocalStorageの変更を検知
window.addEventListener('storage', (event) => {
  if (event.key === 'favorites') {
    try {
      const newFavorites = event.newValue ? JSON.parse(event.newValue) : [];

      // 変更があった場合、chrome.storage.syncに保存
      chrome.storage.sync.set({ favorites: newFavorites }, () => {
        console.log('Favorites automatically synced after change in another tab.');
      });
    } catch (error) {
      console.error('Error syncing favorites after change:', error);
    }
  }
});

// localStorageの直接監視（同一ページ内での変更用）
// Proxyを使用してlocalStorageのsetItemメソッドをオーバーライド
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  // 元のsetItemメソッドを呼び出す
  originalSetItem.call(this, key, value);

  // favoritesキーの場合は同期処理を実行
  if (key === 'favorites') {
    console.log('localStorage.setItem detected for favorites');
    syncFavoritesToStorage();
  }
};

// storage.localからlocalStorageへ同期する関数
function syncFromLocalStorage(): void {
  chrome.storage.local.get(['pendingFavorites', 'lastSyncTime'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to get pendingFavorites from storage.local:', chrome.runtime.lastError);
      return;
    }

    const pendingFavorites = result.pendingFavorites;
    const lastSyncTime = result.lastSyncTime;

    if (!pendingFavorites || !Array.isArray(pendingFavorites)) {
      console.log('No pending favorites found in storage.local');
      return;
    }

    console.log(`storage.localから待避されたお気に入り情報を取得しました。最終同期時刻: ${lastSyncTime || '不明'}`);

    // 共通関数を使用してlocalStorageにマージ
    mergeFavoritesToLocalStorage(pendingFavorites, 'storage.local', (hasNewFavorites) => {
      // 同期が完了したら、pendingFavoritesをクリアする
      if (hasNewFavorites) {
        // 注意: 完全に削除せず、最後に同期したお気に入りとして保持
        chrome.storage.local.set({
          lastSyncedFavorites: pendingFavorites,
          pendingFavorites: null,
          lastSyncedTime: new Date().toISOString()
        }, () => {
          console.log('storage.localの待避データをクリアしました');
        });
      }
    });
  });
}

// ページ読み込み時の初期化処理
function initialize(): void {
  // 既存のお気に入りを同期
  syncFavoritesToStorage();

  // storage.localから待避されたお気に入り情報を同期
  syncFromLocalStorage();

  // 星ボタンのクリックを監視
  observeStarButtonClicks();

  console.log('LGTMoon Favorites Sync content script initialized with auto-sync.');
}

// DOMContentLoadedイベントで初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // すでにDOMが読み込まれている場合は即時実行
  initialize();
}
