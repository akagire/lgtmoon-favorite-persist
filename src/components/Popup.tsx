import React from 'react';
import { Header } from './Header';
import { UploadButton } from './UploadButton';
import { StatusMessage } from './StatusMessage';
import { StorageUsage } from './StorageUsage';
import { FavoritesList } from './FavoritesList';
import { useFavorites } from '../hooks/useFavorites';

/**
 * ポップアップのメインコンポーネント
 */
export const Popup: React.FC = () => {
  const { favorites, status, storageUsage, uploadLocalFavoritesToSync, setStatusMessage } = useFavorites();

  return (
    <div className="popup-container">
      <Header />

      <UploadButton onUpload={uploadLocalFavoritesToSync} />

      <StatusMessage status={status} />

      <StorageUsage current={storageUsage.current} max={storageUsage.max} />

      <FavoritesList favorites={favorites} onCopy={setStatusMessage} />
    </div>
  );
};
