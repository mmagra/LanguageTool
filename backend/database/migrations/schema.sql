-- ============================================================
-- Spoken Edge Database Schema (PostgreSQL)
-- Single consolidated migration file
-- ============================================================

-- ============================================================
-- 1. LANGUAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    speech_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. SCHOOLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_number VARCHAR(50),  -- Added by 003
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    plan_tier VARCHAR(20) DEFAULT 'basic' CHECK (plan_tier IN ('basic', 'pro', 'enterprise')),
    features JSONB DEFAULT '{
        "in_person": true,
        "chat_history": true,
        "remote_sessions": false
    }'::jsonb,
    max_students INTEGER DEFAULT 100,
    max_teachers INTEGER DEFAULT 10,
    minutes_limit INTEGER DEFAULT 1000, -- Added by 006
    minutes_used INTEGER DEFAULT 0,     -- Added by 006
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. SCHOOL LANGUAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS school_languages (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, language_id)
);

CREATE INDEX IF NOT EXISTS idx_school_languages_school ON school_languages(school_id);

-- ============================================================
-- 4. GRADES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(100),
    phone VARCHAR(20),
    profile_image TEXT,
    about TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'super admin')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'allowed')),
    is_online BOOLEAN DEFAULT FALSE,
    school_id INTEGER REFERENCES schools(id), -- Added by 002
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. TEACHER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. STUDENT PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES grades(id),
    guardian_name VARCHAR(100),
    guardian_relation VARCHAR(50),
    preferred_language_id INTEGER REFERENCES languages(id), -- Added by 002
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. CONVERSATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    teacher_last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    student_last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Denormalized fields (001_optimize_chat.sql)
    last_message_content TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_sender_id INTEGER REFERENCES users(id),
    teacher_unread_count INTEGER DEFAULT 0,
    student_unread_count INTEGER DEFAULT 0
);

-- ============================================================
-- 9. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255),
    content TEXT NOT NULL,
    translated_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. SUBSCRIPTION LOGS (Added by 002, Enhanced by 010, 012)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_logs (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id),
    amount DECIMAL(10, 2),
    payment_date DATE,
    status VARCHAR(20) CHECK (status IN ('paid', 'pending', 'failed')),
    payment_method VARCHAR(50) DEFAULT 'manual',
    invoice_number VARCHAR(100) UNIQUE,
    invoice_url TEXT,
    billing_period_start DATE,
    billing_period_end DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_school ON subscription_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_status ON subscription_logs(status);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_date ON subscription_logs(payment_date);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_invoice ON subscription_logs(invoice_number);

-- ============================================================
-- ============================================================
-- 11. SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. AUDIT LOGS TABLE (Added by migration 011)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 13. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_teacher ON conversations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_grade ON student_profiles(grade_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_school ON sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- ============================================================
-- SEED DATA: LANGUAGES
-- ============================================================
INSERT INTO languages (name, code, speech_code) VALUES
    ('Afrikaans', 'af', NULL),
    ('Albanian', 'sq', NULL),
    ('Amharic', 'am', NULL),
    ('Arabic', 'ar', NULL),
    ('Armenian', 'hy', NULL),
    ('Azerbaijani', 'az', 'az'),
    ('Basque', 'eu', 'eu'),
    ('Belarusian', 'be', NULL),
    ('Bengali', 'bn', NULL),
    ('Bosnian', 'bs', NULL),
    ('Bulgarian', 'bg', NULL),
    ('Catalan', 'ca', NULL),
    ('Cebuano', 'ceb', NULL),
    ('Chichewa', 'ny', NULL),
    ('Chinese (Simplified)', 'zh-CN', 'zh-CN'),
    ('Chinese (Traditional)', 'zh-TW', 'zh-TW'),
    ('Corsican', 'co', 'co'),
    ('Croatian', 'hr', 'hr-HR'),
    ('Czech', 'cs', NULL),
    ('Danish', 'da', 'da-DK'),
    ('Dutch', 'nl', 'nl-NL'),
    ('English', 'en', 'en-US'),
    ('Esperanto', 'eo', NULL),
    ('Estonian', 'et', NULL),
    ('Filipino', 'tl', NULL),
    ('Finnish', 'fi', 'fi-FI'),
    ('French', 'fr', 'fr-FR'),
    ('Frisian', 'fy', NULL),
    ('Galician', 'gl', NULL),
    ('Georgian', 'ka', NULL),
    ('German', 'de', 'de-DE'),
    ('Greek', 'el', NULL),
    ('Gujarati', 'gu', NULL),
    ('Haitian Creole', 'ht', NULL),
    ('Hausa', 'ha', 'ha'),
    ('Hawaiian', 'haw', NULL),
    ('Hebrew', 'he', NULL),
    ('Hindi', 'hi', 'hi-IN'),
    ('Hmong', 'hmn', NULL),
    ('Hungarian', 'hu', NULL),
    ('Icelandic', 'is', 'is-IS'),
    ('Igbo', 'ig', NULL),
    ('Indonesian', 'id', 'id-ID'),
    ('Irish', 'ga', 'ga'),
    ('Italian', 'it', 'it-IT'),
    ('Japanese', 'ja', 'ja-JP'),
    ('Javanese', 'jv', 'jv-ID'),
    ('Kannada', 'kn', NULL),
    ('Kazakh', 'kk', NULL),
    ('Khmer', 'km', NULL),
    ('Kinyarwanda', 'rw', NULL),
    ('Korean', 'ko', 'ko-KR'),
    ('Kurdish (Kurmanji)', 'ku', NULL),
    ('Kyrgyz', 'ky', NULL),
    ('Lao', 'lo', NULL),
    ('Latin', 'la', NULL),
    ('Latvian', 'lv', NULL),
    ('Lithuanian', 'lt', 'lt-LT'),
    ('Luxembourgish', 'lb', 'lb'),
    ('Macedonian', 'mk', NULL),
    ('Malagasy', 'mg', NULL),
    ('Malay', 'ms', NULL),
    ('Malayalam', 'ml', NULL),
    ('Maltese', 'mt', NULL),
    ('Maori', 'mi', NULL),
    ('Marathi', 'mr', NULL),
    ('Mongolian', 'mn', NULL),
    ('Myanmar (Burmese)', 'my', NULL),
    ('Nepali', 'ne', NULL),
    ('Norwegian', 'no', NULL),
    ('Odia (Oriya)', 'or', NULL),
    ('Pashto', 'ps', NULL),
    ('Persian', 'fa', NULL),
    ('Polish', 'pl', 'pl-PL'),
    ('Portuguese', 'pt', 'pt-PT'),
    ('Punjabi', 'pa', NULL),
    ('Romanian', 'ro', NULL),
    ('Russian', 'ru', 'ru-RU'),
    ('Samoan', 'sm', NULL),
    ('Scots Gaelic', 'gd', NULL),
    ('Serbian', 'sr', NULL),
    ('Sesotho', 'st', 'st'),
    ('Shona', 'sn', 'sn'),
    ('Sindhi', 'sd', NULL),
    ('Sinhala', 'si', NULL),
    ('Slovak', 'sk', NULL),
    ('Slovenian', 'sl', NULL),
    ('Somali', 'so', NULL),
    ('Spanish', 'es', 'es-ES'),
    ('Sundanese', 'su', 'su'),
    ('Swahili', 'sw', NULL),
    ('Swedish', 'sv', 'sv-SE'),
    ('Tajik', 'tg', NULL),
    ('Tamil', 'ta', NULL),
    ('Tatar', 'tt', NULL),
    ('Telugu', 'te', NULL),
    ('Thai', 'th', NULL),
    ('Turkish', 'tr', 'tr-TR'),
    ('Turkmen', 'tk', NULL),
    ('Ukrainian', 'uk', NULL),
    ('Urdu', 'ur', NULL),
    ('Uyghur', 'ug', NULL),
    ('Uzbek', 'uz', 'uz-UZ'),
    ('Vietnamese', 'vi', 'vi-VN'),
    ('Welsh', 'cy', NULL),
    ('Xhosa', 'xh', 'xh'),
    ('Yiddish', 'yi', NULL),
    ('Yoruba', 'yo', 'yo'),
    ('Zulu', 'zu', 'zu-ZA')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED DATA: DEFAULT SCHOOL
-- ============================================================
INSERT INTO schools (name, contact_email, plan_tier, features)
VALUES ('Default School', 'admin@spokene.com', 'enterprise', '{
    "in_person": true,
    "chat_history": true,
    "remote_sessions": true
}')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: GRADES
-- ============================================================
INSERT INTO grades (id, name) VALUES
    (1, 'Pre-Kindergarten (Pre-K)'),
    (2, 'Kindergarten (K)'),
    (3, '1st'),
    (4, '2nd'),
    (5, '3rd'),
    (6, '4th'),
    (7, '5th'),
    (8, '6th'),
    (9, '7th'),
    (10, '8th'),
    (11, '9th'),
    (12, '10th'),
    (13, '11th'),
    (14, '12th')
ON CONFLICT (id) DO NOTHING;

-- Reset grade sequence
SELECT setval('grades_id_seq', (SELECT COALESCE(MAX(id), 1) FROM grades));

-- ============================================================
-- SEED DATA: SAMPLE USERS
-- Password for all: Password123! (bcrypt hash)
-- ============================================================

-- Super Admin user
INSERT INTO users (email, password_hash, first_name, last_name, username, role, status, phone, about, school_id)
VALUES (
    'superadmin@spokene.com',
    '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na',
    'Super',
    'Admin',
    'super_admin',
    'super admin',
    'active',
    '000000000',
    'Global System Administrator',
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Admin user
INSERT INTO users (email, password_hash, first_name, last_name, username, role, status, phone, about, school_id)
VALUES (
    'admin@spokene.com',
    '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na',
    'Khawar',
    'Shakeel',
    'admin',
    'admin',
    'active',
    '123456789',
    'Administrator',
    (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1)
) ON CONFLICT (email) DO NOTHING;

-- Sample Teachers
INSERT INTO users (email, password_hash, first_name, last_name, username, role, status, phone, about, school_id)
VALUES 
    ('ateacher@gmail.com', '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na', 'Teacher', 'A', 'a_teacher', 'teacher', 'active', '111000', 'I''m passionate about helping students grow and discover their strengths.', (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1)),
    ('bteacher@gmail.com', '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na', 'Teacher', 'B', 'b_teacher', 'teacher', 'active', '111111', 'I strive to make my classroom a welcoming and engaging space for all learners.', (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1)),
    ('cteacher@gmail.com', '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na', 'Teacher', 'C', 'c_teacher', 'teacher', 'active', '111222', 'I believe in creating a classroom where every student feels valued.', (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1))
ON CONFLICT (email) DO NOTHING;

-- Sample Students
INSERT INTO users (email, password_hash, first_name, last_name, username, role, status, phone, about, school_id)
VALUES 
    ('student01@gmail.com', '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na', 'Student', '01', 'student01', 'student', 'active', '111', 'Student 01 is a dedicated student who is actively engaged in their academic journey.', (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1)),
    ('student02@gmail.com', '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na', 'Student', '02', 'student02', 'student', 'active', '222', 'Student 02 is learning actively with help from home.', (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1)),
    ('student03@gmail.com', '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na', 'Student', '03', 'student03', 'student', 'active', '333', 'Student 03 is learning actively with help from home.', (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1)),
    ('student04@gmail.com', '$2b$10$.9s85gZDkktS4LQt2eILLuy3IZd4caCfv7uVhjW9qdocO3D5am.na', 'Student', '04', 'student04', 'student', 'active', '123123', 'Student 04 is a bright student who enjoys school.', (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1))
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SEED DATA: TEACHER PROFILES
-- ============================================================
INSERT INTO teacher_profiles (user_id)
SELECT id
FROM users WHERE email = 'ateacher@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teacher_profiles (user_id)
SELECT id
FROM users WHERE email = 'bteacher@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teacher_profiles (user_id)
SELECT id
FROM users WHERE email = 'cteacher@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- SEED DATA: STUDENT PROFILES
-- ============================================================
INSERT INTO student_profiles (user_id, grade_id, guardian_name, guardian_relation, preferred_language_id)
SELECT u.id, 8, 'Father 01', 'Father', (SELECT id FROM languages WHERE name = 'Spanish')
FROM users u WHERE u.email = 'student01@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student_profiles (user_id, grade_id, guardian_name, guardian_relation, preferred_language_id)
SELECT u.id, 9, 'Mother 02', 'Mother', (SELECT id FROM languages WHERE name = 'Urdu')
FROM users u WHERE u.email = 'student02@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student_profiles (user_id, grade_id, guardian_name, guardian_relation, preferred_language_id)
SELECT u.id, 8, 'Father 03', 'Father', (SELECT id FROM languages WHERE name = 'Hindi')
FROM users u WHERE u.email = 'student03@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student_profiles (user_id, grade_id, guardian_name, guardian_relation, preferred_language_id)
SELECT u.id, 10, 'Mother 04', 'Mother', (SELECT id FROM languages WHERE name = 'Danish')
FROM users u WHERE u.email = 'student04@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- SEED DATA: SCHOOL LANGUAGES (Assign all to Default)
-- ============================================================
INSERT INTO school_languages (school_id, language_id)
SELECT (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1), id
FROM languages
ON CONFLICT DO NOTHING;

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
