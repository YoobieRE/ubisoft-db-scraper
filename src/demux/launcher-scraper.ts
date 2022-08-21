import pRetry from 'p-retry';
import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { UbisoftDemux } from 'ubisoft-demux';
import { LauncherVersion, LauncherVersionDocument } from '../schema/launcher-version';

export type LauncherScraperEvents = {
  launcherUpdate: (newVersion: LauncherVersionDocument) => void;
};

export interface LauncherScraperProps {
  logger: Logger;
  maxRetries?: number;
}

export default class LauncherScraper extends (EventEmitter as new () => TypedEmitter<LauncherScraperEvents>) {
  private L: Logger;

  private retryOptions: pRetry.Options;

  private demux = new UbisoftDemux();

  constructor(props: LauncherScraperProps) {
    super();
    this.L = props.logger;
    this.retryOptions = {
      retries: props.maxRetries ?? 5,
      onFailedAttempt: (err) => this.L.debug(err),
    };
  }

  public async scrapeLauncherVersion(): Promise<void> {
    this.L.info(`Scraping latest launcher version`);
    try {
      const patchResp = await pRetry(async () => {
        this.L.debug('Getting patch info');
        return this.demux.basicRequest({
          getPatchInfoReq: {
            patchTrackId: 'DEFAULT',
            testConfig: false,
            trackType: 0,
          },
        });
      }, this.retryOptions);
      const { getPatchInfoRsp } = patchResp;
      if (!getPatchInfoRsp) {
        this.L.trace({ getPatchInfoRsp }, 'No patch info response. Ignoring...');
        return;
      }
      const { latestVersion } = getPatchInfoRsp;

      // http://static3.cdn.ubi.com/orbit/releases/133.0/patches/
      const urlPath = new URL(getPatchInfoRsp.patchBaseUrl).pathname;
      const patchTrackId = urlPath.split('/')[3];

      if (!patchTrackId) {
        throw new Error(`Could not find patch version in URL: ${getPatchInfoRsp.patchBaseUrl}`);
      }

      const existingVersion = await LauncherVersion.exists({
        latestVersion,
        patchTrackId,
      });

      if (!existingVersion) {
        const newVersion = new LauncherVersion({ latestVersion, patchTrackId });
        this.L.info({ newVersion: newVersion.toObject() }, 'Inserting new launcher version');
        await newVersion.save();
        this.emit('launcherUpdate', newVersion);
      } else {
        this.L.trace('No new launcher version detected');
      }
    } catch (err) {
      this.L.error(err);
    }
  }

  public async destroy(): Promise<void> {
    return this.demux.destroy();
  }
}
