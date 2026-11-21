process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Register TypeScript ESM loader from production dependency `tsx` and start Express server
await import('tsx');
await import('./server.ts');
