import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';

export class AdminController {
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await adminService.getAnalytics();
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const video = await adminService.createVideo(req.body);
      res.status(201).json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const video = await adminService.updateVideo(id, req.body);
      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await adminService.deleteVideo(id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await adminService.updatePlan(id, req.body);
      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
