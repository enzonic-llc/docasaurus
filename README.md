# 🦖 enzonic Docasaurus

**enzonic Docasaurus** is a powerful, green-themed web application designed to help you process and modify large PDF documents using AI. It breaks down complex documents into manageable chunks, processes them via AI with custom prompts, and allows you to track progress in real-time.

![License](https://img.shields.io/badge/license-MIT-green)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Node.js%20%7C%20Express-brightgreen)

## ✨ Features

- 📑 **PDF Intelligent Chunking**: Automatically splits large PDFs into smaller text blocks for efficient AI processing.
- 🤖 **AI-Driven Modifications**: Deep integration with OpenAI-compatible APIs (like Chutes.ai) to transform your text based on custom prompts.
- 🔄 **Real-time Progress Tracking**: Watch your document being processed piece-by-piece with a live dashboard.
- 🛡️ **Resilience & Autoretry**: Includes a built-in 10-second retry mechanism for any failed AI requests.
- 💾 **Persistence**: Tasks are saved to a local database, allowing you to resume interrupted work even after a server restart.
- 🍏 **Modern Green UI**: A sleek, user-friendly interface built with React and Vite.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- An AI API Key (OpenAI or compatible provider like Chutes.ai)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd docasaurus
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   *(This will install dependencies for both the root, client, and server)*

3. **Configure Environment Variables**:
   Copy the `.env.example` file to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   - `OPENAI_API_KEY`: Your secret key.
   - `OPENAI_COMPLETIONS_URL`: Set to `https://llm.chutes.ai/v1/chat/completions` for Chutes.ai or the standard OpenAI URL.
   - `MODEL_ID`: e.g., `zai-org/GLM-4.6-TEE` or `gpt-4o`.

### Running the App

To start both the frontend and backend in development mode:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:5000`

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Axios, Lucide Icons.
- **Backend**: Node.js, Express, Multer (File Uploads), pdf-parse.
- **Database**: lowdb (JSON-based local persistence).
- **Styling**: Vanilla CSS with a focus on modern aesthetics.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙌 Acknowledgments

- Built with ❤️ by the **enzonic** team.
- Powered by the latest in agentic AI.
