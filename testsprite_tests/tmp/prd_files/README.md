# Infinia Property Management System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Backend Services](#backend-services)
5. [Frontend Application](#frontend-application)
6. [API Documentation](#api-documentation)
7. [Payment Integration](#payment-integration)
8. [Communication Services](#communication-services)
9. [Security & Authentication](#security--authentication)
10. [Development Guidelines](#development-guidelines)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)

## System Overview

Infinia Property Management is a comprehensive property management system that helps landlords and property managers efficiently manage their properties, tenants, and financial transactions.

### Key Features
- Property and Unit Management
- Tenant Management
- Lease Management
- Payment Processing (M-Pesa, Bank, Cash)
- Invoice Generation
- SMS Communications
- Financial Reporting
- User Role Management

## Architecture

### Backend (Django REST Framework)
- Python/Django REST Framework
- MySQL/SQLite Database
- Celery for Background Tasks
- Redis for Caching
- Firebase Authentication

### Frontend (Next.js)
- Next.js Framework
- TypeScript
- Tailwind CSS
- ShadcnUI Components
- Context API for State Management

### Third-Party Integrations
- M-Pesa Payment Gateway
- AfricasTalking SMS Gateway
- Firebase Authentication
- Cloud Storage

## Installation & Setup

### Prerequisites
```bash
# Python 3.8+
# Node.js 16+
# Redis Server
# MySQL (Optional)
```

### Backend Setup
1. Clone the repository
2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Environment Configuration:
Create `.env.local` file with:
```env
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_TYPE=sqlite  # or mysql
DJANGO_TIME_ZONE=Africa/Nairobi

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/firebase_service_account.json

# M-Pesa Configuration
CONSUMER_KEY=your_mpesa_consumer_key
CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_shortcode
BASE_URL=your_base_url

# AfricasTalking Configuration
AT_USERNAME=your_africastalking_username
AT_API_KEY=your_africastalking_api_key
AT_SENDER_ID=your_sender_id

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379
```

5. Database Setup:
```bash
python manage.py migrate
python manage.py createsuperuser
```

6. Start Redis Server (WSL):
```bash
sudo service redis-server start
redis-cli ping  # Should return "PONG" if Redis is running
```

7. Start Celery Services:
```bash
# Start Celery Worker (in a separate terminal)
celery -A rental_backend worker --pool=solo -l info

# Start Celery Beat (in another separate terminal)
celery -A rental_backend beat -l info
```

Note: For Windows users, the `--pool=solo` option is required for the Celery worker to function correctly.

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd v0_client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_CONFIG=your_firebase_config
```

4. Start development server:
```bash
npm run dev
```

## Backend Services

### Core Apps
1. **accounts**: User management and authentication
2. **properties**: Property management
3. **units**: Unit management within properties
4. **tenants**: Tenant management
5. **payments**: Payment processing (M-Pesa, Bank, Cash)
6. **lease**: Lease agreement management
7. **communications**: SMS communication
8. **system_settings**: System-wide configurations

### Background Tasks (Celery)
- Invoice Generation
- Payment Processing
- SMS Notifications
- Report Generation

## Frontend Application

### Key Components
1. **Dashboard**: Overview and analytics
2. **Properties**: Property management interface
3. **Units**: Unit management and status
4. **Tenants**: Tenant information and history
5. **Payments**: Payment processing and history
6. **Reports**: Financial and operational reports
7. **Settings**: System configuration

### State Management
- Context API for global state
- Custom hooks for data fetching
- Form management with React Hook Form

## API Documentation

### Authentication
All API endpoints require authentication using Firebase tokens.

### API Endpoints
1. **Properties**
   - `GET /api/v1/properties/`: List properties
   - `POST /api/v1/properties/`: Create property
   - `GET /api/v1/properties/{id}/`: Get property details
   - `PUT /api/v1/properties/{id}/`: Update property
   - `DELETE /api/v1/properties/{id}/`: Delete property

2. **Units**
   - `GET /api/v1/properties/{property_id}/units/`: List units
   - `POST /api/v1/properties/{property_id}/units/`: Create unit
   - `GET /api/v1/units/{id}/`: Get unit details
   - `PUT /api/v1/units/{id}/`: Update unit
   - `DELETE /api/v1/units/{id}/`: Delete unit

3. **Tenants**
   - `GET /api/v1/tenants/`: List tenants
   - `POST /api/v1/tenants/`: Create tenant
   - `GET /api/v1/tenants/{id}/`: Get tenant details
   - `PUT /api/v1/tenants/{id}/`: Update tenant
   - `DELETE /api/v1/tenants/{id}/`: Delete tenant

4. **Payments**
   - `GET /api/v1/payments/`: List payments
   - `POST /api/v1/payments/`: Create payment
   - `GET /api/v1/payments/{id}/`: Get payment details
   - `PUT /api/v1/payments/{id}/`: Update payment
   - `GET /api/v1/payments/stats/`: Get payment statistics

5. **Communications**
   - `GET /api/v1/communications/messages/`: List messages
   - `POST /api/v1/communications/messages/`: Send message
   - `GET /api/v1/communications/templates/`: List templates

## Payment Integration

### M-Pesa Integration
1. **Configuration**
   - Set up M-Pesa credentials in system settings
   - Configure callback URLs
   - Register C2B URLs using management command

2. **Payment Flow**
   - C2B (Customer to Business) payments
   - Payment validation and confirmation
   - Transaction recording and reconciliation

3. **Error Handling**
   - Validation errors
   - Transaction failures
   - Network issues

### Bank Transfers
1. **Manual Recording**
2. **Reconciliation Process**
3. **Receipt Generation**

### Cash Payments
1. **Recording Process**
2. **Receipt Generation**
3. **Cash Handling Guidelines**

## Communication Services

### SMS Integration (AfricasTalking)
1. **Configuration**
   - API credentials setup
   - Sender ID configuration
   - Template management

2. **Message Types**
   - Payment confirmations
   - Rent reminders
   - General notifications

3. **Templates**
   - Template variables
   - Template management
   - Message customization

## Security & Authentication

### Firebase Authentication
1. **Setup**
   - Firebase project configuration
   - Service account setup
   - Client-side configuration

2. **User Management**
   - User registration
   - Role assignment
   - Permission management

### API Security
1. **Authentication**
   - Token validation
   - Session management
   - CORS configuration

2. **Authorization**
   - Role-based access control
   - Permission checking
   - Resource ownership

## Development Guidelines

### Code Style
1. **Backend (Python)**
   - PEP 8 compliance
   - Type hints usage
   - Documentation strings

2. **Frontend (TypeScript)**
   - ESLint configuration
   - Prettier formatting
   - Component organization

### Testing
1. **Backend Tests**
   - Unit tests
   - Integration tests
   - API tests

2. **Frontend Tests**
   - Component tests
   - Integration tests
   - E2E tests

## Deployment Guide

### Backend Deployment
1. **Server Requirements**
2. **Database Setup**
3. **Environment Configuration**
4. **Static Files**
5. **SSL Configuration**

### Frontend Deployment
1. **Build Process**
2. **Environment Variables**
3. **Static Export**
4. **CDN Configuration**

## Troubleshooting

### Common Issues
1. **Payment Integration**
   - M-Pesa callback failures
   - Transaction reconciliation issues
   - Payment validation errors

2. **Authentication**
   - Token expiration
   - Permission issues
   - Firebase configuration

3. **Performance**
   - Database optimization
   - Caching strategies
   - API response times

### Monitoring
1. **Error Logging**
2. **Performance Metrics**
3. **User Activity Tracking