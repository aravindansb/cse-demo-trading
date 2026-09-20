import prisma from '../utils/prisma';
import { CSE_CONFIG } from '../config/constants';
import { BadgeService } from './badge.service';

export class TournamentService {
  /**
   * Automatically initializes recurring Weekly and Monthly trading tournaments and Hall of Fame
   */
  public static async ensureDefaultTournaments() {
    const existing = await prisma.tournament.findMany();
    const now = new Date();

    // 1. Check Weekly Sprint
    const weeklyExists = existing.some(t => t.category === 'WEEKLY' && t.status === 'ACTIVE');
    if (!weeklyExists) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(9, 30, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
      endOfWeek.setHours(14, 30, 0, 0);

      const weekly = await prisma.tournament.create({
        data: {
          title: 'Weekly Colombo Sprint Challenge',
          description: 'Compete against retail traders across Sri Lanka in a fast-paced 5-day trading sprint. Highest portfolio return takes the Weekly Crown!',
          category: 'WEEKLY',
          startDate: startOfWeek,
          endDate: endOfWeek,
          status: 'ACTIVE',
          prizeDetails: '🥇 CSE Weekly Champion Gold Badge • Hall of Fame Induction'
        }
      });

      // Auto-enroll demo trader
      const trader = await prisma.user.findFirst({ where: { role: 'USER' } });
      if (trader) {
        await prisma.tournamentParticipant.create({
          data: {
            tournamentId: weekly.id,
            userId: trader.id,
            startingCapital: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL
          }
        }).catch(() => {});
      }
    }

    // 2. Check Monthly Grand Cup
    const monthlyExists = existing.some(t => t.category === 'MONTHLY' && t.status === 'ACTIVE');
    if (!monthlyExists) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 9, 30, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 14, 30, 0);

      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

      const monthly = await prisma.tournament.create({
        data: {
          title: `${monthName} CSE Grand Cup`,
          description: 'The premier institutional trading challenge of the Colombo Stock Exchange. Build the strongest equities portfolio over 30 days of market movement.',
          category: 'MONTHLY',
          startDate: startOfMonth,
          endDate: endOfMonth,
          status: 'ACTIVE',
          prizeDetails: '🏆 Grand Cup Trophy • Featured on Platform Home • Certified Electronic ATS Note'
        }
      });

      // Auto-enroll demo users
      const users = await prisma.user.findMany({ take: 3 });
      for (const u of users) {
        await prisma.tournamentParticipant.create({
          data: {
            tournamentId: monthly.id,
            userId: u.id,
            startingCapital: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL
          }
        }).catch(() => {});
      }
    }

    // 3. Ensure a Completed Tournament for the Hall of Fame
    const completedExists = existing.some(t => t.status === 'COMPLETED');
    if (!completedExists) {
      const pastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 9, 30);
      const pastEnd = new Date(now.getFullYear(), now.getMonth(), 0, 14, 30);

      const pastTourney = await prisma.tournament.create({
        data: {
          title: 'Inaugural Colombo Masters Cup',
          description: 'Historic founding competition of the Colombo Stock Exchange simulated paper trading platform.',
          category: 'CUSTOM',
          startDate: pastStart,
          endDate: pastEnd,
          status: 'COMPLETED',
          prizeDetails: '🏅 Hall of Fame Certificate • Permanent Legacy Podium'
        }
      });

      const users = await prisma.user.findMany({ take: 3 });
      const sampleReturns = [42.85, 28.14, 15.60];
      for (let i = 0; i < users.length; i++) {
        await prisma.tournamentParticipant.create({
          data: {
            tournamentId: pastTourney.id,
            userId: users[i].id,
            startingCapital: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL,
            finalReturn: sampleReturns[i] || 10.0,
            rank: i + 1
          }
        }).catch(() => {});
      }
    }

    console.log('[TournamentService] Synchronized active tournaments and Hall of Fame');
  }

  /**
   * Lists all active, upcoming, and completed tournaments
   */
  public static async getTournaments(currentUserId?: string) {
    const tournaments = await prisma.tournament.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, role: true }
            }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    const active = tournaments.filter(t => t.status === 'ACTIVE');
    const upcoming = tournaments.filter(t => t.status === 'UPCOMING');
    const completed = tournaments.filter(t => t.status === 'COMPLETED');

    const formatTournament = (t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status,
      prizeDetails: t.prizeDetails,
      participantCount: t.participants.length,
      isJoined: currentUserId ? t.participants.some((p: any) => p.userId === currentUserId) : false,
      topParticipants: t.participants.slice(0, 3).map((p: any) => ({
        username: p.user?.username || 'Trader',
        rank: p.rank,
        finalReturn: p.finalReturn
      }))
    });

    return {
      active: active.map(formatTournament),
      upcoming: upcoming.map(formatTournament),
      completed: completed.map(formatTournament)
    };
  }

  /**
   * Joins a user into a tournament
   */
  public static async joinTournament(userId: string, tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status === 'COMPLETED') {
      throw new Error('Cannot join a completed tournament');
    }

    const existing = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId
        }
      }
    });

    if (existing) {
      return { success: true, message: 'Already participating in this tournament' };
    }

    await prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        startingCapital: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL
      }
    });

    return {
      success: true,
      message: `Successfully joined ${tournament.title}! Good luck trader.`
    };
  }

  /**
   * Admin creates a custom tournament
   */
  public static async createTournament(data: {
    title: string;
    description?: string;
    category?: string;
    startDate: string;
    endDate: string;
    prizeDetails?: string;
  }) {
    if (!data.title || !data.startDate || !data.endDate) {
      throw new Error('Title, start date, and end date are required');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end <= start) {
      throw new Error('End date must be after start date');
    }

    const now = new Date();
    const status = now >= start && now <= end ? 'ACTIVE' : now < start ? 'UPCOMING' : 'COMPLETED';

    const tournament = await prisma.tournament.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim(),
        category: data.category || 'CUSTOM',
        startDate: start,
        endDate: end,
        status,
        prizeDetails: data.prizeDetails?.trim()
      }
    });

    return tournament;
  }
}
