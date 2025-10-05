# EXPAIR

EXPAIR is a platform built with Next.js (frontend) and Django (backend), featuring real-time messaging, skill-based trading, and user verification systems.

## 🏗️ Project Architecture

```
expair/
├── app/                    # Next.js frontend application
├── backend/               # Django REST API backend
│   ├── accounts/         # User authentication & management
│   ├── database/         # Database management scripts & SQL files
│   └── manage.py         # Django management script
├── components/           # Reusable React components
├── stores/              # Zustand state management
└── public/              # Static assets
```

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v20.x) - [Download here](https://nodejs.org/)
- **Python** (v3.8+) - [Download here](https://python.org/)
- **PostgreSQL** (v12+) - [Download here](https://postgresql.org/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd expair
```

### 2. Database Setup

#### Option A: Using Database Management Scripts (Recommended)

Navigate to the backend directory and use the provided scripts:

```bash
cd backend

# For Windows
database\manage_db.bat fresh

# For Linux/Mac
chmod +x database/manage_db.sh
./database/manage_db.sh fresh
```

#### Option B: Manual Database Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE expair_db;
   ```

2. **Run SQL Files in Order:**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Run schema (creates all tables)
   psql -h localhost -U postgres -d expair_db < database/sql/01_schema.sql
   
   # Run initial data (skills, categories, etc.)
   psql -h localhost -U postgres -d expair_db < database/sql/02_initial_data.sql
   ```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Django migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start Django development server
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### 4. Frontend Setup

```bash
# From project root directory
npm install

# Start Next.js development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📁 SQL Files Location

The database SQL files are located in `backend/database/sql/`:

- **`01_schema.sql`** - Complete database schema (tables, indexes, constraints)
- **`02_initial_data.sql`** - Initial data (skills, categories, sample data)
- **`expair_db.sql`** - Additional database operations (if needed)

## 🛠️ Database Management

The project includes comprehensive database management scripts:

### Windows (`backend/database/manage_db.bat`)
```bash
# Create backup
database\manage_db.bat backup

# Restore from backup
database\manage_db.bat restore

# Create fresh database
database\manage_db.bat fresh

# Show database info
database\manage_db.bat info
```

### Linux/Mac (`backend/database/manage_db.sh`)
```bash
# Make executable
chmod +x database/manage_db.sh

# Create backup
./database/manage_db.sh backup

# Restore from backup
./database/manage_db.sh restore

# Create fresh database
./database/manage_db.sh fresh

# Show database info
./database/manage_db.sh info
```

## 🔧 Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=expair_db

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Frontend Environment Variables

Create a `.env.local` file in the project root:

```env
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Google reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

## 🎯 Key Features

- **User Authentication** - Registration, login, password reset
- **Skill-Based Trading** - General and specific skills management
- **Real-time Messaging** - Live chat between users
- **Trade Management** - Request, offer, and complete trades
- **User Verification** - Document upload and verification system
- **Rating System** - User feedback and rating mechanism
- **Interactive Maps** - Location-based features using Mapbox

## 📚 API Documentation

The Django REST API provides endpoints for:

- **Authentication**: `/api/auth/` - User registration, login, password reset
- **Users**: `/api/users/` - User profiles and management
- **Skills**: `/api/skills/` - General and specific skills
- **Trades**: `/api/trades/` - Trade requests and management
- **Messages**: `/api/messages/` - Real-time messaging

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
npm test
```

### Code Quality

```bash
# Frontend linting
npm run lint

# Backend linting (if configured)
cd backend
flake8 .
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (---)


## 📖 Additional Documentation

- **Database Management**: See `backend/database/README.md` for detailed database operations
- **API Documentation**: Available at `http://localhost:8000/api/docs/` when running
- **Component Documentation**: Check individual component files in `components/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
