import { Logger } from 'pino';
import path from 'path';
import { CleanOptions, simpleGit, SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import logger from '../common/logger';
import { config } from '../common/config';

export interface ProductGitArchiveProps {
  logger: Logger;
  repoDir?: string;
  remote: string;
  token: string;
}

export default class ProductGitArchive {
  private L: Logger;

  private repoDir = path.join('./cache', 'repos', 'product-db-archive');

  private git: SimpleGit;

  private authedRemote: string;

  constructor(props: ProductGitArchiveProps) {
    this.L = props.logger;
    this.repoDir = props.repoDir ?? this.repoDir;
    this.git = simpleGit();

    const remoteUrl = new URL(props.remote);
    remoteUrl.username = 'YoobieTracker';
    remoteUrl.password = props.token;
    this.authedRemote = remoteUrl.toString();
  }

  public async archive(): Promise<void> {
    try {
      await this.git.cwd(this.repoDir);
      await this.git.clean(CleanOptions.FORCE);
      await this.git.pull();
    } catch {
      await this.git.clone(this.authedRemote, this.repoDir);
    }
    await this.git.addConfig('user.name', 'YoobieTracker', undefined, 'local');
    await this.git.addConfig('user.email', 'yoobietracker@gmail.com', undefined, 'local');
    await fs.outputJSON(path.join(this.repoDir, 'test.json'), { foo: 'bar' });
    await this.git.add('.');
    await this.git.commit('Database update');
    await this.git.push();
  }
}

async function main() {
  const productArchive = new ProductGitArchive({
    logger,
    remote: 'https://github.com/YoobieRE/product-db-archive.git',
    token: config.githubToken,
  });
  await productArchive.archive();
}

main();
