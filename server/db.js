import { JSONFilePreset } from 'lowdb/node';
import logger from './logger.js';

let db;

export async function initDb() {
    try {
        const defaultData = { tasks: [] };
        db = await JSONFilePreset('db.json', defaultData);
        logger.info('DB', 'Database initialized successfully');
    } catch (error) {
        logger.error('DB', 'Failed to initialize database', error.stack);
        throw error;
    }
}

export { db };
