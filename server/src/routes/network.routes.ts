import { Router } from 'express';
import { 
  getNetworkGraph, 
  getReachability, 
  findPathBetweenResearchers, 
  getRecommendations, 
  detectCycles, 
  getCommunityClusters 
} from '../controllers/network.controller';

const router = Router();
router.get('/graph', getNetworkGraph);
router.get('/reachability/:userId', getReachability);
router.get('/path', findPathBetweenResearchers);
router.get('/recommendations/:userId', getRecommendations);
router.get('/cycles/:userId', detectCycles);
router.get('/communities', getCommunityClusters);

export default router;
