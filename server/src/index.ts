import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import networkRoutes from './routes/network.routes';
import postsRoutes from './routes/posts.routes';
import commentsRoutes from './routes/comments.routes';
import groupsRoutes from './routes/groups.routes';
import publicationsRoutes from './routes/publications.routes';
import labRoutes from './routes/lab.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/lab', labRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Academic Research Network & PostgreSQL Recursive Optimization Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[ARI Server] Academic Network API running on http://localhost:${PORT}`);
});

export default app;
