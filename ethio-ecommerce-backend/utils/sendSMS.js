const axios = require('axios');

// Ethiopian SMS Gateway Integration (Example)
const sendSMS = async (phone, message) => {
    try {
        // This is a placeholder - you'll need to integrate with actual Ethiopian SMS providers
        // Examples: Ethio Telecom SMS Gateway, local providers
        
        const smsData = {
            to: phone,
            message: message,
            sender: 'EcomET',
            apiKey: process.env.SMS_API_KEY
        };

        // const response = await axios.post(process.env.SMS_GATEWAY_URL, smsData);
        // return response.data;
        
        console.log(`SMS sent to ${phone}: ${message}`);
        return { success: true, message: 'SMS sent successfully' };
        
    } catch (error) {
        console.error('SMS sending failed:', error);
        throw new Error('Failed to send SMS');
    }
};

module.exports = sendSMS;