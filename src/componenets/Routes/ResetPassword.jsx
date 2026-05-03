import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../componenets/config/api';
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Check } from 'lucide-react';

export default function ResetPassword(){
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    // Password strength validation
    const errors = [];
    let strength = 0;

    if (newPassword.length >= 8) {
      strength += 25;
    } else if (newPassword.length > 0) {
      errors.push('At least 8 characters');
    }

    if (/[A-Z]/.test(newPassword)) {
      strength += 25;
    } else if (newPassword.length > 0) {
      errors.push('One uppercase letter');
    }

    if (/[a-z]/.test(newPassword)) {
      strength += 25;
    } else if (newPassword.length > 0) {
      errors.push('One lowercase letter');
    }

    if (/[0-9]/.test(newPassword)) {
      strength += 25;
    } else if (newPassword.length > 0) {
      errors.push('One number');
    }

    setPasswordStrength(strength);
    setValidationErrors(errors);
  }, [newPassword]);

  const handleSubmit = async () => {
    if (passwordStrength < 100) return setStatus({ ok: false, msg: 'Please meet all password requirements' });
    if (!token || !email) return setStatus({ ok: false, msg: 'Missing reset token or email. Use the link from your email.' });
    if (newPassword !== confirmPassword) return setStatus({ ok: false, msg: 'Passwords do not match.' });

    setLoading(true);
    setStatus(null);
    try{
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ ok: true, msg: data?.message || 'Password updated successfully. Redirecting to login...' });
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setStatus({ ok: false, msg: data?.message || 'Failed to reset password' });
      }
    }catch(err){
      setStatus({ ok: false, msg: 'Network error. Please try again.' });
    }finally{ setLoading(false); }
  };

  const getStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-emerald-500';
    if (passwordStrength >= 50) return 'bg-yellow-500';
    if (passwordStrength >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthText = () => {
    if (passwordStrength >= 75) return 'Strong';
    if (passwordStrength >= 50) return 'Good';
    if (passwordStrength >= 25) return 'Fair';
    return 'Weak';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600 text-sm">Create a new secure password</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-sm border border-white/50">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Set New Password</h2>
            <p className="text-sm text-gray-600">
              Creating a new password for <span className="font-medium text-teal-600">{email}</span>
            </p>
          </div>

          <div className="space-y-6">
            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Enter your new password"
                  className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-4 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password Strength */}
            {newPassword && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password Strength</span>
                  <span className={`text-sm font-medium ${
                    passwordStrength >= 75 ? 'text-emerald-600' :
                    passwordStrength >= 50 ? 'text-yellow-600' :
                    passwordStrength >= 25 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor()} transition-all duration-300`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                
                {/* Password Requirements */}
                <div className="space-y-2">
                  {[
                    { text: 'At least 8 characters', met: newPassword.length >= 8 },
                    { text: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
                    { text: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
                    { text: 'One number', met: /[0-9]/.test(newPassword) }
                  ].map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        req.met ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        {req.met && <Check className="w-3 h-3 text-emerald-600" />}
                      </div>
                      <span className={`text-xs ${req.met ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              onClick={handleSubmit}
              disabled={loading || passwordStrength < 100}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </button>

            {/* Status Message */}
            {status && (
              <div className={`flex items-start space-x-3 p-4 rounded-2xl ${
                status.ok 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {status.ok ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${status.ok ? 'text-emerald-800' : 'text-red-800'}`}>
                  {status.msg}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 mt-6 border border-white/50">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">Security Tip</p>
              <p className="text-xs text-gray-600">
                Use a unique password that you haven't used elsewhere. Consider using a password manager to generate and store secure passwords.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}