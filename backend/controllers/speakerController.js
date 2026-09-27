const speakerModel = require('../models/speakerModel');

async function createSpeaker(req, res) {
  try {
    const { name, bio, contact, organization, designation } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });

    const id = await speakerModel.createSpeaker({ name, bio, contact, organization, designation });
    const speaker = await speakerModel.getSpeakerById(id);
    res.status(201).json({ message: 'Speaker added.', speaker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add speaker.' });
  }
}

async function getSpeakers(req, res) {
  try {
    const speakers = await speakerModel.getAllSpeakers();
    res.json({ speakers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch speakers.' });
  }
}

async function updateSpeaker(req, res) {
  try {
    const existing = await speakerModel.getSpeakerById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Speaker not found.' });

    const { name, bio, contact, organization, designation } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required.' });

    await speakerModel.updateSpeaker(req.params.id, { name, bio, contact, organization, designation });
    const updated = await speakerModel.getSpeakerById(req.params.id);
    res.json({ message: 'Speaker updated.', speaker: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update speaker.' });
  }
}

async function deleteSpeaker(req, res) {
  try {
    const existing = await speakerModel.getSpeakerById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Speaker not found.' });

    await speakerModel.deleteSpeaker(req.params.id);
    res.json({ message: 'Speaker deleted.' });
  } catch (err) {
    // speakers.id is referenced by sessions.speaker_id (FK, no cascade) —
    // deleting a speaker still assigned to a session hits that constraint.
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        message: 'This speaker is assigned to one or more sessions. Remove or reassign those sessions first.',
      });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to delete speaker.' });
  }
}

module.exports = { createSpeaker, getSpeakers, updateSpeaker, deleteSpeaker };