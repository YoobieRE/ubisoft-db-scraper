import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { store_service, UbisoftDemux } from 'ubisoft-demux';
import type { Message } from 'protobufjs';
import TTLCache from '@isaacs/ttlcache';
import { Account } from '../../common/config';
import { UbiTicketManager } from '../ticket-manager';

export type StoreServiceListenerEvents = {
  revisionProductRemoved: (productId: number, storeDataType?: store_service.StoreType) => void;
  revisionProductUpdate: (
    storeProductUpdate: store_service.StoreProductUpdateInfo,
    storeDataType?: store_service.StoreType
  ) => void;
  debouncedProductUpdate: (productId: number) => void;
};

export interface StoreServiceListenerProps {
  logger: Logger;
  account: Account;
}

export default class StoreServiceListener extends (EventEmitter as new () => TypedEmitter<StoreServiceListenerEvents>) {
  private L: Logger;

  private demux = new UbisoftDemux();

  private ticketManager: UbiTicketManager;

  private productUpdateCache = new TTLCache<number, number>({ ttl: 1000 });

  constructor(props: StoreServiceListenerProps) {
    super();
    this.L = props.logger;
    this.ticketManager = new UbiTicketManager({ account: props.account, logger: this.L });
  }

  public async listenForUpdates(): Promise<void> {
    await this.demux.basicRequest({
      authenticateReq: {
        clientId: 'uplay_pc',
        sendKeepAlive: false,
        token: {
          ubiTicket: await this.ticketManager.getTicket(),
        },
      },
    });

    this.demux.socket.socket?.on('timeout', () => this.L.error('Store socket timeout'));
    this.demux.socket.socket?.on('end', () => this.L.error('Store socket end'));
    this.demux.socket.socket?.on('close', () => this.L.error('Store socket close'));
    const storeConnection = await this.demux.openConnection('store_service');
    storeConnection.on('push', this.onPush.bind(this));
    const initResp = await storeConnection.request({
      request: {
        requestId: 1,
        initializeReq: {
          protoVersion: 7,
          useStaging: false,
        },
      },
    });
    this.L.debug({ initResp }, 'Store connection init response');
    this.L.info('Listening for store updates');
  }

  private onPush(payload: store_service.Downstream & Message): void {
    this.L.info({ payload }, 'store push event');
    const { push } = payload;
    if (!push) return;
    if ('revisionsUpdatedPush' in push && push.revisionsUpdatedPush) {
      const { revisionsUpdatedPush } = push;
      const { storeDataType } = revisionsUpdatedPush; // storeDataType can be undefined (maybe?)
      if (revisionsUpdatedPush.removedProducts?.length) {
        revisionsUpdatedPush.removedProducts.forEach((productId) => {
          this.emit('revisionProductRemoved', productId, storeDataType);
          this.emitGenericProductUpdate(productId);
        });
      }
      if (revisionsUpdatedPush.updateInfo?.length) {
        revisionsUpdatedPush.updateInfo.forEach((productInfo) => {
          this.emit('revisionProductUpdate', productInfo, storeDataType);
          this.emitGenericProductUpdate(productInfo.productId);
        });
      }
    }
  }

  private emitGenericProductUpdate(productId: number): void {
    if (!this.productUpdateCache.has(productId)) {
      this.productUpdateCache.set(productId, productId);
      this.emit('debouncedProductUpdate', productId);
    }
  }

  public async destroy(): Promise<void> {
    return this.demux.destroy();
  }
}
