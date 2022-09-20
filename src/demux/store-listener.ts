import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { store_service, UbisoftDemux } from 'ubisoft-demux';
import { Account } from '../common/config';
import { UbiTicketManager } from './ticket-manager';

export type StoreListenerEvents = {
  update: (payload: Pick<store_service.Downstream, 'push'>) => void;
};

export interface StoreListenerProps {
  logger: Logger;
  account: Account;
}

export default class StoreListener extends (EventEmitter as new () => TypedEmitter<StoreListenerEvents>) {
  private L: Logger;

  private demux = new UbisoftDemux();

  private ticketManager: UbiTicketManager;

  constructor(props: StoreListenerProps) {
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

    (this.demux.socket as any).socket.on('timeout', () => this.L.error('Store socket timeout'));
    (this.demux.socket as any).socket.on('end', () => this.L.error('Store socket end'));
    (this.demux.socket as any).socket.on('close', () => this.L.error('Store socket end'));
    const storeConnection = await this.demux.openConnection('store_service');
    storeConnection.on('push', (payload) => {
      const payloadObj: Pick<store_service.Downstream, 'push'> = payload.toJSON();
      this.L.info({ payload: payloadObj }, 'store push event');
      this.emit('update', payloadObj);
    });
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

  public async destroy(): Promise<void> {
    return this.demux.destroy();
  }
}
