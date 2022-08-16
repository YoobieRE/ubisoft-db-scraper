import { Logger } from 'pino';
import path from 'path';
import { ResetMode, simpleGit, SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import os from 'os';
import groupBy from 'just-group-by';
import { IManifestVersion, ManifestVersion } from '../schema/manifest-version';
import { config } from '../common/config';

export interface ManifestVersionsGitProps {
  logger: Logger;
  repoDir?: string;
  remote: string;
  token: string;
  userName: string;
  userEmail: string;
}

export default class ManifestVersionsGit {
  private L: Logger;

  private repoDir = path.join(os.tmpdir(), 'ubisoft-db-scraper', 'manifest-versions');

  private git: SimpleGit;

  private remote: string;

  private authedRemote: string;

  private userName: string;

  private userEmail: string;

  constructor(props: ManifestVersionsGitProps) {
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

    await this.syncWithRemote();

    // make file updates
    await this.dumpManifestVersions();

    // commit changes
    await this.git.add('./*');
    const status = await this.git.status();
    if (status.isClean()) {
      this.L.info('No product changes to commit');
    } else {
      const { insertions, deletions } = await this.git.diffSummary('--staged');
      this.L.debug({ insertions, deletions }, 'Committing product changes');
      await this.git.commit(`Manifest version update\n${insertions} added, ${deletions} deleted`);
      if (!config.noPush) {
        await this.git.push();
        this.L.info(`Pushed changes to ${this.remote}`);
      }
    }
  }

  private async syncWithRemote(): Promise<void> {
    const files = await fs.readdir(path.join(this.repoDir, 'versions'));
    await Promise.all(
      files.map(async (file) => {
        const productVersions: IManifestVersion[] = await fs.readJSON(
          path.join(this.repoDir, 'versions', file)
        );
        await Promise.all(
          productVersions.map(async (productVersion) => {
            const result = await ManifestVersion.updateOne(
              {
                productId: productVersion.productId,
                manifest: productVersion.manifest,
              },
              productVersion,
              { upsert: true }
            );
            if (result.upsertedCount) {
              this.L.info({ productVersion }, 'Upserted version from remote');
            }
          })
        );
      })
    );
  }

  private async dumpManifestVersions(): Promise<void> {
    const versions = await ManifestVersion.find(
      { manifest: { $regex: /[0-9A-F]+/ } }, // Only non-empty manifests
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }, // Remove unfriendly fields
      { sort: { productId: 1, releaseDate: -1 } }
    );
    this.L.info(`Found ${versions.length} manifest versions in the database`);
    const productGroups = groupBy(versions, (v) => v.productId); // The ES Array.group is not available yet
    // Output to JSON files
    await Promise.all(
      Object.entries(productGroups).map(async ([productId, productVersions]) =>
        fs.outputJSON(
          path.join(this.repoDir, 'versions', `${productId.padStart(5, '0')}.json`),
          productVersions,
          { spaces: 2 }
        )
      )
    );
    this.L.info(`Dumped manifest versions to ${Object.keys(productGroups).length} JSON files`);
  }
}
