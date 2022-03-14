import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import colors from 'ansi-colors';
import NightwatchInit from './init';
import { NIGHTWATCH_TITLE } from './constants';

const main = async () => {
  try {
    const argv = process.argv.slice(2);
    const args = argv.filter(arg => !arg.startsWith('-'));
    const options = getArgOptions(argv);

    console.error(NIGHTWATCH_TITLE);

    const rootDir = path.resolve(process.cwd(), args[0] || '');

    if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
      options.push('new-project');
      initializeNodeProject(rootDir);
    }

    const nightwatchInit = new NightwatchInit(rootDir, options);
    await nightwatchInit.run();
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
};

const getArgOptions = (argv: string[]): string[] => {
  const options: string[] = [];

  const alias: {[key: string]: string} = {
    'y': 'yes',
  };

  argv.forEach(arg => {
    if (arg.startsWith('--')) {
      options.push(arg.slice(2));
    } else if (arg.startsWith('-') && alias[arg.slice(1)]) {
      options.push(alias[arg.slice(1)]);
    }
  })

  return options;
}

const initializeNodeProject = (rootDir: string) => {
  if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, {recursive: true});

  console.error(`${colors.yellow('package.json')} not found in the root directory. Initializing a new NPM project..\n`);

  execSync("npm init -y", {
    "stdio": "inherit",
    "cwd": rootDir,
  });
}


main();