import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  // 型のインポートに関するルールを含むスタイリスティックなルールセット
  tseslint.configs.stylistic,
  // より厳格なTypeScriptのルールセット（recommendedのルールを含む）
  tseslint.configs.strict,
  {
    ignores: ['webpack.config.js'],
  },
  // React用のルールセット
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // React v19以降のベストプラクティス
      'react/jsx-uses-react': 'off', // React v19ではimport Reactが不要
      'react/react-in-jsx-scope': 'off', // React v19ではimport Reactが不要
      'react/prop-types': 'off', // TypeScriptを使用するため不要
      'react/jsx-key': 'error', // 配列のマッピングでkeyを必須に
      'react/jsx-no-undef': 'error', // 未定義のコンポーネントを使用禁止
      'react/jsx-pascal-case': 'error', // コンポーネント名はパスカルケースに
      'react/self-closing-comp': 'error', // 子要素のないコンポーネントは自己閉じタグに
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }], // 不要な中括弧を禁止
      // React Hooksのルール
      'react-hooks/rules-of-hooks': 'error', // Hooksのルールを強制
      'react-hooks/exhaustive-deps': 'warn', // useEffectの依存配列の警告
    },
    settings: {
      react: {
        version: 'detect', // Reactのバージョンを自動検出
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // JSXのサポート
        },
      },
    },
  },
);
