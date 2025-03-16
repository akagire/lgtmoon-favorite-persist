import React from 'react';

interface StatusMessageProps {
  status: { message: string; isError: boolean } | null;
}

/**
 * ステータスメッセージを表示するコンポーネント
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
  if (!status) return null;

  return (
    <div className="status" style={{ color: status.isError ? 'red' : 'green' }}>
      {status.message}
    </div>
  );
};
