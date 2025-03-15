import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  // 型のインポートに関するルールを含むスタイリスティックなルールセット
  tseslint.configs.stylistic,
  // より厳格なTypeScriptのルールセット（recommendedのルールを含む）
  tseslint.configs.strict,
  {
    ignores: ['webpack.config.js'],
  },
);
