import { Logger } from 'pino';
import path from 'path';
import { ResetMode, simpleGit, SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import os from 'os';
import { IProduct, Product } from '../schema/product';
import { config } from '../common/config';

export interface ProductGitArchiveProps {
  logger: Logger;
  repoDir?: string;
  remote: string;
  token: string;
  userName: string;
  userEmail: string;
}

export default class ProductGitArchive {
  private L: Logger;

  private repoDir = path.join(os.tmpdir(), 'ubisoft-db-scraper', 'product-db-archive');

  private git: SimpleGit;

  private remote: string;

  private authedRemote: string;

  private userName: string;

  private userEmail: string;

  constructor(props: ProductGitArchiveProps) {
    this.L = props.logger;
    this.userName = props.userName;
    this.userEmail = props.userEmail;
    this.repoDir = props.repoDir ?? this.repoDir;
    this.git = simpleGit();

    this.remote = props.remote;
    const remoteUrl = new URL(this.remote);
    remoteUrl.username = props.token;
    this.authedRemote = remoteUrl.toString();
  }

  public async archive(): Promise<void> {
    try {
      await this.git.cwd(this.repoDir);
      // repo already exists
      await this.git.fetch();
      await this.git.reset(ResetMode.HARD, ['origin/HEAD']);
    } catch {
      // repo doesn't exist
      await this.git.clone(this.authedRemote, this.repoDir);
      await this.git.cwd(this.repoDir);
    }
    // ensure config is set
    await this.git.addConfig('user.name', this.userName, undefined, 'local');
    await this.git.addConfig('user.email', this.userEmail, undefined, 'local');

    // make file updates
    const products = await this.dumpProducts();
    await fs.outputJSON(path.join(this.repoDir, 'products.json'), products, { spaces: 2 });

    // commit changes
    await this.git.add('./*');
    const status = await this.git.status();
    if (status.isClean()) {
      this.L.info('No product changes to commit');
    } else {
      this.L.debug('Committing product changes');
      await this.git.commit('Database update');
      if (config.noPush) {
        await this.git.push();
        this.L.info(`Pushed changes to ${this.remote}`);
      }
    }
  }

  private async dumpProducts(): Promise<IProduct[]> {
    const products = await Product.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 },
      { sort: { _id: 1 } }
    );
    this.L.info(`Dumped ${products.length} products from the database`);
    return products.map((p) => p.toJSON());
  }
}
