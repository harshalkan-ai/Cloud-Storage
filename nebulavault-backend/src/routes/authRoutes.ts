import { Router } from 'express';
import { signUp, signIn } from '../controllers/authController';

const router = Router();

router.post('/register', signUp); // When user hits /register, run signUp()
router.post('/login', signIn);    // When user hits /login, run signIn()

export default router;