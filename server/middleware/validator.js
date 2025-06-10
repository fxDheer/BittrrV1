const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    lookingFor: Joi.string().valid('male', 'female', 'both').required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    bio: Joi.string().max(500),
    interests: Joi.array().items(Joi.string()),
    preferences: Joi.object({
      ageRange: Joi.object({
        min: Joi.number().min(18).max(99),
        max: Joi.number().min(18).max(99),
      }),
      distance: Joi.number().min(1).max(100),
    }),
  }),

  updateLocation: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }),

  sendMessage: Joi.object({
    content: Joi.string().required(),
    type: Joi.string().valid('text', 'image', 'location'),
    mediaUrl: Joi.string().when('type', {
      is: Joi.string().valid('image', 'video'),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    location: Joi.object({
      type: Joi.string().valid('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2),
    }).when('type', {
      is: 'location',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

module.exports = {
  validate,
  schemas,
}; 