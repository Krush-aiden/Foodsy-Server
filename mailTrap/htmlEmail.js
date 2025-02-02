export const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Email Verification</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f0f2f5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                padding: 30px;
                background-color: #ffffff;
                border-radius: 15px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .header {
                padding: 20px 0;
            }
            .header h1 {
                margin: 0;
                color: #4A90E2;
                font-size: 32px;
                font-weight: bold;
            }
            .content {
                padding: 20px;
            }
            .content h2 {
                color: #333333;
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 20px;
            }
            .content p {
                color: #666666;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .content .code {
                font-size: 26px;
                font-weight: bold;
                color: #333333;
                margin: 20px 0;
                padding: 12px 20px;
                border: 1px solid #dddddd;
                border-radius: 8px;
                background-color: #f9fafb;
                display: inline-block;
            }
            .footer {
                margin-top: 30px;
                font-size: 14px;
                color: #999999;
                border-top: 1px solid #eeeeee;
                padding-top: 20px;
            }
            .footer a {
                color: #4A90E2;
                text-decoration: none;
            }
            .footer a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Verification</h1>
            </div>
            <div class="content">
                <h2 class="code">Hello, {verifyUser}</h2>
                <p>Thank you for registering with us! To complete your registration, please verify your email address by entering the following verification code:</p>
                <div class="code">{verificationToken}</div>
                <p>If you did not request this verification, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 FoodSy. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
`;

export const generateWelcomeEmailHtml = (name) => {
  return `
          <html>
            <head>
              <style>
                .email-container {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  padding: 20px;
                  background-color: #f4f4f4;
                  border-radius: 10px;
                  max-width: 600px;
                  margin: auto;
                }
                .email-header {
                  background-color: #4CAF50;
                  color: white;
                  padding: 10px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                }
                .email-body {
                  padding: 20px;
                  background-color: white;
                  border-radius: 0 0 10px 10px;
                }
                .email-footer {
                  text-align: center;
                  padding: 10px;
                  font-size: 12px;
                  color: #777;
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="email-header">
                  <h1>Welcome to FoodSy!</h1>
                </div>
                <div class="email-body">
                  <p>Hi ${name},</p>
                  <p>Congratulations! Your email has been successfully verified.</p>
                  <p>We are excited to have you on board at FoodSy. Explore our platform and enjoy our services.</p>
                  <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                  <p>Best Regards,<br/>The FoodSy Team</p>
                </div>
                <div class="email-footer">
                  <p>&copy; 2024 FoodSy. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;
};

export const generatePasswordResetEmailHtml = (resetURL) => {
  return `
      <html>
        <head>
          <style>
            .email-container {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
              background-color: #f4f4f4;
              border-radius: 10px;
              max-width: 600px;
              margin: auto;
            }
            .email-header {
              background-color: #d9534f;
              color: white;
              padding: 10px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .email-body {
              padding: 20px;
              background-color: white;
              border-radius: 0 0 10px 10px;
            }
            .email-footer {
              text-align: center;
              padding: 10px;
              font-size: 12px;
              color: #777;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              margin: 20px 0;
              font-size: 16px;
              color: white;
              background-color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="email-body">
              <p>Hi,</p>
              <p>We received a request to reset your password. Click the button below to reset it.</p>
              <a href="${resetURL}" class="button">Reset Password</a>
              <p>If you didn't request a password reset, please ignore this email.</p>
              <p>Thank you,<br/>The FoodSy Team</p>
            </div>
            <div class="email-footer">
              <p>&copy; 2024 FoodSy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
};

export const generateResetSuccessEmailHtml = () => {
  return `
      <html>
        <head>
          <style>
            .email-container {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
              background-color: #f4f4f4;
              border-radius: 10px;
              max-width: 600px;
              margin: auto;
            }
            .email-header {
              background-color: #4CAF50;
              color: white;
              padding: 10px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .email-body {
              padding: 20px;
              background-color: white;
              border-radius: 0 0 10px 10px;
            }
            .email-footer {
              text-align: center;
              padding: 10px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Password Reset Successful</h1>
            </div>
            <div class="email-body">
              <p>Hi,</p>
              <p>Your password has been successfully reset. You can now log in with your new password.</p>
              <p>If you did not request this change, please contact our support team immediately.</p>
              <p>Thank you,<br/>The FoodSy Team</p>
            </div>
            <div class="email-footer">
              <p>&copy; 2024 FoodSy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
};

// module.exports = {
//   htmlContent,
//   generateWelcomeEmailHtml,
//   generatePasswordResetEmailHtml,
//   generateResetSuccessEmailHtml,
// };
