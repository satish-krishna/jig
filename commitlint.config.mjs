// Conventional Commits enforcement for Jig. Scopes mirror the repo areas so a
// commit message names where it lands. Enforced by the commit-msg git hook
// (see .githooks/commit-msg) and in CI — a malformed message is rejected.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['transport', 'forms', 'contracts', 'api', 'shell', 'ui', 'catalog', 'tools', 'repo'],
    ],
    'scope-empty': [2, 'never'],
  },
};
