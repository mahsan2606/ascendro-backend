import express from 'express';
import jwt, { decode } from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
const app = express();
app.use(cookieParser());

const JWT_SECRET = 'SECRET_KEY'; // Use the same secret key as in your authController

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;  // for local storage get token
    console.log("req.header", authHeader)

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing', message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token missing', message: 'Please login to access' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("decodedn token", decoded)
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('JWT verification failed:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const generateToken = async (req, res, next) => {
    try {
        // Generate a token based on the verified user (req.user)
        const token = await new Promise((resolve, reject) => {
            jwt.sign({
                userId: req.user.id,
                email: req.user.email
            }, JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });

        // console.log('token', token)
        req.token = token; // Attach token to request for use in loginUser or subsequent middleware/route handlers
        next();
    } catch (error) {
        console.error('Error in tokenGenerate middleware:', error);
        res.status(500).json({ error: error, message: "Error in tokenGenerate middleware" });
    }
};

export { generateToken, verifyToken };
