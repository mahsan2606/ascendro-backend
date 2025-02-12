import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { settingController } from '../../controllers/settings/settingControllers.js';

const router = express.Router();

router.put('/updatemyaccount/:userId', verifyToken, settingController.updateMyAccountByUserId);

router.get('/getmyaccountuserbyid/:userId', verifyToken, settingController.getMyAccountByUserId );

router.put('/changepassword/:userId', verifyToken, settingController.ChangePasswordByUserId);

router.put('/logoutmyaccount/:userId', verifyToken, settingController.logOutMyAccountByUserId);

router.delete('/deletemyaccount/:userId', verifyToken, settingController.deleteMyAccountById);




// router.post('/addinstructor', verifyToken, settingController.createInstructor );

// router.get('/alluserbyroletypeinstructor', verifyToken, settingController.getAllUserByRoleTypeInstructor);

// router.get('/instructor/:instructorId', verifyToken, settingController.getAllInstructorById);


// router.delete('/deleteinstructor/:instructorId', verifyToken, settingController.deleteInstructorById);

// router.get('/getallinstructorbyactivate', verifyToken, settingController.getAllInstructorByActivate);


// // Subscribe User
// router.post('/addsubscribeuser', verifyToken, settingController.createSubscribeUser );

// router.get('/alluserbyroletypeuser', verifyToken, settingController.getAllUserByRoleTypeUser);

// router.get('/subscribeuser/:subscribeuserId', verifyToken, settingController.getAllSubscribeUserById);

// router.put('/updatesubscribeuser/:subscribeuserId', verifyToken, settingController.updateSubscribeUserById);

// router.delete('/deletesubscribeuser/:subscribeuserId', verifyToken, settingController.deleteSubscribeUserById);

// router.get('/getallinstructorbyactivate', verifyToken, settingController.getAllInstructorByActivate);

export default router;
