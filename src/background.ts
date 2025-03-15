// LGTMoon Favorites Sync のバックグラウンドスクリプト

import { Favorite } from './types';

// 指定したURLパターンに一致するLGTMoonのタブにメッセージを送信する関数
function sendMessageToLgtmoonTabs(
  urlPattern: string,
  favorites: Favorite[],
  domainLabel: string = ''
): void {
  chrome.tabs.query({ url: urlPattern }, (tabs) => {
    if (tabs.length > 0) {
      // 見つかったすべてのLGTMoonタブにメッセージを送信
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'syncFromStorage',
            favorites: favorites
          });
        }
      });
      const label = domainLabel ? `(${domainLabel})` : '';
      console.log(`${tabs.length}個のLGTMoonタブ${label}に同期メッセージを送信しました。`);
    }
  });
}

// 拡張機能がインストールされたときの処理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('LGTMoon Favorites Sync がインストールされました。');

    // 初期設定などがあれば、ここで行う
  } else if (details.reason === 'update') {
    console.log(`LGTMoon Favorites Sync がバージョン ${chrome.runtime.getManifest().version} に更新されました。`);
  }
});

// storage.sync の変更を監視する
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.favorites) {
    const newFavorites = changes.favorites.newValue as Favorite[];
    console.log('お気に入りが更新されました:', newFavorites);

    // storage.syncの情報をstorage.localに待避
    chrome.storage.local.set(
      {
        pendingFavorites: newFavorites,
        lastSyncTime: new Date().toISOString()
      },
      () => {
        console.log('お気に入り情報をstorage.localに待避しました。');
      }
    );

    // 各ドメインのLGTMoonタブにメッセージを送信
    sendMessageToLgtmoonTabs('*://*.lgtmoon.dev/*', newFavorites);
    sendMessageToLgtmoonTabs('*://*.lgtmoon.herokuapp.com/*', newFavorites, 'Heroku');
  }
});

console.log('LGTMoon Favorites Sync バックグラウンドスクリプトが初期化されました。');
