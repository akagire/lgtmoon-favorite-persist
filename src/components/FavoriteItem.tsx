import React from 'react';
import type { Favorite } from '../types';

interface FavoriteItemProps {
  favorite: Favorite;
  index: number;
  onCopy?: (message: string) => void;
}

/**
 * お気に入りアイテムを表示するコンポーネント
 */
export const FavoriteItem: React.FC<FavoriteItemProps> = ({ favorite, index, onCopy }) => {
  /**
   * 画像クリック時にMarkdown形式のLGTM文字列をクリップボードにコピーする
   */
  const handleClick = () => {
    const markdownText = `![LGTM](${favorite.url})`;

    // クリップボードにコピー
    navigator.clipboard.writeText(markdownText)
      .then(() => {
        // コピー成功時にコールバックを呼び出す
        if (onCopy) {
          onCopy('Copied!');
        }
      })
      .catch(err => {
        console.error('クリップボードへのコピーに失敗しました:', err);
        if (onCopy) {
          onCopy('コピーに失敗しました');
        }
      });
  };

  return (
    <div key={`${favorite.url}-${index}`} className="favorite-item">
      <img
        src={favorite.url}
        alt="LGTM画像"
        loading="lazy"
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
        title="クリックしてMarkdown形式でコピー"
      />
    </div>
  );
};
