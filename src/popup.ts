function showStatus(message: string, isError = false): void {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? 'red' : 'green';
  }
}

function uploadLocalFavoritesToSync(): void {
  // localStorage に 'favorites' が存在するかチェック
  const localFavoritesStr = localStorage.getItem('favorites');
  if (!localFavoritesStr) {
    console.log('No favorites found in localStorage.');
    showStatus('お気に入りが見つかりませんでした。', true);
    return;
  }

  let localFavorites;
  try {
    // JSON形式をパース
    localFavorites = JSON.parse(localFavoritesStr);
  } catch (error) {
    console.error('Failed to parse favorites from localStorage:', error);
    showStatus('お気に入りの解析に失敗しました。', true);
    return;
  }

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
}

// ポップアップが読み込まれたタイミングでボタンを取得し、関数と紐付ける例
document.addEventListener('DOMContentLoaded', () => {
  const uploadButton = document.getElementById('upload-favorites-button');
  if (uploadButton) {
    uploadButton.addEventListener('click', uploadLocalFavoritesToSync);
  }
});
