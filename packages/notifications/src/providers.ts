import { NotificationChannel as NotifChannel, type NotificationType } from '@stellar-pay/types';

export interface NotificationMessage {
  userId?: string;
  channel: NotifChannel;
  type: NotificationType;
  title: string;
  body?: string;
  /** Channel-specific data (email: to, sms: phone, webhook: url…). */
  to?: string;
  payload?: Record<string, unknown>;
}

/** Provider contract per channel. */
export interface ChannelProvider {
  readonly channel: NotifChannel;
  send(message: NotificationMessage): Promise<void>;
}

export class ConsoleChannelProvider implements ChannelProvider {
  readonly channel: NotifChannel;
  constructor(channel: NotifChannel) {
    this.channel = channel;
  }
  async send(message: NotificationMessage): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `[notifications:${this.channel}] ${message.type} — ${message.title}${
        message.body ? `: ${message.body}` : ''
      }`,
    );
  }
}

/** Webhook delivery via fetch (used by the API for merchant webhooks). */
export class WebhookChannelProvider implements ChannelProvider {
  readonly channel = NotifChannel.WEBHOOK;
  constructor(
    private readonly sign?: (payload: string) => string,
    private readonly fetchImpl: typeof fetch = fetch.bind(globalThis),
  ) {}

  async send(message: NotificationMessage): Promise<void> {
    if (!message.to) {
      throw new Error('Webhook notifications require a target URL (message.to)');
    }
    const body = JSON.stringify({
      event: message.type.toLowerCase(),
      title: message.title,
      body: message.body,
      payload: message.payload ?? {},
      timestamp: new Date().toISOString(),
    });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.sign) {
      headers['x-stellar-pay-signature'] = this.sign(body);
    }
    const response = await this.fetchImpl(message.to, { method: 'POST', headers, body });
    if (!response.ok) {
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    }
  }
}

/** SMTP provider placeholder - swap in nodemailer/Resend when configured. */
export class SmtpChannelProvider implements ChannelProvider {
  readonly channel = NotifChannel.EMAIL;
  constructor(
    private readonly config: {
      host: string;
      port: number;
      user?: string;
      password?: string;
      from: string;
    },
  ) {}
  async send(message: NotificationMessage): Promise<void> {
    if (this.config.host === 'smtp.example.com') {
      // eslint-disable-next-line no-console
      console.log(`[notifications:email] would send to ${message.to ?? 'unknown'}: ${message.title}`);
      return;
    }
    // Production: use nodemailer or a service like Resend/SendGrid.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.port === 465,
        auth: this.config.user && this.config.password ? {
          user: this.config.user,
          pass: this.config.password,
        } : undefined,
      });
      await transporter.sendMail({
        from: this.config.from,
        to: message.to,
        subject: message.title,
        text: message.body,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`[notifications:email] fallback: ${message.to ?? 'unknown'}: ${message.title}`);
      if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
        return; // nodemailer not installed - graceful fallback
      }
      throw error;
    }
  }
}

/**
 * Twilio SMS provider.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER env vars.
 */
export class TwilioSmsProvider implements ChannelProvider {
  readonly channel = NotifChannel.SMS;
  constructor(
    private readonly config: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
    },
  ) {}
  async send(message: NotificationMessage): Promise<void> {
    if (!message.to) {
      throw new Error('SMS notifications require a phone number (message.to)');
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      const client = twilio(this.config.accountSid, this.config.authToken);
      await client.messages.create({
        body: `${message.title}${message.body ? ` — ${message.body}` : ''}`.slice(0, 1600),
        from: this.config.fromNumber,
        to: message.to,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
        // eslint-disable-next-line no-console
        console.log(`[notifications:sms] twilio not installed — would send to ${message.to}: ${message.title}`);
        return;
      }
      throw error;
    }
  }
}

/**
 * Firebase Cloud Messaging (FCM) push notification provider.
 * Requires FCM_SERVER_KEY env var.
 */
export class FcmPushProvider implements ChannelProvider {
  readonly channel = NotifChannel.PUSH;
  constructor(
    private readonly serverKey: string,
    private readonly fetchImpl: typeof fetch = fetch.bind(globalThis),
  ) {}
  async send(message: NotificationMessage): Promise<void> {
    if (!message.to) {
      throw new Error('Push notifications require a device token (message.to)');
    }
    const payload = {
      to: message.to,
      notification: {
        title: message.title,
        body: message.body ?? '',
      },
      data: {
        type: message.type,
        payload: message.payload ? JSON.stringify(message.payload) : '{}',
      },
    };
    const response = await this.fetchImpl('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${this.serverKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`FCM push failed with status ${response.status}`);
    }
  }
}

/**
 * Vonage (Nexmo) SMS provider as an alternative to Twilio.
 */
export class VonageSmsProvider implements ChannelProvider {
  readonly channel = NotifChannel.SMS;
  constructor(
    private readonly config: {
      apiKey: string;
      apiSecret: string;
      fromNumber: string;
    },
  ) {}
  async send(message: NotificationMessage): Promise<void> {
    if (!message.to) {
      throw new Error('SMS notifications require a phone number (message.to)');
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const vonage = require('@vonage/server-sdk');
      const client = new vonage.Vonage({
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
      });
      await client.sms.send({
        to: message.to,
        from: this.config.fromNumber,
        text: `${message.title}${message.body ? ` — ${message.body}` : ''}`.slice(0, 1600),
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
        // eslint-disable-next-line no-console
        console.log(`[notifications:sms] vonage not installed — would send to ${message.to}: ${message.title}`);
        return;
      }
      throw error;
    }
  }
}
