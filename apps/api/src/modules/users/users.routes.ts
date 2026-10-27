import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { meController, updateMeController } from './users.controller.js';

export const usersRouter: Router = Router();

usersRouter.get('/me', requireAuth, meController);
usersRouter.patch('/me', requireAuth, updateMeController);
