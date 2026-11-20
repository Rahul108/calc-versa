import { BadRequestException } from '@nestjs/common';
import { RecordAnalyticsService } from './record-analytics.service';

describe('RecordAnalyticsService', () => {
  it('reads a valid uiConfig.analytics mapping and drops malformed fields', () => {
    expect(
      RecordAnalyticsService.fieldMappingFrom({
        analytics: { amountField: 'amount', memberField: "x'; drop table", categoryField: 42 },
      }),
    ).toEqual({ amountField: 'amount', memberField: undefined, categoryField: undefined });
    expect(RecordAnalyticsService.fieldMappingFrom(null)).toEqual({});
  });

  it('passes parameters (never interpolates) and rejects inverted ranges', async () => {
    const query = jest.fn().mockResolvedValue([{ total_runs: 0 }]);
    const svc = new RecordAnalyticsService({ query } as any);
    await svc.aggregate('app', '2026-01-01', undefined, { amountField: 'amount' });
    expect(query.mock.calls[0][1]).toEqual(['app', '2026-01-01', null, 'amount', null, null]);
    await expect(svc.aggregate('app', '2026-02-01', '2026-01-01', {})).rejects.toThrow(BadRequestException);
  });
});
