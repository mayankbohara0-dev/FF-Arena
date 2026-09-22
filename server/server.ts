import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[FF Arena Backend] REST API Server running at http://localhost:${PORT}`);
  console.log(`[FF Arena Backend] Endpoints available at:`);
  console.log(` - POST http://localhost:${PORT}/tournaments`);
  console.log(` - GET  http://localhost:${PORT}/tournaments/:id`);
  console.log(` - POST http://localhost:${PORT}/tournaments/:id/join`);
  console.log(` - POST http://localhost:${PORT}/tournaments/:id/result`);
  console.log(` - GET  http://localhost:${PORT}/tournaments/:id/leaderboard`);
  console.log(` - POST http://localhost:${PORT}/tournaments/:id/payout`);
});
