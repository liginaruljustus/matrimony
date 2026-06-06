const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'Admin@12345';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(hash);
}

hashPassword();
