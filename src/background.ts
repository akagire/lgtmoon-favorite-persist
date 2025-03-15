// LGTMoon Favorites Sync のバックグラウンドスクリプト

// 拡張機能がインストールされたときの処理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('LGTMoon Favorites Sync がインストールされました。');

    // 初期設定などがあれば、ここで行う
  } else if (details.reason === 'update') {
    console.log(`LGTMoon Favorites Sync がバージョン ${chrome.runtime.getManifest().version} に更新されました。`);
  }
});

// storage.sync の変更を監視する（オプション機能）
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.favorites) {
    console.log('お気に入りが更新されました:', changes.favorites.newValue);
    // 必要に応じて追加の処理を行う
  }
});

console.log('LGTMoon Favorites Sync バックグラウンドスクリプトが初期化されました。');
