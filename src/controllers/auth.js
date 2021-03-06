const express = require('express');
const bcrypt = require('bcrypt');
const { Account } = require('../models');

const { accountSignUp, accountSignIn } = require('../validators/account');
const { getMessage } = require('../helpers/validator');

const {
  generateJwt,
  generateRefreshJwt,
  verifyRefreshJwt,
  getTokenFromHeaders,
} = require('../helpers/jwt');

const router = express.Router();

const saltRounds = 10;

router.post('/signin', accountSignIn, async (req, res) => {
  const { email, password } = req.body;

  const account = await Account.findOne({ where: { email } });

  const match = account ? bcrypt.compareSync(password, account.password) : null;
  if (!match) {
    return res.jsonBadRequest(null, getMessage('account.signin.invalid'));
  }

  const token = genereateJwt({ id: account.id });
  const refreshToken = genereateRefreshJwt({
    id: account.id,
    version: account.jwtVersion,
  });

  return res.jsonOK(account, getMessage('account.signin.sucess'), {
    token,
    refreshToken,
  });
});

router.post('/signup', accountSignUp, async (req, res) => {
  const { email, password } = req.body;

  const account = await Account.findOne({ where: { email } });

  if (account) {
    return res.jsonBadRequest(null, getMessage('account.signup.email_exists'));
  }

  const hash = bcrypt.hashSync(password, saltRounds);
  const newAccount = await Account.create({ email, password: hash });

  const token = genereateJwt({ id: newAccount.id });
  const refreshToken = genereateRefreshJwt({
    id: newAccount.id,
    version: newAccount.jwtVersion,
  });

  return res.jsonOK(newAccount, getMessage('account.signup.sucess'), {
    token,
    refreshToken,
  });
});

router.post('/refresh', async (req, res) => {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return res.jsonUnauthorized(null, 'Invalid token a');

  try {
    const decoded = verifyRefreshJwt(token);
    const account = await Account.findByPk(decoded.id);

    if (!account) return res.jsonUnauthorized(null, 'Invalid token b');

    if (decoded.version !== account.jwtVersion) {
      return res.jsonUnauthorized(null, 'Invalid token c');
    }

    const meta = {
      token: generateJwt({ id: account.id }),
    };

    return res.jsonOK(null, null, meta);
  } catch (error) {
    return res.jsonUnauthorized(null, `${error}`);
  }
});

module.exports = router;
