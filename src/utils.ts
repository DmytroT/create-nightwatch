import fs from 'fs';
import path from 'path';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import {DownloaderHelper} from 'node-downloader-helper';
import Logger from './logger';

/**
 * Strips out all control characters from a string
 * However, excludes newline and carriage return
 *
 * @param {string} input String to remove invisible chars from
 * @returns {string} Initial input string but without invisible chars
 */
export const stripControlChars = (input: string): string => {
  return (
    input &&
    input.replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g,
      ''
    )
  );
};

export const symbols = () => {
  let ok = String.fromCharCode(10004);
  let fail = String.fromCharCode(10006);

  if (process.platform === 'win32') {
    ok = '\u221A';
    fail = '\u00D7';
  }

  return {
    ok: ok,
    fail: fail
  };
};

export const isNodeProject = (rootDir: string): boolean => fs.existsSync(path.join(rootDir, 'package.json'));

export const copy = (src: string, dest: string, excludeDir: string[] = [], overwrite = false): void => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    return copyDir(src, dest, excludeDir);
  }

  if (fs.existsSync(dest) && !overwrite) {
    return;
  }

  fs.copyFileSync(src, dest);
};

const copyDir = (srcDir: string, destDir: string, excludeDir: string[]): void => {
  if (excludeDir.some((dir) => srcDir.endsWith(dir))) {
    return;
  }

  fs.mkdirSync(destDir, {recursive: true});
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile, excludeDir);
  }
};

export const rmDirSync = (dirPath: string) => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        rmDirSync(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
};

export const downloadWithProgressBar = async (url: string, dest: string) => {
  const progressBar = new cliProgress.Bar({
    format: ' [{bar}] {percentage}% | ETA: {eta}s'
  }, cliProgress.Presets.shades_classic);

  const downloader = new DownloaderHelper(url, dest, {override: {skip: true}});

  downloader.on('start', () => progressBar.start(100, 0));
  downloader.on('progress', (stats) => {
    progressBar.update(stats.progress);
  });
  downloader.on('skip', (skipInfo) => {
    progressBar.stop();
    Logger.info(`Download skipped! File already present at: '${skipInfo.filePath}'\n`);
  });
  downloader.on('end', (downloadInfo) => {
    progressBar.stop();
    Logger.info(`${colors.green('Success!')} File downloaded at: '${downloadInfo.filePath}'\n`);
  });
  downloader.on('error', () => progressBar.stop());

  return await downloader.start();
};
