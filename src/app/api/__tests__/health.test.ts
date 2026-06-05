import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/route';

describe('GET /api', () => {
  it('returns health check response', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toBe('Hello, world!');
  });
});
