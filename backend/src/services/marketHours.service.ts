import { CSE_CONFIG } from '../config/constants';
import prisma from '../utils/prisma';

export interface MarketStatusInfo {
  isOpen: boolean;
  reason: string;
  isOverridden: boolean;
  overrideStatus?: string;
  sltTime: string;
  formattedTime: string;
  nextSessionText: string;
}

export class MarketHoursService {
  /**
   * Get current Sri Lanka Time (GMT+5:30) components
   */
  public static getSriLankaTimeComponents(customDate?: Date) {
    const target = customDate || new Date();
    
    // Format into Asia/Colombo timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: CSE_CONFIG.TRADING_HOURS.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short'
    });

    const parts = formatter.formatToParts(target);
    const partMap: Record<string, string> = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const hour = parseInt(partMap.hour, 10);
    const minute = parseInt(partMap.minute, 10);
    const second = parseInt(partMap.second, 10);
    const dayName = partMap.weekday; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"

    // Map weekday to 1 (Mon) - 7 (Sun)
    const weekdayMap: Record<string, number> = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 7
    };
    const dayOfWeek = weekdayMap[dayName] || 1;
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 7;

    const currentMinutes = hour * 60 + minute;
    const openMinutes = CSE_CONFIG.TRADING_HOURS.OPEN_HOUR * 60 + CSE_CONFIG.TRADING_HOURS.OPEN_MINUTE; // 9:30 = 570
    const closeMinutes = CSE_CONFIG.TRADING_HOURS.CLOSE_HOUR * 60 + CSE_CONFIG.TRADING_HOURS.CLOSE_MINUTE; // 14:30 = 870

    const isRegularTradingTime = !isWeekend && currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    return {
      hour,
      minute,
      second,
      dayOfWeek,
      dayName,
      isWeekend,
      isRegularTradingTime,
      formattedTime: `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}:${partMap.second} (SLT)`
    };
  }

  /**
   * Determine whether CSE market is open considering live time & admin overrides
   */
  public static async isMarketOpen(customDate?: Date): Promise<MarketStatusInfo> {
    const slt = this.getSriLankaTimeComponents(customDate);

    // Check database for any demo/admin session override
    try {
      const sessionConfig = await prisma.marketSession.findUnique({
        where: { id: 'singleton' }
      });

      if (sessionConfig && sessionConfig.isOverrideActive) {
        const isForceOpen = sessionConfig.overrideStatus === 'OPEN';
        return {
          isOpen: isForceOpen,
          reason: isForceOpen 
            ? 'Manual Override: Simulated Market OPEN (Testing Mode)' 
            : 'Manual Override: Simulated Market CLOSED (Testing Mode)',
          isOverridden: true,
          overrideStatus: sessionConfig.overrideStatus,
          sltTime: slt.formattedTime,
          formattedTime: slt.formattedTime,
          nextSessionText: isForceOpen ? 'Session simulated open' : 'Session simulated closed'
        };
      }
    } catch {
      // If db not initialized yet or in test mode, proceed with clock evaluation
    }

    if (slt.isWeekend) {
      return {
        isOpen: false,
        reason: `CSE is closed for the weekend (${slt.dayName}). Regular sessions: Mon–Fri, 9:30 AM - 2:30 PM SLT.`,
        isOverridden: false,
        sltTime: slt.formattedTime,
        formattedTime: slt.formattedTime,
        nextSessionText: 'Opens Monday 9:30 AM SLT'
      };
    }

    if (slt.isRegularTradingTime) {
      return {
        isOpen: true,
        reason: 'CSE Regular Trading Session is ACTIVE (9:30 AM - 2:30 PM SLT).',
        isOverridden: false,
        sltTime: slt.formattedTime,
        formattedTime: slt.formattedTime,
        nextSessionText: 'Closes today at 2:30 PM SLT'
      };
    }

    const currentMinutes = slt.hour * 60 + slt.minute;
    const openMinutes = 9 * 60 + 30;

    let nextSessionText = 'Opens tomorrow at 9:30 AM SLT';
    if (currentMinutes < openMinutes) {
      nextSessionText = 'Opens today at 9:30 AM SLT';
    }

    return {
      isOpen: false,
      reason: `Outside regular trading hours (Current: ${slt.hour.toString().padStart(2, '0')}:${slt.minute.toString().padStart(2, '0')} SLT). Orders will be QUEUED.`,
      isOverridden: false,
      sltTime: slt.formattedTime,
      formattedTime: slt.formattedTime,
      nextSessionText
    };
  }

  /**
   * Set manual session override (for admin/demo testing)
   */
  public static async setSessionOverride(isOpen: boolean, isOverrideActive: boolean) {
    return prisma.marketSession.upsert({
      where: { id: 'singleton' },
      update: {
        isOverrideActive,
        overrideStatus: isOpen ? 'OPEN' : 'CLOSED'
      },
      create: {
        id: 'singleton',
        isOverrideActive,
        overrideStatus: isOpen ? 'OPEN' : 'CLOSED'
      }
    });
  }

  /**
   * Get current session config
   */
  public static async getSessionConfig() {
    return prisma.marketSession.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        isOverrideActive: false,
        overrideStatus: 'OPEN'
      }
    });
  }
}
