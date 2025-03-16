import React from 'react';
import type { Favorite } from '../types';

interface FavoriteItemProps {
  favorite: Favorite;
  index: number;
}

/**
 * お気に入りアイテムを表示するコンポーネント
 */
export const FavoriteItem: React.FC<FavoriteItemProps> = ({ favorite, index }) => {
  return (
    <div key={`${favorite.url}-${index}`} className="favorite-item">
      <img src={favorite.url} alt="LGTM画像" loading="lazy" />
    </div>
  );
};
