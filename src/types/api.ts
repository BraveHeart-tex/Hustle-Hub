import type { components } from '@/generated/openapi';

export type ApiErrorEnvelope = components['schemas']['ApiError'];
export type ApiErrorType = ApiErrorEnvelope['error']['type'];
