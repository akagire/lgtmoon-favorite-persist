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

// ポップアップが読み込まれたタイミングでボタンを取得し、関数と紐付ける例
document.addEventListener('DOMContentLoaded', () => {
  const uploadButton = document.getElementById('upload-favorites-button');
  if (uploadButton) {
    uploadButton.addEventListener('click', uploadLocalFavoritesToSync);
  }
});
