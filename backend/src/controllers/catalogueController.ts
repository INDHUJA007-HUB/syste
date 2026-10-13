import { Request, Response, NextFunction } from 'express';
import { catalogueService } from '../services/catalogueService';

export class CatalogueController {
  async listVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string | undefined;
      const genre = req.query.genre as string | undefined;
      const tier = req.query.tier as any;
      const sortBy = (req.query.sortBy as any) || 'trending';

      const userId = req.user?.userId;

      const result = await catalogueService.listVideos(
        { page, limit, search, genre, tier, sortBy },
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const video = await catalogueService.getVideoById(id, userId);

      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGenres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const genres = await catalogueService.getGenres();
      res.status(200).json({
        success: true,
        data: genres,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const catalogueController = new CatalogueController();
