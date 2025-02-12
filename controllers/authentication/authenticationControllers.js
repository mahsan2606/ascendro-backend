import { generatePassword, generateUUID } from '../../middleware/uuidGenerator.js';
import { dbConnection, dbQueryAttributes } from '../../config/db_connection.js';
import bcrypt from 'bcrypt';
import { sendEmailForOTPCredentials, sendEmailRegistrationCredentials } from '../../middleware/nodemailer.js';

const authenticationController = {
  // Candidate User Create
  createUser: async (req, res, next) => {
    const response = req.body;
    console.log("responsessss body data", response)

    // Check for missing fields
    if (!response.fullName || !response.password || !response.email) {
      return res.status(409).json({ message: "All fields are required", error: 'All fields are required' });
    }

    try {
      let userBody = {};
      const userId = generateUUID('UsER')
      console.log('userId', userId)
      userBody.id = userId
      userBody.firstName = response.firstName
      userBody.lastName = response.lastName
      userBody.mobileNumber = response.mobileNumber
      userBody.password = response.password
      userBody.email = response.email

      const query = 'INSERT INTO users SET ?';
      const results = await dbQueryAttributes(query, userBody);
      console.log('resultss', results)
      if (results.affectedRows > 0) {
        res.status(201).json({ status: 201, message: 'You have Successfully Registered.' });
      }

    } catch (error) {
      console.log('errorfjdslkjfaklsjrweiorjfslkd', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  verifyUser: async (req, res, next) => {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      return res.status(400).json({ status: 400, message: 'Email and password are required', error: 'Email and password are required' });
    }

    try {
      // Find the user by username email
      const query = 'SELECT * FROM users WHERE email = ?';
      const values = [email]

      const userData = await dbQueryAttributes(query, values);

      if (userData.length == 0) {
        return res.status(404).json({ status: 404, message: 'User not found', error: 'User not found' });
      }

      // Compare the provided password with the stored hashed password
      // const isMatch = await bcrypt.compare(password, userData[0].password);

      if (password !== userData[0].password) {
        return res.status(402).json({ status: 402, error: "Incorrect password", message: "Incorrect password" });
      }

      // if (userData[0].activation_status === 'Deactivate') {
      //   return res.status(402).json({ status: 402, error: "Account Deactivate", message: "Please contact admin to activate account" });
      // }

      // if (user_type !== userData[0].user_type) {
      //   return res.status(402).json({ status: 402, error: "Incorrect Panel", message: "Please login to correct panel" });
      // }
      // Respond with success message
      req.user = userData[0]
      next()

    } catch (error) {
      // Handle errors
      console.error('Error verify in user:', error);
      res.status(error.status || 500).json({ status: error.status, error: error.error || 'Internal Server Error', message: error.message });
    }
  },
  loginUser: async (req, res, next) => {
    const user = req.user
    const token = req.token
    console.log('userss', user)
    try {

      // Find the user by username email
      const query = 'SELECT * FROM users WHERE id = ?';

      const userData = await dbQueryAttributes(query, [user.id]);

      console.log("userdataass", userData)

      if (userData.length == 0) {
        return res.status(404).json({ status: 404, message: 'User not found', error: 'User not found' });
      }

      return res.status(201).json({ status: 201, message: 'You have successfully Logged in..', userId: userData[0].id, data: userData[0], token: token });

    } catch (error) {
      // Handle errors
      console.error('Error logging in user:', error);
      res.status(error.status || 500).json({ status: error.status, error: error.error || 'Internal Server Error', message: error.message });
    }
  },

  sendOtpEmail: async (req, res, next) => {
    const user = req.user
    console.log('userss', user)
    try {

      // Find the user by username email
      const query = 'SELECT * FROM users WHERE id = ?';

      const userData = await dbQueryAttributes(query, [user.id]);

      console.log("userdataass", userData)

      if (userData.length == 0) {
        return res.status(404).json({ status: 404, message: 'User not found', error: 'User not found' });
      }

      const email = "belamkarsatish@gmail.com";
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP as a string
      const subject = 'Your Code is : ' + otp
      
      const responseMail = await sendEmailForOTPCredentials(email, otp, subject, userData[0].email, userData[0].fullName)

      console.log('responsemeial done ', responseMail)

      if(responseMail){

        return res.status(201).json({ status: 201, message: 'Successfully Generated One Time Password (OTP). on email is: ' + email, otp: otp, data: userData[0] });

      }


    } catch (error) {
      // Handle errors
      console.error('Error logging in user:', error);
      res.status(error.status || 500).json({ status: error.status, error: error.error || 'Internal Server Error', message: error.message });
    }
  },










  registerAdminUser: async (req, res) => {
    const { first_name, last_name, password, email, mobile_number, user_type } = req.body;

    // Check for missing fields
    if (!first_name || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {

      let id;
      if (user_type === 'admin') {
        id = generateUUID('uSerADmiN')
      } else if (user_type === 'companyUser') {
        id = generateUUID('cOmPAnYuSEr')
      } else if (user_type === 'candidateUser') {
        id = generateUUID('cANdiDaTeUseR')
      }

      console.log('idddd', id)

      bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ status: 500, message: 'password generated error', error: err });
        }

        const query = `INSERT INTO users (id, first_name, last_name, password, email, mobile_number, user_type) VALUES ?`;
        const values = [[id, first_name, last_name, password, email, mobile_number, user_type]];

        if (id) {
          dbQueryAttributes(query, [values])
            .then(results => {
              console.log(`Admin User '${id}' inserted into database.`, results);
              //   Respond with success message
              return res.status(201).json({ status: 201, message: 'Admin User registered successfully', id: id });
            })
            .catch(error => {
              console.error('Failed to create attributes:', error);
              // Handle the error accordingly
              return res.status(error.status || 409).json({ status: error.status, code: error.code, error: error.error || 'Duplicate Entry', message: error.message });
            });
        }

      });

    } catch (error) {
      // Handle errors
      console.error('Error registering user:', error);
      res.status(error.status || 500).json({ status: error.status, error: error || 'Internal Server Error', message: error.message, });
    }
  },
  getLoginUserById: async (req, res, next) => {

    try {

      // Extract ID from request params
      const id = req.params.userId
      console.log('idddd', req.params.userId)

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the query
      const query = 'SELECT * FROM users WHERE id = ?';

      // Execute the query directly
      dbConnection.query(query, [id], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }
        if (results.length === 0) {
          return res.status(404).json({ status: 404, error: 'Login user data not found' });
        }

        console.log(`Login user with ID '${id}' fetched successfully.`, results[0]);
        res.status(201).json({ status: 201, message: 'Login User data fetched successfully', data: results[0] });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Candidate User Create
  createCandidateUser: async (req, res, next) => {
    const { first_name, password, email } = req.body;
    const response = req.body;
    console.log("responsessss body data", response)

    // Check for missing fields
    if (!first_name || !password || !email) {
      return res.status(409).json({ message: "All fields are required", error: 'All fields are required' });
    }

    try {
      let userBody = {};
      const userId = generateUUID('cAnDIdaTeUsER')
      console.log('userId', userId)
      userBody.id = userId
      userBody.first_name = response.first_name
      userBody.last_name = response.last_name
      userBody.password = password
      userBody.email = response.email
      const dateOfBirth = response.date_of_birth
      if (dateOfBirth) {
        userBody.date_of_birth = await formatDate(response.date_of_birth)
      } else {
        userBody.date_of_birth = response.date_of_birth
      }
      userBody.mobile_number = response.mobile_number
      userBody.user_type = response.user_type
      userBody.profile_image = response.profile_image
      userBody.profile_resume = response.profile_resume

      const query = 'INSERT INTO users SET ?';
      dbQueryAttributes(query, [userBody])
        .then(async results => {
          console.log('candidateUserResult', results)
          if (results.affectedRows > 0) {
            let candidateBody = {};
            const candidateId = generateUUID('cAnDiDAtePrOFiLe');
            console.log('candidateId', candidateId)
            candidateBody.id = candidateId
            candidateBody.age = response.age
            candidateBody.whatsapp_number = response.whatsapp_number
            candidateBody.education_id = response.education_id
            candidateBody.stream_id = response.stream_id
            candidateBody.course_id = response.course_id
            candidateBody.specialization_id = response.specialization_id
            candidateBody.other_stream = response.other_stream
            candidateBody.is_experience = candidateBody.is_experience
            candidateBody.exp_exim_industry = response.exp_exim_industry
            candidateBody.exp_current_org = response.exp_current_org
            candidateBody.organization_type_id = response.organization_type_id
            candidateBody.functional_area_id = response.functional_area_id
            candidateBody.current_position_level_id = response.current_position_level_id
            candidateBody.mode_shipment_expertise = response.mode_shipment_expertise
            candidateBody.area_expertise = response.area_expertise
            candidateBody.last_salary = response.last_salary
            candidateBody.notice_period = response.notice_period
            candidateBody.user_id = userId

            const query = `INSERT INTO candidate_profile SET ?`;
            const candidateProfile = await dbQueryAttributes(query, candidateBody);
            console.log("candidateProfile", candidateProfile)

            if (candidateProfile.affectedRows > 0) {
              const addressId = generateUUID('aDdrESseS')
              console.log('addressId', addressId)
              let addressBody = {};
              addressBody.id = addressId
              addressBody.location = response.location
              addressBody.nearest_station = response.nearest_station
              addressBody.country = response.country
              addressBody.state = response.state
              addressBody.city = response.city
              addressBody.pin_code = response.pin_code
              addressBody.user_id = userId

              const query = `INSERT INTO addresses SET ?`;
              const addresses = await dbQueryAttributes(query, addressBody);
              console.log("addressResults", addresses)

              if (addresses.affectedRows > 0) {
                //   Respond with success message
                let data = {}
                data.id = userId
                data.candidateId = candidateId
                data.addressId = addressId

                res.status(201).json({ status: 201, message: 'Wow! You have Successfully Registered. Please Complete Your Profile now.', type: 'wizardCandidate', data: data, id: userId, });
                const responseMail = await sendEmailRegistrationCredentials(email, password, 'Thanks for Registration', response.user_type, response.first_name)
                console.log("responsemail", responseMail)

              }

            }
          }
        })
        .catch(error => {
          console.error('Failed to create usersss:', error);
          // Handle the error accordingly
          return res.status(error.status || 409).json({ status: error.status, code: error.code, error: error.error || 'Duplicate Entry', message: error.message });
        });

    } catch (error) {
      console.log('errorfjdslkjfaklsjrweiorjfslkd', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },
  wizardUpdateCandidateUsersById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)
      const response = req.body

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      let userBody = {}
      userBody.first_name = response.first_name
      userBody.last_name = response.last_name
      if (response.date_of_birth) {
        userBody.date_of_birth = await formatDate(response.date_of_birth)
      } else {
        userBody.date_of_birth = response.date_of_birth
      }
      userBody.email = response.email
      userBody.mobile_number = response.mobile_number
      userBody.profile_image = response.profile_image
      userBody.profile_resume = response.profile_resume
      userBody.is_wizard = 1

      // Define the update query
      const query = 'UPDATE users SET ? WHERE id = ?';
      // Execute the query directly
      const results = await dbQueryAttributes(query, [userBody, id]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ status: 404, error: 'Attributes data not found' });
      }

      let addressBody = {}
      addressBody.location = response.location
      addressBody.nearest_station = response.nearest_station
      addressBody.country = response.country
      addressBody.state = response.state
      addressBody.city = response.city
      addressBody.pin_code = response.pin_code

      // Prepare the SQL query
      const addressQuery = 'UPDATE addresses SET ? WHERE user_id = ?';
      // Execute the query directly
      const updateAddress = await dbQueryAttributes(addressQuery, [addressBody, id]);

      let candidateBody = {}

      candidateBody.age = response.age
      candidateBody.gender = response.gender
      candidateBody.whatsapp_number = response.whatsapp_number
      candidateBody.education_id = response.education_id
      candidateBody.other_stream = response.other_stream
      candidateBody.stream_id = response.stream_id
      candidateBody.course_id = response.course_id
      candidateBody.specialization_id = response.specialization_id
      candidateBody.is_experience = response.is_experience
      candidateBody.exp_exim_industry = response.exp_exim_industry
      candidateBody.exp_current_org = response.exp_current_org
      candidateBody.current_org_name = response.current_org_name
      candidateBody.organization_type_id = response.organization_type_id
      candidateBody.functional_area_id = response.functional_area_id
      candidateBody.current_position_level_id = response.current_position_level_id
      candidateBody.mode_shipment_expertise = response.mode_shipment_expertise
      candidateBody.area_expertise = response.area_expertise
      candidateBody.last_salary = response.last_salary
      candidateBody.notice_period = response.notice_period

      // Prepare the SQL query
      const companyQuery = 'UPDATE candidate_profile SET ? WHERE user_id = ?';
      // Execute the query directly
      const updateCandidate = await dbQueryAttributes(companyQuery, [candidateBody, id]);

      return res.status(201).json({ status: 201, message: 'Profile updated successfully', data: results });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  wizardGetCandidateUsersByUserId: async (req, res, next) => {

    try {

      // Extract ID from request query
      const userId = req.params.userId
      console.log('userId', userId)

      if (!userId) {
        return res.status(400).json({ status: 400, error: 'userId not found' });
      }

      // Define the query
      const query = `
     SELECT 
        users.*,
        cp.age,
        cp.whatsapp_number,
        cp.education_id,
        cp.other_stream,
        cp.stream_id,
        cp.course_id,
        cp.specialization_id,
        cp.is_experience,
        cp.exp_exim_industry,
        cp.exp_current_org,
        cp.organization_type_id,
        cp.functional_area_id,
        cp.current_position_level_id,        
        cp.current_org_name,        
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        addr.location,
        addr.nearest_station,
        addr.country,
        addr.state,
        addr.city,
        addr.pin_code,
        education.name AS education_name,
        stream.name AS stream_name,
        course.name AS course_name,
        specialization.name AS specialization_name,
        DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth
      FROM users
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
      WHERE users.id = ?
    `;

      const results = await dbQueryAttributes(query, [userId]);
      console.log('resultsfdsdsf', results)

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      return res.status(201).json({ status: 201, message: 'Candidate Users data By User Id fetched successfully', data: results[0], total: results.length });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },


  // Company User Create
  createCompanyUser: async (req, res, next) => {
    const { first_name, password, email } = req.body;
    const response = req.body;
    console.log("responsessss body data", response)

    // Check for missing fields
    if (!first_name || !password || !email) {
      return res.status(409).json({ message: "All fields are required", error: 'All fields are required' });
    }

    try {
      let userBody = {};
      const userId = generateUUID('cOmpANyUsER')
      console.log('userId', userId)
      userBody.id = userId
      userBody.first_name = response.first_name
      userBody.password = password
      userBody.email = response.email
      const dateOfBirth = response.date_of_birth
      if (dateOfBirth) {
        userBody.date_of_birth = await formatDate(response.date_of_birth)
      } else {
        userBody.date_of_birth = response.date_of_birth
      }
      userBody.mobile_number = response.mobile_number
      userBody.user_type = response.user_type
      userBody.profile_image = response.profile_image
      userBody.profile_resume = response.profile_resume

      const query = 'INSERT INTO users SET ?';
      dbQueryAttributes(query, [userBody])
        .then(async results => {
          console.log('candidateUserResult', results)
          if (results.affectedRows > 0) {
            let companyBody = {};
            const companyId = generateUUID('cOmpANyPrOFiLe')
            console.log('companyId', companyId)
            companyBody.id = companyId
            companyBody.company_constitution_id = response.company_constitution_id
            companyBody.organization_type_id = response.organization_type_id
            companyBody.prop_name = response.prop_name
            companyBody.prop_position = response.prop_position
            companyBody.authorized_name = response.authorized_name
            companyBody.auth_designation = response.auth_designation
            companyBody.whatsapp_number = response.whatsapp_number
            companyBody.telephone = response.telephone
            companyBody.staff_strengh = response.staff_strengh
            companyBody.branch = response.branch
            companyBody.annual_turnover = response.annual_turnover
            companyBody.company_since_year = response.company_since_year
            companyBody.description = await removeHtmlTags(response.description)
            companyBody.user_id = userId

            const query = `INSERT INTO company_profile SET ?`;
            const companyProfile = await dbQueryAttributes(query, companyBody);
            console.log("companyProfileResults", companyProfile)

            if (companyProfile.affectedRows > 0) {
              const addressId = generateUUID('aDdrESseS')
              console.log('addressId', addressId)
              let addressBody = {};
              addressBody.id = addressId
              addressBody.location = response.location
              addressBody.nearest_station = response.nearest_station
              addressBody.country = response.country
              addressBody.state = response.state
              addressBody.city = response.city
              addressBody.pin_code = response.pin_code
              addressBody.user_id = userId

              const query = `INSERT INTO addresses SET ?`;
              const addresses = await dbQueryAttributes(query, addressBody);
              console.log("addressResults", addresses)

              if (addresses.affectedRows > 0) {
                //   Respond with success message
                let data = {}
                data.id = userId
                data.companyId = companyId
                data.addressId = addressId
                res.status(201).json({ status: 201, message: 'Wow! You have Successfully Registered. Please Complete Your Profile now.', type: 'wizardCompany', data: data, id: userId, });

                const responseMail = await sendEmailRegistrationCredentials(email, password, 'Thanks for Registration', response.user_type, response.first_name)
                console.log("responsemail", responseMail)
                // sendCredentials('digidevahsan@gmail.com', 'examplepassword');

              }

            }
          }
        })
        .catch(error => {
          console.error('Failed to create usersss:', error);
          // Handle the error accordingly
          return res.status(error.status || 409).json({ status: error.status, code: error.code, error: error.error || 'Duplicate Entry', message: error.message });
        });

    } catch (error) {
      console.log('errorfjdslkjfaklsjrweiorjfslkd', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },
  wizardGetCompanyUsersByUserId: async (req, res, next) => {

    try {

      // Extract ID from request query
      const userId = req.params.userId
      console.log('userId', userId)

      if (!userId) {
        return res.status(400).json({ status: 400, error: 'userId not found' });
      }

      // Define the query
      const query = `
      SELECT 
        users.*,
        cp.telephone,
        cp.company_constitution_id,
        cp.organization_type_id,
        cp.prop_name,
        cp.prop_position,
        cp.authorized_name,
        cp.auth_designation,
        cp.whatsapp_number,
        cp.staff_strengh,
        cp.branch,
        cp.annual_turnover,
        cp.description,
        cp.company_since_year,
        addr.location,
        addr.nearest_station,
        addr.country,
        addr.state,
        addr.city,
        addr.pin_code,
        companyconstitution.name AS company_constitution,
        orgtype.name AS organization_type
      FROM users
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN company_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes companyconstitution ON cp.company_constitution_id = companyconstitution.id
        LEFT JOIN attributes orgtype ON cp.organization_type_id = orgtype.id
      WHERE users.id = ?
    `;

      const results = await dbQueryAttributes(query, [userId]);
      console.log('resultsfdsdsf', results)

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      return res.status(201).json({ status: 201, message: 'Company Users data By User Id fetched successfully', data: results[0], total: results.length });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  wizardUpdateCompanyUsersById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)
      const response = req.body

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      let userBody = {}
      userBody.first_name = response.first_name
      userBody.email = response.email
      userBody.mobile_number = response.mobile_number
      userBody.profile_image = response.profile_image
      userBody.profile_resume = response.profile_resume
      userBody.is_wizard = 1

      // Define the update query
      const query = 'UPDATE users SET ? WHERE id = ?';
      // Execute the query directly
      const results = await dbQueryAttributes(query, [userBody, id]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ status: 404, error: 'Attributes data not found' });
      }

      let addressBody = {}
      addressBody.location = response.location
      addressBody.nearest_station = response.nearest_station
      addressBody.country = response.country
      addressBody.state = response.state
      addressBody.city = response.city
      addressBody.pin_code = response.pin_code

      // Prepare the SQL query
      const addressQuery = 'UPDATE addresses SET ? WHERE user_id = ?';
      // Execute the query directly
      const updateAddress = await dbQueryAttributes(addressQuery, [addressBody, id]);

      let companyBody = {}
      companyBody.telephone = response.telephone
      companyBody.company_constitution_id = response.company_constitution_id
      companyBody.organization_type_id = response.organization_type_id
      companyBody.prop_name = response.prop_name
      companyBody.prop_position = response.prop_position
      companyBody.authorized_name = response.authorized_name
      companyBody.auth_designation = response.auth_designation
      companyBody.whatsapp_number = response.whatsapp_number
      companyBody.staff_strengh = response.staff_strengh
      companyBody.branch = response.branch
      companyBody.annual_turnover = response.annual_turnover
      companyBody.company_since_year = response.company_since_year
      companyBody.description = await removeHtmlTags(response.description)

      // Prepare the SQL query
      const companyQuery = 'UPDATE company_profile SET ? WHERE user_id = ?';
      // Execute the query directly
      const updateCompany = await dbQueryAttributes(companyQuery, [companyBody, id]);

      return res.status(201).json({ status: 201, message: 'Profile updated successfully', data: results });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },


  usersForgotPasswordAndUpdateUser: async (req, res, next) => {
    const { email, user_type } = req.body;

    // Check for missing fields
    if (!email) {
      return res.status(400).json({ status: 400, message: 'Email is required', error: 'Email is required' });
    }

    try {
      // Find the user by username email
      const query = 'SELECT * FROM users WHERE email = ?';
      const values = [email]

      const userData = await dbQueryAttributes(query, values);

      if (userData.length == 0) {
        return res.status(404).json({ status: 404, message: 'User not found', error: 'User not found' });
      }

      if (user_type !== userData[0].user_type) {
        return res.status(402).json({ status: 402, error: "Incorrect Panel", message: "Please login to correct panel" });
      }

      const password = generatePassword()
      const id = userData[0].id
      console.log('password', password, id)

      if (password) {
        let userBody = {}
        userBody.password = password
        // Define the update query
        const query = 'UPDATE users SET ? WHERE id = ?';
        // Execute the query directly
        const results = await dbQueryAttributes(query, [userBody, id]);

        if (results.affectedRows > 0) {
          // Respond with success message
          const responseMail = await sendEmailRegistrationCredentials(email, password, 'Thanks for Forget Password', 'Forget_Password', userData[0].first_name)
          console.log("responsemail", responseMail)
          if (responseMail) {
            return res.status(201).json({ status: 201, email: email, message: 'Email sent successfully' })
          }
        }
      }
    } catch (error) {
      // Handle errors
      console.error('Error verify in user:', error);
      res.status(error.status || 500).json({ status: error.status, error: error.error || 'Internal Server Error', message: error.message });
    }
  },
};



// Function to DB Query if attributes not exists
// async function dbQueryAttributes(query, params = []) {
//   return new Promise((resolve, reject) => {
//     dbConnection.query(query, params, (error, results) => {
//       if (error) {
//         return reject(error);
//       }
//       resolve(results);
//     });
//   });
// }

// Function to get all attributes with pagination and search
async function getAllAttributes(query, params = []) {
  return new Promise((resolve, reject) => {
    dbConnection.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
}

// Function to remove HTML tags
async function removeHtmlTags(str) {
  return str.replace(/<\/?[^>]+(>|$)/g, "");
}

// Function to format date to 'YYYY-MM-DD'
async function formatDate(dateStr) {
  let date = new Date(dateStr);
  // Manually adjust the date to IST (UTC +5:30)
  date.setHours(date.getHours() + 5); // Add 5 hours
  date.setMinutes(date.getMinutes() + 30); // Add 30 minutes
  const indiaDate = date.toISOString().split('T')[0]; // Extract just the date part (YYYY-MM-DD)
  console.log('Converted IST Date:', indiaDate);
  return indiaDate;
  // return dateStr.split('T')[0];
}

export { authenticationController };
