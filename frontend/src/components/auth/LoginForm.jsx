import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, User, Eye, EyeOff } from 'lucide-react';

const InputField = ({ formik, label, name, type = "text", icon: Icon, placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
        <Icon size={16} />
      </div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-200 outline-none text-slate-800 placeholder-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-slate-800"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
      />
    </div>
    {formik.touched[name] && formik.errors[name] && (
      <p className="text-red-500 text-xs mt-0.5 ml-1 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
        {formik.errors[name]}
      </p>
    )}
  </div>
);

const PasswordField = ({ formik, label, name, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
          <Lock size={16} />
        </div>
        <input
          name={name}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-200 outline-none text-slate-800 placeholder-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-slate-800"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values[name]}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(v => !v)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary-600 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-red-500 text-xs mt-0.5 ml-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
          {formik.errors[name]}
        </p>
      )}
    </div>
  );
};

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);

  const formik = useFormik({
    initialValues: {
      emailOrUsername: '',
      password: '',
    },
    validationSchema: Yup.object({
      emailOrUsername: Yup.string().required('Email or Username is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setLoginFailed(false);
      const result = await login(values.emailOrUsername, values.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setLoginFailed(true);
      }
      setLoading(false);
    },
  });

  return (
    <div className="w-full animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1 tracking-tight">Sign In</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs">Access your account and stay connected.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <InputField
          formik={formik}
          label="Email or Username"
          name="emailOrUsername"
          icon={User}
          placeholder="Enter your email or username"
        />

        <div className="space-y-1">
          <PasswordField
            formik={formik}
            label="Password"
            name="password"
            placeholder="Enter your password"
          />
          <div className="flex justify-end pt-1">
            <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>

        {loginFailed && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
            Incorrect credentials.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-70 mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Signing In...
            </span>
          ) : 'Sign In'}
        </button>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-700 font-bold hover:underline">
            Create Account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
