require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const speakerRoutes = require('./routes/speakerRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const myRoutes = require('./routes/myRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/events/:eventId/sessions', sessionRoutes);
app.use('/api/events/:eventId/registrations', registrationRoutes);
app.use('/api/registrations', myRoutes);
app.use('/api/events/:eventId/attendance', attendanceRoutes);
app.use('/api/events/:eventId/feedback', feedbackRoutes);

// Simple health check — hit this first in Postman to confirm the server
// is up before testing anything that touches the database.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
});
