require('dotenv').config({ path: '.env' });
console.log('All loaded env:', process.env); // <-- Add this line
require('dotenv').config({ path: '.env' });
const AWS = require('aws-sdk');

const ses = new AWS.SES({
  accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  region: process.env.AWS_SES_REGION || 'us-east-1',
});

const SENDER_EMAIL = process.env.AWS_SES_SENDER_EMAIL;
const TEST_RECIPIENT = process.env.AWS_SES_SENDER_EMAIL; // send to self for test

console.log('Loaded SENDER_EMAIL:', SENDER_EMAIL);

async function testSesEmail() {
  const params = {
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [TEST_RECIPIENT],
    },
    Message: {
      Subject: {
        Data: 'Bittrr AWS SES Test Email',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: `<h2>Bittrr AWS SES Test Successful!</h2><p>This is a test email sent using AWS SES from your Bittrr backend.</p><p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>`,
          Charset: 'UTF-8',
        },
      },
    },
  };
  try {
    const result = await ses.sendEmail(params).promise();
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.MessageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    if (error.code === 'MessageRejected') {
      console.error('Check if your sender/recipient is verified and your SES is out of sandbox mode.');
    }
    return false;
  }
}

testSesEmail(); 