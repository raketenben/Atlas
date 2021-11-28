const path = require('path');
module.exports = env => {
    console.log(env)
    return {
        mode: env.production ? 'production' : 'development',
        watch: true,
        entry: './src/index.ts',
        module: {
            rules: [{
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }, ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist'),
        },
    }
}