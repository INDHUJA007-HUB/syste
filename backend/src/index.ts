import { app } from './app';
import { config } from './config/env';
import { connectDatabase } from './config/prisma';

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      console.log(`
🎬 ===================================================
   StreamSphere Video Streaming & OTT Platform API
   Running in ${config.env.toUpperCase()} mode
   Listening on http://localhost:${config.port}
   Health check: http://localhost:${config.port}/api/health
=================================================== 🍿
      `);
    });

    const shutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('StreamSphere API server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start StreamSphere backend:', error);
    process.exit(1);
  }
}

startServer();
