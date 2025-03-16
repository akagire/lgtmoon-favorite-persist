import type { Favorite } from '../types';

// Chrome storage.syncの容量制限（バイト単位）
const SYNC_STORAGE_LIMIT_BYTES = 102400; // 100KB

/**
 * 1つのお気に入り項目のおおよそのサイズを計算する関数
 */
export function calculateFavoriteItemSize(favorite: Favorite): number {
  // JSONとして文字列化したサイズを計算
  const jsonString = JSON.stringify(favorite);
  // UTF-16文字列のバイト数（2バイト/文字）+ オーバーヘッド
  return jsonString.length * 2 + 8; // 8バイトは保守的なオーバーヘッド
}

/**
 * 登録可能な最大項目数を計算する関数
 */
export function calculateMaxItems(sampleItem?: Favorite): number {
  // サンプル項目がない場合のデフォルト値
  const defaultItem: Favorite = {
    url: 'https://image.lgtmoon.dev/123456',
    isConverted: true,
  };

  // サンプル項目またはデフォルト項目のサイズを計算
  const itemSize = sampleItem
    ? calculateFavoriteItemSize(sampleItem)
    : calculateFavoriteItemSize(defaultItem);

  // 配列のオーバーヘッドを考慮（保守的に見積もって50バイト）
  const arrayOverhead = 50;

  // 利用可能な容量から最大項目数を計算
  return Math.floor((SYNC_STORAGE_LIMIT_BYTES - arrayOverhead) / itemSize);
}
