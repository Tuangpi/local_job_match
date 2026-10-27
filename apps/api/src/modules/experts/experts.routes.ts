import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import {
  createProfileController,
  getProfileController,
  updateProfileController,
  replaceSkillsController,
  replaceAreasController,
  replacePortfolioController,
  searchExpertsController,
  getPublicProfileController,
} from './experts.controller.js';

export const expertsRouter: Router = Router();

expertsRouter.get('/', searchExpertsController);
expertsRouter.get('/:expertId', getPublicProfileController);
expertsRouter.post('/me/profile', requireAuth, createProfileController);
expertsRouter.get('/me/profile', requireAuth, getProfileController);
expertsRouter.patch('/me/profile', requireAuth, updateProfileController);
expertsRouter.put('/me/skills', requireAuth, replaceSkillsController);
expertsRouter.put('/me/areas', requireAuth, replaceAreasController);
expertsRouter.put('/me/portfolio', requireAuth, replacePortfolioController);
