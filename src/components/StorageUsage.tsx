import React from 'react';

interface StorageUsageProps {
  current: number;
  max: number;
}

/**
 * ストレージ使用状況を表示するコンポーネント
 */
export const StorageUsage: React.FC<StorageUsageProps> = ({ current, max }) => {
  // ストレージ使用状況のスタイルを計算
  const getStorageUsageStyle = () => {
    if (current >= max * 0.95) return { color: 'red' };
    if (current >= max * 0.8) return { color: 'orange' };
    return { color: '#666' };
  };

  return (
    <div className="storage-usage" style={getStorageUsageStyle()}>
      {current} / {max} 件
    </div>
  );
};
