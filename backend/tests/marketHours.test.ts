import { MarketHoursService } from '../src/services/marketHours.service';

describe('CSE MarketHoursService (Asia/Colombo Timezone UTC+5:30)', () => {
  it('should identify active market during regular weekday trading hours (e.g. Wednesday 11:00 AM SLT)', async () => {
    // 2026-09-16 is a Wednesday. 11:00 AM SLT (UTC+5:30) is 05:30 AM UTC
    const wednesdayMarketHourUtc = new Date('2026-09-16T05:30:00Z');
    const status = await MarketHoursService.isMarketOpen(wednesdayMarketHourUtc);

    expect(status.isOpen).toBe(true);
    expect(status.reason).toContain('Regular Trading Session is ACTIVE');
  });

  it('should identify closed market outside regular trading hours (e.g. Wednesday 7:00 PM SLT)', async () => {
    // 2026-09-16 19:00 SLT is 13:30 UTC
    const wednesdayEveningUtc = new Date('2026-09-16T13:30:00Z');
    const status = await MarketHoursService.isMarketOpen(wednesdayEveningUtc);

    expect(status.isOpen).toBe(false);
    expect(status.reason).toContain('Outside regular trading hours');
  });

  it('should identify closed market during weekends (e.g. Saturday 11:00 AM SLT)', async () => {
    // 2026-09-19 is a Saturday
    const saturdayUtc = new Date('2026-09-19T05:30:00Z');
    const status = await MarketHoursService.isMarketOpen(saturdayUtc);

    expect(status.isOpen).toBe(false);
    expect(status.reason).toContain('weekend');
  });

  it('should correctly format Sri Lanka Time string', () => {
    const utcDate = new Date('2026-09-16T04:00:00Z'); // 9:30 AM SLT
    const slt = MarketHoursService.getSriLankaTimeComponents(utcDate);

    expect(slt.hour).toBe(9);
    expect(slt.minute).toBe(30);
    expect(slt.isRegularTradingTime).toBe(true);
  });
});
