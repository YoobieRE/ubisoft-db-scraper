import PQueue from 'p-queue';
import {
  UbisoftDemux,
  ownership_service,
  UbiServicesApi,
  CreateSessionSuccessResponse,
} from 'ubisoft-demux';
import { DemuxConnection } from 'ubisoft-demux/dist/src/demux-connection';
import * as otp from 'otpauth';
import { Logger } from 'pino';
import { readRememberMeTicket, writeRememberMeTicket } from '../common/cache';
import { Account } from '../common/config';

export interface DemuxUnit {
  demux: UbisoftDemux;
  limiter: PQueue;
}

export interface OwnershipUnit extends DemuxUnit {
  ownershipConnection: DemuxConnection<ownership_service.Upstream, ownership_service.Downstream>;
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

    const ubiServices = new UbiServicesApi();
    this.demuxPool = await Promise.all(
      this.accounts.map(async ({ email, password, totp }) => {
        // TODO: switch to UbiTicketManager
        let rememberMeTicket: string | null | undefined = await readRememberMeTicket(email);
        let ticket: string;

        if (rememberMeTicket) {
          this.L.debug({ email }, 'Logging in with rememberMeTicket');
          // obtain new ticket, update rememberMeTicket
          const loginResp = await ubiServices.loginRememberMe(rememberMeTicket);
          ticket = loginResp.ticket;
          rememberMeTicket = loginResp.rememberMeTicket;
        } else {
          this.L.debug({ email }, 'Logging in with email/password');
          if (!email || !password) throw new Error('Email and password are required');

          // Attempt login, check if 2fa is required
          const loginResp = await ubiServices.login(email, password);

          if (loginResp.twoFactorAuthenticationTicket) {
            this.L.trace({ email }, '2fa required');
            if (!totp) throw new Error(`TOTP secret is required for ${email}`);
            const totpGen = new otp.TOTP({ secret: otp.Secret.fromBase32(totp) });
            this.L.debug({ email }, 'Logging in with 2fa code');
            const mfaLoginResp = await ubiServices.login2fa(
              loginResp.twoFactorAuthenticationTicket,
              totpGen.generate()
            );
            ticket = mfaLoginResp.ticket;
            rememberMeTicket = mfaLoginResp.rememberMeTicket;
          } else {
            ticket = (loginResp as CreateSessionSuccessResponse).ticket;
            rememberMeTicket = (loginResp as CreateSessionSuccessResponse).rememberMeTicket;
          }
        }
        // Cache rememberMeTicket
        if (rememberMeTicket) await writeRememberMeTicket(rememberMeTicket, email);

        const demux = new UbisoftDemux({ timeout: 1000 });
        this.L.debug({ email }, 'Authenticating with Demux');

        const authResponse = await demux.basicRequest({
          authenticateReq: {
            clientId: 'uplay_pc',
            sendKeepAlive: false,
            token: {
              ubiTicket: ticket,
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

  public async getOwnershipPool(): Promise<OwnershipUnit[]> {
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

        return {
          demux,
          ownershipConnection,
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
