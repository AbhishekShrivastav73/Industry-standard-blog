const JOI = require("joi");


const registerSchema = JOI.object({
    name: JOI.string().required(),
    email: JOI.string().required(),
    password: JOI.string().required(),
    role: JOI.string().required(),
});

const loginSchema = JOI.object({
    email: JOI.string().required(),
    password: JOI.string().required(),
});

module.exports = { registerSchema, loginSchema };