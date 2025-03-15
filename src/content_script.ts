// LGTMoonサイトのlocalStorageからお気に入り情報を取得し、
// chrome.storage.syncに保存するためのcontent script

// お気に入り情報をstorage.syncに同期する関数
function syncFavoritesToStorage(): void {
  const localFavoritesStr = localStorage.getItem('favorites');

  if (!localFavoritesStr) {
    console.log('No favorites found in localStorage.');
    return;
  }

  try {
    const localFavorites = JSON.parse(localFavoritesStr);

    // chrome.storage.syncに保存
    chrome.storage.sync.set({ favorites: localFavorites }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to sync favorites to storage:', chrome.runtime.lastError);
      } else {
        console.log('Favorites automatically synced to storage.sync.');
      }
    });
  } catch (error) {
    console.error('Failed to parse favorites from localStorage:', error);
  }
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

// メッセージリスナーを設定
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getFavorites') {
    // localStorageからお気に入り情報を取得
    const localFavoritesStr = localStorage.getItem('favorites');

    if (!localFavoritesStr) {
      // お気に入りが見つからない場合
      sendResponse({ success: false, error: 'No favorites found in localStorage.' });
      return true;
    }

    try {
      // JSON形式をパース
      const localFavorites = JSON.parse(localFavoritesStr);

      // 取得したお気に入り情報を返す
      sendResponse({ success: true, favorites: localFavorites });
    } catch (error) {
      // パースエラーの場合
      sendResponse({ success: false, error: `Failed to parse favorites: ${error}` });
    }

    return true; // 非同期レスポンスのために必要
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

// ページ読み込み時の初期化処理
function initialize(): void {
  // 既存のお気に入りを同期
  syncFavoritesToStorage();

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
