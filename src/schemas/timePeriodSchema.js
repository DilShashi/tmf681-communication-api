const Joi = require('joi');

// Schema for validating TimePeriod objects
const timePeriodSchema = Joi.object({
  startDateTime: Joi.date().required().description('Start date and time of the period'),
  endDateTime: Joi.date().required().description('End date and time of the period')
}).unknown(true); // Allow polymorphic extensions

module.exports = timePeriodSchema;