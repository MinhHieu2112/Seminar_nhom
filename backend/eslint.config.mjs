// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  {
    // Bỏ qua các thư mục build và cấu hình
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.mjs',
      'prisma.config.mjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // Đổi thành module vì bạn đang dùng NestJS/ESM
      sourceType: 'module', 
      parserOptions: {
        projectService: true,
        // Dùng path.resolve để đảm bảo đường dẫn chuẩn trên mọi hệ điều hành
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      // Tắt bớt các quy tắc quá khắt khe khi bạn đang trong giai đoạn chuyển từ Mock sang Real Data
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off', // Hỗ trợ khi fetch data từ API chưa chuẩn kiểu
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      "prettier/prettier": ["error", { "endOfLine": "auto" }],
      'no-useless-catch': 'off',
    },
  },
);