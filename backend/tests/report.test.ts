import { ReportService, OFFICIAL_BROKER_INFO } from '../src/services/report.service';

describe('ReportService Unit Tests', () => {
  test('generates valid Sri Lankan CDS account number format', () => {
    const cdsNum = ReportService.getCdsAccountNumber('trader1', '123e4567-e89b-12d3-a456-426614174000');
    expect(cdsNum).toMatch(/^CDS\/COL\/[A-Z0-9]+-N$/);
    expect(cdsNum).toContain('TRAD');
  });

  test('calculates T+2 settlement date skipping weekends', () => {
    // A Wednesday trade should settle on Friday (same week)
    const wednesday = new Date('2026-09-16T10:00:00Z'); // Wednesday
    const wedSettlement = ReportService.calculateSettlementDate(wednesday);
    expect(wedSettlement.getDay()).toBe(5); // Friday

    // A Friday trade should settle on Tuesday (skipping Saturday & Sunday)
    const friday = new Date('2026-09-18T10:00:00Z'); // Friday
    const friSettlement = ReportService.calculateSettlementDate(friday);
    expect(friSettlement.getDay()).toBe(2); // Tuesday
  });

  test('OFFICIAL_BROKER_INFO contains correct Colombo Stock Exchange details', () => {
    expect(OFFICIAL_BROKER_INFO.name).toBe('Colombo Demo Stock Brokers (Pvt) Ltd');
    expect(OFFICIAL_BROKER_INFO.memberOf).toContain('Colombo Stock Exchange');
    expect(OFFICIAL_BROKER_INFO.cdsParticipantCode).toBe('BMS / 007');
  });
});
