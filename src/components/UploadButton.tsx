import React from 'react';

interface UploadButtonProps {
  onUpload: () => void;
}

/**
 * お気に入りをアップロードするボタンコンポーネント
 */
export const UploadButton: React.FC<UploadButtonProps> = ({ onUpload }) => {
  return (
    <button onClick={onUpload}>
      お気に入りをアップロード
    </button>
  );
};
