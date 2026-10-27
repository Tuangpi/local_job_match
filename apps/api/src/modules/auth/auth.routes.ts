import { Router } from 'express';

import { requestOtpController, verifyOtpController, logoutController } from './auth.controller.js';

export const authRouter: Router = Router();

authRouter.post('/otp/request', requestOtpController);
authRouter.post('/otp/verify', verifyOtpController);
authRouter.post('/logout', logoutController);
