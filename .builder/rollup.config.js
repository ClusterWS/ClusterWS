import fs from 'fs'
import path from 'path'
import uglify from 'rollup-plugin-uglify'
import typescriptPlugin from 'rollup-plugin-typescript2'

const copyPlugin = function (options) {
    return {
        ongenerate() {
            const targDir = path.dirname(options.targ);
            if (!fs.existsSync(targDir)) {
                fs.mkdirSync(targDir)
            }
            if (options.remove) {
                let json = fs.readFileSync(options.src)
                let parsed = JSON.parse(json)
                options.remove.forEach(element => delete parsed[element])
                fs.writeFileSync(options.targ, JSON.stringify(parsed, null, '\t'))
            } else {
                fs.writeFileSync(options.targ, fs.readFileSync(options.src))
            }
        }
    }
}

export default {
    input: './src/index.ts',
    plugins: [
        typescriptPlugin({
            useTsconfigDeclarationDir: true,
            tsconfig: './.builder/tsconfig.json',
            cacheRoot: './.builder/cache'
        }),
        uglify({
            mangle: true,
            output: {
                beautify: true
            }
        }),
        copyPlugin({
            src: './package.json',
            targ: './dist/package.json',
            remove: ['devDependencies', 'scripts']
        }),
        copyPlugin({
            src: './README.md',
            targ: './dist/README.md',
        }),
        copyPlugin({
            src: './LICENSE',
            targ: './dist/LICENSE',
        })
    ],
    external: ['cluster', 'http', 'https', 'uws'],
    output: { format: 'cjs', file: './dist/index.js', name: 'ClusterWS' }
}
