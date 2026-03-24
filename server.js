const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = 'mongodb+srv://Karthika:K%40re5678@cluster0.whpudve.mongodb.net/hotelDB?retryWrites=true&w=majority';
const JWT_SECRET = 'hotel_secret_key_2024';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── Schemas ───────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const hotelSchema = new mongoose.Schema({
  name: String,
  location: String,
  roomsAvailable: Number,
  basePrice: Number
});

const bookingSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  hotelId: mongoose.Schema.Types.ObjectId,
  hotelName: String,
  price: Number,
  bookedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Hotel = mongoose.model('Hotel', hotelSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// ─── Seed Hotels ───────────────────────────────────────────

mongoose.connection.once('open', async () => {
  const count = await Hotel.countDocuments();
  if (count === 0) {
    await Hotel.insertMany([
      { name: 'Grand Palace', location: 'Mumbai', roomsAvailable: 10, basePrice: 3000 },
      { name: 'Sea View Inn', location: 'Goa', roomsAvailable: 5, basePrice: 2000 },
      { name: 'Mountain Retreat', location: 'Manali', roomsAvailable: 2, basePrice: 1500 }
    ]);
    console.log('Sample hotels added');
  }
});

// ─── Auth Middleware ───────────────────────────────────────

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ─── Dynamic Pricing ───────────────────────────────────────

function calculatePrice(hotel) {
  let price = hotel.basePrice;
  if (hotel.roomsAvailable <= 3) price *= 1.5;
  else if (hotel.roomsAvailable <= 6) price *= 1.2;
  return Math.round(price);
}

// ─── Auth Routes ───────────────────────────────────────────

app.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, name: user.name });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid email or password' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid email or password' });
  const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, name: user.name });
});

// ─── Hotel Routes ──────────────────────────────────────────

app.get('/hotels', async (req, res) => {
  const hotels = await Hotel.find();
  res.json(hotels);
});

app.get('/price/:id', async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  res.json({ price: calculatePrice(hotel) });
});

app.post('/book', authMiddleware, async (req, res) => {
  const { hotelId } = req.body;
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  if (hotel.roomsAvailable === 0) return res.status(400).json({ message: 'No rooms available' });
  const price = calculatePrice(hotel);
  hotel.roomsAvailable -= 1;
  await hotel.save();
  await Booking.create({ userId: req.user.id, hotelId: hotel._id, hotelName: hotel.name, price });
  res.json({ message: 'Booking confirmed!', price });
});

app.get('/bookings', authMiddleware, async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id }).sort({ bookedAt: -1 });
  res.json(bookings);
});

// ─── Serve Static ──────────────────────────────────────────

app.use(express.static(path.join(__dirname)));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
