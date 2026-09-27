const feedbackModel = require('../models/feedbackModel');

// POST /api/events/:eventId/feedback — participant only
async function submitFeedback(req, res) {
  const { eventId } = req.params;
  const { rating, comments } = req.body;
  const participantId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating is required and must be between 1 and 5.' });
  }

  try {
    const feedbackId = await feedbackModel.submitFeedback(participantId, eventId, rating, comments);
    res.status(201).json({ message: 'Feedback submitted. Thank you!', feedback_id: feedbackId });
  } catch (err) {
    if (err instanceof feedbackModel.EventNotFoundError) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (err instanceof feedbackModel.NotAttendedError) {
      return res.status(403).json({ message: 'You can only submit feedback for events you attended.' });
    }
    if (err instanceof feedbackModel.DuplicateFeedbackError) {
      return res.status(409).json({ message: 'You have already submitted feedback for this event.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to submit feedback.' });
  }
}

// GET /api/events/:eventId/feedback — admin only
async function getEventFeedback(req, res) {
  try {
    const feedback = await feedbackModel.getFeedbackForEvent(req.params.eventId);
    res.json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch feedback.' });
  }
}

module.exports = { submitFeedback, getEventFeedback };
