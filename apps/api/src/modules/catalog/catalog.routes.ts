import { Router } from 'express';

import {
  listCategoriesController,
  listCitiesController,
  listTownshipsController,
} from './catalog.controller.js';

export const catalogRouter: Router = Router();

catalogRouter.get('/categories', listCategoriesController);
catalogRouter.get('/locations/cities', listCitiesController);
catalogRouter.get('/locations/townships', listTownshipsController);
