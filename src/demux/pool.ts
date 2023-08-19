import PQueue from 'p-queue';
import { UbisoftDemux, ServiceConnections } from 'ubisoft-demux';
import { Logger } from 'pino';
import pRetry from 'p-retry';
import { Account } from '../common/config';
import { UbiTicketManager } from './ticket-manager';

export interface DemuxUnit {
  demux: UbisoftDemux;
  limiter: PQueue;
  connections: Partial<ServiceConnections>;
}

export interface DemuxPoolProps {
  accounts: Account[];
  logger: Logger;
  throttleTime?: number;
  demuxTimeout?: number;
  maxRetries?: number;
}

export default class DemuxPool {
  private currentIndex = 0;

  private accounts: Account[];

  private demuxPool: DemuxUnit[] = [];

  private L: Logger;

  private throttleTime = 100;

  private demuxTimeout = 1000;

  private retryOptions: pRetry.Options;

  constructor(props: DemuxPoolProps) {
    this.accounts = props.accounts;
    this.L = props.logger;
    this.throttleTime = props.throttleTime ?? this.throttleTime;
    this.demuxTimeout = props.demuxTimeout ?? this.demuxTimeout;
    this.retryOptions = {
      retries: props.maxRetries ?? 5,
      onFailedAttempt: (err) => this.L.debug(err),
    };
  }

  private async getDemuxUnit(account: Account): Promise<DemuxUnit> {
    const { email, password, totp } = account;
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
      connections: {},
    };
  }

  public async getDemuxPool(): Promise<DemuxUnit[]> {
    if (this.demuxPool) return this.demuxPool;

    this.demuxPool = await Promise.all(this.accounts.map(this.getDemuxUnit));
    return this.demuxPool;
  }

  public async getConnection(
    serviceName: 'ownership_service'
  ): Promise<ServiceConnections['ownership_service']>;

  public async getConnection(
    serviceName: 'store_service'
  ): Promise<ServiceConnections['store_service']>;

  /**
   * Selects an account from the pool, starts a connection if one doesn't exist,
   * and makes a retryable and queued request
   */
  public async getConnection(
    serviceName: keyof ServiceConnections
  ): Promise<ServiceConnections[keyof ServiceConnections]> {
    this.currentIndex = (this.currentIndex + 1) % this.accounts.length;
    if (!this.demuxPool[this.currentIndex]) {
      this.demuxPool[this.currentIndex] = await this.getDemuxUnit(this.accounts[this.currentIndex]);
    }
    const demuxUnit = this.demuxPool[this.currentIndex];

    if (serviceName === 'store_service') {
      if (demuxUnit.connections.store_service) return demuxUnit.connections.store_service;
      this.L.trace({ accountIndex: this.currentIndex }, 'Opening store connection');
      const storeConnection = await demuxUnit.demux.openConnection('store_service');
      // TODO: is bind required?
      storeConnection.request = this.limitRetryFunction(
        storeConnection.request,
        demuxUnit.limiter
      ).bind(this);

      this.L.debug({ accountIndex: this.currentIndex }, 'Initializing store connection');
      await storeConnection.request({
        request: {
          requestId: 1,
          initializeReq: {
            protoVersion: 7,
            useStaging: false,
          },
        },
      });
      demuxUnit.connections.store_service = storeConnection;
      return storeConnection;
    }

    if (serviceName === 'ownership_service') {
      this.L.trace({ accountIndex: this.currentIndex }, 'Opening ownership connection');
      const ownershipConnection = await demuxUnit.demux.openConnection('ownership_service');
      // TODO: is bind required?
      ownershipConnection.request = this.limitRetryFunction(
        ownershipConnection.request,
        demuxUnit.limiter
      ).bind(this);

      this.L.debug({ accountIndex: this.currentIndex }, 'Initializing ownership connection');
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
      return ownershipConnection;
    }

    throw new Error(`getConnection not yet implemented for serviceName ${serviceName}`);
  }

  public async destroy(): Promise<void> {
    if (this.demuxPool) {
      await Promise.all(this.demuxPool.map((demuxUnit) => demuxUnit.demux.destroy()));
    }
    this.demuxPool = [];
  }

  private limitRetryFunction<T extends Array<unknown>, U>(
    fn: (...args: T) => Promise<U>,
    limiter: PQueue
  ) {
    return (...args: T) => pRetry(async () => limiter.add(() => fn(...args)), this.retryOptions);
  }
}
