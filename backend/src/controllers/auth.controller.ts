import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  public static async register(req: Request, res: Response) {
    try {
      const { username, email, password, securityPin } = req.body;
      // Strictly enforce role: 'USER' for public self-registration
      const result = await AuthService.register({ username, email, password, securityPin, role: 'USER' });
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Registration failed' });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login({ identifier, password });
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Authentication failed' });
    }
  }

  public static async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const profile = await AuthService.getProfile(req.user.id);
      return res.status(200).json(profile);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Profile not found' });
    }
  }

  public static async verifyResetPin(req: Request, res: Response) {
    try {
      const { identifier, pin } = req.body;
      const result = await AuthService.verifyResetPin(identifier, pin);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Verification failed' });
    }
  }

  public static async resetPasswordWithPin(req: Request, res: Response) {
    try {
      const { identifier, pin, newPassword } = req.body;
      const result = await AuthService.resetPasswordWithPin(identifier, pin, newPassword);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Password reset failed' });
    }
  }

  public static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to change password' });
    }
  }

  public static async changePin(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { currentCredential, newPin } = req.body;
      const result = await AuthService.changePin(req.user.id, currentCredential, newPin);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to change Security PIN' });
    }
  }

  public static async adminResetPassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId is required' });
      }
      const result = await AuthService.adminResetPassword(targetUserId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Admin password reset failed' });
    }
  }

  public static async adminResetPin(req: AuthRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId is required' });
      }
      const result = await AuthService.adminResetPin(targetUserId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Admin PIN reset failed' });
    }
  }

  public static async createAdminUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Administrator access required' });
      }

      const { username, email, password, securityPin, role, authorizingPin } = req.body;
      const result = await AuthService.createAdminUser({
        callerUserId: req.user.id,
        username,
        email,
        password,
        securityPin,
        role,
        authorizingPin
      });

      return res.status(201).json(result);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to create administrator account';
      const statusCode = errMsg.includes('Forbidden') ? 403 : 400;
      return res.status(statusCode).json({ error: errMsg });
    }
  }
}
