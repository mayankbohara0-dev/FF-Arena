import { Router } from 'express';
import {
  createTournament,
  getAllTournaments,
  getTournamentById,
  joinTournament,
  submitMatchResult,
  getLeaderboard,
  processPayout,
} from '../controllers/tournamentController';

const router = Router();

// Tournament Management
router.post('/', createTournament);
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);

// Registration & Gameplay
router.post('/:id/join', joinTournament);
router.post('/:id/result', submitMatchResult);
router.get('/:id/leaderboard', getLeaderboard);
router.post('/:id/payout', processPayout);

export default router;
