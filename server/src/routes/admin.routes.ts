import { Router } from 'express';
import {
  getDatabaseOverview,
  bulkGenerateData,
  resetAndSeedDatabase,
  runAdminAdvancedQuery,
  comparePerformance,
  runTransactionScenario
} from '../controllers/admin.controller';

const router = Router();

router.get('/overview', getDatabaseOverview);
router.post('/bulk-generate', bulkGenerateData);
router.post('/reset-seed', resetAndSeedDatabase);
router.post('/advanced-query', runAdminAdvancedQuery);
router.post('/benchmark-compare', comparePerformance);
router.post('/transaction-scenario', runTransactionScenario);

export default router;
