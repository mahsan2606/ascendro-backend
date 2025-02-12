import { dbConnection } from '../../config/db_connection.js';
import { generateUUID } from '../../middleware/uuidGenerator.js';
import bcrypt from 'bcrypt';


const settingController = {
    // my account update
    updateMyAccountByUserId: async (req, res, next) => {

        try {

            // ID from request params
            const id = req.params.userId;
            console.log('idddd', req.params.userId)
            const response = req.body;

            const { user_name, email, mobile_number, image_url, date_of_birth, gender, location, country, state, city, pin_code } = req.body;

            if (!id) {
                return res.status(400).json({ status: 400, error: 'ID not found' });
            }
            let userBody = {};
            userBody.first_name = response.first_name
            userBody.last_name = response.last_name
            userBody.email = response.email
            userBody.mobile_number = response.mobile_number
            userBody.profile_image = response.profile_image

            // Define the update query
            const query = 'UPDATE users SET ? WHERE id = ?';
            const values = [userBody, id];

            const results = await dbQueryAttributes(values, query);
            console.log('resultsss', results)

            if (results.affectedRows > 0) {
                console.log(`My Account with ID '${id}' updated successfully.`);
                const query = 'SELECT * FROM addresses WHERE user_id = ?';
                const values = [id];
                const addressData = await dbQueryAttributes(values, query);
                if (addressData.length > 0) {
                    console.log('addressdatass', addressData, addressData[0].id)
                    // Define the update query
                    const query = 'UPDATE addresses SET location = ?, country = ?, state = ?, city = ?, pin_code = ? WHERE id = ?';
                    const values = [location, country, state, city, pin_code, addressData[0].id];

                    const updateAddress = await dbQueryAttributes(values, query);
                    console.log('update address', updateAddress)

                    if (updateAddress) {
                        //   Respond with success message
                        res.status(200).json({ status: 200, message: 'My Account data updated successfully', data: results, addressData: updateAddress });
                    }
                } else {
                    const addressId = generateUUID('aDdrEssEs')
                    console.log('address id', addressId)
                    const query = 'INSERT INTO addresses (id, location, country, state, city, pin_code, user_id) VALUES (?,?,?,?,?,?,?)';
                    const values = [addressId, location, country, state, city, pin_code, id];
                    const resultAddress = await dbQueryAttributes(values, query);

                    if (resultAddress) {
                        //   Respond with success message
                        res.status(200).json({ status: 200, message: 'My Account data updated successfully', data: results, addressData: resultAddress });
                    }

                }

            }

        } catch (error) {
            console.log('error', error)
            res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
        }
    },
    getMyAccountByUserId: async (req, res, next) => {

        try {

            // Extract ID from request params
            const id = req.params.userId
            console.log('idddd', req.params.userId)

            if (!id) {
                return res.status(400).json({ status: 400, error: 'ID not found' });
            }

            // Define the query
            const query = `
          SELECT users.*, addresses.location, addresses.country, addresses.state, addresses.city, addresses.state, addresses.pin_code
          FROM users
          LEFT JOIN addresses ON users.id = addresses.user_id
          WHERE users.id = ?
        `;

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
                res.status(200).json({ status: 200, message: 'Login User data fetched successfully', data: results[0] });
            });

        } catch (error) {
            console.log('error', error)
            res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
        }
    },
    ChangePasswordByUserId: async (req, res, next) => {

        try {

            // ID from request params
            const id = req.params.userId;
            console.log('idddd', req.params.userId)

            const { old_password, new_password } = req.body;

            if (!id) {
                return res.status(400).json({ status: 400, error: 'ID not found' });
            }

            const query = 'SELECT * FROM users WHERE id = ?';
            const values = [id];
            const userData = await dbQueryAttributes(values, query);
            // console.log('userdata', userData, userData[0].password)

            if (userData.length > 0) {
                // const isMatch = await bcrypt.compare(old_password, userData[0].password);

                // if (!isMatch) {
                //     return res.status(402).json({ status: 402, error: "Incorrect password", message: "Incorrect password" });
                // }

                if (old_password !== userData[0].password) {
                    return res.status(402).json({ status: 402, error: "Incorrect password", message: "Incorrect password" });
                }

                // Define the update query
                const query = 'UPDATE users SET password = ? WHERE id = ?';
                const values = [new_password, id];

                const passwordUpdate = await dbQueryAttributes(values, query);
                console.log('passwordUpdate', passwordUpdate)

                if (passwordUpdate.affectedRows > 0) {
                    //   Respond with success message
                    res.status(200).json({ status: 200, message: 'Password Changed successfully' });
                }

                // bcrypt.hash(new_password, 10, async (err, hashedPassword) => {
                //     if (err) {
                //         return res.status(501).json({ status: 401, error: err, message: 'New password generating error ' });
                //     }
                // });
            }

        } catch (error) {
            console.log('error', error)
            res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
        }
    },
    // my account update
    logOutMyAccountByUserId: async (req, res, next) => {

        try {

            // ID from request params
            const id = req.params.userId;
            console.log('idddd', req.params.userId)

            if (!id) {
                return res.status(400).json({ status: 400, error: 'ID not found' });
            }

            // Define the update query
            const query = 'UPDATE users SET is_login = ? WHERE id = ?';
            const values = [false, id];

            const results = await dbQueryAttributes(values, query);
            console.log('resultsss', results)

            if (results.affectedRows > 0) {
                console.log(`My Account with ID '${id}' updated successfully.`);
                return res.status(200).json({ status: 200, message: 'User logout successfully', data: results });
            }

        } catch (error) {
            console.log('error', error)
            res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
        }
    },

    deleteMyAccountById: async (req, res, next) => {

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

                console.log(`Account with User ID '${id}' deleted successfully.`);
                return res.status(200).json({ status: 200, message: 'Account deleted successfully', data: results });
            });

        } catch (error) {
            console.log('error', error)
            res.status(error.status || 500).json({ error: error.message || 'Unknown error occurred' });
        }
    },



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

                const results = await dbQueryAttributes(values, query);
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
            const countResult = await getAllAttributes(dbConnection, countQuery, [searchTerm]);
            const totalRecords = countResult[0].total;

            // Query to get the paginated and filtered data
            const query = `SELECT * FROM users WHERE user_role = 'instructor' AND user_name LIKE ? LIMIT ? OFFSET ?`;
            const getAllRoleTypeInstructor = await getAllAttributes(dbConnection, query, [searchTerm, limit, offset]);

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

                const results = await dbQueryAttributes(values, query);
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
            const countResult = await getAllAttributes(dbConnection, countQuery, [searchTerm]);
            const totalRecords = countResult[0].total;

            // Query to get the paginated and filtered data
            const query = `SELECT * FROM users WHERE user_role = 'user' AND user_name LIKE ? LIMIT ? OFFSET ?`;
            const getAllRoleTypeUser = await getAllAttributes(dbConnection, query, [searchTerm, limit, offset]);

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


};

// Function to create if attributes not exists
async function dbQueryAttributes(values, query) {
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
                // console.log('resultsss', results)
                resolve(results);
            }
        });
    });
}

// Function to get all attributes with pagination and search
async function getAllAttributes(dbConnection, query, params = []) {
    return new Promise((resolve, reject) => {
        dbConnection.query(query, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
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

export { settingController };
