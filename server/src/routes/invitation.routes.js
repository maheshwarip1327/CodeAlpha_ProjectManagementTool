import express from 'express';
import {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  getPendingUserInvitations
} from '../controllers/invitation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public / token retrieval
router.get('/token/:token', getInvitationByToken);

// Authenticated accept/decline
router.post('/token/:token/accept', authenticate, acceptInvitation);
router.post('/token/:token/decline', authenticate, declineInvitation);
router.get('/my-invites', authenticate, getPendingUserInvitations);

export default router;
