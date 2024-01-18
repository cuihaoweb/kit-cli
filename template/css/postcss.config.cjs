module.exports = {
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        require('postcss-pxtorem')({
            rootValue: 16, // 指定转换倍率，我现在设置这个表示1rem=16px;
            propList: ['*'] // 属性列表，表示你要把哪些css属性的px转换成rem，这个*表示所有
            // minPixelValue: 1, // 需要转换的最小值，一般1px像素不转换，以上才转换
            // unitPrecision: 6, // 转换成rem单位的小数点后的保留位数
            // selectorBalckList: ['van'], // 匹配不被转换为rem的选择器
            // replace: true, // 替换包含rem的规则，而不是添加回退
            // mediaQuery: false // 允许在媒体查询中转换px
        })
    ]
};
