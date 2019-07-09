import { builtinModules } from 'module';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import config from 'sapper/config/rollup.js';
import { dependencies } from './package.json';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const onwarn = (warning, original) =>
  (warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) ||
  original(warning);
const dedupe = importee => importee === 'svelte' || importee.startsWith('svelte/');

const svelteOptions = {
  dev,
  // Add preprocessors here...
};

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      svelte({
        ...svelteOptions,
        hydratable: true,
        emitCss: true,
      }),
      resolve({
        browser: true,
        dedupe,
      }),
      commonjs(),

      legacy &&
        babel({
          extensions: ['.js', '.mjs', '.html', '.svelte'],
          runtimeHelpers: true,
          exclude: ['node_modules/@babel/**'],
          presets: [
            [
              '@babel/preset-env',
              {
                targets: '> 0.25%, not dead',
              },
            ],
          ],
          plugins: [
            '@babel/plugin-syntax-dynamic-import',
            [
              '@babel/plugin-transform-runtime',
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],

    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        'process.browser': false,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      svelte({
        ...svelteOptions,
        generate: 'ssr',
      }),
      resolve({
        dedupe,
      }),
      commonjs(),
    ],
    external: (builtinModules || Object.keys(process.binding('natives'))).concat(
      Object.keys(dependencies)
    ),

    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      commonjs(),
      !dev && terser(),
    ],

    onwarn,
  },
};
