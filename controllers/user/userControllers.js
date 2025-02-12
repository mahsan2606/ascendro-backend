import { dbConnection, dbQueryAttributes } from '../../config/db_connection.js';
import { generateUUID } from '../../middleware/uuidGenerator.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import xlsx from 'xlsx';




const userController = {

  registerElectoral: async (req, res, next) => {
    const { fullName, voterNumber, aadharNumber } = req.body;
    const response = req.body;

    // Check for missing fields
    if (!fullName || !voterNumber || !aadharNumber) {
      return res.status(409).json({ message: "All fields are required", error: 'All fields are required' });
    }

    try {
      let userBody = {};
      const userId = generateUUID('eLecToRAl')
      console.log('userId', userId)
      userBody.id = userId
      userBody.receiptNumber = response.receiptNumber
      userBody.fullName = response.fullName
      if (response.dateOfBirth) {
        userBody.dateOfBirth = await formatDate(response.dateOfBirth)
      } else {
        userBody.dateOfBirth = response.dateOfBirth
      }
      userBody.mobileNumber = response.mobileNumber
      userBody.aadharNumber = response.aadharNumber
      userBody.voterNumber = response.voterNumber
      userBody.address = response.address
      userBody.profilePhoto = response.profilePhoto

      const query = 'INSERT INTO electoral_user SET ?';

      const results = await dbQueryAttributes(query, userBody);

      if (results.affectedRows > 0) {

        return res.status(201).json({ status: 201, message: 'Form Submitted successfully', id: userId });

      }

    } catch (error) {
      console.log('error fetch', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllElectoralList: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `
      SELECT COUNT(*) AS total 
      FROM electoral_user
       WHERE 
       (
         LOWER(fullName) LIKE LOWER(?) 
         OR LOWER(voterNumber) LIKE LOWER(?)
         OR LOWER(receiptNumber) LIKE LOWER(?)
       )
      `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, searchTerm, searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
      SELECT 
        electoral_user.*
      FROM electoral_user
       WHERE 
       (
         LOWER(fullName) LIKE LOWER(?) 
         OR LOWER(voterNumber) LIKE LOWER(?)
         OR LOWER(receiptNumber) LIKE LOWER(?)
       )
      ORDER BY electoral_user.created_at DESC LIMIT ? OFFSET ?`;
      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, searchTerm, searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Electoral List Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Electoral List data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getElectoralUsersByUserId: async (req, res, next) => {

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
        electoral_user.*
      FROM electoral_user
      WHERE electoral_user.id = ?
    `;

      const results = await dbQueryAttributes(query, [userId]);
      console.log('resultsfdsdsf', results)

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      return res.status(201).json({ status: 201, message: 'Electoral Users data By User Id fetched successfully', data: results[0], total: results.length });

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  updateElectoralUsersById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)
      const response = req.body

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      let userBody = {}
      // userBody.id = userId
      // userBody.receiptNumber = response.receiptNumber
      userBody.fullName = response.fullName
      if (response.dateOfBirth) {
        userBody.dateOfBirth = await formatDate(response.dateOfBirth)
      } else {
        userBody.dateOfBirth = response.dateOfBirth
      }
      userBody.mobileNumber = response.mobileNumber
      // userBody.aadharNumber = response.aadharNumber
      // userBody.voterNumber = response.voterNumber
      userBody.address = response.address
      userBody.profilePhoto = response.profilePhoto

      // Define the update query
      const query = 'UPDATE electoral_user SET ? WHERE id = ?';
      // Execute the query directly
      const results = await dbQueryAttributes(query, [userBody, id]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ status: 404, error: 'Attributes data not found' });
      }

      return res.status(201).json({ status: 201, message: 'Form updated successfully', data: results });

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllElectoralUsersData: async (req, res, next) => {

    try {

      // Define the query
      const query = `
      SELECT 
        electoral_user.*
      FROM electoral_user
      WHERE electoral_user.formStatus = 'Submitted'
    `;

      const results = await dbQueryAttributes(query, []);
      console.log('resultsfdsdsf', results)

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      return res.status(201).json({ status: 201, message: 'Electoral Users data fetched successfully', data: results, total: results.length });

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllElectoralFanSpin: async (req, res, next) => {

    try {

      // Step 1: Check the count of existing `lotteryName = 'Fan'` entries
      const countQuery = `
      SELECT COUNT(*) AS count
      FROM electoral_user
      WHERE lotteryName = 'Fan';
      `;

      const fanCountResult = await dbQueryAttributes(countQuery, []);
      const fanCount = fanCountResult[0]?.count || 0;

      // Calculate the remaining number of rows to fetch
      const remainingCount = 10 - fanCount;

      if (fanCount >= 10) {
        console.log("Already 10 entries with lotteryName = 'Fan'. No need to spin.");
        return res.status(400).json({ status: 400, message: 'Already 10 entries with lotteryName = Fan. No need to spin.', error: 'Already 10 entries with lotteryName = Fan. No need to spin.' });
      } else {
        // Step 2: Fetch the remaining random rows
        const query = `
          SELECT 
            electoral_user.*
          FROM electoral_user
          WHERE electoral_user.formStatus = 'Submitted'
          ORDER BY RAND()
          LIMIT ${remainingCount};
        `;

        const results = await dbQueryAttributes(query, []);
        console.log(`Fetched ${results.length} random rows.`, results);

        // Step 3: Update `lotteryName` to 'Fan' for the selected rows
        const ids = results.map(row => row.id); // Extract IDs
        if (ids.length > 0) {
          const updateQuery = `
            UPDATE electoral_user
            SET lotteryName = 'Fan', formStatus = "Rewarded"
            WHERE id IN (${ids.map(() => '?').join(', ')});
          `;

          await dbQueryAttributes(updateQuery, ids);
          console.log(`Updated ${ids.length} rows with lotteryName = 'Fan'.`);

          return res.status(201).json({ status: 201, message: 'Electoral Fan Spin data fetched successfully', data: results, total: results.length });

        }
      }

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllElectoralIronSpin: async (req, res, next) => {

    try {

      // Step 1: Check the count of existing `lotteryName = 'Iron'` entries
      const countQuery = `
      SELECT COUNT(*) AS count
      FROM electoral_user
      WHERE lotteryName = 'Iron';
      `;

      const ironCountResult = await dbQueryAttributes(countQuery, []);
      const ironCount = ironCountResult[0]?.count || 0;

      // Calculate the remaining number of rows to fetch
      const remainingCount = 10 - ironCount;

      if (ironCount >= 10) {
        console.log("Already 10 entries with lotteryName = 'Iron'. No need to spin.");
        return res.status(400).json({ status: 400, message: 'Already 10 entries with lotteryName = Iron. No need to spin.', error: 'Already 10 entries with lotteryName = Iron. No need to spin.' });
      } else {
        // Step 2: Fetch the remaining random rows
        const query = `
          SELECT 
            electoral_user.*
          FROM electoral_user
          WHERE electoral_user.formStatus = 'Submitted'
          ORDER BY RAND()
          LIMIT ${remainingCount};
        `;

        const results = await dbQueryAttributes(query, []);
        console.log(`Fetched ${results.length} random rows.`, results);

        // Step 3: Update `lotteryName` to 'Iron' for the selected rows
        const ids = results.map(row => row.id); // Extract IDs
        if (ids.length > 0) {
          const updateQuery = `
            UPDATE electoral_user
            SET lotteryName = 'Iron', formStatus = "Rewarded"
            WHERE id IN (${ids.map(() => '?').join(', ')});
          `;

          await dbQueryAttributes(updateQuery, ids);
          console.log(`Updated ${ids.length} rows with lotteryName = 'Iron'.`);

          return res.status(201).json({ status: 201, message: 'Electoral Iron Spin data fetched successfully', data: results, total: results.length });

        }
      }

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllElectoralLedTVSpin: async (req, res, next) => {

    try {

      // Step 1: Check the count of existing `lotteryName = 'Iron'` entries
      const countQuery = `
      SELECT COUNT(*) AS count
      FROM electoral_user
      WHERE lotteryName = 'LED TV';
      `;

      const TVCountResult = await dbQueryAttributes(countQuery, []);
      const TVCount = TVCountResult[0]?.count || 0;

      // Calculate the remaining number of rows to fetch
      const remainingCount = 10 - TVCount;

      if (TVCount >= 10) {
        console.log("Already 10 entries with lotteryName = 'TV'. No need to spin.");
        return res.status(400).json({ status: 400, message: 'Already 10 entries with lotteryName = TV. No need to spin.', error: 'Already 10 entries with lotteryName = TV. No need to spin.' });
      } else {
        // Step 2: Fetch the remaining random rows
        const query = `
          SELECT 
            electoral_user.*
          FROM electoral_user
          WHERE electoral_user.formStatus = 'Submitted'
          ORDER BY RAND()
          LIMIT ${remainingCount};
        `;

        const results = await dbQueryAttributes(query, []);
        console.log(`Fetched ${results.length} random rows.`, results);

        // Step 3: Update `lotteryName` to 'Iron' for the selected rows
        const ids = results.map(row => row.id); // Extract IDs
        if (ids.length > 0) {
          const updateQuery = `
            UPDATE electoral_user
            SET lotteryName = 'LED TV', formStatus = "Rewarded"
            WHERE id IN (${ids.map(() => '?').join(', ')});
          `;

          await dbQueryAttributes(updateQuery, ids);
          console.log(`Updated ${ids.length} rows with lotteryName = 'LED TV'.`);

          return res.status(201).json({ status: 201, message: 'Electoral LED TV Spin data fetched successfully', data: results, total: results.length });

        }
      }

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllElectoralSareeSpin: async (req, res, next) => {

    try {

      // Step 1: Check the count of existing `lotteryName = 'Saree'` entries
      const countQuery = `
      SELECT COUNT(*) AS count
      FROM electoral_user
      WHERE lotteryName = 'Saree';
      `;

      const SareeCountResult = await dbQueryAttributes(countQuery, []);
      const SareeCount = SareeCountResult[0]?.count || 0;

      // Calculate the remaining number of rows to fetch
      const remainingCount = 3000 - SareeCount;

      if (SareeCount >= 3000) {
        console.log("Already 3000 entries with lotteryName = 'Saree'. No need to spin.");
        return res.status(400).json({ status: 400, message: 'Already 3000 entries with lotteryName = Saree. No need to spin.', error: 'Already 3000 entries with lotteryName = Saree. No need to spin.' });
      } else {
        // Step 2: Fetch the remaining random rows
        const query = `
          SELECT 
            electoral_user.*
          FROM electoral_user
          WHERE electoral_user.formStatus = 'Submitted'
          ORDER BY RAND()
          LIMIT ${remainingCount};
        `;

        const results = await dbQueryAttributes(query, []);
        console.log(`Fetched ${results.length} random rows.`, results);

        // Step 3: Update `lotteryName` to 'Iron' for the selected rows
        const ids = results.map(row => row.id); // Extract IDs
        if (ids.length > 0) {
          const updateQuery = `
            UPDATE electoral_user
            SET lotteryName = 'Saree', formStatus = "Rewarded"
            WHERE id IN (${ids.map(() => '?').join(', ')});
          `;

          await dbQueryAttributes(updateQuery, ids);
          console.log(`Updated ${ids.length} rows with lotteryName = 'Saree'.`);

          return res.status(201).json({ status: 201, message: 'Electoral Saree Spin data fetched successfully', data: results, total: results.length });

        }
      }

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },



  // Winner Electoral Data
  getAllWinnerElectoralUsersData: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `
      SELECT COUNT(*) AS total 
      FROM electoral_user
       WHERE 
       (
         LOWER(fullName) LIKE LOWER(?) 
         OR LOWER(voterNumber) LIKE LOWER(?)
         OR LOWER(receiptNumber) LIKE LOWER(?)
       )
         AND electoral_user.formStatus = 'Rewarded'
      `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, searchTerm, searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
      SELECT 
        electoral_user.*
      FROM electoral_user
       WHERE 
       (
         LOWER(fullName) LIKE LOWER(?) 
         OR LOWER(voterNumber) LIKE LOWER(?)
         OR LOWER(receiptNumber) LIKE LOWER(?)
       )
        AND electoral_user.formStatus = 'Rewarded'
      ORDER BY electoral_user.created_at DESC LIMIT ? OFFSET ?`;
      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, searchTerm, searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Electoral Winner List Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Electoral Winner List data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  updateWinnerStatusElectoralUsersById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)
      const response = req.body

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      let userBody = {}
      userBody.formStatus = response.formStatus

      // Define the update query
      const query = 'UPDATE electoral_user SET ? WHERE id = ?';
      // Execute the query directly
      const results = await dbQueryAttributes(query, [userBody, id]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ status: 404, error: 'Attributes data not found' });
      }

      return res.status(201).json({ status: 201, message: 'Reward Delivered Successfully', data: results });

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllWinnerRewardDeliveredElectoralUsersData: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM electoral_user
         WHERE 
         (
           LOWER(fullName) LIKE LOWER(?) 
           OR LOWER(voterNumber) LIKE LOWER(?)
           OR LOWER(receiptNumber) LIKE LOWER(?)
         )
           AND electoral_user.formStatus = 'Delivered'
        `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, searchTerm, searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
        SELECT 
          electoral_user.*
        FROM electoral_user
         WHERE 
         (
           LOWER(fullName) LIKE LOWER(?) 
           OR LOWER(voterNumber) LIKE LOWER(?)
           OR LOWER(receiptNumber) LIKE LOWER(?)
         )
          AND electoral_user.formStatus = 'Delivered'
        ORDER BY electoral_user.created_at DESC LIMIT ? OFFSET ?`;
      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, searchTerm, searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Electoral Winner Reward Delivered List Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Electoral Winner Reward Delivered List data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      return res.status(error.status || 500).json({ status: error.status, code: error.code, message: error.message, sqlMessage: error.sqlMessage, error: error.error || 'Unknown error occurred' });
    }
  },







  createCompanyUser: async (req, res, next) => {
    const { first_name, password, email } = req.body;
    const response = req.body;

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
      userBody.mobile_number = response.mobile_number
      userBody.user_type = response.user_type
      userBody.profile_image = response.profile_image
      userBody.profile_resume = response.profile_resume

      const query = 'INSERT INTO users SET ?';
      dbQueryAttributes(query, [userBody])
        .then(async results => {
          console.log('companyUserResult', results)
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
            companyBody.description = response.description
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
                return res.status(201).json({ status: 201, message: 'Company created successfully', id: userId, companyId: companyId, addressId: addressId });
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
  getAllCompanyList: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `
      SELECT COUNT(*) AS total 
      FROM users
      LEFT JOIN company_profile cp ON users.id = cp.user_id
      LEFT JOIN attributes orgtype ON cp.organization_type_id = orgtype.id
       WHERE 
       (
         LOWER(first_name) LIKE LOWER(?) 
         OR LOWER(orgtype.name) LIKE LOWER(?)
       )
      AND user_type = 'companyUser'`;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
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
       WHERE 
       (
         LOWER(first_name) LIKE LOWER(?) 
         OR LOWER(orgtype.name) LIKE LOWER(?)
       ) 
        AND users.user_type = 'companyUser' 
      ORDER BY users.created_at DESC LIMIT ? OFFSET ?`;
      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Company Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Company data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllUserListsByUserType: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const userType = req.query.userType;
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `SELECT COUNT(*) AS total FROM users WHERE LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER (?) AND user_type = ?`;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, userType]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `SELECT * FROM users WHERE LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER (?) AND user_type = ? LIMIT ? OFFSET ?`;
      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, userType, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Company Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Company data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllUsersByUserType: async (req, res, next) => {

    try {

      // Extract ID from request query
      const userType = req.query.userType
      console.log('userType', userType)

      if (!userType) {
        return res.status(400).json({ status: 400, error: 'userType not found' });
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
      WHERE users.user_type = ?
    `;

      const results = await dbQueryAttributes(query, [userType]);

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      // Execute the query directly
      return res.status(201).json({ status: 201, message: 'Users data By User Type fetched successfully', data: results, total: results.length });


    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getCompanyUsersByUserId: async (req, res, next) => {

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
  updateCompanyUsersById: async (req, res, next) => {

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
      userBody.password = response.password
      userBody.email = response.email
      userBody.mobile_number = response.mobile_number
      userBody.profile_image = response.profile_image
      userBody.profile_resume = response.profile_resume
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
      companyBody.description = response.description

      // Prepare the SQL query
      const companyQuery = 'UPDATE company_profile SET ? WHERE user_id = ?';
      // Execute the query directly
      const updateCompany = await dbQueryAttributes(companyQuery, [companyBody, id]);

      return res.status(201).json({ status: 201, message: 'Company updated successfully', data: results });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllSearchCandidateByCompanyUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const companyId = req.query.userId;
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const functionalAreaName = req.query.functionalAreaName || ''; // Default to empty string if not provided
      const organizationType = req.query.organizationType || '';
      const state = req.query.state || '';
      const city = req.query.city || '';
      const shippingExpertise = req.query.shippingExpertise || '';
      const salaryRange = req.query.salaryRange || '';
      const areaOfExpertise = req.query.areaOfExpertise || '';

      // Query to get the total count of records with the search term
      let countQuery = `
     SELECT COUNT(*) AS total 
     FROM users 
     LEFT JOIN addresses addr ON users.id = addr.user_id
     LEFT JOIN candidate_profile cp ON users.id = cp.user_id
     LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
     LEFT JOIN attributes orgtype ON cp.organization_type_id = orgtype.id
     LEFT JOIN block_company bc ON bc.candidate_id = users.id AND bc.company_id = ?
     WHERE 
       (
         LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(?) 
         OR LOWER(fa.name) LIKE LOWER(?) 
         OR LOWER(orgtype.name) LIKE LOWER(?)
       )
       AND users.user_type = 'candidateUser'
       AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
   `;

      // Add filters dynamically
      let filterParams = [companyId, searchTerm, searchTerm, searchTerm]; // Base params

      if (functionalAreaName) {
        countQuery += ' AND LOWER(fa.name) LIKE LOWER(?)';
        filterParams.push(`%${functionalAreaName}%`);
      }

      if (organizationType) {
        countQuery += ' AND LOWER(orgtype.id) LIKE LOWER(?)';
        filterParams.push(`%${organizationType}%`);
      }

      if (state) {
        countQuery += ' AND LOWER(addr.state) LIKE LOWER(?)';
        filterParams.push(`%${state}%`);
      }

      if (city) {
        countQuery += ' AND LOWER(addr.city) LIKE LOWER(?)';
        filterParams.push(`%${city}%`);
      }

      if (shippingExpertise) {
        countQuery += ' AND LOWER(cp.mode_shipment_expertise) LIKE LOWER(?)';
        filterParams.push(`%${shippingExpertise}%`);
      }

      // if (salaryRange) {
      //     countQuery += ' AND LOWER(vacancy.salary_range_id) LIKE LOWER(?)';
      //     filterParams.push(`%${salaryRange}%`);
      // }

      if (areaOfExpertise) {
        countQuery += ' AND LOWER(cp.area_expertise) LIKE LOWER(?)';
        filterParams.push(`%${areaOfExpertise}%`);
      }

      const countResult = await dbQueryAttributes(countQuery, filterParams);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      let query = `
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
        cp.current_org_name,
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        cp.current_position_level_id,
        cp.functional_area_id,
        cp.organization_type_id,
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
        position_level.name AS position_level_name,
        fa.name AS functional_area_name,
        ot.name AS organization_type_name,
        bpc.status AS verified_status,
        attribute_price_list.price AS salary_range_price,
              -- Cart status
    CASE 
      WHEN acc.candidate_id IS NOT NULL AND acc.company_id = ? THEN acc.status 
      ELSE 'Unpaid' 
    END AS cart_status

      FROM users
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
        LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
        LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
        LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
        LEFT JOIN boost_profile_candidate bpc ON users.id = bpc.candidate_id 
        LEFT JOIN block_company bc ON bc.candidate_id = users.id AND bc.company_id = ?
        LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
           -- Cart status join
        LEFT JOIN add_cart_candidate acc ON acc.candidate_id = users.id AND acc.company_id = ?
      WHERE 
       (
         LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(?) 
         OR LOWER(fa.name) LIKE LOWER(?) 
         OR LOWER(ot.name) LIKE LOWER(?)
       )
       AND users.user_type = 'candidateUser'
       AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
      `;

      // Add filters dynamically
      let filterParamsQuery = [companyId, companyId, companyId, searchTerm, searchTerm, searchTerm]; // Base params

      if (functionalAreaName) {
        query += ' AND LOWER(fa.name) LIKE LOWER(?)';
        filterParamsQuery.push(`%${functionalAreaName}%`);
      }

      if (organizationType) {
        query += ' AND LOWER(ot.id) LIKE LOWER(?)';
        filterParamsQuery.push(`%${organizationType}%`);
      }

      if (state) {
        query += ' AND LOWER(addr.state) LIKE LOWER(?)';
        filterParamsQuery.push(`%${state}%`);
      }

      if (city) {
        query += ' AND LOWER(addr.city) LIKE LOWER(?)';
        filterParamsQuery.push(`%${city}%`);
      }

      if (shippingExpertise) {
        query += ' AND LOWER(cp.mode_shipment_expertise) LIKE LOWER(?)';
        filterParamsQuery.push(`%${shippingExpertise}%`);
      }

      // if (salaryRange) {
      //   query += ' AND LOWER(vacancy.salary_range_id) LIKE LOWER(?)';
      //   filterParamsQuery.push(`%${salaryRange}%`);
      // }

      if (areaOfExpertise) {
        query += ' AND LOWER(cp.area_expertise) LIKE LOWER(?)';
        filterParamsQuery.push(`%${areaOfExpertise}%`);
      }

      // Add pagination
      query += `
      ORDER BY 
      CASE 
          WHEN bpc.candidate_id IS NOT NULL THEN 1
          ELSE 2 
      END, users.created_at DESC LIMIT ? OFFSET ?`;
      filterParamsQuery.push(limit, offset);

      const getAllAttributes = await dbQueryAttributes(query, filterParamsQuery);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Company Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Company data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  getAllAppliedCandidateByCompanyUser: async (req, res, next) => {
    try {
      console.log('req.query', req.query);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const companyId = req.query.userId;
      const organizationTypeId = req.query.organizationTypeId; // Filter for organization type in vacancy table
      const functionalAreaId = req.query.functionalAreaId; // Filter for functional area in vacancy table
      const vacancyId = req.query.vacancyId; // Optional filter for specific vacancy

      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      const filters = [];
      const filterValues = [companyId, companyId, searchTerm, companyId];

      // Apply filter for organizationTypeId from vacancy table if provided
      if (organizationTypeId) {
        filters.push('vacancy.organization_type_id = ?');
        filterValues.push(organizationTypeId);
      }

      // Apply filter for functionalAreaId from vacancy table if provided
      if (functionalAreaId) {
        filters.push('vacancy.functional_area_id = ?');
        filterValues.push(functionalAreaId);
      }

      // Apply filter for vacancyId if provided
      if (vacancyId) {
        filters.push('vacancy.id = ?');
        filterValues.push(vacancyId);
      }

      // if(companyId){
      //   filters.push('acc.company_id = ?');
      //   filterValues.push(companyId);
      // }

      // Query to get the total count of records with the search term and filters
      let countQuery = `
        SELECT COUNT(*) AS total 
        FROM applied_jobs_candidate 
        JOIN users userCandidate ON userCandidate.id = applied_jobs_candidate.candidate_id
        LEFT JOIN users companyUser ON companyUser.id = applied_jobs_candidate.company_id
        LEFT JOIN add_cart_candidate acc ON acc.candidate_id = applied_jobs_candidate.candidate_id AND acc.company_id = ?
        LEFT JOIN vacancy ON applied_jobs_candidate.vacancy_id = vacancy.id
        LEFT JOIN block_company bc ON bc.candidate_id = userCandidate.id AND bc.company_id = ?
        WHERE LOWER(CONCAT(userCandidate.first_name, ' ', userCandidate.last_name)) LIKE LOWER(?) 
        AND applied_jobs_candidate.company_id = ?  AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
        ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''};
      `;

      const countResult = await dbQueryAttributes(countQuery, filterValues);
      const totalRecords = countResult[0].total;

      const query = `
        SELECT 
          DISTINCT applied_jobs_candidate.candidate_id, applied_jobs_candidate.*,
          userCandidate.first_name, userCandidate.last_name, userCandidate.profile_image, userCandidate.certified_status,
          userCandidate.profile_resume, userCandidate.email, userCandidate.mobile_number, userCandidate.candidate_reg_id,
          cp.age, cp.whatsapp_number, cp.education_id, cp.other_stream, cp.stream_id,
          cp.course_id, cp.specialization_id, cp.is_experience, cp.exp_exim_industry,
          cp.exp_current_org, cp.current_org_name, cp.mode_shipment_expertise,
          cp.area_expertise, cp.last_salary, cp.notice_period, cp.current_position_level_id,
          cp.functional_area_id, cp.organization_type_id,
          userCompany.first_name AS company_first_name, userCompany.last_name AS company_last_name,
          userCompany.profile_image AS company_profile_image, userCompany.profile_resume AS company_profile_resume,
          userCompany.email AS company_email, userCompany.mobile_number AS company_mobile_number,
          addrCandidate.location, addrCandidate.nearest_station, addrCandidate.country,
          addrCandidate.state, addrCandidate.city, addrCandidate.pin_code,
          addrCompany.location AS company_location, addrCompany.nearest_station AS company_nearest_station,
          addrCompany.country AS company_country, addrCompany.state AS company_state,
          addrCompany.city AS company_city, addrCompany.pin_code AS company_pin_code,
          vacancy.company_id, vacancy.organization_type_id, vacancy.functional_area_id,
          vacancy.operational_area_expertise, vacancy.shipment_expertise, vacancy.salary_range_id,
          vacancy.location, vacancy.international_location, vacancy.expiry_date, vacancy.job_type,
          vacancy.no_of_vacancy, vacancy.work_experience,
          fa.name AS vacancy_functional_area_name, ot.name AS vacancy_organization_type_name,
          faCandidate.name AS functional_area_name, otCandidate.name AS organization_type_name,
          education.name AS education_name, stream.name AS stream_name,
          course.name AS course_name, specialization.name AS specialization_name,
          position_level.name AS position_level_name,
          attribute_price_list.price AS salary_range_price,
          bpc.status AS verified_status,
          bpc.candidate_id AS verified_candidate_id,
          CASE 
            WHEN acc.candidate_id IS NOT NULL AND acc.company_id = userCompany.id THEN acc.status 
            ELSE 'Unpaid' 
          END AS cart_status
        FROM applied_jobs_candidate
          LEFT JOIN users userCandidate ON userCandidate.id = applied_jobs_candidate.candidate_id
          LEFT JOIN addresses addrCandidate ON userCandidate.id = addrCandidate.user_id
          LEFT JOIN users userCompany ON userCompany.id = applied_jobs_candidate.company_id
          LEFT JOIN addresses addrCompany ON userCompany.id = addrCompany.user_id
          LEFT JOIN candidate_profile cp ON userCandidate.id = cp.user_id
          LEFT JOIN vacancy ON applied_jobs_candidate.vacancy_id = vacancy.id
          LEFT JOIN attributes ot ON vacancy.organization_type_id = ot.id
          LEFT JOIN functional_area fa ON vacancy.functional_area_id = fa.id
          LEFT JOIN attributes otCandidate ON cp.organization_type_id = otCandidate.id
          LEFT JOIN functional_area faCandidate ON cp.functional_area_id = faCandidate.id
          LEFT JOIN attributes education ON cp.education_id = education.id
          LEFT JOIN attributes stream ON cp.stream_id = stream.id
          LEFT JOIN attributes course ON cp.course_id = course.id
          LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
          LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
          LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
          LEFT JOIN add_cart_candidate acc ON acc.candidate_id = applied_jobs_candidate.candidate_id AND acc.company_id = ?
          LEFT JOIN boost_profile_candidate bpc ON userCandidate.id = bpc.candidate_id 
          LEFT JOIN block_company bc ON bc.candidate_id = userCandidate.id AND bc.company_id = ?
        WHERE LOWER(CONCAT(userCandidate.first_name, ' ', userCandidate.last_name)) LIKE LOWER(?) 
        AND applied_jobs_candidate.company_id = ? AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
        ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
        ORDER BY 
      CASE 
          WHEN bpc.candidate_id IS NOT NULL THEN 1 -- Boost profile users first
          ELSE 2 
      END, applied_jobs_candidate.created_at DESC
        LIMIT ? OFFSET ?;
      `;

      filterValues.push(limit, offset);
      const getAllAttributes = await dbQueryAttributes(query, filterValues);

      console.log("getAllAttributes", getAllAttributes);

      if (getAllAttributes.length > 0) {
        res.status(201).json({
          status: 201,
          message: 'Get All Applied Candidate Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Get All Applied Candidate data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error);
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  getAllAppliedCandidateByAdmin: async (req, res, next) => {
    try {
      console.log('req.query', req.query);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const companyId = req.query.userId;
      const organizationTypeId = req.query.organizationTypeId; // Filter for organization type in vacancy table
      const functionalAreaId = req.query.functionalAreaId; // Filter for functional area in vacancy table
      const vacancyId = req.query.vacancyId; // Optional filter for specific vacancy

      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      const filters = [];
      const filterValues = [searchTerm, searchTerm, searchTerm];

      // Apply filter for organizationTypeId from vacancy table if provided
      if (organizationTypeId) {
        filters.push('vacancy.organization_type_id = ?');
        filterValues.push(organizationTypeId);
      }

      // Apply filter for functionalAreaId from vacancy table if provided
      if (functionalAreaId) {
        filters.push('vacancy.functional_area_id = ?');
        filterValues.push(functionalAreaId);
      }

      // Apply filter for vacancyId if provided
      if (vacancyId) {
        filters.push('vacancy.id = ?');
        filterValues.push(vacancyId);
      }

      // Query to get the total count of records with the search term and filters
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM applied_jobs_candidate 
        JOIN users userCandidate ON userCandidate.id = applied_jobs_candidate.candidate_id
        LEFT JOIN users companyUser ON companyUser.id = applied_jobs_candidate.company_id
        LEFT JOIN vacancy ON applied_jobs_candidate.vacancy_id = vacancy.id
        LEFT JOIN functional_area fa ON vacancy.functional_area_id = fa.id
        LEFT JOIN attributes orgtype ON vacancy.organization_type_id = orgtype.id
        WHERE 
              (
                LOWER(CONCAT(userCandidate.first_name, ' ', userCandidate.last_name)) LIKE LOWER(?) 
                OR LOWER(fa.name) LIKE LOWER(?) 
                OR LOWER(orgtype.name) LIKE LOWER(?)
              )
        AND applied_jobs_candidate.candidate_id = userCandidate.id
        ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''};
      `;

      const countResult = await dbQueryAttributes(countQuery, filterValues);
      const totalRecords = countResult[0].total;

      const query = `
        SELECT 
          DISTINCT applied_jobs_candidate.candidate_id, applied_jobs_candidate.*,
          userCandidate.first_name, userCandidate.last_name, userCandidate.profile_image, userCandidate.certified_status,
          userCandidate.created_at AS candidate_created_at, userCandidate.updated_at AS candidate_updated_at,
          userCandidate.profile_resume, userCandidate.email, userCandidate.mobile_number, userCandidate.candidate_reg_id,
          cp.age, cp.whatsapp_number, cp.education_id, cp.other_stream, cp.stream_id,
          cp.course_id, cp.specialization_id, cp.is_experience, cp.exp_exim_industry,
          cp.exp_current_org, cp.current_org_name, cp.mode_shipment_expertise,
          cp.area_expertise, cp.last_salary, cp.notice_period, cp.current_position_level_id,
          cp.functional_area_id, cp.organization_type_id,
          userCompany.first_name AS company_first_name, userCompany.last_name AS company_last_name,
          userCompany.profile_image AS company_profile_image, userCompany.profile_resume AS company_profile_resume,
          userCompany.email AS company_email, userCompany.mobile_number AS company_mobile_number,
          addrCandidate.location, addrCandidate.nearest_station, addrCandidate.country,
          addrCandidate.state, addrCandidate.city, addrCandidate.pin_code,
          addrCompany.location AS company_location, addrCompany.nearest_station AS company_nearest_station,
          addrCompany.country AS company_country, addrCompany.state AS company_state,
          addrCompany.city AS company_city, addrCompany.pin_code AS company_pin_code,
          vacancy.company_id, vacancy.organization_type_id, vacancy.functional_area_id,
          vacancy.operational_area_expertise, vacancy.shipment_expertise, vacancy.salary_range_id,
          vacancy.location, vacancy.international_location, vacancy.expiry_date, vacancy.job_type,
          vacancy.no_of_vacancy, vacancy.work_experience,
          fa.name AS vacancy_functional_area_name, ot.name AS vacancy_organization_type_name,
          faCandidate.name AS functional_area_name, otCandidate.name AS organization_type_name,
          education.name AS education_name, stream.name AS stream_name,
          course.name AS course_name, specialization.name AS specialization_name,
          position_level.name AS position_level_name,
          attribute_price_list.price AS salary_range_price,
          bpc.status AS verified_status,
          bpc.candidate_id AS boost_candidate_id,
          CASE 
            WHEN acc.candidate_id IS NOT NULL AND acc.company_id = userCompany.id THEN acc.status 
            ELSE 'Unpaid' 
          END AS cart_status
        FROM applied_jobs_candidate
          LEFT JOIN users userCandidate ON userCandidate.id = applied_jobs_candidate.candidate_id
          LEFT JOIN addresses addrCandidate ON userCandidate.id = addrCandidate.user_id
          LEFT JOIN users userCompany ON userCompany.id = applied_jobs_candidate.company_id
          LEFT JOIN addresses addrCompany ON userCompany.id = addrCompany.user_id
          LEFT JOIN candidate_profile cp ON userCandidate.id = cp.user_id
          LEFT JOIN vacancy ON applied_jobs_candidate.vacancy_id = vacancy.id
          LEFT JOIN attributes ot ON vacancy.organization_type_id = ot.id
          LEFT JOIN functional_area fa ON vacancy.functional_area_id = fa.id
          LEFT JOIN attributes otCandidate ON cp.organization_type_id = otCandidate.id
          LEFT JOIN functional_area faCandidate ON cp.functional_area_id = faCandidate.id
          LEFT JOIN attributes education ON cp.education_id = education.id
          LEFT JOIN attributes stream ON cp.stream_id = stream.id
          LEFT JOIN attributes course ON cp.course_id = course.id
          LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
          LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
          LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
          LEFT JOIN add_cart_candidate acc ON acc.candidate_id = applied_jobs_candidate.candidate_id
          LEFT JOIN boost_profile_candidate bpc ON userCandidate.id = bpc.candidate_id 
        WHERE 
              (
                LOWER(CONCAT(userCandidate.first_name, ' ', userCandidate.last_name)) LIKE LOWER(?) 
                OR LOWER(fa.name) LIKE LOWER(?) 
                OR LOWER(ot.name) LIKE LOWER(?)
              )
        AND applied_jobs_candidate.candidate_id = userCandidate.id
        ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
        ORDER BY 
      CASE 
          WHEN bpc.candidate_id IS NOT NULL THEN 1 -- Boost profile users first
          ELSE 2 
      END, applied_jobs_candidate.created_at DESC LIMIT ? OFFSET ?;
      `;

      filterValues.push(limit, offset);
      const getAllAttributes = await dbQueryAttributes(query, filterValues);

      console.log("getAllAttributes", getAllAttributes);

      if (getAllAttributes.length > 0) {
        res.status(201).json({
          status: 201,
          message: 'Get All Applied Candidate Data By Admin Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Get All Applied Candidate data By Admin not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error);
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },




  // getAllAppliedCandidateByCompanyUser: async (req, res, next) => {

  //   try {
  //     console.log('req.query', req.query)
  //     const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  //     const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
  //     const search = req.query.search || ''; // Default to an empty string if not provided
  //     const companyId = req.query.userId;
  //     const offset = (page - 1) * limit;
  //     const searchTerm = `%${search}%`;

  //     // Query to get the total count of records with the search term
  //     const countQuery = `
  //     SELECT COUNT(*) AS total 
  //     FROM applied_jobs_candidate 
  //     JOIN users userCandidate ON userCandidate.id = applied_jobs_candidate.candidate_id
  //     LEFT JOIN users companyUser ON companyUser.id = applied_jobs_candidate.company_id
  //     WHERE LOWER(CONCAT(userCandidate.first_name, ' ', userCandidate.last_name)) LIKE LOWER(?) 
  //     AND applied_jobs_candidate.company_id = ?;
  // `;

  //     const countResult = await dbQueryAttributes(countQuery, [searchTerm, companyId]);
  //     const totalRecords = countResult[0].total;

  //     const query = `
  //     SELECT 
  //       DISTINCT applied_jobs_candidate.candidate_id, applied_jobs_candidate.*,
  //         -- Candidate details
  //       userCandidate.first_name,
  //       userCandidate.last_name,
  //       userCandidate.profile_image,
  //       userCandidate.profile_resume,
  //       userCandidate.email,
  //       userCandidate.mobile_number,

  //         -- Candidate profile details
  //       cp.age,
  //       cp.whatsapp_number,
  //       cp.education_id,
  //       cp.other_stream,
  //       cp.stream_id,
  //       cp.course_id,
  //       cp.specialization_id,
  //       cp.is_experience,
  //       cp.exp_exim_industry,
  //       cp.exp_current_org,
  //       cp.current_org_name,
  //       cp.mode_shipment_expertise,
  //       cp.area_expertise,
  //       cp.last_salary,
  //       cp.notice_period,
  //       cp.current_position_level_id,
  //       cp.functional_area_id,
  //       cp.organization_type_id,


  //       -- Company details
  //       userCompany.first_name AS company_first_name,
  //       userCompany.last_name AS company_last_name,
  //       userCompany.profile_image AS company_profile_image,
  //       userCompany.profile_resume AS company_profile_resume,
  //       userCompany.email AS company_email,
  //       userCompany.mobile_number AS company_mobile_number,

  //           -- Candidate address
  //       addrCandidate.location,
  //       addrCandidate.nearest_station,
  //       addrCandidate.country,
  //       addrCandidate.state,
  //       addrCandidate.city,
  //       addrCandidate.pin_code,

  //       -- Company address
  //       addrCompany.location AS company_location,
  //       addrCompany.nearest_station AS company_nearest_station,
  //       addrCompany.country AS company_country,
  //       addrCompany.state AS company_state,
  //       addrCompany.city AS company_city,
  //       addrCompany.pin_code AS company_pin_code,
  //       vacancy.company_id,
  //       vacancy.organization_type_id,
  //       vacancy.functional_area_id,
  //       vacancy.operational_area_expertise,
  //       vacancy.shipment_expertise,
  //       vacancy.salary_range_id,
  //       vacancy.location,
  //       vacancy.international_location,
  //       vacancy.expiry_date,
  //       vacancy.job_type,
  //       vacancy.no_of_vacancy,
  //       vacancy.work_experience,

  //       fa.name AS vacancy_functional_area_name,
  //       ot.name AS vacancy_organization_type_name,
  //       faCandidate.name AS functional_area_name,
  //       otCandidate.name AS organization_type_name,

  //             -- Educational details
  //       education.name AS education_name,
  //       stream.name AS stream_name,
  //       course.name AS course_name,
  //       specialization.name AS specialization_name,
  //       position_level.name AS position_level_name,

  //         -- Salary range based on last salary
  //       attribute_price_list.price AS salary_range_price,

  //        -- Cart status
  //   CASE 
  //     WHEN acc.candidate_id IS NOT NULL AND acc.company_id = userCompany.id THEN acc.status 
  //     ELSE 'Unpaid' 
  //   END AS cart_status

  //     FROM applied_jobs_candidate
  //         -- Candidate and Company joins
  //       LEFT JOIN users userCandidate ON userCandidate.id = applied_jobs_candidate.candidate_id
  //       LEFT JOIN addresses addrCandidate ON userCandidate.id = addrCandidate.user_id
  //       LEFT JOIN users userCompany ON userCompany.id = applied_jobs_candidate.company_id
  //       LEFT JOIN addresses addrCompany ON userCompany.id = addrCompany.user_id
  //       LEFT JOIN candidate_profile cp ON userCandidate.id = cp.user_id
  //       LEFT JOIN vacancy ON applied_jobs_candidate.vacancy_id = vacancy.id

  //           -- Vacancy Organization type and functional area
  //       LEFT JOIN attributes ot ON vacancy.organization_type_id = ot.id
  //       LEFT JOIN functional_area fa ON vacancy.functional_area_id = fa.id

  //           -- Candidate Organization type and functional area
  //       LEFT JOIN attributes otCandidate ON cp.organization_type_id = otCandidate.id
  //       LEFT JOIN functional_area faCandidate ON cp.functional_area_id = faCandidate.id

  //               LEFT JOIN attributes education ON cp.education_id = education.id
  //       LEFT JOIN attributes stream ON cp.stream_id = stream.id
  //       LEFT JOIN attributes course ON cp.course_id = course.id
  //       LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
  //       LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id

  //            -- Salary range
  //       LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range

  //       -- Cart status join
  //       LEFT JOIN add_cart_candidate acc ON acc.candidate_id = applied_jobs_candidate.candidate_id

  //     WHERE LOWER(applied_jobs_candidate.status) LIKE LOWER(?)
  //     AND applied_jobs_candidate.company_id = ?
  //     LIMIT ? OFFSET ?;
  //   `;

  //     const getAllAttributes = await dbQueryAttributes(query, [searchTerm, companyId, limit, offset]);


  //     console.log("getAllAttributes", getAllAttributes)

  //     if (getAllAttributes.length > 0) {
  //       //   Respond with success message
  //       res.status(201).json({
  //         status: 201,
  //         message: 'Get All Applied Candidate Data Fetched successfully',
  //         data: getAllAttributes,
  //         pagination: {
  //           totalRecords: totalRecords,
  //           currentPage: page,
  //           totalPages: Math.ceil(totalRecords / limit)
  //         }
  //       });

  //     } else {
  //       res.status(201).json({
  //         status: 201,
  //         error: 'not found',
  //         data: getAllAttributes,
  //         message: 'Get All Applied Candidate data not found in database',
  //         pagination: {
  //           totalRecords: totalRecords,
  //           currentPage: page,
  //           totalPages: Math.ceil(totalRecords / limit)
  //         }
  //       });
  //     }

  //   } catch (error) {
  //     console.log('error', error)
  //     res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
  //   }
  // },
  // Add To Cart Candidate By Company User
  addToCartCandidateByCompanyUser: async (req, res, next) => {
    console.log('body details', req.body)
    let response = req.body
    try {

      const id = generateUUID('aDdToCArt')

      let expiryDate = new Date(Date.now());
      // Add 3 months to the current date
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      console.log('Expiry Date:', expiryDate);

      let addToCartBody = {}
      addToCartBody.id = id
      addToCartBody.candidate_id = response.candidate_id
      addToCartBody.company_id = response.company_id
      addToCartBody.payments_id = response.payments_id
      addToCartBody.expiry_date = expiryDate
      addToCartBody.amount = response.amount
      addToCartBody.status = response.status

      const query = 'INSERT INTO add_cart_candidate SET ?';
      const results = await dbQueryAttributes(query, [addToCartBody]);

      console.log('resultsss', results)
      if (results.affectedRows > 0) {
        console.log(`Add To Cart Candidate '${id}' inserted into database.`, results);
        //   Respond with success message
        return res.status(201).json({ status: 201, message: `Added To Cart Successfully`, id: id });

      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ message: error.message, error: error.error || 'Unknown error occurred' });
    }
  },

  // Add To Cart Candidate By Company User
  addToCartMultipleCandidateByCompanyUser: async (req, res, next) => {
    console.log('body details', req.body)
    let response = req.body
    try {

      let expiryDate = new Date(Date.now());
      // Add 3 months to the current date
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      console.log('Expiry Date:', expiryDate);

      const candidateData = response.candidate_id;
      if (candidateData.length > 0) {
        const responseCandidateQueries = candidateData.map(async candidate => {
          const id = generateUUID('aDdToCArt')
          let addToCartBody = {}
          addToCartBody.id = id
          addToCartBody.candidate_id = candidate.candidate_id
          addToCartBody.company_id = response.company_id
          addToCartBody.payments_id = response.payments_id
          addToCartBody.expiry_date = expiryDate
          addToCartBody.amount = candidate.amount
          addToCartBody.status = response.status

          const query = 'INSERT INTO add_cart_candidate SET ?';
          const results = await dbQueryAttributes(query, [addToCartBody]);
          console.log('result insert add to card success', results)

        })
        console.log('responsecandidate', responseCandidateQueries)
        return res.status(201).json({ status: 201, message: `You have Successfully Unlocked the Profiles..Happy Hiring…` });
      }


      // let addToCartBody = {}
      // addToCartBody.id = id
      // addToCartBody.candidate_id = response.candidate_id
      // addToCartBody.company_id = response.company_id
      // addToCartBody.payments_id = response.payments_id
      // addToCartBody.expiry_date = expiryDate
      // addToCartBody.amount = response.amount
      // addToCartBody.status = response.status

      // const query = 'INSERT INTO add_cart_candidate SET ?';
      // const results = await dbQueryAttributes(query, [addToCartBody]);

      // console.log('resultsss', results)
      // if (results.affectedRows > 0) {
      //   console.log(`Add To Cart Candidate '${id}' inserted into database.`, results);
      //   //   Respond with success message
      //   return res.status(201).json({ status: 201, message: `Added To Cart Successfully`, id: id });

      // }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ message: error.message, error: error.error || 'Unknown error occurred' });
    }
  },

  getAllVerifiedCandidateListByCompany: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const companyId = req.query.userId;
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const functionalAreaName = req.query.functionalAreaName || ''; // Default to empty string if not provided
      const organizationType = req.query.organizationType || '';
      const state = req.query.state || '';
      const city = req.query.city || '';
      const shippingExpertise = req.query.shippingExpertise || '';
      const salaryRange = req.query.salaryRange || '';
      const areaOfExpertise = req.query.areaOfExpertise || '';

      // Query to get the total count of records with the search term
      let countQuery = `
       SELECT COUNT(*) AS total 
       FROM boost_profile_candidate 
       JOIN users ON boost_profile_candidate.candidate_id = users.id
       LEFT JOIN addresses addr ON users.id = addr.user_id
       LEFT JOIN candidate_profile cp ON users.id = cp.user_id
       LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
       LEFT JOIN attributes orgtype ON cp.organization_type_id = orgtype.id
       LEFT JOIN block_company bc ON bc.candidate_id = users.id AND bc.company_id = ?
       WHERE 
         (
           LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?) 
           OR LOWER(fa.name) LIKE LOWER(?) 
           OR LOWER(orgtype.name) LIKE LOWER(?)
         )
       AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
     `;

      // Add filters dynamically
      let filterParams = [companyId, searchTerm, searchTerm, searchTerm]; // Base params

      if (functionalAreaName) {
        countQuery += ' AND LOWER(fa.name) LIKE LOWER(?)';
        filterParams.push(`%${functionalAreaName}%`);
      }

      if (organizationType) {
        countQuery += ' AND LOWER(orgtype.id) LIKE LOWER(?)';
        filterParams.push(`%${organizationType}%`);
      }

      if (state) {
        countQuery += ' AND LOWER(addr.state) LIKE LOWER(?)';
        filterParams.push(`%${state}%`);
      }

      if (city) {
        countQuery += ' AND LOWER(addr.city) LIKE LOWER(?)';
        filterParams.push(`%${city}%`);
      }

      if (shippingExpertise) {
        countQuery += ' AND LOWER(cp.mode_shipment_expertise) LIKE LOWER(?)';
        filterParams.push(`%${shippingExpertise}%`);
      }

      if (areaOfExpertise) {
        countQuery += ' AND LOWER(cp.area_expertise) LIKE LOWER(?)';
        filterParams.push(`%${areaOfExpertise}%`);
      }

      const countResult = await dbQueryAttributes(countQuery, filterParams);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      let query = `
      SELECT 
        boost_profile_candidate.*,
        users.first_name,
        users.last_name,
        users.date_of_birth,
        users.email,
        users.mobile_number,
        users.profile_image,
        users.profile_resume,
        users.candidate_reg_id,
        users.certified_status,
        users.created_at AS candidate_created_at,
        users.updated_at AS candidate_updated_at,
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
        cp.current_org_name,
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        cp.current_position_level_id,
        cp.functional_area_id,
        cp.organization_type_id,
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
        position_level.name AS position_level_name,
        fa.name AS functional_area_name,
        ot.name AS organization_type_name,
        attribute_price_list.price AS salary_range_price,
        COALESCE(acc.status, 'Unpaid') AS cart_status

      FROM boost_profile_candidate
        JOIN users ON boost_profile_candidate.candidate_id = users.id
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
        LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
        LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
        LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
        LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
        LEFT JOIN add_cart_candidate acc ON acc.company_id = ? AND acc.candidate_id = users.id
        LEFT JOIN block_company bc ON bc.candidate_id = users.id AND bc.company_id = ?
      WHERE 
       (
         LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?) 
         OR LOWER(fa.name) LIKE LOWER(?) 
         OR LOWER(ot.name) LIKE LOWER(?)
       )
      AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
      `;

      // Add filters dynamically
      let filterParamsQuery = [companyId, companyId, searchTerm, searchTerm, searchTerm]; // Base params

      if (functionalAreaName) {
        query += ' AND LOWER(fa.name) LIKE LOWER(?)';
        filterParamsQuery.push(`%${functionalAreaName}%`);
      }

      if (organizationType) {
        query += ' AND LOWER(ot.id) LIKE LOWER(?)';
        filterParamsQuery.push(`%${organizationType}%`);
      }

      if (state) {
        query += ' AND LOWER(addr.state) LIKE LOWER(?)';
        filterParamsQuery.push(`%${state}%`);
      }

      if (city) {
        query += ' AND LOWER(addr.city) LIKE LOWER(?)';
        filterParamsQuery.push(`%${city}%`);
      }

      if (shippingExpertise) {
        query += ' AND LOWER(cp.mode_shipment_expertise) LIKE LOWER(?)';
        filterParamsQuery.push(`%${shippingExpertise}%`);
      }

      if (areaOfExpertise) {
        query += ' AND LOWER(cp.area_expertise) LIKE LOWER(?)';
        filterParamsQuery.push(`%${areaOfExpertise}%`);
      }

      // Add pagination
      query += ' ORDER BY users.created_at DESC LIMIT ? OFFSET ?';
      filterParamsQuery.push(limit, offset);

      const getAllAttributes = await dbQueryAttributes(query, filterParamsQuery);

      // // Query to get the paginated and filtered data
      // const query = `
      // SELECT 
      //   boost_profile_candidate.*,
      //   users.first_name,
      //   users.last_name,
      //   users.date_of_birth,
      //   users.email,
      //   users.mobile_number,
      //   users.profile_image,
      //   users.profile_resume,
      //   cp.age,
      //   cp.whatsapp_number,
      //   cp.education_id,
      //   cp.other_stream,
      //   cp.stream_id,
      //   cp.course_id,
      //   cp.specialization_id,
      //   cp.is_experience,
      //   cp.exp_exim_industry,
      //   cp.exp_current_org,
      //   cp.current_org_name,
      //   cp.mode_shipment_expertise,
      //   cp.area_expertise,
      //   cp.last_salary,
      //   cp.notice_period,
      //   cp.current_position_level_id,
      //   cp.functional_area_id,
      //   cp.organization_type_id,
      //   addr.location,
      //   addr.nearest_station,
      //   addr.country,
      //   addr.state,
      //   addr.city,
      //   addr.pin_code,
      //   education.name AS education_name,
      //   stream.name AS stream_name,
      //   course.name AS course_name,
      //   specialization.name AS specialization_name,
      //   position_level.name AS position_level_name,
      //   fa.name AS functional_area_name,
      //   ot.name AS organization_type_name,
      //   attribute_price_list.price AS salary_range_price,
      //   COALESCE(acc.status, 'Unpaid') AS cart_status

      // FROM boost_profile_candidate
      //   JOIN users ON boost_profile_candidate.candidate_id = users.id
      //   LEFT JOIN addresses addr ON users.id = addr.user_id
      //   LEFT JOIN candidate_profile cp ON users.id = cp.user_id
      //   LEFT JOIN attributes education ON cp.education_id = education.id
      //   LEFT JOIN attributes stream ON cp.stream_id = stream.id
      //   LEFT JOIN attributes course ON cp.course_id = course.id
      //   LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
      //   LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
      //   LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
      //   LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
      //   LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
      //   LEFT JOIN add_cart_candidate acc ON acc.company_id = ? AND acc.candidate_id = users.id

      // WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?) 
      // LIMIT ? OFFSET ?`;

      // const getAllAttributes = await dbQueryAttributes(query, [companyId, searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Company Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Company data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllShortListedCandidateListByCompanyUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const companyId = req.query.userId;


      // Query to get the total count of records with the search term
      const countQuery = `
      SELECT COUNT(*) AS total 
      FROM add_cart_candidate 
      JOIN users ON add_cart_candidate.candidate_id = users.id
      LEFT JOIN block_company bc ON bc.candidate_id = users.id AND bc.company_id = ?
      WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?)
      AND add_cart_candidate.company_id = ? 
      AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
    `;
      const countResult = await dbQueryAttributes(countQuery, [companyId, searchTerm, companyId]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
      SELECT 
        add_cart_candidate.*,
        users.first_name,
        users.last_name,
        users.date_of_birth,
        users.email,
        users.mobile_number,
        users.profile_image,
        users.profile_resume,
        users.candidate_reg_id,
        users.certified_status,
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
        cp.current_org_name,
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        cp.current_position_level_id,
        cp.functional_area_id,
        cp.organization_type_id,
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
        position_level.name AS position_level_name,
        fa.name AS functional_area_name,
        ot.name AS organization_type_name,
        attribute_price_list.price AS salary_range_price,
        bpc.status AS verified_status,
        bpc.candidate_id AS verified_candidate_id
      FROM add_cart_candidate
        JOIN users ON add_cart_candidate.candidate_id = users.id
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
        LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
        LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
        LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
        LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
        LEFT JOIN boost_profile_candidate bpc ON users.id = bpc.candidate_id 
        LEFT JOIN block_company bc ON bc.candidate_id = users.id AND bc.company_id = ?

      WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?)
      AND add_cart_candidate.company_id = ?
      AND bc.candidate_id IS NULL -- Ensure the user is not blocked by the company
      ORDER BY 
      CASE 
          WHEN bpc.candidate_id IS NOT NULL THEN 1 -- Boost profile users first
          ELSE 2 
      END, add_cart_candidate.created_at DESC
      LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [companyId, searchTerm, companyId, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Company Wise Shortlisted Candidate Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Company Wise Shortlisted Candidate data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Shortlisted candidate by admin
  getAllShortListedCandidateListByAdminUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const companyId = req.query.companyId || '';

      // Add filters dynamically
      let filterParams = [searchTerm]; // Base params

      // Query to get the total count of records with the search term
      let countQuery = `
      SELECT COUNT(*) AS total 
      FROM add_cart_candidate 
      JOIN users ON add_cart_candidate.candidate_id = users.id
      JOIN users companyUser ON add_cart_candidate.company_id = companyUser.id
      WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?)
    `;

      if (companyId) {
        countQuery += ' AND add_cart_candidate.company_id = ?';
        filterParams.push(companyId);
      }

      const countResult = await dbQueryAttributes(countQuery, filterParams);
      const totalRecords = countResult[0].total;

      let filterParamsQuery = [searchTerm]; // Base params


      // Query to get the paginated and filtered data
      let query = `
      SELECT 
        add_cart_candidate.*,
        users.first_name,
        users.last_name,
        users.date_of_birth,
        users.certified_status,
        users.created_at AS candidate_created_at,
        users.updated_at AS candidate_updated_at,
        users.email,
        users.mobile_number,
        users.profile_image,
        users.profile_resume,
        users.candidate_reg_id,
        companyUser.first_name AS company_name,
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
        cp.current_org_name,
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        cp.current_position_level_id,
        cp.functional_area_id,
        cp.organization_type_id,
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
        position_level.name AS position_level_name,
        fa.name AS functional_area_name,
        ot.name AS organization_type_name,
        attribute_price_list.price AS salary_range_price,
        bpc.status AS verified_status
      FROM add_cart_candidate
        JOIN users ON add_cart_candidate.candidate_id = users.id
        LEFT JOIN users companyUser ON add_cart_candidate.company_id = companyUser.id
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
        LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
        LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
        LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
        LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
        LEFT JOIN boost_profile_candidate bpc ON users.id = bpc.candidate_id 
      WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?)
      `;

      if (companyId) {
        query += ' AND add_cart_candidate.company_id = ?';
        filterParamsQuery.push(companyId);
      }

      query += ` ORDER BY 
      CASE 
          WHEN bpc.candidate_id IS NOT NULL THEN 1 -- Boost profile users first
          ELSE 2 
      END,
      add_cart_candidate.created_at DESC LIMIT ? OFFSET ?`;
      filterParamsQuery.push(limit, offset);

      const getAllAttributes = await dbQueryAttributes(query, filterParamsQuery);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Admin Wise Shortlisted Candidate Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Admin Wise Shortlisted Candidate data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Candidate User

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
      if (response.date_of_birth) {
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
            candidateBody.exp_exim_industry = response.exp_exim_industry + ' Year'
            candidateBody.exp_current_org = response.exp_current_org + ' Year'
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
                return res.status(201).json({ status: 201, message: 'Candidate created successfully', id: userId, candidateId: candidateId, addressId: addressId });
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
  getAllCandidateList: async (req, res, next) => {
    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const companyId = req.query.userId;
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const functionalAreaName = req.query.functionalAreaName || ''; // Default to empty string if not provided
      const organizationType = req.query.organizationType || '';
      const state = req.query.state || '';
      const city = req.query.city || '';
      const shippingExpertise = req.query.shippingExpertise || '';
      const salaryRange = req.query.salaryRange || '';
      const areaOfExpertise = req.query.areaOfExpertise || '';

      // Query to get the total count of records with the search term
      let countQuery = `
     SELECT COUNT(*) AS total 
     FROM users 
     LEFT JOIN addresses addr ON users.id = addr.user_id
     LEFT JOIN candidate_profile cp ON users.id = cp.user_id
     LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
     LEFT JOIN attributes orgtype ON cp.organization_type_id = orgtype.id
     WHERE 
       (
         LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(?) 
         OR LOWER(fa.name) LIKE LOWER(?) 
         OR LOWER(orgtype.name) LIKE LOWER(?)
       )
       AND users.user_type = 'candidateUser'
   `;

      // Add filters dynamically
      let filterParams = [searchTerm, searchTerm, searchTerm]; // Base params

      if (functionalAreaName) {
        countQuery += ' AND LOWER(fa.name) LIKE LOWER(?)';
        filterParams.push(`%${functionalAreaName}%`);
      }

      if (organizationType) {
        countQuery += ' AND LOWER(orgtype.id) LIKE LOWER(?)';
        filterParams.push(`%${organizationType}%`);
      }

      if (state) {
        countQuery += ' AND LOWER(addr.state) LIKE LOWER(?)';
        filterParams.push(`%${state}%`);
      }

      if (city) {
        countQuery += ' AND LOWER(addr.city) LIKE LOWER(?)';
        filterParams.push(`%${city}%`);
      }

      if (shippingExpertise) {
        countQuery += ' AND LOWER(cp.mode_shipment_expertise) LIKE LOWER(?)';
        filterParams.push(`%${shippingExpertise}%`);
      }

      // if (salaryRange) {
      //     countQuery += ' AND LOWER(vacancy.salary_range_id) LIKE LOWER(?)';
      //     filterParams.push(`%${salaryRange}%`);
      // }

      if (areaOfExpertise) {
        countQuery += ' AND LOWER(cp.area_expertise) LIKE LOWER(?)';
        filterParams.push(`%${areaOfExpertise}%`);
      }

      const countResult = await dbQueryAttributes(countQuery, filterParams);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      let query = `
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
        cp.current_org_name,
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        cp.current_position_level_id,
        cp.functional_area_id,
        cp.organization_type_id,
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
        position_level.name AS position_level_name,
        fa.name AS functional_area_name,
        ot.name AS organization_type_name,
        attribute_price_list.price AS salary_range_price,
              -- Cart status
    CASE 
      WHEN bpc.candidate_id IS NOT NULL AND bpc.candidate_id = users.id THEN bpc.status 
      ELSE 'Non-Membership' 
    END AS cart_status

      FROM users
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
        LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
        LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
        LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
        LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range
           -- Boost Profile status join
        LEFT JOIN boost_profile_candidate bpc ON bpc.candidate_id = users.id
      WHERE 
       (
         LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(?) 
         OR LOWER(fa.name) LIKE LOWER(?) 
         OR LOWER(ot.name) LIKE LOWER(?)
       )
       AND users.user_type = 'candidateUser'
      `;

      // Add filters dynamically
      let filterParamsQuery = [searchTerm, searchTerm, searchTerm]; // Base params

      if (functionalAreaName) {
        query += ' AND LOWER(fa.name) LIKE LOWER(?)';
        filterParamsQuery.push(`%${functionalAreaName}%`);
      }

      if (organizationType) {
        query += ' AND LOWER(ot.id) LIKE LOWER(?)';
        filterParamsQuery.push(`%${organizationType}%`);
      }

      if (state) {
        query += ' AND LOWER(addr.state) LIKE LOWER(?)';
        filterParamsQuery.push(`%${state}%`);
      }

      if (city) {
        query += ' AND LOWER(addr.city) LIKE LOWER(?)';
        filterParamsQuery.push(`%${city}%`);
      }

      if (shippingExpertise) {
        query += ' AND LOWER(cp.mode_shipment_expertise) LIKE LOWER(?)';
        filterParamsQuery.push(`%${shippingExpertise}%`);
      }

      // if (salaryRange) {
      //   query += ' AND LOWER(vacancy.salary_range_id) LIKE LOWER(?)';
      //   filterParamsQuery.push(`%${salaryRange}%`);
      // }

      if (areaOfExpertise) {
        query += ' AND LOWER(cp.area_expertise) LIKE LOWER(?)';
        filterParamsQuery.push(`%${areaOfExpertise}%`);
      }

      // Add pagination
      query += ` ORDER BY 
      CASE 
          WHEN bpc.candidate_id IS NOT NULL THEN 1 -- Boost profile users first
          ELSE 2 
      END,
      users.created_at DESC -- Recent users first
      LIMIT ? OFFSET ?`;
      filterParamsQuery.push(limit, offset);

      const getAllAttributes = await dbQueryAttributes(query, filterParamsQuery);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Candidate Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Candidate data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getCandidateUsersByUserId: async (req, res, next) => {

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
        cp.gender,
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
  updateCandidateUsersById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)
      const response = req.body

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      console.log('responseddd', response)

      let userBody = {}
      userBody.first_name = response.first_name
      userBody.last_name = response.last_name
      if (response.date_of_birth) {
        userBody.date_of_birth = await formatDate(response.date_of_birth)
      } else {
        userBody.date_of_birth = response.date_of_birth
      }
      userBody.password = response.password
      userBody.email = response.email
      userBody.mobile_number = response.mobile_number
      userBody.profile_image = response.profile_image
      userBody.profile_resume = response.profile_resume
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

      return res.status(201).json({ status: 201, message: 'Candidate updated successfully', data: results });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Boost Profile Candidate
  boostProfileByCandidateUser: async (req, res, next) => {
    console.log('body details', req.body)
    let response = req.body
    try {

      const id = generateUUID('bOoStPrOfIle')

      let expiryDate = new Date(Date.now());
      // Add 3 months to the current date
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      console.log('Expiry Date:', expiryDate);

      let boostProfileBody = {}
      boostProfileBody.id = id
      boostProfileBody.candidate_id = response.user_id
      boostProfileBody.payments_id = response.payments_id
      boostProfileBody.expiry_date = expiryDate
      boostProfileBody.amount = response.amount
      boostProfileBody.status = response.status

      const query = 'INSERT INTO boost_profile_candidate SET ?';
      const results = await dbQueryAttributes(query, [boostProfileBody]);

      console.log('resultsss', results)
      if (results.affectedRows > 0) {
        console.log(`Boos Profile Candidate '${id}' inserted into database.`, results);
        //   Respond with success message
        return res.status(201).json({ status: 201, message: `Your profile is successfully Boosted`, id: id });

      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ message: error.message, error: error.error || 'Unknown error occurred' });
    }
  },
  getBoostProfileByCandidateUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const userId = req.query.userId
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      if (!userId) {
        return res.status(404).json({ status: 404, message: 'id is not found' })
      }

      // Query to get the total count of records with the search term
      const countQuery = `
    SELECT COUNT(*) AS total 
    FROM users 
    WHERE LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(?) 
    AND user_type = 'candidateUser' AND id = ?;
  `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, userId]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
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
      cp.mode_shipment_expertise,
      cp.area_expertise,
      cp.last_salary,
      cp.notice_period,
      cp.current_position_level_id,
      cp.functional_area_id,
      cp.organization_type_id,
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
      position_level.name AS position_level_name,
      fa.name AS functional_area_name,
      ot.name AS organization_type_name,
      COALESCE(boostpc.status, 'Non-Membership') AS membership_status,
      boostpc.expiry_date AS membership_expiry_date,
      attribute_price_list.price AS salary_range_price
    FROM users
      LEFT JOIN addresses addr ON users.id = addr.user_id
      LEFT JOIN candidate_profile cp ON users.id = cp.user_id
      LEFT JOIN attributes education ON cp.education_id = education.id
      LEFT JOIN attributes stream ON cp.stream_id = stream.id
      LEFT JOIN attributes course ON cp.course_id = course.id
      LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
      LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
      LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
      LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
      LEFT JOIN boost_profile_candidate boostpc ON users.id = boostpc.candidate_id
      LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range

    WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?) 
      AND users.user_type = 'candidateUser' AND users.id = ?
    LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, userId, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Boost Profile Candidate Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Boost Profile Candidate data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  // For Admin Access all boost candidates lists
  getBoostProfileListsAllCandidateUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `
    SELECT COUNT(*) AS total 
    FROM users 
    WHERE LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(?) 
    AND user_type = 'candidateUser';
  `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
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
      cp.mode_shipment_expertise,
      cp.area_expertise,
      cp.last_salary,
      cp.notice_period,
      cp.current_position_level_id,
      cp.functional_area_id,
      cp.organization_type_id,
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
      position_level.name AS position_level_name,
      fa.name AS functional_area_name,
      ot.name AS organization_type_name,
      COALESCE(boostpc.status, 'Non-Membership') AS membership_status,
      boostpc.expiry_date AS membership_expiry_date
    FROM users
      LEFT JOIN addresses addr ON users.id = addr.user_id
      LEFT JOIN candidate_profile cp ON users.id = cp.user_id
      LEFT JOIN attributes education ON cp.education_id = education.id
      LEFT JOIN attributes stream ON cp.stream_id = stream.id
      LEFT JOIN attributes course ON cp.course_id = course.id
      LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
      LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
      LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
      LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
      LEFT JOIN boost_profile_candidate boostpc ON users.id = boostpc.candidate_id

    WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?) 
      AND users.user_type = 'candidateUser'
    LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Boost Profile Candidate Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Boost Profile Candidate data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Company List For Candidate Panel
  getAllCompanyUserList: async (req, res, next) => {

    try {

      // Extract ID from request query
      const userType = req.query.userType
      const search = req.query.search || ''; // Default to an empty string if not provided
      const searchTerm = `%${search}%`;
      console.log('userType', userType)

      if (!userType) {
        return res.status(400).json({ status: 400, error: 'userType not found' });
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
      WHERE LOWER(users.first_name) LIKE LOWER(?) AND users.user_type = ?
      ORDER BY users.first_name ASC
    `;

      const results = await dbQueryAttributes(query, [searchTerm, userType]);

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      // Execute the query directly
      return res.status(201).json({ status: 201, message: 'Users data By User Type fetched successfully', data: results, total: results.length });


    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },



  // Payment History Related Candidate And Company And Admin
  getAllCandidateUserPaymentHistory: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `
    SELECT COUNT(*) AS total 
    FROM payments 
    WHERE LOWER(name) LIKE LOWER(?) 
    AND user_type = 'candidateUser';
  `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
    SELECT 
      payments.*,
      candidateUser.first_name AS candidate_first_name,
      candidateUser.last_name AS candidate_last_name,
      candidateUser.date_of_birth AS candidate_date_of_birth,
      candidateUser.email AS candidate_email,
      candidateUser.mobile_number AS candidate_mobile_number,
      candidateUser.profile_image AS candidate_profile_image,
      candidateUser.profile_resume AS candidate_profile_resume,
      addr.location,
      addr.nearest_station,
      addr.country,
      addr.state,
      addr.city,
      addr.pin_code
    FROM payments
    LEFT JOIN users candidateUser ON payments.user_id = candidateUser.id
    LEFT JOIN addresses addr ON candidateUser.id = addr.user_id
    WHERE LOWER(payments.name) LIKE LOWER(?) 
      AND payments.user_type = 'candidateUser'
    ORDER BY payments.created_at DESC LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Candidate Payment History Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Candidate Payment History data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllCompanyUserPaymentHistory: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `
    SELECT COUNT(*) AS total 
    FROM payments 
    WHERE LOWER(name) LIKE LOWER(?) 
    AND user_type = 'companyUser';
  `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
    SELECT 
      payments.*,
      JSON_ARRAYAGG(
          JSON_OBJECT(
            'candidate_id', add_cart_candidate.candidate_id,
            'status', add_cart_candidate.status,
            'amount', add_cart_candidate.amount,
            'first_name', users.first_name,
            'last_name', users.last_name
          )
        ) AS candidates,
      companyUser.first_name AS company_first_name,
      companyUser.last_name AS company_last_name,
      companyUser.date_of_birth AS company_date_of_birth,
      companyUser.email AS company_email,
      companyUser.mobile_number AS company_mobile_number,
      companyUser.profile_image AS company_profile_image,
      companyUser.profile_resume AS company_profile_resume,
      addr.location,
      addr.nearest_station,
      addr.country,
      addr.state,
      addr.city,
      addr.pin_code
    FROM payments
    LEFT JOIN add_cart_candidate ON payments.id = add_cart_candidate.payments_id
    LEFT JOIN users ON add_cart_candidate.candidate_id = users.id
    LEFT JOIN users companyUser ON payments.user_id = companyUser.id
    LEFT JOIN addresses addr ON companyUser.id = addr.user_id
    WHERE LOWER(payments.name) LIKE LOWER(?) 
      AND payments.user_type = 'companyUser'
      GROUP BY payments.id, companyUser.first_name, companyUser.last_name, companyUser.date_of_birth, 
         companyUser.email, companyUser.mobile_number, companyUser.profile_image, 
         companyUser.profile_resume, addr.location, addr.nearest_station, addr.country, 
         addr.state, addr.city, addr.pin_code
    ORDER BY payments.created_at DESC LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Company Payment History Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Company Payment History data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Company Payment History By Company User
  getAllCompanyPaymentHistoryByCompanyUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const userId = req.query.userId;

      // Query to get the total count of records with the search term
      const countQuery = `
    SELECT COUNT(*) AS total 
    FROM payments 
    WHERE LOWER(name) LIKE LOWER(?) 
    AND payments.user_type = 'companyUser' AND payments.user_id = ?;
  `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, userId]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
    SELECT 
      payments.*,
      JSON_ARRAYAGG(
          JSON_OBJECT(
            'candidate_id', add_cart_candidate.candidate_id,
            'status', add_cart_candidate.status,
            'amount', add_cart_candidate.amount,
            'first_name', users.first_name,
            'last_name', users.last_name
          )
        ) AS candidates,
      companyUser.first_name AS company_first_name,
      companyUser.last_name AS company_last_name,
      companyUser.date_of_birth AS company_date_of_birth,
      companyUser.email AS company_email,
      companyUser.mobile_number AS company_mobile_number,
      companyUser.profile_image AS company_profile_image,
      companyUser.profile_resume AS company_profile_resume,
      addr.location,
      addr.nearest_station,
      addr.country,
      addr.state,
      addr.city,
      addr.pin_code
    FROM payments
    LEFT JOIN add_cart_candidate ON payments.id = add_cart_candidate.payments_id
    LEFT JOIN users ON add_cart_candidate.candidate_id = users.id
    LEFT JOIN users companyUser ON payments.user_id = companyUser.id
    LEFT JOIN addresses addr ON companyUser.id = addr.user_id
    WHERE LOWER(payments.name) LIKE LOWER(?) 
      AND payments.user_type = 'companyUser'
      AND payments.user_id = ?
      GROUP BY payments.id, companyUser.first_name, companyUser.last_name, companyUser.date_of_birth, 
         companyUser.email, companyUser.mobile_number, companyUser.profile_image, 
         companyUser.profile_resume, addr.location, addr.nearest_station, addr.country, 
         addr.state, addr.city, addr.pin_code
    ORDER BY payments.created_at DESC LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, userId, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Company Wise Payment History Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Company Wise Payment History data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllCandidatePaymentHistoryByCandidateUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const userId = req.query.userId;

      // Query to get the total count of records with the search term
      const countQuery = `
    SELECT COUNT(*) AS total 
    FROM payments 
    WHERE LOWER(name) LIKE LOWER(?) 
    AND user_type = 'candidateUser' AND payments.user_id = ?;
  `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm, userId]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
    SELECT 
      payments.*,
      candidateUser.first_name AS candidate_first_name,
      candidateUser.last_name AS candidate_last_name,
      candidateUser.date_of_birth AS candidate_date_of_birth,
      candidateUser.email AS candidate_email,
      candidateUser.mobile_number AS candidate_mobile_number,
      candidateUser.profile_image AS candidate_profile_image,
      candidateUser.profile_resume AS candidate_profile_resume,
      addr.location,
      addr.nearest_station,
      addr.country,
      addr.state,
      addr.city,
      addr.pin_code
    FROM payments
    LEFT JOIN users candidateUser ON payments.user_id = candidateUser.id
    LEFT JOIN addresses addr ON candidateUser.id = addr.user_id
    WHERE LOWER(payments.name) LIKE LOWER(?) 
      AND payments.user_type = 'candidateUser' AND payments.user_id = ?
    ORDER BY payments.created_at DESC LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [searchTerm, userId, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Candidate Wise Payment History Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Candidate Wise Payment History data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },


  deleteUserByUserId: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the delete query
      const query = 'DELETE FROM users WHERE id = ?';
      // Execute the query directly
      dbConnection.query(query, [id], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ status: 404, error: 'User data not found' });
        }

        console.log(`Users with ID '${id}' deleted successfully.`);
        res.status(201).json({ status: 201, message: 'User deleted successfully', data: results });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  getAllVerifiedCandidateListByAdmin: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;
      const companyId = req.query.userId;


      // Query to get the total count of records with the search term
      const countQuery = `
      SELECT COUNT(*) AS total 
      FROM boost_profile_candidate 
      JOIN users ON boost_profile_candidate.candidate_id = users.id
      WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?)
    `;
      const countResult = await dbQueryAttributes(countQuery, [searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `
      SELECT 
        boost_profile_candidate.*,
        users.first_name,
        users.last_name,
        users.date_of_birth,
        users.email,
        users.mobile_number,
        users.profile_image,
        users.profile_resume,
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
        cp.current_org_name,
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        cp.current_position_level_id,
        cp.functional_area_id,
        cp.organization_type_id,
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
        position_level.name AS position_level_name,
        fa.name AS functional_area_name,
        ot.name AS organization_type_name,
        attribute_price_list.price AS salary_range_price,
      FROM boost_profile_candidate
        JOIN users ON boost_profile_candidate.candidate_id = users.id
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
        LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
        LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
        LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
        LEFT JOIN attribute_price_list ON cp.last_salary BETWEEN attribute_price_list.min_range AND attribute_price_list.max_range

      WHERE LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(?) 
      LIMIT ? OFFSET ?`;

      const getAllAttributes = await dbQueryAttributes(query, [companyId, searchTerm, limit, offset]);

      console.log("getAllAttributes", getAllAttributes)

      if (getAllAttributes.length > 0) {
        //   Respond with success message
        res.status(201).json({
          status: 201,
          message: 'Candidate Boost Profile Data Fetched successfully',
          data: getAllAttributes,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(201).json({
          status: 201,
          error: 'not found',
          data: getAllAttributes,
          message: 'Candidate Boost Profile data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  deleteAppliedCandidateById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the delete query
      const query = 'DELETE FROM applied_jobs_candidate WHERE id = ?';
      // Execute the query directly
      dbConnection.query(query, [id], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ status: 404, error: 'User data not found' });
        }

        console.log(`Users with ID '${id}' deleted successfully.`);
        res.status(201).json({ status: 201, message: 'Candidate deleted successfully', data: results });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  getAllCompanyDataExportByAdmin: async (req, res, next) => {

    try {

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
      WHERE users.user_type = 'companyUser'
      ORDER BY users.first_name ASC
    `;

      const results = await dbQueryAttributes(query, []);

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      if (results.length > 0) {

        const csvData = results.map((row) => ({
          ID: 'COMP000' + row.company_reg_id,
          companyName: row.first_name,
          organizationType: row.organization_type,
          companyConstitution: row.company_constitution,
          companySinceYear: row.company_since_year,
          properitorName: row.prop_name,
          properitorPosition: row.prop_position,
          authorizedPersonName: row.authorized_name,
          authorizedPersonDesignation: row.auth_designation,
          mobileNumber: row.mobile_number,
          telephone: row.telephone,
          whatsappNumber: row.whatsapp_number,
          location: row.location,
          nearestStation: row.nearest_station,
          country: row.country,
          state: row.state,
          city: row.city,
          pinCode: row.pin_code,
        }));

        // Convert the data to a worksheet
        const worksheet = xlsx.utils.json_to_sheet(csvData);

        // Create a new workbook and append the worksheet
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Write the data to a CSV file
        const csvOutput = xlsx.utils.sheet_to_csv(worksheet);

        // Save the CSV file
        fs.writeFileSync("file.csv", csvOutput);

        // Set response headers for a file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
        res.send(csvOutput);
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllCandidateDataExportByAdmin: async (req, res, next) => {

    try {

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
        cp.current_org_name,
        cp.mode_shipment_expertise,
        cp.area_expertise,
        cp.last_salary,
        cp.notice_period,
        cp.current_position_level_id,
        cp.functional_area_id,
        cp.organization_type_id,
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
        position_level.name AS position_level_name,
        fa.name AS functional_area_name,
        ot.name AS organization_type_name
      FROM users
        LEFT JOIN addresses addr ON users.id = addr.user_id
        LEFT JOIN candidate_profile cp ON users.id = cp.user_id
        LEFT JOIN attributes education ON cp.education_id = education.id
        LEFT JOIN attributes stream ON cp.stream_id = stream.id
        LEFT JOIN attributes course ON cp.course_id = course.id
        LEFT JOIN attributes specialization ON cp.specialization_id = specialization.id
        LEFT JOIN attributes position_level ON cp.current_position_level_id = position_level.id
        LEFT JOIN attributes ot ON cp.organization_type_id = ot.id
        LEFT JOIN functional_area fa ON cp.functional_area_id = fa.id
      WHERE users.user_type = 'candidateUser'
      ORDER BY users.first_name ASC
    `;

      const results = await dbQueryAttributes(query, []);

      if (results.length === 0) {
        return res.status(201).json({ status: 201, error: 'Users data not found', total: results.length });
      }

      if (results.length > 0) {

        const csvData = results.map((row) => ({
          ID: 'CAND000' + row.candidate_reg_id,
          candidateName: row.first_name + ' ' + row.last_name,
          dateOfBirth: row.date_of_birth,
          Age: row.age,
          mobileNumber: row.mobile_number,
          whatsappNumber: row.whatsapp_number,
          experienceInEximIndustry: row.exp_exim_industry + ' Years',
          experienceInCurrentOrganization: row.exp_current_org + ' Years',
          currentOrganizationName: row.current_org_name,
          shipmentExpertise: row.mode_shipment_expertise,
          areaExpertise: row.area_expertise,
          salary: row.last_salary,
          noticePeriod: row.notice_period,
          educationName: row.education_name,
          streamName: row.stream_name,
          courseName: row.course_name,
          specializationName: row.specialization_name,
          positionLevel: row.position_level_name,
          functionalAreaName: row.functional_area_name,
          organizationTypeName: row.organization_type_name,
          location: row.location,
          nearestStation: row.nearest_station,
          country: row.country,
          state: row.state,
          city: row.city,
          pinCode: row.pin_code,
        }));

        // Convert the data to a worksheet
        const worksheet = xlsx.utils.json_to_sheet(csvData);

        // Create a new workbook and append the worksheet
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Write the data to a CSV file
        const csvOutput = xlsx.utils.sheet_to_csv(worksheet);

        // Save the CSV file
        fs.writeFileSync("file.csv", csvOutput);

        // Set response headers for a file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
        res.send(csvOutput);
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  updateCertifiedStatusById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)
      let response = req.body

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      let userBody = {}
      userBody.certified_status = response.certified_status;

      // Define the update query
      const query = 'UPDATE users SET ? WHERE id = ?';
      // Execute the query directly
      const results = await dbQueryAttributes(query, [userBody, id]);

      if (results.affectedRows > 0) {
        return res.status(201).json({ status: 201, message: 'Candidate status updated successfully', data: results });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  updateActivationStatusById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.userId;
      console.log('idddd', req.params.userId)
      let response = req.body

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      let userBody = {}
      userBody.activation_status = response.activation_status;

      // Define the update query
      const query = 'UPDATE users SET ? WHERE id = ?';
      // Execute the query directly
      const results = await dbQueryAttributes(query, [userBody, id]);

      if (results.affectedRows > 0) {
        return res.status(201).json({ status: 201, message: 'Activation status updated successfully', data: results });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },







  deleteAttributesById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.attributeId;
      console.log('idddd', req.params.attributeId)

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the delete query
      const query = 'DELETE FROM attributes WHERE id = ?';
      // Execute the query directly
      const results = await dbQueryAttributes(query, [id]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ status: 404, error: 'Attirbutes data not found' });
      }

      res.status(201).json({ status: 201, message: 'Attributes data deleted successfully', data: results });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Instructor Create
  createInstructor: async (req, res, next) => {
    const { user_name, password, email, mobile_number, user_role, is_approved, status } = req.body;
    const id = generateUUID('inStRUctOrUsER')
    console.log('idddd', id)
    // Check for missing fields
    if (!user_name || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {

      bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
          return reject(err);
        }

        const query = 'INSERT INTO users (id, user_name, password, email, mobile_number, user_role, is_approved, status) VALUES (?,?,?,?,?,?,?,?)';
        const values = [id, user_name, hashedPassword, email, mobile_number, user_role, is_approved, status];

        const results = await createAttributes(dbConnection, values, query);
        console.log('resultsss', results)

        if (results) {
          console.log(`Instructor '${id}' inserted into database.`, results);
          //   Respond with success message
          res.status(200).json({ status: 200, message: 'Instructor created successfully', instructorId: id });
        }
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllUserByRoleTypeInstructor: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `SELECT COUNT(*) AS total FROM users WHERE user_role = 'instructor' AND user_name LIKE ?`;
      const countResult = await getAllAttributes(countQuery, [searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `SELECT * FROM users WHERE user_role = 'instructor' AND user_name LIKE ? LIMIT ? OFFSET ?`;
      const getAllRoleTypeInstructor = await getAllAttributes(query, [searchTerm, limit, offset]);

      console.log("getAllRoleTypeInstructor", getAllRoleTypeInstructor)

      if (getAllRoleTypeInstructor) {
        //   Respond with success message
        res.status(200).json({
          status: 200,
          message: 'Role Type Instructor Data successfully',
          data: getAllRoleTypeInstructor,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(200).json({
          status: 200,
          error: 'not found',
          data: getAllRoleTypeInstructor,
          message: 'Role Type Instructor data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllInstructorById: async (req, res, next) => {

    try {

      // Extract ID from request params
      const id = req.params.instructorId
      console.log('idddd', req.params.instructorId)

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
          return res.status(404).json({ status: 404, error: 'Instructor data not found' });
        }

        console.log(`Instructor with ID '${id}' fetched successfully.`, results[0]);
        res.status(200).json({ status: 200, message: 'Instructor data fetched successfully', data: results[0] });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  updateInstructorById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.instructorId;
      console.log('idddd', req.params.instructorId)
      const { user_name, email, mobile_number, is_approved, status } = req.body;

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the update query
      const query = 'UPDATE users SET user_name = ?, email = ?, mobile_number = ?, is_approved = ?, status = ? WHERE id = ?';
      const values = [user_name, email, mobile_number, is_approved, status, id];
      // Execute the query directly
      dbConnection.query(query, values, (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ status: 404, error: 'Instructor data not found' });
        }

        console.log(`Instructor with ID '${id}' updated successfully.`);
        res.status(200).json({ status: 200, message: 'Instructor data updated successfully', data: results });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  deleteInstructorById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.instructorId;
      console.log('idddd', req.params.instructorId)

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the delete query
      const query = 'DELETE FROM users WHERE id = ?';
      // Execute the query directly
      dbConnection.query(query, [id], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ status: 404, error: 'Instructor data not found' });
        }

        console.log(`Instructor with ID '${id}' deleted successfully.`);
        res.status(200).json({ status: 200, message: 'Instructor data deleted successfully', data: results });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllInstructorByActivate: async (req, res, next) => {

    try {

      // Define the query
      const query = 'SELECT * FROM users WHERE user_role = ? AND is_approved = ?';
      const values = ['instructor', true];

      // Execute the query directly
      dbConnection.query(query, values, (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }
        if (results.length === 0) {
          return res.status(404).json({ status: 404, error: 'Instructor data not found' });
        }

        console.log(`Instructor with activated fetched successfully.`, results);
        res.status(200).json({ status: 200, message: 'Instructor data fetched successfully', instructorData: results });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  // Subscribe User
  createSubscribeUser: async (req, res, next) => {
    const { user_name, password, email, mobile_number, user_role, is_approved, status } = req.body;
    const id = generateUUID('sUbScRIbeUsEr')
    console.log('idddd', id)
    // Check for missing fields
    if (!user_name || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {

      bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
          return reject(err);
        }

        const query = 'INSERT INTO users (id, user_name, password, email, mobile_number, user_role, is_approved, status) VALUES (?,?,?,?,?,?,?,?)';
        const values = [id, user_name, hashedPassword, email, mobile_number, user_role, is_approved, status];

        const results = await createAttributes(dbConnection, values, query);
        console.log('resultsss', results)

        if (results) {
          console.log(`Subscribe User '${id}' inserted into database.`, results);
          //   Respond with success message
          res.status(200).json({ status: 200, message: 'Subscirbe User created successfully', subscibeUserId: id });
        }
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllUserByRoleTypeUser: async (req, res, next) => {

    try {
      console.log('req.query', req.query)
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
      const search = req.query.search || ''; // Default to an empty string if not provided
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Query to get the total count of records with the search term
      const countQuery = `SELECT COUNT(*) AS total FROM users WHERE user_role = 'user' AND user_name LIKE ?`;
      const countResult = await getAllAttributes(countQuery, [searchTerm]);
      const totalRecords = countResult[0].total;

      // Query to get the paginated and filtered data
      const query = `SELECT * FROM users WHERE user_role = 'user' AND user_name LIKE ? LIMIT ? OFFSET ?`;
      const getAllRoleTypeUser = await getAllAttributes(query, [searchTerm, limit, offset]);

      console.log("getAllRoleTypeUser", getAllRoleTypeUser)

      if (getAllRoleTypeUser) {
        //   Respond with success message
        res.status(200).json({
          status: 200,
          message: 'Role Type User Data successfully',
          data: getAllRoleTypeUser,
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });

      } else {
        res.status(200).json({
          status: 200,
          error: 'not found',
          data: getAllRoleTypeUser,
          message: 'Role Type User data not found in database',
          pagination: {
            totalRecords: totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit)
          }
        });
      }

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  getAllSubscribeUserById: async (req, res, next) => {

    try {

      // Extract ID from request params
      const id = req.params.subscribeuserId
      console.log('idddd', req.params.subscribeuserId)

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
          return res.status(404).json({ status: 404, error: 'Subscribe User data not found' });
        }

        console.log(`Subscribe User with ID '${id}' fetched successfully.`, results[0]);
        res.status(200).json({ status: 200, message: 'Subscribe User data fetched successfully', data: results[0] });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  updateSubscribeUserById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.subscribeuserId;
      console.log('idddd', req.params.subscribeuserId)
      const { user_name, email, mobile_number, is_approved, status } = req.body;

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the update query
      const query = 'UPDATE users SET user_name = ?, email = ?, mobile_number = ?, is_approved = ?, status = ? WHERE id = ?';
      const values = [user_name, email, mobile_number, is_approved, status, id];
      // Execute the query directly
      dbConnection.query(query, values, (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ status: 404, error: 'Subscribe User data not found' });
        }

        console.log(`Subscribe User with ID '${id}' updated successfully.`);
        res.status(200).json({ status: 200, message: 'Subscribe User data updated successfully', data: results });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },
  deleteSubscribeUserById: async (req, res, next) => {

    try {

      // ID from request params
      const id = req.params.subscribeuserId;
      console.log('idddd', req.params.subscribeuserId)

      if (!id) {
        return res.status(400).json({ status: 400, error: 'ID not found' });
      }

      // Define the delete query
      const query = 'DELETE FROM users WHERE id = ?';
      // Execute the query directly
      dbConnection.query(query, [id], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ status: 500, error: 'Database error occurred' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ status: 404, error: 'Subscribe User data not found' });
        }

        console.log(`Subscirbe User with ID '${id}' deleted successfully.`);
        res.status(200).json({ status: 200, message: 'Subscribe User data deleted successfully', data: results });
      });

    } catch (error) {
      console.log('error', error)
      res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
    }
  },

  verifySubscribeUser: async (req, res, next) => {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      return res.status(400).json({ status: 400, message: 'Email and password are required', error: 'Email and password are required' });
    }

    try {
      // Find the user by username email
      const query = 'SELECT * FROM users WHERE email = ?';
      const values = [email]

      const userData = await getAllAttributes(query, values);

      if (userData.length == 0) {
        return res.status(404).json({ status: 404, message: 'User not found', error: 'User not found' });
      }

      // Compare the provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, userData[0].password);

      if (!isMatch) {
        return res.status(402).json({ status: 402, error: "Incorrect password", message: "Incorrect password" });
      }
      // Respond with success message
      req.user = userData[0]
      next()

    } catch (error) {
      // Handle errors
      console.error('Error verify in user:', error);
      res.status(error.status || 500).json({ status: error.status, error: error.error || 'Internal Server Error', message: error.message });
    }
  },
  loginSubscribeUser: async (req, res, next) => {
    const user = req.user
    const token = req.token

    console.log('userss', user)
    try {

      // const userDeviceInfo = await userDevice.findUserDeviceInfoById(req, res, next);

      // if (!userDeviceInfo) {
      //   return res.status(404).json({ status: 404, message: 'User Device Info not found', error: 'User Device Info not found' });
      // }

      const query = 'UPDATE users SET is_login = ? WHERE id = ?';
      const values = [1, user.id];  // Replace userId with the actual user ID you want to update

      const userUpdate = await getAllAttributes(query, values);
      console.log('userupdata', userUpdate)

      if (userUpdate.affectedRows > 0) {
        // Find the user by username email
        const findQuery = 'SELECT * FROM users WHERE id = ?';

        const userData = await getAllAttributes(findQuery, [user.id]);

        if (userData.affectedRows == 0) {
          return res.status(404).json({ status: 404, message: 'User not found', error: 'User not found' });
        }

        res.status(200).json({ status: 200, message: 'Login successful', userId: userData[0].id, user: userData[0], token: token });
      }

    } catch (error) {
      // Handle errors
      console.error('Error logging in user:', error);
      res.status(error.status || 500).json({ status: error.status, error: error.error || 'Internal Server Error', message: error.message });
    }
  },


};



async function createMultipleCandidateAddToCartByCompany(dbConnection, orderId, productOrderData) {
  if (productOrderData.length > 0) {
    const productOrderQueries = productOrderData.map(async productOrder => {
      console.log('productsafdjsk', productOrder)
      let productOrderBody = {};
      const productOrderId = generateUUID('pRoDUctOrdEr')
      productOrderBody.id = productOrderId
      productOrderBody.order_id = orderId
      productOrderBody.product_id = productOrder.product_id
      productOrderBody.product_name = productOrder.product_name
      productOrderBody.quantity = productOrder.quantity
      productOrderBody.price = productOrder.price
      productOrderBody.tax_rate = productOrder.tax_rate
      productOrderBody.gst_amount = productOrder.gst_amount
      productOrderBody.total_amount = productOrder.total_amount
      productOrderBody.grand_total = productOrder.grand_total

      const createQuery = `INSERT INTO product_orders SET ?`;
      return new Promise((resolve, reject) => {
        dbConnection.query(createQuery, [productOrderBody], (err, result) => {
          if (err) return reject(err);
          resolve({ id: productOrderId, grand_total: productOrder.grand_total, gst_amount: productOrder.gst_amount, total_amount: productOrder.total_amount });
        });
      });
    })

    try {
      const createProductOrder = await Promise.all(productOrderQueries);
      console.log('createfjsdkafjklsdjfksdlfwe', createProductOrder)
      return createProductOrder;
    } catch (error) {
      console.error('Error createing product orders:', error);
      throw error; // Throw the error to be caught by the caller
    }
  }

}

// Function to create if attributes not exists
async function createAttributes(dbConnection, values, query) {
  return new Promise((resolve, reject) => {
    dbConnection.query(query, values, (err, results) => {
      console.log('error', err)
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          // Handle duplicate entry error specifically
          reject({
            status: 409, // HTTP status code for Conflict
            error: 'Duplicate',
            message: 'Duplicate entry error: The data already exists in the database.'
          });
        } else {
          // Handle other types of errors
          reject({
            status: 500, // Internal Server Error
            message: err.message || 'An unknown error occurred.'
          });
        }
      } else {
        console.log('resultsss', results)
        resolve(results);
      }
    });
  });
}

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

export { userController };
