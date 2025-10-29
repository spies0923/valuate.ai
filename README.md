# valuate.ai

> Exam Answer Paper Valuation and Marksheet Generation using AI

Our application streamlines the grading process for educational institutions, specifically designed for professors and teachers. Upon registration, educators can effortlessly create a valuation form, representing the specific exam they intend to assess. They have the flexibility to upload both the question paper and the criteria, serving as the answer key for evaluating responses.

Once this foundation is laid, teachers can seamlessly upload batches of answer papers in various formats, including PDF or images. The AI takes the lead at this stage, utilizing computer vision to recognize and analyze handwritten responses. By comparing these answers against the provided criteria, the AI assigns marks to each question, significantly streamlining the grading process.

Following this initial evaluation, teachers have the opportunity to review the marks assigned by the AI. The system provides remarks, explaining the rationale behind each mark, and displays a progress indicator in red, green, or yellow to indicate the AI's confidence level in its assessment. Teachers can then make adjustments to the marks manually or request the AI to reevaluate a specific question by providing additional context.

Finally, teachers can export the overall marklist of the students, which includes the evaluated marks. The export feature supports various formats such as PDF, CSV, providing educators with a versatile tool for managing and comprehensively assessing student performance.

In essence, our application seamlessly integrates advanced technology to automate and enhance the efficiency of traditional paper-grading systems, empowering educators with a robust tool for managing and evaluating student performance.

## Quick Start with Docker 🐳

The easiest way to run Valuate.ai is using Docker:

```bash
# 1. Clone the repository
git clone <repository-url>
cd valuate.ai

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Health Check: http://localhost:8080/health/detailed
```

For detailed Docker setup instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

## Features

- 🤖 **AI-Powered Grading**: GPT-4o vision model for intelligent answer evaluation
- 📊 **Batch Processing**: Grade multiple answer sheets simultaneously
- 🔍 **Review System**: Confidence indicators and manual adjustment capabilities
- 🔄 **Revaluation**: Re-grade with additional context
- 📄 **Export Options**: PDF and CSV marksheet generation
- ⚡ **Performance**: Caching and optimized queries for fast responses
- 🔐 **Security**: Rate limiting, error handling, and secure authentication
- 📈 **Monitoring**: Health checks and comprehensive logging

## Technology Stack

**Frontend:**
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS + DaisyUI
- Clerk Authentication
- UploadThing (file uploads)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- OpenAI GPT-4o
- Winston (logging)
- Rate limiting + Caching

**Infrastructure:**
- Docker + Docker Compose
- MongoDB (included in container)

## Documentation

- [Docker Setup Guide](./DOCKER_SETUP.md) - Complete Docker deployment guide
- [Phase 1 Improvements](./PHASE1_IMPROVEMENTS.md) - Critical improvements & error handling
- [Phase 2 Improvements](./PHASE2_IMPROVEMENTS.md) - Performance & stability enhancements
- [Implementation Review](./PHASE1_PHASE2_REVIEW.md) - Comprehensive code review

## Manual Installation

If you prefer not to use Docker:

### Prerequisites
- Node.js 18+
- MongoDB
- OpenAI API Key

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure .env
npm start
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## Environment Variables

Required environment variables (see `.env.example`):
- `OPENAI_API_KEY` - OpenAI API key
- `MONGO_ROOT_PASSWORD` - MongoDB password
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `UPLOADTHING_SECRET` - UploadThing secret
- `UPLOADTHING_APP_ID` - UploadThing app ID

## API Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system metrics
- `GET /valuators` - List all valuators (with pagination)
- `POST /valuators` - Create new valuator
- `POST /valuators/valuate` - Grade answer sheet
- `POST /valuators/revaluate` - Re-grade with additional remarks
- `POST /valuators/marksheet` - Get final marksheet

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

See project in [Devfolio](https://devfolio.co/projects/valuateai-b724)
