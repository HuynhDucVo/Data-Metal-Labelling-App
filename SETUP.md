# Setup Guide - Data Labelling App with MySQL Backend

This guide will help you set up the FastAPI backend with MySQL database and file storage service.

## Prerequisites

- Python 3.8+ installed
- MySQL Server installed and running
- Node.js and npm installed (for frontend)

## Step 1: MySQL Database Setup

1. **Start MySQL Server** (if not already running):
   ```bash
   # On Ubuntu/WSL
   sudo service mysql start
   # Or
   sudo systemctl start mysql
   ```

2. **Login to MySQL**:
   ```bash
   mysql -u root -p
   ```

3. **Create Database and User**:
   ```sql
   CREATE DATABASE labeling_db;
   CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'apppass';
   GRANT ALL PRIVILEGES ON labeling_db.* TO 'appuser'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

## Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (if not already created):
   ```bash
   python3 -m venv venv
   ```

3. **Activate virtual environment**:
   ```bash
   # On Linux/Mac/WSL
   source venv/bin/activate
   
   # On Windows
   venv\Scripts\activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Create .env file** (copy from .env.example if available, or create manually):
   ```bash
   # Create .env file in backend directory
   cat > .env << EOF
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=appuser
   DB_PASSWORD=apppass
   DB_NAME=labeling_db
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760
   API_HOST=0.0.0.0
   API_PORT=8000
   EOF
   ```

6. **Fix import in main.py** (if needed):
   Open `backend/main.py` and change line 9 from:
   ```python
   from sqlalchemy import select
   ```
   to:
   ```python
   from sqlalchemy import select, func, distinct
   ```
   
   Also remove the duplicate import on line 187 (the `from sqlalchemy import distinct` line inside the function).

7. **Create uploads directory**:
   ```bash
   mkdir -p uploads
   ```

8. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`
   API documentation at `http://localhost:8000/docs`

## Step 3: Frontend Setup

1. **Navigate to project root**:
   ```bash
   cd ..
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## Step 4: Verify Setup

1. **Check MySQL connection**:
   - Backend should start without database connection errors
   - Check logs for "Database initialized" message

2. **Test API endpoints**:
   - Visit `http://localhost:8000/docs` for interactive API documentation
   - Test `/upload` endpoint with a file
   - Test `/data` endpoint to retrieve uploaded files

3. **Test Frontend**:
   - Open `http://localhost:5173`
   - Try uploading an image with a tag
   - Switch to "Data Management" view
   - Toggle between Table View and Grid View

## API Endpoints

- `POST /upload` - Upload an image file with tag metadata
- `GET /data` - Get all image records (supports `?tag=<tag>` filter)
- `GET /data/{image_id}` - Get image file by ID
- `GET /tags` - Get all unique tags

## File Structure

```
backend/
├── main.py           # FastAPI application with endpoints
├── models.py         # SQLAlchemy database models
├── database.py       # Database connection and session management
├── config.py         # Configuration settings
├── requirements.txt  # Python dependencies
├── uploads/          # File storage directory (created automatically)
└── .env              # Environment variables (create this)

src/
├── App.jsx           # Main React component with 2 views
└── App.css           # Styles for the application
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `sudo service mysql status`
- Check credentials in `.env` file
- Ensure database and user exist

### Import Errors
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Verify `func` and `distinct` are imported in `main.py`

### CORS Issues
- Ensure backend CORS settings include your frontend URL
- Check that backend is running on port 8000

### File Upload Issues
- Ensure `uploads` directory exists and is writable
- Check file size limits in `.env` (MAX_FILE_SIZE)

## Production Considerations

For production deployment:
1. Use environment variables for sensitive data
2. Set up proper file storage (S3, etc.)
3. Configure proper CORS origins
4. Use a production WSGI server (Gunicorn with Uvicorn workers)
5. Set up database connection pooling
6. Implement proper error logging
7. Add authentication/authorization
