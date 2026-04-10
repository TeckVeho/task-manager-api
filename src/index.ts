import express from 'express';
import { userRouter } from './routes/users';
import { taskRouter } from './routes/tasks';
import { categoryRouter } from './routes/categories';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ルーター登録（この下に追加）
app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/categories', categoryRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
