import OpenAI from 'openai';
import { db } from './db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const baseURL = process.env.OPENAI_COMPLETIONS_URL?.replace('/chat/completions', '').replace(/\/$/, '') || undefined;
const modelID = process.env.MODEL_ID || 'gpt-4o';

logger.info('PROCESSOR', 'Initializing OpenAI client', { baseURL, modelID });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL
});

export async function processTask(taskId) {
    logger.info('PROCESSOR', `Starting task: ${taskId}`);
    const task = db.data.tasks.find(t => t.id === taskId);
    if (!task) {
        logger.error('PROCESSOR', `Task ${taskId} not found`);
        return;
    }

    if (task.status === 'completed') {
        logger.info('PROCESSOR', `Task ${taskId} already completed`);
        return;
    }

    task.status = 'processing';
    await db.write();
    logger.info('PROCESSOR', `Task ${taskId} status set to processing`);

    const batchSize = parseInt(process.env.PAGES_PER_BATCH) || 2;
    logger.info('PROCESSOR', `Batch size: ${batchSize}`);

    while (true) {
        const pendingChunks = task.chunks.filter(c => c.status === 'pending');
        if (pendingChunks.length === 0) {
            logger.info('PROCESSOR', `No more pending chunks for task ${taskId}`);
            break;
        }

        const batch = pendingChunks.slice(0, batchSize);
        logger.info('PROCESSOR', `Processing batch of ${batch.length} chunks`);

        await Promise.all(batch.map(async (chunk) => {
            chunk.status = 'processing';
            await db.write();
            logger.info('PROCESSOR', `Chunk ${chunk.index} status set to processing`);

            const maxRetries = 3;
            let retryCount = 0;

            const processChunk = async () => {
                try {
                    logger.debug('AI', `Requesting completion for chunk ${chunk.index}`, { prompt: task.prompt, model: modelID, attempt: retryCount + 1 });
                    const response = await openai.chat.completions.create({
                        model: modelID,
                        messages: [
                            { role: 'system', content: `You are an assistant that modifies documents based on a prompt. Return the result as text. ${task.prompt}` },
                            { role: 'user', content: chunk.content }
                        ]
                    });

                    chunk.result = response.choices[0].message.content;
                    chunk.status = 'completed';
                    logger.info('PROCESSOR', `Chunk ${chunk.index} completed successfully`);
                } catch (error) {
                    retryCount++;
                    logger.error('AI', `Error processing chunk ${chunk.index} (Attempt ${retryCount}):`, error.message);

                    if (retryCount < maxRetries) {
                        logger.info('PROCESSOR', `Retrying chunk ${chunk.index} in 10s...`);
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        return processChunk();
                    } else {
                        chunk.status = 'failed';
                        logger.error('PROCESSOR', `Chunk ${chunk.index} failed after ${maxRetries} attempts`);
                    }
                }
            };

            await processChunk();

            // Update progress
            const completedCount = task.chunks.filter(c => c.status === 'completed').length;
            const total = Math.max(task.totalChunks, task.chunks.length, 1);
            task.progress = Math.round((completedCount / total) * 100);

            logger.info('PROCESSOR', `Task ${taskId} update: ${completedCount}/${total} chunks done. Progress: ${task.progress}%`);

            // Ensure status updates if all chunks are done
            if (completedCount === total) {
                task.status = 'completed';
                task.results = task.chunks.map(c => c.result);
                logger.info('PROCESSOR', `Task ${taskId} fully completed during chunk update`);
            }

            await db.write();
        }));
    }

    const failedCount = task.chunks.filter(c => c.status === 'failed').length;
    if (failedCount === 0 && task.status !== 'completed') { // Add check for task.status to avoid overwriting if already completed
        task.status = 'completed';
        logger.info('PROCESSOR', `Task ${taskId} completed all chunks`);
        // Final assemble
        task.results = task.chunks.map(c => c.result);
    } else {
        task.status = 'failed';
        logger.warn('PROCESSOR', `Task ${taskId} finished with ${failedCount} failures`);
    }

    await db.write();
}

export async function resumeTasks() {
    logger.info('PROCESSOR', 'Checking for tasks to resume...');
    const tasksToResume = db.data.tasks.filter(t => t.status === 'processing' || t.status === 'pending');
    logger.info('PROCESSOR', `Found ${tasksToResume.length} tasks to resume`);
    for (const task of tasksToResume) {
        processTask(task.id);
    }
}
