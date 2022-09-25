import PQueue from 'p-queue';
import { UbisoftDemux, ownership_service, store_service } from 'ubisoft-demux';
import { DemuxConnection } from 'ubisoft-demux/dist/src/demux-connection';
import { Logger } from 'pino';
import { Account } from '../common/config';
import { UbiTicketManager } from './ticket-manager';

export interface DemuxUnit {
  demux: UbisoftDemux;
  limiter: PQueue;
}

export interface ConnectionUnit extends DemuxUnit {
  ownershipConnection: DemuxConnection<ownership_service.Upstream, ownership_service.Downstream>;
  storeConnection: DemuxConnection<store_service.Upstream, store_service.Downstream>;
}

export interface DemuxPoolProps {
  accounts: Account[];
  logger: Logger;
  throttleTime?: number;
  demuxTimeout?: number;
}

export default class DemuxPool {
  private accounts: Account[];

  private demuxPool?: DemuxUnit[];

  private L: Logger;

  private throttleTime = 100;

  private demuxTimeout = 1000;

  constructor(props: DemuxPoolProps) {
    this.accounts = props.accounts;
    this.L = props.logger;
    this.throttleTime = props.throttleTime ?? this.throttleTime;
    this.demuxTimeout = props.demuxTimeout ?? this.demuxTimeout;
  }

  public async getDemuxPool(): Promise<DemuxUnit[]> {
    if (this.demuxPool) return this.demuxPool;

    this.demuxPool = await Promise.all(
      this.accounts.map(async ({ email, password, totp }) => {
        const ticketManager = new UbiTicketManager({
          account: { email, password, totp },
          logger: this.L,
        });

        const demux = new UbisoftDemux({ timeout: 1000 });
        this.L.debug({ email }, 'Authenticating with Demux');

        const authResponse = await demux.basicRequest({
          authenticateReq: {
            clientId: 'uplay_pc',
            sendKeepAlive: false,
            token: {
              ubiTicket: await ticketManager.getTicket(),
            },
          },
        });

        if (!authResponse.authenticateRsp?.success) throw new Error('Not able to authenticate');
        this.L.info({ email }, 'Successfully logged in and authenticated');
        const limiter = new PQueue({ concurrency: 1, interval: this.throttleTime, intervalCap: 1 });
        return {
          demux,
          limiter,
        };
      })
    );
    return this.demuxPool;
  }

  public async getConnectionPool(): Promise<ConnectionUnit[]> {
    const demuxPool = await this.getDemuxPool();
    return Promise.all(
      demuxPool.map(async ({ demux, limiter }, index) => {
        this.L.trace({ accountIndex: index }, 'Opening ownership connection');
        const ownershipConnection = await demux.openConnection('ownership_service');

        this.L.debug({ accountIndex: index }, 'Initializing ownership connection');
        await ownershipConnection.request({
          request: {
            requestId: 1,
            initializeReq: {
              getAssociations: false,
              protoVersion: 7,
              useStaging: false,
            },
          },
        });

        const storeConnection = await demux.openConnection('store_service');

        this.L.debug({ accountIndex: index }, 'Initializing store connection');
        await storeConnection.request({
          request: {
            requestId: 1,
            initializeReq: {
              protoVersion: 7,
              useStaging: false,
            },
          },
        });

        return {
          demux,
          ownershipConnection,
          storeConnection,
          limiter,
        };
      })
    );
  }

  public async destroy(): Promise<void> {
    if (this.demuxPool) {
      await Promise.all(this.demuxPool.map((demuxUnit) => demuxUnit.demux.destroy()));
    }
    this.demuxPool = undefined;
  }
}
