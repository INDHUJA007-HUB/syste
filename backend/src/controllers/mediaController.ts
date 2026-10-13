import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { verifySignedMediaToken } from '../utils/mediaSigning';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';


export class MediaController {
  async streamMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId } = req.params;
      const token = (req.query.token as string) || (req.headers['x-playback-token'] as string);

      if (!token) {
        throw new AppError('Media access denied. Missing authorization playback token.', 401, 'UNAUTHORIZED');
      }

      // Verify token
      const verification = verifySignedMediaToken(token);
      if (!verification.valid || !verification.payload) {
        throw new AppError(`Media access denied: ${verification.error || 'Invalid token'}`, 403, 'FORBIDDEN');
      }

      if (verification.payload.videoId !== videoId) {
        throw new AppError('Media token does not match requested title.', 403, 'FORBIDDEN');
      }

      // Check session
      const session = await prisma.playbackSession.findUnique({
        where: { id: verification.payload.sessionId },
      });

      if (!session || !session.isActive || new Date() > session.expiresAt) {
        throw new AppError('Media playback session has expired.', 401, 'SESSION_EXPIRED');
      }

      // Fetch video
      const video = await prisma.video.findUnique({
        where: { id: videoId },
      });

      if (!video) {
        throw new AppError('Video media not found.', 404, 'NOT_FOUND');
      }

      const format = req.query.format as string;
      const targetUrl = format === 'hls' && video.hlsManifestUrl ? video.hlsManifestUrl : video.videoUrl;

      // Disable caching of signed playback streams
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Check if target is a local media file
      const localFilePath = targetUrl.startsWith('/media/')
        ? path.join(__dirname, '../../public', targetUrl)
        : null;

      if (localFilePath && fs.existsSync(localFilePath)) {
        const stat = fs.statSync(localFilePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = end - start + 1;
          const fileStream = fs.createReadStream(localFilePath, { start, end });

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
          });
          fileStream.pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
          });
          fs.createReadStream(localFilePath).pipe(res);
        }
        return;
      }

      // External stream redirect
      res.redirect(302, targetUrl);
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();

