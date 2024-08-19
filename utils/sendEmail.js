const nodemailer = require('nodemailer');  // Ensure this line is present
const dotenv = require('dotenv');
dotenv.config();

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.email,  // Ensure this field is correctly set
    subject: options.subject,
    html: options.message,
  };

  console.log('Sending email to:', options.email); // Debugging log
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
