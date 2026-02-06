export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'ci',
        'build',
        'revert',
      ],
    ],
    'subject-case': [0],
    'body-max-line-length': [0],
  },
};
