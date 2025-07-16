# Readly - AI-Powered Learning Platform

Readly is an educational platform that uses AI to create interactive learning experiences from PDF documents. It generates knowledge maps, quizzes, and various learning activities to help users master educational content.

## Features

- 📄 **PDF Upload & Processing**: Upload educational PDFs and extract content
- 🧠 **AI Knowledge Mapping**: Generate structured knowledge maps with subtopics
- ❓ **Interactive Quizzes**: Multiple choice questions with explanations
- 🎯 **Learning Activities**: Fill-in-the-blank, matching, and sorting exercises
- 📊 **Progress Tracking**: Track mastery status of different topics

## Prerequisites

Before running Readly, you need to install and set up:

### 1. Ollama (Required for AI functionality)
- **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
- **Start Ollama**: Run `ollama serve` in your terminal
- **Install Mistral Model**: Run `ollama pull mistral`

### 2. Node.js (v18 or higher)
- Download from [nodejs.org](https://nodejs.org)

### 3. Python (v3.8 or higher)
- Download from [python.org](https://python.org)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd readly-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Start the Backend Server

```bash
# From the project root
cd backend
python app.py
```

The backend will start on `http://localhost:5000` and automatically preload the Mistral model.

### 3. Start the Frontend Development Server

```bash
# From the project root (in a new terminal)
npm run dev
```

The frontend will start on `http://localhost:3000`.

### 4. Open the Application

Open [http://localhost:3000](http://localhost:3000) in your browser to start using Readly.

## Usage

1. **Upload a PDF**: Use the file uploader to upload an educational PDF
2. **Generate Knowledge Map**: The AI will analyze the content and create a structured knowledge map
3. **Explore Topics**: Navigate through subtopics and key concepts
4. **Take Quizzes**: Test your knowledge with AI-generated questions
5. **Track Progress**: Monitor your mastery status across different topics

## API Endpoints

- `POST /upload` - Upload and process PDF files
- `POST /generate-questions` - Generate additional quiz questions
- `GET /test-ollama` - Test Ollama connection and performance

## Troubleshooting

### Ollama Issues
- **"Cannot connect to Ollama"**: Make sure Ollama is running with `ollama serve`
- **"Mistral model not found"**: Install the model with `ollama pull mistral`
- **Slow responses**: The first request may be slow as the model loads

### Backend Issues
- **Port 5000 in use**: Change the port in `backend/app.py` or kill the process using port 5000
- **Python dependencies**: Make sure you're in the `backend` directory when running `pip install`

### Frontend Issues
- **Port 3000 in use**: Next.js will automatically try the next available port
- **Build errors**: Clear node_modules and reinstall with `rm -rf node_modules && npm install`

## Development

### Project Structure
```
readly-app/
├── backend/           # Flask API server
│   ├── app.py        # Main server file
│   └── requirements.txt
├── src/
│   ├── app/          # Next.js pages
│   └── components/   # React components
└── package.json
```

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Flask, PyMuPDF, Requests
- **AI**: Ollama with Mistral model
- **UI Components**: Lucide React icons, Hello Pangea DnD

## License

[Add your license information here]
