import React from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './components/Popup';
import { styles } from './styles';

// DOMが読み込まれたらReactコンポーネントをレンダリング
document.addEventListener('DOMContentLoaded', () => {
  // スタイルを適用
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  // Reactコンポーネントをレンダリング
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<Popup />);
  }
});
