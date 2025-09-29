# Expert BI API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "status": 200,
  "message": "Success message",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "status": 400,
  "message": "Error message",
  "errors": [ /* detailed error information */ ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "plan": "free",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:** Same as register

### Refresh Token
**POST** `/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "free",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile
**PUT** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith"
}
```

### Change Password
**PUT** `/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "NewPassword123!"
}
```

### Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "NewPassword123!"
}
```

---

## Project Endpoints

### Create Project
**POST** `/projects`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Analysis Project",
  "description": "Project description (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Analysis Project",
    "description": "Project description",
    "userId": "user_uuid",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### List Projects
**GET** `/projects`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10, max: 100) - Items per page
- `status` (string, default: 'active') - Project status filter
- `search` (string) - Search project names

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Project Name",
        "description": "Description",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "datasets": [...],
        "datasetCounts": {
          "total": 5,
          "completed": 3,
          "processing": 1,
          "error": 1
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

### Get Project
**GET** `/projects/:id`

**Headers:** `Authorization: Bearer <token>`

### Update Project
**PUT** `/projects/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "archived"
}
```

### Delete Project
**DELETE** `/projects/:id`

**Headers:** `Authorization: Bearer <token>`

### Get Project Statistics
**GET** `/projects/:id/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDatasets": 10,
    "completedDatasets": 8,
    "totalRows": 50000,
    "totalSize": 5242880,
    "completionRate": "80.0",
    "recentDatasets": [...]
  }
}
```

---

## Dataset Endpoints

### Upload Dataset
**POST** `/datasets/upload`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (file) - CSV file to upload
- `projectId` (string) - UUID of the project

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "project_uuid",
    "originalName": "sales_data.csv",
    "fileName": "processed_filename.csv",
    "fileSize": 1024000,
    "status": "processing",
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### List Datasets
**GET** `/datasets`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (integer) - Page number
- `limit` (integer) - Items per page
- `projectId` (uuid) - Filter by project
- `status` (string) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "datasets": [
      {
        "id": "uuid",
        "projectId": "project_uuid",
        "originalName": "data.csv",
        "fileSize": 1024000,
        "status": "completed",
        "rowCount": 1000,
        "columnCount": 15,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### Get Dataset
**GET** `/datasets/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "project_uuid",
    "originalName": "sales_data.csv",
    "fileSize": 1024000,
    "status": "completed",
    "rowCount": 1000,
    "columnCount": 15,
    "analysisData": { /* full analysis results */ },
    "processedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Dataset Analysis
**GET** `/datasets/:id/analysis`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "name": "sales_amount",
        "type": "number",
        "unique": 500,
        "missing": 5,
        "sample": [100.5, 250.0, 75.25, 300.0, 125.5]
      },
      {
        "name": "customer_type",
        "type": "string",
        "unique": 3,
        "missing": 0,
        "sample": ["Premium", "Standard", "Basic"]
      }
    ],
    "rowCount": 1000,
    "summary": {
      "numerical": {
        "sales_amount": {
          "mean": 185.50,
          "median": 175.00,
          "std": 95.25,
          "min": 10.0,
          "max": 1500.0,
          "q1": 120.0,
          "q3": 250.0
        }
      },
      "categorical": {
        "customer_type": {
          "counts": {
            "Premium": 300,
            "Standard": 450,
            "Basic": 250
          },
          "uniqueCount": 3,
          "mostFrequent": ["Standard", 450]
        }
      }
    },
    "insights": [
      "Dataset contains 1,000 rows and 15 columns",
      "Found 8 numerical columns suitable for statistical analysis",
      "Found 5 categorical columns for grouping and classification",
      "2 columns have missing values (15 total missing values)"
    ],
    "chartData": [
      {
        "type": "bar",
        "title": "Distribution of customer_type",
        "data": [
          {"name": "Standard", "value": 450},
          {"name": "Premium", "value": 300},
          {"name": "Basic", "value": 250}
        ],
        "xKey": "name",
        "yKey": "value"
      },
      {
        "type": "bar",
        "title": "Distribution of sales_amount",
        "data": [
          {"range": "10.0-160.0", "count": 150},
          {"range": "160.0-310.0", "count": 400},
          {"range": "310.0-460.0", "count": 300}
        ],
        "xKey": "range",
        "yKey": "count"
      },
      {
        "type": "scatter",
        "title": "sales_amount vs order_quantity",
        "data": [
          {"x": 100.5, "y": 2},
          {"x": 250.0, "y": 5},
          {"x": 75.25, "y": 1}
        ],
        "xKey": "x",
        "yKey": "y"
      }
    ],
    "dataQuality": {
      "completeness": "98.5",
      "totalMissingValues": 15
    }
  }
}
```

### Reanalyze Dataset
**POST** `/datasets/:id/reanalyze`

**Headers:** `Authorization: Bearer <token>`

### Delete Dataset
**DELETE** `/datasets/:id`

**Headers:** `Authorization: Bearer <token>`

---

## System Endpoints

### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### API Information
**GET** `/`

**Response:**
```json
{
  "message": "Expert BI API",
  "version": "1.0.0",
  "documentation": "https://api.expertbi.com/docs",
  "endpoints": {
    "auth": "/api/auth",
    "projects": "/api/projects",
    "datasets": "/api/datasets",
    "health": "/api/health"
  }
}
```

---

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **File Upload**: 10 uploads per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T01:00:00.000Z
Retry-After: 900
```

---

## Error Codes

- **400** - Bad Request (validation errors, malformed data)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions, plan limits)
- **404** - Not Found (resource doesn't exist)
- **422** - Unprocessable Entity (business logic errors)
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error (server-side errors)

---

## File Upload Specifications

### Supported Formats
- CSV files only (`.csv` extension)
- MIME types: `text/csv`, `application/csv`

### Limits
- Maximum file size: 10MB
- Maximum files per upload: 1

### Security
- Files are scanned for malicious content
- Secure storage via Cloudinary
- User data isolation
- Automatic file cleanup on errors

---

## Data Analysis Capabilities

### Column Type Detection
- **Numbers**: Integers, floats, percentages
- **Strings**: Text, categories, identifiers
- **Dates**: Various date formats
- **Booleans**: True/false, yes/no, 1/0

### Statistical Analysis
- Descriptive statistics for numerical data
- Frequency analysis for categorical data
- Missing value detection
- Data quality assessment

### Chart Generation
- **Bar Charts**: Categorical distributions
- **Histograms**: Numerical distributions
- **Scatter Plots**: Correlation analysis
- **Pie Charts**: Proportional data

### Insights Generation
- Automated pattern detection
- Data quality recommendations
- Statistical significance
- Anomaly identification