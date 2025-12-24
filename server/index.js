import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { processTask, resumeTasks } from './processor.js';
import { db, initDb } from './db.js';
import logger from './logger.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const pdf = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 5000;

// Initialize database
await initDb();
resumeTasks();

app.listen(PORT, () => {
    logger.info('SERVER', `Server running on port ${PORT}`);
});

app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    logger.info('API', 'Received upload request', { body: req.body, file: req.file?.originalname });
    try {
        const { prompt } = req.body;
        const file = req.file;

        if (!file || !prompt) {
            logger.warn('API', 'Upload rejected: Missing file or prompt');
            return res.status(400).json({ error: 'PDF file and prompt are required' });
        }

        logger.info('PDF', `Parsing PDF: ${file.path}`);
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdf(dataBuffer);
        const text = pdfData.text;
        logger.info('PDF', `Parsed ${pdfData.numpages} pages, ${text.length} characters`);

        const taskId = `task_${Date.now()}`;
        logger.info('TASK', `Creating new task: ${taskId}`);
        const task = {
            id: taskId,
            name: file.originalname,
            prompt,
            status: 'pending',
            progress: 0,
            chunks: [],
            totalChunks: 0,
            results: [],
            createdAt: new Date().toISOString()
        };

        // Chunking logic
        const chunkSize = parseInt(process.env.CHUNK_SIZE) || 2000;
        logger.info('TASK', `Chunking text with size: ${chunkSize}`);
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }

        task.chunks = chunks.map((content, index) => ({
            index,
            content,
            status: 'pending',
            result: null
        }));
        task.totalChunks = chunks.length;
        logger.info('TASK', `Generated ${task.totalChunks} chunks`);

        db.data.tasks.push(task);
        await db.write();
        logger.info('DB', `Task ${taskId} saved to database`);

        // Start processing background
        processTask(taskId);

        res.json({ taskId });
    } catch (error) {
        logger.error('API', 'Upload failed', error.stack);
        res.status(500).json({ error: 'Failed to upload and parse PDF' });
    }
});

app.get('/api/tasks', (req, res) => {
    res.json(db.data.tasks);
});

app.get('/api/tasks/:id', (req, res) => {
    logger.debug('API', `Fetching task: ${req.params.id}`);
    const task = db.data.tasks.find(t => t.id === req.params.id);
    if (!task) {
        logger.warn('API', `Task not found: ${req.params.id}`);
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});

app.post('/api/tasks/:id/resume', async (req, res) => {
    logger.info('API', `Resuming task: ${req.params.id}`);
    const task = db.data.tasks.find(t => t.id === req.params.id);
    if (!task) {
        logger.warn('API', `Task not found for resume: ${req.params.id}`);
        return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status === 'processing') {
        logger.info('API', `Task ${task.id} is already processing`);
        return res.json({ message: 'Task is already processing' });
    }

    task.status = 'pending';
    // Reset failed chunks to pending so they can be retried
    task.chunks.forEach(chunk => {
        if (chunk.status === 'failed') {
            chunk.status = 'pending';
        }
    });
    await db.write();
    processTask(task.id);
    res.json({ message: 'Resumed and failed chunks reset' });
});
