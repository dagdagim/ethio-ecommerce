const axios = require('axios');
(async () => {
  try {
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'unique_test3@example.com',
      password: 'password123'
    });
    console.log('LOGIN_RESPONSE', JSON.stringify(login.data, null, 2));

    const token = login.data.token;
    const me = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('ME_RESPONSE', JSON.stringify(me.data, null, 2));
  } catch (e) {
    if (e.response) console.error('ERROR_RESPONSE', JSON.stringify(e.response.data, null, 2));
    else console.error('ERROR', e.message);
  }
})();
