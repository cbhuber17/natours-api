const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  //   GMAIL
  //   const transporter = nodemailer.createTransport({
  //     service: 'Gmail',
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       pass: process.env.EMAIL_PASSWORD,
  //     },
  //   });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Define email options
  const mailOptions = {
    from: 'Colin Huber <cbhuber@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
