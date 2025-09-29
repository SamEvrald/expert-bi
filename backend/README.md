# Expert BI Backend API

A comprehensive Node.js backend API for the Expert BI data analysis platform.

## Features

- **User Authentication & Authorization** - JWT-based auth with refresh tokens
- **Project Management** - Create and manage data analysis projects
- **File Upload & Processing** - Secure CSV upload via Cloudinary with automatic analysis
- **Data Analysis Engine** - Statistical analysis, data type detection, and insight generation
- **Interactive Charts** - Automatic chart generation based on data types
- **Rate Limiting** - API protection with configurable rate limits
- **Data Security** - User data isolation and secure file storage
- **Plan Management** - Free and Premium plan support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Data Analysis**: CSV parsing, statistical analysis, chart generation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Environment**: dotenv for configuration

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Cloudinary account (for file storage)

### Installation

1. **Clone and setup:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup:**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE expert_bi;
   exit
   
   # Seed database with sample data
   npm run seed
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

## Environment Configuration

Update your `.env` file with the following settings:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=expert_bi
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/stats` - Get project statistics

### Datasets
- `POST /api/datasets/upload` - Upload CSV file
- `GET /api/datasets` - List datasets
- `GET /api/datasets/:id` - Get dataset details
- `GET /api/datasets/:id/analysis` - Get analysis results
- `POST /api/datasets/:id/reanalyze` - Rerun analysis
- `DELETE /api/datasets/:id` - Delete dataset

### System
- `GET /api/health` - Health check
- `GET /api` - API information

## Data Analysis Features

The backend automatically analyzes uploaded CSV files and provides:

### Column Analysis
- **Data Type Detection**: Number, String, Date, Boolean
- **Statistical Summary**: Mean, median, standard deviation, min/max
- **Data Quality**: Missing values, unique counts, sample values

### Chart Generation
- **Bar Charts**: For categorical data distribution
- **Histograms**: For numerical data distribution
- **Scatter Plots**: For numerical correlations
- **Pie Charts**: For categorical breakdowns

### Insights Generation
- Dataset overview and quality assessment
- Column type distribution analysis
- Missing data identification
- Data quality recommendations

## Security Features

- **JWT Authentication** with secure token rotation
- **Rate Limiting** to prevent abuse
- **Input Validation** using express-validator
- **SQL Injection Protection** via Sequelize ORM
- **CORS Configuration** for secure cross-origin requests
- **File Upload Security** with type and size validation
- **Password Hashing** using bcrypt
- **Data Isolation** between users

## Database Schema

### Users
```sql
- id (UUID, Primary Key)
- name (String, Required)
- email (String, Unique, Required)
- password (String, Hashed)
- plan (Enum: 'free', 'premium')
- emailVerified (Boolean)
- isActive (Boolean)
- createdAt, updatedAt (Timestamps)
```

### Projects
```sql
- id (UUID, Primary Key)
- name (String, Required)
- description (Text)
- userId (UUID, Foreign Key)
- status (Enum: 'active', 'archived', 'deleted')
- createdAt, updatedAt (Timestamps)
```

### Datasets
```sql
- id (UUID, Primary Key)
- projectId (UUID, Foreign Key)
- userId (UUID, Foreign Key)
- originalName (String)
- fileName (String)
- fileSize (Integer)
- cloudinaryPublicId (String)
- cloudinaryUrl (Text)
- status (Enum: 'uploading', 'processing', 'completed', 'error')
- rowCount, columnCount (Integer)
- analysisData (JSON)
- createdAt, updatedAt (Timestamps)
```

## Error Handling

The API implements comprehensive error handling:

- **Validation Errors** (400) - Invalid input data
- **Authentication Errors** (401) - Invalid/expired tokens
- **Authorization Errors** (403) - Insufficient permissions
- **Not Found Errors** (404) - Resource not found
- **Rate Limit Errors** (429) - Too many requests
- **Server Errors** (500) - Internal server errors

All errors return consistent JSON responses with:
```json
{
  "success": false,
  "status": 400,
  "message": "Error description",
  "errors": [...], // Detailed validation errors if applicable
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Plan Limitations

### Free Plan
- 1 active project maximum
- Standard analysis features
- 10MB file size limit

### Premium Plan
- Unlimited projects
- Advanced analysis features
- Enhanced file processing
- Priority support

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
backend/
├── src/
│   ├── config/         # Database and service configurations
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Authentication, validation, error handling
│   ├── models/         # Database models (Sequelize)
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic (CSV analysis, etc.)
│   └── utils/          # Helper functions
├── scripts/            # Database seeding and utility scripts
└── server.js          # Main application entry point
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up Cloudinary for file storage
4. Configure email service for password resets
5. Set up SSL/TLS certificates
6. Configure reverse proxy (nginx)
7. Set up monitoring and logging

## License

MIT License - see LICENSE file for details.