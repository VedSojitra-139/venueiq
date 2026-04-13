const { z } = require('zod');
const { ValidationError } = require('../utils/errors');

const schemas = {
  verifyPNR: z.object({
    pnr:   z.string().min(5).max(20).regex(/^[A-Z0-9]+$/i, 'PNR must be alphanumeric'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  }),
  chat: z.object({
    message:   z.string().min(1).max(500),
    sessionId: z.string().uuid().optional(),
  }),
  surgTest: z.object({
    standId: z.string().regex(/^stand-[a-h]$/),
  }),
};

const validate = (schemaName) => (req, res, next) => {
  const result = schemas[schemaName].safeParse(req.body);
  if (!result.success) {
    const msg = result.error.errors.map(e => e.message).join('; ');
    return next(new ValidationError(msg));
  }
  req.body = result.data; // use sanitised data from here on
  next();
};

module.exports = { validate };