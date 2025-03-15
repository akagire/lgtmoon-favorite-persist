// LGTMoonサイトのlocalStorageからお気に入り情報を取得し、
// chrome.storage.syncに保存するためのcontent script

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

// お気に入りの変更を監視する（オプション機能）
// localStorageの変更を検知して自動的に同期することも可能
window.addEventListener('storage', (event) => {
  if (event.key === 'favorites') {
    try {
      const newFavorites = event.newValue ? JSON.parse(event.newValue) : [];

      // 変更があった場合、chrome.storage.syncに保存
      chrome.storage.sync.set({ favorites: newFavorites }, () => {
        console.log('Favorites automatically synced after change.');
      });
    } catch (error) {
      console.error('Error syncing favorites after change:', error);
    }
  }
});

// 初期化メッセージをコンソールに表示
console.log('LGTMoon Favorites Sync content script initialized.');
