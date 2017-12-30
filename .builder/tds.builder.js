var dts = require('dts-bundle')
dts.bundle({
    externals: false,
    referenceExternals: false,
    name: "index",
    main: './src/**/*.d.ts',
    out: '../dist/index.d.ts',
    removeSource: true,
    outputAsModuleFolder: true,
    emitOnIncludedFileNotFound: true
})