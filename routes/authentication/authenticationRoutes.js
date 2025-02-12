import express from 'express';
const router = express.Router();
import { authenticationController } from '../../controllers/authentication/authenticationControllers.js';
import { generateToken, verifyToken } from '../../middleware/authMiddleware.js';




// User Registeration

router.post('/users/register', authenticationController.createUser );

router.post('/users/login/sendOtpEmail', authenticationController.verifyUser, authenticationController.sendOtpEmail);

router.post('/users/login', authenticationController.verifyUser, generateToken, authenticationController.loginUser);

router.get('/getloginuserbyid/:userId', verifyToken, authenticationController.getLoginUserById );






router.post('/admin/user/register', authenticationController.registerAdminUser);

router.post('/admin/user/login', authenticationController.verifyUser, generateToken, authenticationController.loginUser);


router.post('/users/forgotPasswordAndUpdateUser', authenticationController.usersForgotPasswordAndUpdateUser );

// Candidate User

router.post('/users/candidateUserCreate', authenticationController.createCandidateUser );

// Company User
router.post('/users/companyUserCreate', authenticationController.createCompanyUser );


// Wizard for Candidate User
router.get('/wizard/users/getCandidateUsersByUserId/:userId', authenticationController.wizardGetCandidateUsersByUserId);

router.put('/wizard/users/updateCandidateUsersById/:userId', authenticationController.wizardUpdateCandidateUsersById);


// Wizard for Company User
router.get('/wizard/users/getCompanyUsersByUserId/:userId', authenticationController.wizardGetCompanyUsersByUserId);

router.put('/wizard/users/updateCompanyUsersById/:userId', authenticationController.wizardUpdateCompanyUsersById);




export default router;
