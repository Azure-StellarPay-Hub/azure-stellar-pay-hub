import { ApiClient } from '@stellar-pay/sdk';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const explorerApi = new ApiClient({ baseUrl: API_URL });
