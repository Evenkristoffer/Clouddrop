const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const uploadDir = path.join(__dirname, 'uploads');

console.log('Server is starting...');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB || 'clouddrop';
let usersCollection;
let uploadsCollection;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

async function connectToMongo() {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(mongoDbName);
    usersCollection = db.collection('users');
    uploadsCollection = db.collection('uploads');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await uploadsCollection.createIndex({ email: 1, createdAt: -1 });
    console.log(`Connected to MongoDB at ${mongoUri}/${mongoDbName}`);
}

connectToMongo().catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});

function sanitizeForPath(input) {
    return input.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user || !req.user.email) {
        return cb(new Error('Unauthenticated upload'));
    }
    const safeEmail = sanitizeForPath(req.user.email);
    const userDir = path.join(uploadDir, safeEmail);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
    },
    filename: function (req, file, cb) {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });
const frontendDir = path.join(__dirname, 'src');
const mediaDir = path.join(__dirname, 'media');

app.use(bodyParser.json());
app.use(express.static(frontendDir)); 
app.use('/media', express.static(mediaDir));

async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function passwordsMatch(password, storedHash) {
    const looksHashed = typeof storedHash === 'string' && storedHash.startsWith('$2');
    if (looksHashed) {
        return bcrypt.compare(password, storedHash);
    }
    return password === storedHash;
}

async function requireUser(req, res, next) {
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not ready' });
    }

    const userEmail = req.header('x-user-email');
    if (!userEmail) {
        return res.status(401).json({ error: 'Missing user identity' });
    }

    try {
        const user = await usersCollection.findOne({ email: userEmail });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error('Failed to validate user', err);
        res.status(500).json({ error: 'User validation failed' });
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'html', 'index.html'));
});

app.post('/api/login', async (req, res) => {
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not ready' });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const existingUser = await usersCollection.findOne({ email });
        if (!existingUser) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const ok = await passwordsMatch(password, existingUser.password);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ email, status: 'ok' });
    } catch (err) {
        console.error('Login failed:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/register', async (req, res) => {
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not ready' });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Credentials are already in use' });
        }

        const passwordHash = await hashPassword(password);
        await usersCollection.insertOne({
            email,
            password: passwordHash,
            createdAt: new Date()
        });

        res.status(201).json({ email, status: 'created' });
    } catch (err) {
        console.error('Registration failed:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.get('/api/uploads', requireUser, async (req, res) => {
    if (!uploadsCollection) {
        return res.status(503).json({ error: 'Database not ready' });
    }

    try {
        const entries = await uploadsCollection
            .find({ email: req.user.email })
            .sort({ createdAt: -1 })
            .toArray();

        const payload = entries.map((file) => ({
            id: file._id,
            name: file.storedName,
            originalName: file.originalName,
            url: `/api/uploads/file/${file._id}`
        }));

        res.json(payload);
    } catch (err) {
        console.error('Failed to fetch uploads', err);
        res.status(500).json({ error: 'Unable to read uploaded files' });
    }
});

app.get('/api/uploads/file/:id', requireUser, async (req, res) => {
    if (!uploadsCollection) {
        return res.status(503).json({ error: 'Database not ready' });
    }

    try {
        const doc = await uploadsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!doc || doc.email !== req.user.email) {
            return res.status(404).json({ error: 'File not found' });
        }
        const filePath = path.join(uploadDir, doc.relativePath);
        return res.sendFile(filePath);
    } catch (err) {
        console.error('Failed to serve file', err);
        return res.status(500).json({ error: 'Unable to serve file' });
    }
});

app.delete('/api/uploads/:id', requireUser, async (req, res) => {
    if (!uploadsCollection) {
        return res.status(503).json({ error: 'Database not ready' });
    }

    try {
        const doc = await uploadsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!doc || doc.email !== req.user.email) {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.join(uploadDir, doc.relativePath);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Failed to delete file from disk', err);
        }

        await uploadsCollection.deleteOne({ _id: doc._id });
        return res.json({ status: 'deleted' });
    } catch (err) {
        console.error('Failed to delete file', err);
        return res.status(500).json({ error: 'Could not delete file' });
    }
});

app.post('/upload', requireUser, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!uploadsCollection) {
        return res.status(503).json({ error: 'Database not ready' });
    }

    const safeEmail = sanitizeForPath(req.user.email);
    const relativePath = path.join(safeEmail, req.file.filename);

    try {
        const result = await uploadsCollection.insertOne({
            email: req.user.email,
            originalName: req.file.originalname,
            storedName: req.file.filename,
            relativePath,
            createdAt: new Date()
        });

        res.json({
            message: 'File uploaded successfully',
            filePath: `/api/uploads/file/${result.insertedId}`,
            storedName: req.file.filename,
            originalName: req.file.originalname,
            url: `/api/uploads/file/${result.insertedId}`
        });
    } catch (err) {
        console.error('Failed to save upload metadata', err);
        res.status(500).json({ error: 'Could not record uploaded file' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
