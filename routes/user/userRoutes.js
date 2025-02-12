import express from 'express';
import { generateToken, verifyToken } from '../../middleware/authMiddleware.js';
import { userController } from '../../controllers/user/userControllers.js';


const router = express.Router();


// Electoral Users
router.post('/electoral/registerElectoral', verifyToken, userController.registerElectoral );

// All Electoral List
router.get('/electoral/getAllElectoralList', verifyToken, userController.getAllElectoralList);

router.get('/electoral/getElectoralUsersByUserId/:userId', verifyToken, userController.getElectoralUsersByUserId);

router.put('/electoral/updateElectoralUsersById/:userId', verifyToken, userController.updateElectoralUsersById);


// Spin Electoral Data
router.get('/electoral/getAllElectoralUsersData', verifyToken, userController.getAllElectoralUsersData);

// Fan Spin 
router.get('/electoral/spin/getAllElectoralFanSpin', verifyToken, userController.getAllElectoralFanSpin);

// Iron Spin 
router.get('/electoral/spin/getAllElectoralIronSpin', verifyToken, userController.getAllElectoralIronSpin);

// LED TV Spin 
router.get('/electoral/spin/getAllElectoralLedTVSpin', verifyToken, userController.getAllElectoralLedTVSpin);

// Saree Spin 
router.get('/electoral/spin/getAllElectoralSareeSpin', verifyToken, userController.getAllElectoralSareeSpin);


// Winner List Data
router.get('/electoral/winner/getAllWinnerElectoralUsersData', verifyToken, userController.getAllWinnerElectoralUsersData);

// Winner Reward Delivered Status Update
router.put('/electoral/winner/updateWinnerStatusElectoralUsersById/:userId', verifyToken, userController.updateWinnerStatusElectoralUsersById);

// Winner Reward Delivered Data
router.get('/electoral/winner/getAllWinnerRewardDeliveredElectoralUsersData', verifyToken, userController.getAllWinnerRewardDeliveredElectoralUsersData);









// Company User
router.post('/companyCreate', verifyToken, userController.createCompanyUser );

router.get('/getAllListCompany', verifyToken, userController.getAllCompanyList);

router.get('/getAllUsersListByUserType', verifyToken, userController.getAllUserListsByUserType);

router.get('/getAllUsersByUserType', userController.getAllUsersByUserType);

router.get('/getCompanyUsersByUserId/:userId', verifyToken, userController.getCompanyUsersByUserId);

router.put('/updateCompanyUsersById/:userId', verifyToken, userController.updateCompanyUsersById);

// Search Candidate from Company
router.get('/getAllSearchCandidateByCompanyUser', verifyToken, userController.getAllSearchCandidateByCompanyUser);

// Applied Candidate from Company
router.get('/company/getAllAppliedCandidateByCompanyUser', verifyToken, userController.getAllAppliedCandidateByCompanyUser);

router.get('/admin/getAllAppliedCandidateByAdmin', verifyToken, userController.getAllAppliedCandidateByAdmin);

// Add TO Cart Candidate from Company
router.post('/candidate/addToCartCandidateByCompanyUser', verifyToken, userController.addToCartCandidateByCompanyUser );

// Add TO Cart Multiple Candidate from Company
router.post('/candidate/addToCartMultipleCandidateByCompanyUser', verifyToken, userController.addToCartMultipleCandidateByCompanyUser );


// Verified Candidate Lists from Company
router.get('/company/getAllVerifiedCandidateList', verifyToken, userController.getAllVerifiedCandidateListByCompany );


// Shortlisted Candidate Lists from Company
router.get('/company/getAllShortListedCandidateListByCompanyUser', verifyToken, userController.getAllShortListedCandidateListByCompanyUser );

// Shortlisted Candidate Lists from Admin
router.get('/admin/getAllShortListedCandidateListByAdminUser', verifyToken, userController.getAllShortListedCandidateListByAdminUser );





// Candidate User
router.post('/candidateCreate', verifyToken, userController.createCandidateUser );

router.get('/getAllListCandidate', verifyToken, userController.getAllCandidateList);

router.get('/getAllUsersListByUserType', verifyToken, userController.getAllUserListsByUserType);

router.get('/getCandidateUsersByUserId/:userId', verifyToken, userController.getCandidateUsersByUserId);

router.put('/updateCandidateUsersById/:userId', verifyToken, userController.updateCandidateUsersById);

// Boost Profile Candidate
router.post('/candidate/boostProfileByCandidate', verifyToken, userController.boostProfileByCandidateUser );

router.get('/candidate/getBoostProfileByCandidate', verifyToken, userController.getBoostProfileByCandidateUser );

// Boost Profile All Candidates By Admin
router.get('/candidate/getBoostProfileListsAllCandidate', verifyToken, userController.getBoostProfileListsAllCandidateUser );

// All Company list For Candidate Panel
router.get('/candidate/getAllCompanyUserList', verifyToken, userController.getAllCompanyUserList);




// Payments Section 

// Admin Access Both Candidate and Company
router.get('/candidate/payments/getAllCandidatePaymentHistory', verifyToken, userController.getAllCandidateUserPaymentHistory );

router.get('/company/payments/getAllCompanyPaymentHistory', verifyToken, userController.getAllCompanyUserPaymentHistory );


// Candidate Wise Payment History Data Fetch
router.get('/candidate/payments/getAllCandidatePaymentHistoryByCandidateUser', verifyToken, userController.getAllCandidatePaymentHistoryByCandidateUser );

// Company Payment History By Company User Id
router.get('/company/payments/getAllCompanyPaymentHistoryByCompanyUser', verifyToken, userController.getAllCompanyPaymentHistoryByCompanyUser );


//  User Delete
router.delete('/deleteUserByUserId/:userId', verifyToken, userController.deleteUserByUserId);


// Verified Candidate Lists from Admin
router.get('/candidate/getAllVerifiedCandidateListByAdmin', verifyToken, userController.getAllVerifiedCandidateListByCompany );



//  Applied Candidate Delete By Company
router.delete('/deleteAppliedCandidateById/:userId', verifyToken, userController.deleteAppliedCandidateById);





// Export Excel, CSV File 

// COmpany Export Data Via Admin
router.get('/export/company/getAllCompanyDataExportByAdmin', verifyToken, userController.getAllCompanyDataExportByAdmin );

// Candidate Export Data Via Admin
router.get('/export/candidate/getAllCandidateDataExportByAdmin', verifyToken, userController.getAllCandidateDataExportByAdmin );


// User Update Certified Status
// For Update Certified Status BY Id to Fetch Data
router.put('/updateCertifiedStatusById/:userId', verifyToken, userController.updateCertifiedStatusById);


// For Update Activation Status BY Id to Fetch Data
router.put('/updateActivationStatusById/:userId', verifyToken, userController.updateActivationStatusById);








// router.get('/alluserbyroletypeinstructor', verifyToken, userController.getAllUserByRoleTypeInstructor);

// router.get('/instructor/:instructorId', verifyToken, userController.getAllInstructorById);

// router.put('/updateinstructor/:instructorId', verifyToken, userController.updateInstructorById);

// router.delete('/deleteinstructor/:instructorId', verifyToken, userController.deleteInstructorById);

// router.get('/getallinstructorbyactivate', verifyToken, userController.getAllInstructorByActivate);








router.post('/subscribeuserlogin', userController.verifySubscribeUser, generateToken, userController.loginSubscribeUser);

// Instructor User
router.post('/addinstructor', verifyToken, userController.createInstructor );

router.get('/alluserbyroletypeinstructor', verifyToken, userController.getAllUserByRoleTypeInstructor);

router.get('/instructor/:instructorId', verifyToken, userController.getAllInstructorById);

router.put('/updateinstructor/:instructorId', verifyToken, userController.updateInstructorById);

router.delete('/deleteinstructor/:instructorId', verifyToken, userController.deleteInstructorById);

router.get('/getallinstructorbyactivate', verifyToken, userController.getAllInstructorByActivate);


// Subscribe User
router.post('/addsubscribeuser', verifyToken, userController.createSubscribeUser );

router.get('/alluserbyroletypeuser', verifyToken, userController.getAllUserByRoleTypeUser);

router.get('/subscribeuser/:subscribeuserId', verifyToken, userController.getAllSubscribeUserById);

router.put('/updatesubscribeuser/:subscribeuserId', verifyToken, userController.updateSubscribeUserById);

router.delete('/deletesubscribeuser/:subscribeuserId', verifyToken, userController.deleteSubscribeUserById);

// router.get('/getallinstructorbyactivate', verifyToken, userController.getAllInstructorByActivate);

export default router;
