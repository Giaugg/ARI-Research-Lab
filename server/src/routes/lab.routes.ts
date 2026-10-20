import { Router } from 'express';
import { 
  runExplain, 
  benchmarkIndexes, 
  benchmarkPagination, 
  benchmarkSearch, 
  scaleData 
} from '../controllers/lab.controller';

const router = Router();
router.post('/explain', runExplain);
router.post('/benchmark/indexes', benchmarkIndexes);
router.get('/benchmark/pagination', benchmarkPagination);
router.get('/benchmark/search', benchmarkSearch);
router.post('/scale', scaleData);

export default router;
