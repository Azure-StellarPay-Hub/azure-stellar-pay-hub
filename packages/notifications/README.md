# @stellar-pay/notifications

Multi-channel notification dispatch for the platform:

- `ChannelProvider` interface with `ConsoleChannelProvider` (dev),
  `SmtpChannelProvider` (email placeholder), `WebhookChannelProvider` (HMAC
  signed POSTs for merchant webhooks)
- `NotificationService` – templated dispatch per `NotificationType`, tolerant
  `dispatchAll` for fan-out

The API wires these into the `NotificationsModule` and persists in-app
notifications to the database while delivering email/SMS/push/webhook copies
through the configured providers.
