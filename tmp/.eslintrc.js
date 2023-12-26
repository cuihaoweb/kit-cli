module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: ['eslint:recommended'],
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            extends: ['plugin:@typescript-eslint/recommended'],
            parser: '@typescript-eslint/parser',
            plugins: ['@typescript-eslint'],
            rules: {
                '@typescript-eslint/no-var-requires': [0],
                '@typescript-eslint/no-namespace': [0],
                '@typescript-eslint/no-empty-function': [1],
                '@typescript-eslint/no-explicit-any': [1],
                '@typescript-eslint/ban-types': [1]
            }
        },
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['simple-import-sort'],
    rules: {
        'max-len': ['error', {code: 120}], // 允许一行最大的长度

        // 缩进
        indent: [2, 4],

        // 引号
        quotes: [2, 'single'],

        'arrow-parens': ['error', 'as-needed'], // 剪头函数一个参数时不需要圆括号

        // 对象属性引号
        'quote-props': [2, 'as-needed'],

        // 对象最后一项不加,
        'comma-dangle': [2, 'never'],

        // 末尾加;
        semi: ['error', 'always'],

        // 行不允许空格
        'no-trailing-spaces': [2],

        // 大括号空格
        'object-curly-spacing': [2, 'never'],

        'object-curly-newline': [2,  {consistent: true}], // 对象头尾是否换行

        'object-property-newline': [2, {allowAllPropertiesOnSameLine: true}], // 对象属性是否折行，动态适应

        'key-spacing': ['error', {afterColon: true}], // 冒号后留空格

        'comma-spacing': ['error', {after: true}], // 逗号后留空格

        // 文件结尾空行
        'eol-last': [2, 'always'],

        // 空行的数量
        'no-multiple-empty-lines': [2, {max: 2, maxEOF: 1}],

        'no-case-declarations': [0],

        'keyword-spacing': [2],

        'no-shadow': [2], // 重复定义

        'no-redeclare': [2],

        'no-empty': [2, {allowEmptyCatch: true}],

        'no-unused-vars': [2],

        // 针对import排序
        'simple-import-sort/imports': [1, {
            groups: [['^node:', '^[a-zA-Z]', '^@[a-zA-Z]', '^@\\/', '^\\/', '^\\.', '^\\u0000']]
        }],

        'simple-import-sort/exports': [1]
    }
};
