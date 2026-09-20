import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { CSE_CONFIG } from '../config/constants';

const JWT_SECRET = process.env.JWT_SECRET || 'cse_super_secret_jwt_key_2026_fintech';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  securityPin?: string;
  role?: 'USER' | 'ADMIN';
}

export interface LoginInput {
  identifier: string; // username or email
  password: string;
}

export class AuthService {
  /**
   * Register a new user and automatically initialize Rs. 1,000,000.00 virtual cash wallet
   */
  public static async register(input: RegisterInput) {
    const { username, email, password, securityPin, role = 'USER' } = input;

    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    const trimmedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const rawPin = (securityPin && securityPin.trim()) || '1234';

    if (!/^\d{4}$/.test(rawPin)) {
      throw new Error('Security PIN must be a 4-digit numeric code');
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: trimmedUsername }, { email: normalizedEmail }]
      }
    });

    if (existing) {
      if (existing.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        throw new Error('Username is already taken');
      }
      throw new Error('Email address is already registered');
    }

    // Hash password and PIN
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const pinSalt = await bcrypt.genSalt(10);
    const securityPinHash = await bcrypt.hash(rawPin, pinSalt);

    // Create User and Wallet with 1,000,000.00 LKR virtual capital
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: trimmedUsername,
          email: normalizedEmail,
          passwordHash,
          securityPinHash,
          role: 'USER'
        }
      });

      const newWallet = await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL,
          lockedBalance: 0.0
        }
      });

      return { user: newUser, wallet: newWallet };
    });

    const token = jwt.sign(
      {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        balance: result.wallet.balance
      }
    };
  }

  /**
   * Login user by email or username
   */
  public static async login(input: LoginInput) {
    const { identifier, password } = input;

    if (!identifier || !password) {
      throw new Error('Identifier (username or email) and password are required');
    }

    const trimmedIdentifier = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedIdentifier },
          { email: trimmedIdentifier.toLowerCase() }
        ]
      },
      include: { wallet: true }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.wallet?.balance || CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL
      }
    };
  }

  /**
   * Fetch current authenticated user's profile
   */
  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        wallet: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Automatically initializes default 4-digit PIN '1234' for existing accounts without a PIN
   */
  public static async ensureUserPins() {
    const usersWithoutPin = await prisma.user.findMany({
      where: { securityPinHash: null }
    });

    if (usersWithoutPin.length > 0) {
      const pinSalt = await bcrypt.genSalt(10);
      const defaultPinHash = await bcrypt.hash('1234', pinSalt);
      await prisma.user.updateMany({
        where: { securityPinHash: null },
        data: { securityPinHash: defaultPinHash }
      });
      console.log(`[AuthService] Initialized default Security PIN '1234' for ${usersWithoutPin.length} account(s).`);
    }
  }

  /**
   * Verify Step 1: Username/Email + 4-digit Security PIN
   */
  public static async verifyResetPin(identifier: string, pin: string) {
    if (!identifier || !pin) {
      throw new Error('Username/Email and 4-digit Security PIN are required');
    }

    const cleanId = identifier.trim();
    const cleanPin = pin.trim();

    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error('Security PIN must be a 4-digit numeric code');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanId },
          { email: cleanId.toLowerCase() }
        ]
      }
    });

    if (!user) {
      throw new Error('No registered account found with that username or email');
    }

    let isPinValid = false;
    if (user.securityPinHash) {
      isPinValid = await bcrypt.compare(cleanPin, user.securityPinHash);
    } else if (cleanPin === '1234') {
      // Self-healing legacy accounts
      const pinSalt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('1234', pinSalt);
      await prisma.user.update({
        where: { id: user.id },
        data: { securityPinHash: hash }
      });
      isPinValid = true;
    }

    if (!isPinValid) {
      throw new Error('Invalid 4-digit Security PIN for this account');
    }

    const resetToken = jwt.sign(
      { id: user.id, username: user.username, purpose: 'PASSWORD_RESET' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      success: true,
      username: user.username,
      email: user.email,
      resetToken
    };
  }

  /**
   * Complete Step 2: Reset password using 4-digit PIN verification and auto-login
   */
  public static async resetPasswordWithPin(identifier: string, pin: string, newPassword: string) {
    if (!identifier || !pin || !newPassword) {
      throw new Error('Username/Email, Security PIN, and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const verified = await this.verifyResetPin(identifier, pin);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { username: verified.username },
      data: { passwordHash },
      include: { wallet: true }
    });

    const token = jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        balance: updatedUser.wallet?.balance || CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL
      },
      message: 'Password reset successfully'
    };
  }

  /**
   * Admin Action: Reset user password to default 'Password123!'
   */
  public static async adminResetPassword(targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!user) {
      throw new Error('Target user account not found');
    }

    const defaultPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash }
    });

    return {
      success: true,
      username: user.username,
      newPassword: defaultPassword,
      message: `Password for ${user.username} has been reset to ${defaultPassword}`
    };
  }

  /**
   * Admin Action: Reset user security PIN to default '1234'
   */
  public static async adminResetPin(targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!user) {
      throw new Error('Target user account not found');
    }

    const defaultPin = '1234';
    const pinSalt = await bcrypt.genSalt(10);
    const securityPinHash = await bcrypt.hash(defaultPin, pinSalt);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { securityPinHash }
    });

    return {
      success: true,
      username: user.username,
      newPin: defaultPin,
      message: `Security PIN for ${user.username} has been reset to ${defaultPin}`
    };
  }

  /**
   * Privileged Action: Admin or Super Admin provisions a new Administrator account
   */
  public static async createAdminUser(input: {
    callerUserId: string;
    username: string;
    email: string;
    password: string;
    securityPin?: string;
    role?: 'ADMIN' | 'SUPER_ADMIN';
    authorizingPin: string;
  }) {
    const { callerUserId, username, email, password, securityPin, role = 'ADMIN', authorizingPin } = input;

    // 1. Verify caller administrator and authorizing PIN
    if (!authorizingPin || !/^\d{4}$/.test(authorizingPin.trim())) {
      throw new Error('Authorizing 4-digit Administrator Security PIN is required');
    }

    const caller = await prisma.user.findUnique({
      where: { id: callerUserId }
    });

    if (!caller || (caller.role !== 'ADMIN' && caller.role !== 'SUPER_ADMIN')) {
      throw new Error('Forbidden: Administrator privileges required to provision admins');
    }

    let isCallerPinValid = false;
    const cleanAuthPin = authorizingPin.trim();
    if (caller.securityPinHash) {
      isCallerPinValid = await bcrypt.compare(cleanAuthPin, caller.securityPinHash);
    } else if (cleanAuthPin === '1234') {
      isCallerPinValid = true;
    }

    if (!isCallerPinValid) {
      throw new Error('Invalid Administrator Security PIN');
    }

    // 2. Enforce tiered role creation: Regular ADMIN cannot create SUPER_ADMIN
    const targetRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
    if (targetRole === 'SUPER_ADMIN' && caller.role !== 'SUPER_ADMIN') {
      throw new Error('Forbidden: Regular administrators cannot create Super Admin accounts');
    }

    // 3. Validate new credentials
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    const trimmedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedUsername },
          { email: normalizedEmail }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        throw new Error('Username is already taken');
      }
      throw new Error('Email address is already registered');
    }

    const rawPin = securityPin?.trim() || '1234';
    if (!/^\d{4}$/.test(rawPin)) {
      throw new Error('Security PIN must be a 4-digit numeric code');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const pinSalt = await bcrypt.genSalt(10);
    const securityPinHash = await bcrypt.hash(rawPin, pinSalt);

    // 4. Create User and Wallet with standard 1,000,000 LKR virtual capital
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: trimmedUsername,
          email: normalizedEmail,
          passwordHash,
          securityPinHash,
          role: targetRole
        }
      });

      const newWallet = await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: CSE_CONFIG.INITIAL_VIRTUAL_CAPITAL,
          lockedBalance: 0.0
        }
      });

      return { user: newUser, wallet: newWallet };
    });

    return {
      success: true,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        balance: result.wallet.balance
      },
      message: `${targetRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'} account '${result.user.username}' created successfully.`
    };
  }
}
