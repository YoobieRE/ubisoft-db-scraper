import { Logger } from 'pino';
import * as otp from 'otpauth';
import { CreateSessionSuccessResponse, UbiServicesApi } from 'ubisoft-demux';
import { readRememberMeTicket, writeRememberMeTicket } from '../common/cache';
import { Account } from '../common/config';

export interface UbiTicketManagerProps {
  logger: Logger;
  account: Account;
}

export class UbiTicketManager {
  private L: Logger;

  private account: Account;

  private ubiServices = new UbiServicesApi();

  private cachedTicket?: string;

  private ticketExpiration?: Date;

  private expirationBufferSec = 5;

  constructor(props: UbiTicketManagerProps) {
    this.L = props.logger;
    this.account = props.account;
  }

  public async getTicket() {
    if (
      this.ticketExpiration &&
      Date.now() + this.expirationBufferSec * 1000 < this.ticketExpiration.getTime()
    ) {
      this.L.debug({ expiration: this.ticketExpiration }, 'Using cached ticket');
      return this.cachedTicket;
    }

    const { email, password, totp } = this.account;

    let rememberMeTicket: string | null | undefined = await readRememberMeTicket(email);
    let ticket: string;
    let expiration;

    if (rememberMeTicket) {
      this.L.debug({ email }, 'Logging in with rememberMeTicket');
      // obtain new ticket, update rememberMeTicket
      const loginResp = await this.ubiServices.loginRememberMe(rememberMeTicket);
      ticket = loginResp.ticket;
      rememberMeTicket = loginResp.rememberMeTicket;
      expiration = loginResp.expiration;
    } else {
      this.L.debug({ email }, 'Logging in with email/password');
      if (!email || !password) throw new Error('Email and password are required');

      // Attempt login, check if 2fa is required
      const loginResp = await this.ubiServices.login(email, password);

      if (loginResp.twoFactorAuthenticationTicket) {
        this.L.trace({ email }, '2fa required');
        if (!totp) throw new Error(`TOTP secret is required for ${email}`);
        const totpGen = new otp.TOTP({ secret: otp.Secret.fromBase32(totp) });
        this.L.debug({ email }, 'Logging in with 2fa code');
        const mfaLoginResp = await this.ubiServices.login2fa(
          loginResp.twoFactorAuthenticationTicket,
          totpGen.generate()
        );
        ticket = mfaLoginResp.ticket;
        rememberMeTicket = mfaLoginResp.rememberMeTicket;
        expiration = loginResp.expiration;
      } else {
        ticket = (loginResp as CreateSessionSuccessResponse).ticket;
        rememberMeTicket = (loginResp as CreateSessionSuccessResponse).rememberMeTicket;
        expiration = (loginResp as CreateSessionSuccessResponse).expiration;
      }
    }
    // Cache rememberMeTicket
    if (rememberMeTicket) await writeRememberMeTicket(rememberMeTicket, email);
    this.ticketExpiration = new Date(expiration);
    this.cachedTicket = ticket;
    return ticket;
  }
}
