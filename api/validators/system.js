import Joi from "joi";

// Schema for updating a system preference
export const updatePreferenceSchema = Joi.object({
	value: Joi.string().required(),
});

// Schema for validating the system preference key (URL param)
export const preferenceKeySchema = Joi.object({
	key: Joi.string().min(1).required(),
});
