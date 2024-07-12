const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');

const getAllNotes = async (req, res) => {
    const notes = await Note.find().lean();

    if (!notes?.length) {
        res.status(400).json({ message: 'No notes found.' })
    }

    // Add username to each note before sending the response
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.userId).lean().exec();

        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
}

const createNewNote = async (req, res) => {
    const { userId, title, text } = req.body

    // Confirm data
    if (!userId || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    // Create and store the new user 
    const note = await Note.create({ userId, title, text })

    if (note) { // Created 
        return res.status(201).json({ message: 'New note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received' })
    }

}

const updateNote = async (req, res) => {
    const { id, user, title, text, completed } = req.body;

    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        res.status(400).json({ message: 'All fields are required.' })
    }

    // confirm note exists to update
    const note = await Note.findById(id).exec()

    if (!note) {
        res.status(400).json({ message: 'Note not found.' })
    }

    // checks for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // allow renaming of the original note
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(400).json({ message: 'Duplicate note title.' })
    }

    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;

    const updatedNotes = await note.save();

    res.json({ message: `Note updated with title ${updatedNotes.title}` })
}

const deleteNote = async (req, res) => {
    const { id } = req.body

    if (!id) {
        res.status(400).json({ message: 'Missing ID required.' })
    }

    const note = await Note.findOne({ _id: id }).exec();

    if (!note) {
        res.status(400).json({ message: 'Note not found.' })
    }

    await note.deleteOne();

    res.json({ message: `Note deleted with ID ${note._id}` })


}

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}