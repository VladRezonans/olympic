module.exports = {
    "env": {
        "browser": false,
        "node": true,
    },
    "rules": {
        "mocha/no-exclusive-tests": "error",
        "semi": [2, "always"],
        "no-param-reassign": [0],
        "no-shadow": [0],
        "class-methods-use-this": [0],
        "prefer-destructuring": [0],
        "no-underscore-dangle": [0],
        "func-names": [0],
        "import/no-extraneous-dependencies": ["error", {
            "devDependencies": true,
            "optionalDependencies": false,
            "peerDependencies": false
        }],
    }
};
