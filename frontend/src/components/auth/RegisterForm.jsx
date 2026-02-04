import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { User, School, Phone, Mail, Lock, UserCheck, GraduationCap, Building, Hash, Globe, Users, BookOpen, ChevronDown, Check } from 'lucide-react';

import api from '../../services/api';

const LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian',
  'Catalan', 'Cebuano', 'Chichewa', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Corsican', 'Croatian', 'Czech', 'Danish', 'Dutch',
  'English', 'Esperanto', 'Estonian', 'Filipino', 'Finnish', 'French', 'Frisian', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati',
  'Haitian Creole', 'Hausa', 'Hawaiian', 'Hebrew', 'Hindi', 'Hmong', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian',
  'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Kinyarwanda', 'Korean', 'Kurdish (Kurmanji)', 'Kyrgyz', 'Lao', 'Latin', 'Latvian',
  'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Myanmar (Burmese)',
  'Nepali', 'Norwegian', 'Odia (Oriya)', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Samoan', 'Scots Gaelic',
  'Serbian', 'Sesotho', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili', 'Swedish', 'Tajik',
  'Tamil', 'Tatar', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uyghur', 'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa', 'Yiddish',
  'Yoruba', 'Zulu'
];

const RELATIONS = ['Father', 'Mother', 'Other'];

// Helper Components Defined Outside (Refactored for compactness)
const InputField = ({ formik, label, name, type = "text", icon: Icon, placeholder }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-600 transition-colors">
        <Icon size={16} />
      </div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 outline-none text-gray-800 placeholder-gray-400 hover:bg-white"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
      />
    </div>
    {formik.touched[name] && formik.errors[name] && (
      <p className="text-red-500 text-[10px] mt-0.5 ml-1 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
        {formik.errors[name]}
      </p>
    )}
  </div>
);

const SelectField = ({ formik, label, name, options, icon: Icon, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const selectedOption = options.find(opt => String(opt.value) === String(formik.values[name]));

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-gray-700 mb-1 ml-1">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg cursor-pointer transition-all duration-200 outline-none flex items-center justify-between group hover:bg-white ${isOpen ? 'ring-2 ring-primary-100 border-primary-500 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-hover:text-primary-600 transition-colors">
          <Icon size={16} />
        </div>

        <span className={`block truncate ${selectedOption ? 'text-gray-800' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center text-gray-400">
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-slideDown">
          {options.length > 0 ? (
            <div className="py-1">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    formik.setFieldValue(name, opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${String(formik.values[name]) === String(opt.value) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <span className="flex items-center gap-2">
                    {opt.label}
                  </span>
                  {String(formik.values[name]) === String(opt.value) && <Check size={14} className="text-primary-600" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-xs text-gray-400 text-center">No options available</div>
          )}
        </div>
      )}

      {formik.touched[name] && formik.errors[name] && (
        <p className="text-red-500 text-[10px] mt-0.5 ml-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
          {formik.errors[name]}
        </p>
      )}
    </div>
  );
};

const RegisterForm = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('parent');
  const [grades, setGrades] = useState([]);
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    const fetchContextData = async () => {
      try {
        // Fetch Grades
        // Use api service to use configured base URL
        const gradesResponse = await api.get('/grades');
        if (gradesResponse.success) {
          setGrades(gradesResponse.data);
        }

        // Fetch Schools
        const schoolsResponse = await api.getPublicSchools();
        if (schoolsResponse.success) {
          setSchools(schoolsResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch registration data', error);
      }
    };
    fetchContextData();
  }, []);

  const validationSchema = Yup.object({
    firstName: Yup.string().min(2).required(activeTab === 'parent' ? "First Name is required" : 'First Name is required'),
    lastName: Yup.string().min(2).required(activeTab === 'parent' ? "Last Name is required" : 'Last Name is required'),
    username: Yup.string().min(2).required(activeTab === 'parent' ? "Student ID is required" : 'Employee ID is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone is required'),
    password: Yup.string().min(8).max(20).required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Required'),
    role: Yup.string().required(),
    termsInfo: Yup.boolean().oneOf([true], 'Required'),

    // School Selection (Required for both)
    schoolId: Yup.string().required('School is required'),

    // Conditional
    guardianName: Yup.string().when('role', { is: 'student', then: (s) => s.required('Guardian Name'), otherwise: (s) => s.notRequired() }),
    guardianRelation: Yup.string().when('role', { is: 'student', then: (s) => s.required('Relation'), otherwise: (s) => s.notRequired() }),
    gradeId: Yup.string().when('role', { is: 'student', then: (s) => s.required('Grade'), otherwise: (s) => s.notRequired() }),
    preferredLanguage: Yup.string().when('role', { is: 'student', then: (s) => s.required('Language'), otherwise: (s) => s.notRequired() }),
  });

  const formik = useFormik({
    initialValues: {
      firstName: '', lastName: '', username: '', email: '', phone: '', password: '', confirmPassword: '',
      role: 'student', termsInfo: false,
      guardianName: '', guardianRelation: '', gradeId: '', preferredLanguage: '', schoolId: '',
    },
    enableReinitialize: true,
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      const { confirmPassword, termsInfo, ...userData } = values;

      // Clean up fields based on role
      if (activeTab === 'teacher') {
        delete userData.guardianName; delete userData.guardianRelation; delete userData.gradeId; delete userData.preferredLanguage;
      }
      // Note: SchoolId is now sent for both

      const result = await register(userData);
      setIsLoading(false);
      if (result.success) setRegistrationSuccess(true);
    },
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    formik.setFieldValue('role', tab === 'parent' ? 'student' : 'teacher');
    formik.setTouched({});
  };

  if (registrationSuccess) {
    return (
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-6 border border-gray-100 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4 animate-pulse-slow">
          <UserCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-gray-600 mb-6 text-sm">Account created. Wait for admin approval.</p>
        <div className="space-y-3">
          <Link to="/login" className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg text-sm transition-all">Access Login</Link>
          <Link to="/" className="block w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 text-sm transition-all">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      {/* Header - Compact */}
      <div className="bg-white px-5 py-3 text-center border-b border-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-0.5 tracking-tight">Connect Without Barriers</h2>
        <p className="text-gray-500 text-[10px] font-light">Bridge the gap between home and school</p>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3">
        <div className="grid grid-cols-2 p-1 bg-gray-100/80 rounded-xl mb-3 border border-gray-200/50">
          <button type="button" onClick={() => handleTabChange('parent')}
            className={`flex items-center justify-center gap-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${activeTab === 'parent' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            <GraduationCap size={14} className={activeTab === 'parent' ? "text-primary-500" : "text-gray-400"} /> Register as Student/Parent
          </button>
          <button type="button" onClick={() => handleTabChange('teacher')}
            className={`flex items-center justify-center gap-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${activeTab === 'teacher' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            <School size={14} className={activeTab === 'teacher' ? "text-primary-500" : "text-gray-400"} /> Register as Teacher
          </button>
        </div>
      </div>

      <div className="px-5 pb-5">
        <form onSubmit={formik.handleSubmit} className="space-y-2">

          {/* PARENT FIELDS */}
          {activeTab === 'parent' && (
            <div className="space-y-2 animate-fadeIn">
              {/* Row 1: Names */}
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="First Name" name="firstName" icon={User} placeholder="First Name" />
                <InputField formik={formik} label="Last Name" name="lastName" icon={User} placeholder="Last Name" />
              </div>

              {/* Row 2: ID & School */}
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="Student ID" name="username" icon={Hash} placeholder="Student ID" />
                <SelectField
                  formik={formik}
                  label="School"
                  name="schoolId"
                  icon={Building}
                  options={schools.map(s => ({ value: s.id, label: s.name }))}
                  placeholder="Select School"
                />
              </div>

              {/* Row 3: Grade & Language */}
              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  formik={formik}
                  label="Grade"
                  name="gradeId"
                  icon={BookOpen}
                  options={grades.map(g => ({ value: g.id, label: g.name }))}
                />
                <SelectField
                  formik={formik}
                  label="Language"
                  name="preferredLanguage"
                  icon={Globe}
                  options={(() => {
                    const selectedSchool = schools.find(s => String(s.id) === String(formik.values.schoolId));
                    if (selectedSchool && selectedSchool.allowed_languages && selectedSchool.allowed_languages.length > 0) {
                      return selectedSchool.allowed_languages.map(l => ({ value: l.id, label: l.name }));
                    }
                    return selectedSchool ? [] : [];
                  })()}
                  placeholder={formik.values.schoolId ? "Select Language" : "Select School"}
                />
              </div>

              {/* Row 4: Guardian */}
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="Guardian" name="guardianName" icon={UserCheck} placeholder="Guardian Name" />
                <SelectField formik={formik} label="Relation" name="guardianRelation" icon={Users} options={RELATIONS.map(r => ({ value: r, label: r }))} />
              </div>

              {/* Row 5: Contact */}
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="Email" name="email" type="email" icon={Mail} placeholder="Email" />
                <InputField formik={formik} label="Phone" name="phone" type="tel" icon={Phone} placeholder="Phone" />
              </div>

              {/* Row 6: Password */}
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="Password" name="password" type="password" icon={Lock} placeholder="8-20 chars" />
                <InputField formik={formik} label="Confirm" name="confirmPassword" type="password" icon={Lock} placeholder="Confirm" />
              </div>
            </div>
          )}

          {/* TEACHER FIELDS */}
          {activeTab === 'teacher' && (
            <div className="space-y-2 animate-fadeIn">
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="First Name" name="firstName" icon={User} placeholder="First Name" />
                <InputField formik={formik} label="Last Name" name="lastName" icon={User} placeholder="Last Name" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="Employee ID" name="username" icon={Hash} placeholder="ID" />
                {/* School Dropdown for Teacher too */}
                <SelectField formik={formik} label="School" name="schoolId" icon={Building} options={schools.map(s => ({ value: s.id, label: s.name }))} placeholder="Select School" />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="Email" name="email" type="email" icon={Mail} placeholder="Email" />
                <InputField formik={formik} label="Phone" name="phone" type="tel" icon={Phone} placeholder="Phone" />
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-2">
                <InputField formik={formik} label="Password" name="password" type="password" icon={Lock} placeholder="8-20 chars" />
                <InputField formik={formik} label="Confirm" name="confirmPassword" type="password" icon={Lock} placeholder="Confirm" />
              </div>
            </div>
          )}

          {/* Terms Checkbox */}
          <div className="flex items-center mb-2 px-1 mt-1">
            <input id="termsInfo" name="termsInfo" type="checkbox" className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" onChange={formik.handleChange} onBlur={formik.handleBlur} checked={formik.values.termsInfo} />
            <label htmlFor="termsInfo" className="ml-2 text-[10px] text-gray-600 cursor-pointer select-none">
              I agree with the <a href="#" className="text-primary-600 font-bold hover:underline">Terms</a> and <a href="#" className="text-primary-600 font-bold hover:underline">Privacy Policy</a>
            </label>
            {formik.touched.termsInfo && formik.errors.termsInfo && <p className="text-red-500 text-[10px] ml-2 font-medium">{formik.errors.termsInfo}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-xs disabled:opacity-70">
            {isLoading ? 'Creating Account...' : (activeTab === 'teacher' ? 'Create Teacher Account' : 'Create Parent Account')}
          </button>

          <p className="text-center text-[10px] text-gray-500 mt-2 !mb-0">
            Already have an account? <Link to="/login" className="text-primary-700 font-bold hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;