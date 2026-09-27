const attendanceModel = require('../models/attendanceModel');

// GET /api/events/:eventId/attendance/token — admin only.
// The admin's "open attendance" screen calls this repeatedly (e.g. every
// 5s); it will keep returning the same token until it expires, then
// hand back a freshly generated one — that's the "rotation".
async function getCurrentToken(req, res) {
  try {
    const result = await attendanceModel.getOrCreateCurrentToken(req.params.eventId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate attendance token.' });
  }
}

// POST /api/events/:eventId/attendance/verify — participant only.
// Body: { "token": "<scanned token string>" }
async function verifyAndMarkAttendance(req, res) {
  const { eventId } = req.params;
  const { token } = req.body;
  const participantId = req.user.id;

  if (!token) return res.status(400).json({ message: 'token is required.' });

  try {
    const attendanceId = await attendanceModel.markAttendance(participantId, eventId, token);
    res.status(201).json({ message: 'Attendance marked successfully.', attendance_id: attendanceId });
  } catch (err) {
    if (err instanceof attendanceModel.EventNotFoundError) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (err instanceof attendanceModel.TokenInvalidError) {
      return res.status(400).json({ message: 'This QR code has expired. Please scan the current code.' });
    }
    if (err instanceof attendanceModel.NotRegisteredError) {
      return res.status(403).json({ message: 'Attendance cannot be marked. You are not registered for this event.' });
    }
    if (err instanceof attendanceModel.AlreadyMarkedError) {
      return res.status(409).json({ message: 'Your attendance is already marked for this event.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to mark attendance.' });
  }
}

// GET /api/events/:eventId/attendance — admin only
async function getEventAttendance(req, res) {
  try {
    const attendance = await attendanceModel.getAttendanceForEvent(req.params.eventId);
    res.json({ attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
}

module.exports = { getCurrentToken, verifyAndMarkAttendance, getEventAttendance };
