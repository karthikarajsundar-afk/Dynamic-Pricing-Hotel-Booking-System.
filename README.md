# Dynamic Pricing Hotel Booking System

## Objective
Develop a backend system that dynamically adjusts hotel room prices based on demand and room availability.

## Problem Statement
Hotels list rooms with base prices. The system automatically adjusts the price depending on booking demand and available rooms.

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose

## System Logic
1. Hotel is added with base price and total rooms.
2. Customers book rooms.
3. System calculates demand rate = bookedRooms / totalRooms.
4. Price increases when demand increases.

Install dependencies

npm install

Run server

node server.js

## Project Structure

models/
routes/
controllers/
middleware/
config/
server.js# Dynamic-Pricing-Hotel-Booking-System.
