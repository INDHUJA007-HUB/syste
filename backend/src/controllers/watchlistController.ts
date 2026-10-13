import { Request, Response, NextFunction } from 'express';
import { watchlistService } from '../services/watchlistService';

export class WatchlistController {
  async getWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const watchlist = await watchlistService.getWatchlist(req.user!.userId);
      res.status(200).json({
        success: true,
        data: watchlist,
      });
    } catch (error) {
      next(error);
    }
  }

  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId } = req.params;
      const result = await watchlistService.addToWatchlist(req.user!.userId, videoId);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId } = req.params;
      const result = await watchlistService.removeFromWatchlist(req.user!.userId, videoId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const watchlistController = new WatchlistController();
