const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Database configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

console.log("Connecting to MySQL...");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Successfully connected to the database.');
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is live at http://localhost:${PORT}`);
});

// Get list of regions
app.get('/regions', (req, res) => {
    const query = `SELECT DISTINCT stop_area FROM stops WHERE stop_area IS NOT NULL`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Query execution error:', err.message);
            res.status(500).send('Server error');
        } else {
            res.json(results.map(row => row.stop_area));
        }
    });
});

// Get stops by region
app.get('/stops', (req, res) => {
    const region = req.query.region;
    console.log('Received region request:', region);

    if (!region) {
        console.error('Region not specified');
        return res.status(400).send('Region not specified');
    }

    const query = `SELECT DISTINCT stop_name FROM stops WHERE stop_area = ?`;

    db.query(query, [region], (err, results) => {
        if (err) {
            console.error('Query execution error:', err.message);
            return res.status(500).send('Server error');
        }

        console.log('Query results:', results);
        res.json(results.map(row => row.stop_name));
    });
});

// Get buses by stop
app.get('/buses', async (req, res) => {
    const stopName = req.query.stop;
    const region = req.query.region; // Get the region from the query parameters
    console.log('Received stop and region request:', stopName, region);

    if (!stopName || !region) {
        console.error('Stop or region not specified');
        return res.status(400).send('Stop and region are required');
    }

    const query = `
        SELECT DISTINCT r.route_short_name AS bus_number
        FROM routes r
        JOIN trips t ON r.route_id = t.route_id
        WHERE t.trip_id IN (
            SELECT DISTINCT st.trip_id
            FROM stop_times st
            JOIN stops s ON st.stop_id = s.stop_id
            WHERE s.stop_name = ? AND s.stop_area = ?
        )
        ORDER BY LENGTH(r.route_short_name), r.route_short_name;
    `;

    db.query(query, [stopName, region], (err, results) => {
        if (err) {
            console.error('Query execution error:', err.message);
            return res.status(500).send('Server error');
        }

        console.log('Query results:', results);
        res.json(results.map(row => row.bus_number));
    });
});

// Get nearest stop
app.get('/nearest', (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).send('Coordinates not specified');
    }

    const query = `
        SELECT stop_name, stop_area, 
               (6371 * acos(
                    cos(radians(?)) * cos(radians(stop_lat)) *
                    cos(radians(stop_lon) - radians(?)) +
                    sin(radians(?)) * sin(radians(stop_lat))
               )) AS distance
        FROM yuganpolezhaev_stops
        ORDER BY distance ASC
        LIMIT 1
    `;

    db.query(query, [lat, lon, lat], (err, results) => {
        if (err) {
            console.error('Query execution error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            res.json({
                stop: results[0].stop_name,
                region: results[0].stop_area,
            });
        } else {
            res.status(404).send('No nearest stop found');
        }
    });
});

// Get bus details
app.get('/bus-details', (req, res) => {
    const { bus, stop } = req.query;

    if (!bus || !stop) {
        return res.status(400).send('Parameters "bus" and "stop" are required');
    }

    const query = `
        SELECT DISTINCT st.arrival_time, t.trip_long_name
        FROM stop_times st
        JOIN trips t ON st.trip_id = t.trip_id
        JOIN routes r ON t.route_id = r.route_id
        WHERE r.route_short_name = ? AND st.stop_id IN (
            SELECT stop_id FROM stops WHERE stop_name = ?
        )
        ORDER BY st.arrival_time ASC
        LIMIT 6
    `;

    db.query(query, [bus, stop], (err, results) => {
        if (err) {
            console.error('Query execution error:', err.message);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('No data found');
        }

        res.json(results);
    });
});
