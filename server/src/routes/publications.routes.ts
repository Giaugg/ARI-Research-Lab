import { Router } from 'express';
import { getPublications, getCoauthorshipGraph } from '../controllers/publications.controller';

const router = Router();
router.get('/', getPublications);
router.get('/coauthorship', getCoauthorshipGraph);

export default router;
