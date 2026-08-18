// @ts-check
import path from 'node:path';
import fs from 'node:fs';
import { execaCommandSync } from 'execa';
import semver from 'semver';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import pkgJson from './package.json' with { type: 'json' };
import manifestJson from './manifest.json' with { type: 'json' };

const __dirname = import.meta.dirname;

/** @type {webpack.RuleSetUseItem[]} */
const cssLoaders = [
    {
        loader: 'style-loader',
        options: {
            insert: ':root',
        },
    },
    {
        loader: 'css-loader',
        options: {
            importLoaders: 1,
        },
    },
    {
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                plugins: ['postcss-import', 'postcss-preset-env', 'cssnano'],
            },
        },
    },
];

export default async (env = {}, argv = {}) => {
    const dev = argv.mode === 'development';
    const devServer = !!env.WEBPACK_SERVE;
    const version = semver.parse(pkgJson.version);
    const repo = new URL(pkgJson.homepage).pathname.replace(/(^\/|\/$)/g, '');
    pkgJson.homepage = pkgJson.homepage.replace(/\/$/, '');
    version.prerelease = version.build = [];

    const type = 'user-script';

    /** @type {webpack.Configuration} */
    const config = {
        mode: dev ? 'development' : 'production',
        module: {
            rules: [
                {
                    include: [path.resolve(__dirname, 'src/assets')],
                    type: 'asset',
                    // 用户脚本是单文件产物，资源必须内联，不能被输出为独立文件
                    parser: {
                        dataUrlCondition: { maxSize: 32 * 1024 },
                    },
                },
                {
                    test: /\.js$/,
                    include: /[/\\]node_modules[/\\]/,
                    exclude: [/[/\\]core-js(-pure)?[/\\]/],
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                sourceType: 'unambiguous',
                                presets: ['@babel/preset-env'],
                                plugins: [['@babel/plugin-transform-runtime', { corejs: 3 }]],
                            },
                        },
                    ],
                },
                {
                    test: /\.ts$/,
                    exclude: /[/\\]node_modules[/\\]/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                sourceType: 'unambiguous',
                                presets: ['@babel/preset-env'],
                                plugins: [['@babel/plugin-transform-runtime', { corejs: 3 }]],
                            },
                        },
                        'ts-loader',
                    ],
                },
                {
                    test: /\.less$/,
                    exclude: /[/\\]node_modules[/\\]/,
                    use: [...cssLoaders, 'less-loader'],
                },
                {
                    test: /\.css$/,
                    use: [...cssLoaders],
                },
                {
                    test: /\.ya?ml$/,
                    type: 'json',
                    use: [{ loader: 'yaml-loader', options: { asJSON: true } }],
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            plugins: [new TsconfigPathsPlugin()],
        },
        plugins: [
            new webpack.NormalModuleReplacementPlugin(/providers\/(.+)$/, (resource) => {
                /** @type {string} */
                let req = resource.request;
                if (req.startsWith('providers/common/') || req.startsWith(`providers/${type}/`)) {
                    return;
                }
                req = req.replace('providers/', `providers/${type}/`);
                resource.request = req;
            }),
            new webpack.DefinePlugin({
                __type: JSON.stringify(type),
            }),
        ],
        performance: false,
        devtool: dev ? 'eval-source-map' : 'inline-source-map',
        optimization: {},
    };

    if (env.analyze) {
        config.plugins.push(
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
            }),
        );
    }

    const outputPath = path.resolve(__dirname, 'releases');
    fs.mkdirSync(outputPath, { recursive: true });

    if (devServer) {
        // 在 e 站使用调试功能需要连接 websocket 到 localhost，必须启用 HTTPS
        // 启用 chrome://flags/#allow-insecure-localhost
        config.devServer = {
            port: 48792,
            allowedHosts: manifestJson.host_permissions.map((h) =>
                h.replace(/^\*:\/\/\*?/, '').replace(/\/\*?$/, ''),
            ),
            liveReload: false,
            hot: false,
            static: {
                directory: outputPath,
            },
            devMiddleware: {
                writeToDisk: true,
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Private-Network': 'true',
            },
            client: {
                webSocketURL: 'ws://localhost:48792/ws',
            },
        };
    }

    config.optimization.minimize = false;
    const currentHEAD = execaCommandSync('git rev-parse HEAD').stdout.trim();
    const fileHost = devServer
        ? `${config.devServer.https ? 'https' : 'http'}://${config.devServer.host || 'localhost'}:${
              config.devServer.port || 8080
          }`
        : `${pkgJson.homepage}/releases/latest/download`;
    /**
     * @param {string} chunkName
     * @param {boolean} meta
     */
    const fileName = (chunkName, meta = false) => {
        const name = chunkName === 'main' ? `${pkgJson.name}` : `${pkgJson.name}.${chunkName}`;
        const ext = meta ? 'meta' : 'user';
        return `${name}.${ext}.js`;
    };

    config.entry = {
        main: [
            path.resolve(__dirname, 'src/user-script/polyfills.ts'),
            path.resolve(__dirname, 'src/user-script/index.ts'),
        ],
    };
    if (dev) {
        config.entry.debug = path.resolve(__dirname, 'src/user-script/debug.ts');
        config.plugins.push(
            new webpack.DefinePlugin({
                userScriptMainSource: JSON.stringify(`${fileHost}/${fileName('main')}`),
            }),
        );
    } else {
        config.devtool = false;
        config.plugins.push(
            new webpack.SourceMapDevToolPlugin({
                publicPath: `${pkgJson.homepage}/releases/download/v${pkgJson.version}/`,
                filename: '[file].map[query]',
            }),
        );
    }
    config.output = {
        path: outputPath,
        publicPath: '/',
        filename: (data) => fileName(data.chunk.name),
    };
    config.plugins.push(
        new webpack.BannerPlugin({
            banner: ({ filename, chunk }) => {
                if (!filename.endsWith('.user.js')) {
                    return '';
                }
                const meta = {
                    name: pkgJson.displayName || pkgJson.name,
                    version: dev ? `${pkgJson.version}+build.${currentHEAD}` : pkgJson.version,
                    author: pkgJson.author,
                    description: pkgJson.description,
                    icon: `https://raw.githubusercontent.com/${repo}/master/src/assets/logo.svg`,
                    license: pkgJson.license,
                    namespace: pkgJson.homepage,
                    homepage: pkgJson.homepage,
                    supportURL: pkgJson.bugs,
                    updateURL: `${fileHost}/${fileName(chunk.name, true)}`,
                    downloadURL: `${fileHost}/${fileName(chunk.name)}`,
                    compatible: ['firefox >= 60', 'edge >= 16', 'chrome >= 61', 'safari >= 11', 'opera >= 48'],
                    match: manifestJson.content_scripts[0].matches,
                    exclude: manifestJson.content_scripts[0].exclude_matches,
                    'run-at': 'document-start',
                    grant: [
                        'GM_deleteValue',
                        'GM_listValues',
                        'GM_setValue',
                        'GM_getValue',
                        'GM_addValueChangeListener',
                        'GM_removeValueChangeListener',
                        'GM_openInTab',
                    ],
                };
                let metaString = '// ==UserScript==\n';
                for (const key of Object.keys(meta)) {
                    let value = meta[key];
                    if (Array.isArray(value)) {
                        value.forEach((v) => {
                            metaString += `// @${key.padEnd(12)} ${v}\n`;
                        });
                    } else {
                        metaString += `// @${key.padEnd(12)} ${value}\n`;
                    }
                }
                metaString += '// ==/UserScript==\n';
                fs.writeFileSync(path.resolve(outputPath, fileName(chunk.name, true)), metaString, 'utf-8');
                return metaString;
            },
            raw: true,
            entryOnly: true,
        }),
    );

    return config;
};
