import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Enforce strong JWT secrets with a minimum length of 32 characters if provided
  JWT_SECRET: Joi.string().min(32).optional().messages({
    'string.min':
      'SECURITY-ALERT: JWT_SECRET is too weak! Must be at least 32 characters long.',
  }),

  JWT_REFRESH_SECRET: Joi.string().min(32).optional().messages({
    'string.min':
      'SECURITY-ALERT: JWT_REFRESH_SECRET is too weak! Must be at least 32 characters long.',
  }),

  JWT_EXPIRES_IN: Joi.string().default('15m'),

  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Enforce strong Internal Service Secret with a minimum length of 32 characters
  INTERNAL_SERVICE_SECRET: Joi.string()
    .min(32)
    .default('dev_internal_service_secret_32_characters_long_minimum')
    .messages({
      'string.min':
        'SECURITY-ALERT: INTERNAL_SERVICE_SECRET is too weak! Must be at least 32 characters long.',
    }),

  // Other infrastructure variables
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // Email/SMTP Configuration Validation
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().integer().default(587).optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().email().default('noreply@studyplan.app').optional(),
});
