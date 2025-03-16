/**
 * アプリケーション全体のスタイル定義
 */
export const styles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    width: 400px;
    padding: 16px;
    margin: 0;
  }

  h1 {
    font-size: 18px;
    margin-bottom: 15px;
  }

  button {
    background-color: #4285f4;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover {
    background-color: #3367d6;
  }

  .status {
    margin-top: 10px;
    font-size: 14px;
  }

  .storage-usage {
    margin-top: 5px;
    font-size: 14px;
  }

  .favorites-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 16px;
  }

  .favorite-item {
    width: 128px;
    height: auto;
    border-radius: 4px;
    overflow: hidden;
  }

  .favorite-item img {
    width: 100%;
    height: auto;
    display: block;
  }

  .no-favorites {
    margin-top: 16px;
    color: #666;
    font-style: italic;
  }

  .popup-container {
    display: flex;
    flex-direction: column;
  }
`;
