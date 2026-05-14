const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/auth/login', // let's try something else, or I can just print everything.
  method: 'POST'
}, res => {})
