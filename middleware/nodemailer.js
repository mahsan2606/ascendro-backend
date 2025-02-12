import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const app = express();


// Initialize the transporter once with pooling
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Max number of connections in the pool
    maxMessages: 100 // Max number of messages to send with a single connection
});

export async function sendEmailRegistrationCredentials(email, password, subject, userType, name) {
    try {
        let message = `Here are your credentials:\n\nEmail: ${email}\nPassword: ${password}`
        if (userType === 'candidateUser') {
            message = `Hello, ${name}!\nGood Day!\nThank you for registering on Eximjobs!\nHere are your credentials:\n\nEmail: ${email}\nPassword: ${password}\n\nWe are excited to have you join our community. You can now explore job opportunities, apply for positions, and connect with top employers.\nIf you need any assistance, our team is here to support you every step of the way.\nStart your job search now and find your dream job! \n\nBest regards,\nThe Exim Jobs Team\nOffice No. 104, Hilton Center, Plot No. 66, Sector 11, CBD Belapur, Navi Mumbai, Maharashtra-400614 India\nE-mail: admin@eximjobs.com / website: www.eximjobs.com \nContact  no.: +919004012108 / +919320909826 / +919594181568 / +918169604178`
        } else if (userType === 'companyUser') {
            message = `Hello, ${name}!\nGood Day!\nThank you for registering at Eximjobs!\nHere are your credentials:\n\nEmail: ${email}\nPassword: ${password}\n\nWe are excited to help you find the perfect candidates for your job openings. \nYou can now search candidates / post vacancies and connect with qualified Exim professionals.If you need any assistance, our team is here to support you every step of the way.\nHappy Hiring!\n\nBest regards,\nThe Exim Jobs Team\nOffice No. 104, Hilton Center, Plot No. 66, Sector 11, CBD Belapur, Navi Mumbai, Maharashtra-400614 India\nE-mail: admin@eximjobs.com / website: www.eximjobs.com \nContact  no.: +919004012108 / +919320909826 / +919594181568 / +918169604178`
        } else if (userType === 'queryInfo') {
            message = `Here are Query Info Related to ${name.selectValue} :\n\nFull Name: ${name.fullName}\nEmail: ${name.email}\nPhone: ${name.phone}\nSubject: ${name.subject}`
        } else {
            message = `Here are your credentials:\n\nEmail: ${email}\nPassword: ${password}`
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: message
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info.messageId
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


export async function sendEmailForOTPCredentials(email, otp, subject, userEmail, name) {
    try {
        const message = `
        <!DOCTYPE html>
        <html>
        <head>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; margin: 20px;">
            <p>User Email: ${userEmail}</p>
            <p>User Name: ${name}</p>
            <p>Here is your code:</p>
            <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">${otp}</div>
            <p style="font-size: 14px; color: #555;">This code will be active for ten minutes. If you don't make it in time, don't sweat it—you can always request a new one.</p>
            <p style="font-size: 14px; color: #555;">If you weren't expecting this email, someone else may have accidentally entered your email address.</p>
        </body>
        </html>
        `;
        
        console.log(message); // Replace this with your email-sending logic


        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: message
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info.messageId
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
