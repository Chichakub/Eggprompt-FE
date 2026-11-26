import { defineConfig, mergeConfig } from 'vite';
import project from '../vite.config.js';
// Actual backend proxy for checking local frontend fixes before deployment.
// No mock server, fixture replies, or database replacements.
export default mergeConfig(project, defineConfig({
  base:'/',
  server:{ host:'127.0.0.1',port:4175,strictPort:true,proxy:{
    '/api':{target:'https://bscit.sit.kmutt.ac.th',changeOrigin:true,secure:true,
      rewrite:path=>`/capstone26/cp26cs1${path}`},
  }},
}));
