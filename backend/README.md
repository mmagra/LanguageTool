# Language Tool - Backend API

A Node.js + Express + PostgreSQL backend for Language Tool platform with user authentication and admin approval system.

## Features
- User registration (Teacher/Student)
- Admin approval system for new registrations
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student)
- PostgreSQL database

## Setup Instructions

### 1. Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### 2. Database Setup
```bash
# Create database
createdb language_tool

# Run migrations
psql -d language_tool -f database/migrations/001_initial_schema.sql

# Run migrations in main directory
psql -U postgres -d language_tool -f backend/database/migrations/001_initial_schema.sql