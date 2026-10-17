import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// plugin-react enables the automatic JSX runtime, so components don't import React.
export default defineConfig({ plugins: [react()] });
