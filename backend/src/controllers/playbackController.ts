import { Request, Response, NextFunction } from 'express';
import { playbackService } from '../services/playbackService';

export class PlaybackController {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const session = await playbackService.createPlaybackSession(
        req.user!.userId,
        videoId,
        ip,
        userAgent
      );

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { positionSeconds, durationSeconds, completed, clientTimestamp } = req.body;

      const progress = await playbackService.updateProgress(
        id,
        req.user!.userId,
        positionSeconds,
        durationSeconds,
        completed,
        clientTimestamp
      );


      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  async getContinueWatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await playbackService.getContinueWatching(req.user!.userId);
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async getResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId } = req.params;
      const progress = await playbackService.getResume(req.user!.userId, videoId);
      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const playbackController = new PlaybackController();
