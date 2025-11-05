import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const copyTemplatesPlugin = {
  name: 'copy-scripts',
  setup(build) {
    build.onEnd(() => {
      const srcDir = path.resolve(import.meta.dirname, 'src/templates');
      const distDir = path.resolve(import.meta.dirname, 'dist/templates');

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, {recursive: true});
      };

      const files = fs.readdirSync(srcDir).filter(file => file.endsWith('.html'));
      for (const file of files) {
        fs.copyFileSync(path.join(srcDir, file), path.join(distDir, file));
      }
    });
  }
};

esbuild.build({
  entryPoints: ['src/**/*.js'],
  platform: 'node',
  format: 'esm',
  bundle: false,
  outdir: 'dist',
  metafile: false,
  sourcemap: true,
  minify: false,
  plugins: [copyTemplatesPlugin],
});
