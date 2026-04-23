import express from 'express';
import { userRouter } from './routes/users';
import { taskRouter } from './routes/tasks';
import { categoryRouter } from './routes/categories';
import { assignmentRouter } from './routes/assignments';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  const { heapUsed, heapTotal } = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    heapUsed,
    heapTotal,
    timestamp: new Date().toISOString(),
  });
});

// ルーター登録（この下に追加）
app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/categories', categoryRouter);
app.use('/api', assignmentRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
