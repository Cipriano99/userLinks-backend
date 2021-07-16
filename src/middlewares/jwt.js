const { verifyJwt } = require('../helpers/jsonwebtoken');

const checkJwt = (req, res, next) => {
  const { url: path } = req;

  const excludedPaths = ['/auth/signin', '/auth/signup'].find((p) =>
    p.startsWith(path)
  );
  const isExcluded = !!excludedPaths.find((p) => p.startsWith(path));
  if (isExcluded) return next();

  let token = req.headers['authorization'];
  token = token ? token.slice(7, token.length) : null;
  if (!token) return res.jsonUnauthorized(null, 'Invalid token');

  console.log('Token ', token);

  try {
    const decoded = verifyJwt(token);

    req.accountId = decoded.id;

    next();
  } catch (error) {
    return res.jsonUnauthorized(null, 'Invalid token');
  }
};

module.exports = checkJwt;
