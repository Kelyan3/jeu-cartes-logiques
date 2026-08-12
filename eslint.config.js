import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
	globalIgnores(['dist', 'backend']),
	{
		files: ['**/*.{js,jsx}'],
		ignores: ['scripts/**'],
		extends: [
			js.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			globals: globals.browser,
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
	},
	{
		files: ['scripts/**/*.js'],
		extends: [js.configs.recommended],
		languageOptions: {
			globals: globals.node,
		}
	}
])