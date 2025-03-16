import React from 'react';
import type { Favorite } from '../types';
import { FavoriteItem } from './FavoriteItem';

interface FavoritesListProps {
  favorites: Favorite[];
  onCopy?: (message: string) => void;
}

/**
 * お気に入りリストを表示するコンポーネント
 */
export const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onCopy }) => {
  if (favorites.length === 0) {
    return <div className="no-favorites">お気に入りがありません</div>;
  }

  return (
    <div className="favorites-container">
      {favorites.map((favorite, index) => (
        <FavoriteItem
          key={`${favorite.url}-${index}`}
          favorite={favorite}
          index={index}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
};
