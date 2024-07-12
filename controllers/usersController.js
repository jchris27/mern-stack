const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    // get all users from mongoDB
    // .select('-password') means exclude the password
    // .lean() to return a minified data object
    const users = await User.find().select('-password').lean();

    // if no users
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found.' })
    }

    res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    // get the user data from the request body
    const { username, password, roles } = req.body

    // Confirm data if fields are met
    // check if roles is an array and if roles has a length
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'All fields are required.' })
    }

    // Check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec();

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username.' })
    }

    // Hash the password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    // Create and store the new user
    const userObject = {
        username,
        "password": hashedPwd,
        roles
    }

    const user = await User.create(userObject)

    // if user created successfully
    if (user) {
        res.status(201).json({ message: `New user ${username} created.` })
    } else {
        res.status(400).json({ message: 'Invalid user data received.' })
    }

});

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body

    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        res.status(400).json({ message: 'All fields are required.' })
    }

    const user = await User.findById(id).exec();

    if (!user) {
        res.status(400).json({ message: 'User not found.' })
    }

    // checks duplicates
    const duplicate = await User.findOne({ username }).lean().exec();
    console.log('Duplicate = ', duplicate)
    // allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Username already existing.' })
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        // hash password
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save();

    res.json({ message: `${updatedUser.username} updated.` })
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body
    if (!id) {
        return res.status(400).json({ message: 'User ID is required.' })
    }

    const notes = await Note.findOne({ user: id }).lean().exec();

    if (notes?.length) {
        return res.status(400).json({ message: 'User has assigned notes.' })
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found.' })
    }

    const result = await user.deleteOne();

    const reply = `Username ${user.username} with ID ${user._id} deleted.`

    res.json(reply);
});

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}