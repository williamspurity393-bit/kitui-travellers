export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "style", "refactor", "test", "revert", "ci"],
    ],
    "subject-case": [2, "always", "lower-case"],
  },
};
