module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    // 'plugin:react/recommended', // (If using React)
    "plugin:prettier/recommended", // <--- Make sure this is LAST
  ],
  rules: {
    // Custom rules...
  },
};
