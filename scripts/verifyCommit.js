const chalk = require('chalk');
const path = require('path');
const { readFileSync } = require('fs');

const msgPath = path.resolve(__dirname, '../.git/COMMIT_EDITMSG');
const msg = readFileSync(msgPath, 'utf-8').trim();

const commitRE =
  /^(revert: )?(feat|fix|docs|style|refactor|perf|test|workflow|ci|chore|types)(\(.+\))?: .{1,50}/;

if (!commitRE.test(msg)) {
  console.log();
  console.error(
    `  ${chalk.bgRed.white(' ERROR ')} ${chalk.red(
      `invalid commit message format.`
    )}\n`
  );
  process.exit(1);
}
