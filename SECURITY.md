# Security Model

> **Documentation Version**: November 2025  
> **Project Status**: Production-ready, active development  
> **If anything seems outdated**: Check Git history or ask maintainers

## Authentication & Authorization

- **JWT-based authentication** via Supabase Auth
- **Role-based access control (RBAC)** via `user_roles` table
- **Security definer function** `has_role()` prevents RLS recursion
- **Admin endpoints** require both valid JWT and admin role verification

## Row-Level Security (RLS)

All tables have RLS enabled with strict policies:

- **Consumers**: Own orders, cart, credits, delivery history
- **Farmers**: Own products, farm profiles, earnings
- **Drivers**: Assigned batches only (address reveal on delivery)
- **Admins**: Full access via `has_role(auth.uid(), 'admin')`

## Address Privacy Model

**Progressive disclosure** prevents premature customer address exposure:

- **Database level**: `driver_batch_stops_secure` view masks addresses until `address_visible_at`
- **Application level**: Addresses revealed only after delivery starts
- **Progressive unlock**: Next 3 stops become visible as deliveries complete

## Admin-Only Endpoints

Sensitive functions require admin JWT verification:

- `/optimize-delivery-batches` - Batch creation
- `/process-payouts` - Financial operations
- `/award-credits` - Credit system management
- Returns **403 Forbidden** for non-admin users

## Rate Limiting

Per-user rate limits enforced at edge function level:

- **Checkout**: 10 requests / 15 minutes
- **Payouts**: 1 request / 5 minutes
- **Push notifications**: 20 requests / hour
- **General**: 100 requests / minute

## CORS Protection

Sensitive admin endpoints restricted to allowed origins:

- Production: `https://lovable.app`
- Development: `http://localhost:5173`, `http://localhost:3000`

Public endpoints (webhooks, product listings) allow wildcard CORS.

## Webhook Security

- **Stripe signature verification** on all webhook events
- **Idempotency keys** stored in `stripe_webhook_events` table
- **Duplicate event prevention** via event ID tracking

## Secrets Management

All secrets stored in Supabase Vault (never client-exposed):

- Stripe API keys (live mode)
- Tax encryption key (AES-256-GCM)
- Third-party API tokens (Resend, Mapbox)

## Data Encryption

- **Tax IDs encrypted at rest** using AES-256-GCM with PBKDF2 key derivation
- **TLS 1.3** for data in transit
- **Supabase managed** key rotation and storage

## Compliance

- **GDPR**: User data deletion via Supabase Auth cascade
- **PCI DSS**: Stripe handles card data (never touches our servers)
- **Data retention**: 7 years for tax documents (IRS requirement)

## Security Contact

For security concerns, please contact:benjaminrk@blueharvests.net
