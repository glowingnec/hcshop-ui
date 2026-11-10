import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldQuestion,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT';

const PRESET_QUESTIONS = [
  'Món ăn yêu thích?',
  'Trường đại học của bạn?',
  'Lớp đại học của bạn?',
  'Tên thú cưng đầu tiên của bạn?',
  'Thành phố nơi bạn sinh ra?',
];

export const AuthPage: React.FC = () => {
  const {
    currentUser,
    users,
    loginUser,
    registerUser,
    logoutUser,
    lookupUserForRecovery,
    resetPasswordBySecurityAnswer,
  } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Login state (UC-02)
  const [loginId, setLoginId] = useState('customer@hcshop.dev');
  const [loginPassword, setLoginPassword] = useState('123456');

  // Register state (UC-01)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regQuestion, setRegQuestion] = useState(PRESET_QUESTIONS[0]);
  const [regAnswer, setRegAnswer] = useState('');

  // Forgot Password state (UC-03)
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null);
  const [recoveryQuestion, setRecoveryQuestion] = useState<string>('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFeedback(null);
    if (nextMode === 'FORGOT') {
      setRecoveryUserId(null);
      setRecoveryQuestion('');
      setRecoveryAnswer('');
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginUser(loginId, loginPassword);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.user) {
      setTimeout(() => {
        if (res.user?.role === 'ADMIN' || res.user?.role === 'STAFF') {
          navigate('/portal');
        } else {
          navigate('/');
        }
      }, 600);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = registerUser({
      fullName: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      confirmPassword: regConfirm,
      securityQuestion: regAnswer.trim() ? regQuestion : undefined,
      securityAnswer: regAnswer.trim() || undefined,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setTimeout(() => navigate('/'), 700);
    }
  };

  const handleLookupRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const res = lookupUserForRecovery(recoveryIdentifier);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.user && res.securityQuestion) {
      setRecoveryUserId(res.user.id);
      setRecoveryQuestion(res.securityQuestion);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryUserId) return;
    const res = resetPasswordBySecurityAnswer({
      userId: recoveryUserId,
      answer: recoveryAnswer,
      newPassword: recoveryNewPassword,
      confirmPassword: recoveryConfirmPassword,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setTimeout(() => navigate('/account'), 800);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 pb-16 space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại cửa hàng
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Tài khoản HCShop
        </h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          Đăng nhập, tạo tài khoản thành viên hoặc khôi phục mật khẩu nhanh chóng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Main Auth Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 space-y-6">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full">
            <button
              type="button"
              onClick={() => switchMode('LOGIN')}
              className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-all ${
                mode === 'LOGIN'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => switchMode('REGISTER')}
              className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-all ${
                mode === 'REGISTER'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Đăng ký
            </button>
            <button
              type="button"
              onClick={() => switchMode('FORGOT')}
              className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-all ${
                mode === 'FORGOT'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Quên mật khẩu
            </button>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-[13px] flex items-start gap-2.5 ${
                feedback.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* TAB 1: LOGIN (UC-02) */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="customer@hcshop.dev hoặc 0987654321"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-zinc-700">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryIdentifier(loginId);
                      switchMode('FORGOT');
                    }}
                    className="text-[12px] font-medium text-blue-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
              >
                Đăng nhập vào HCShop
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER (UC-01) */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-10 pl-10 pr-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                    Số điện thoại (10 số) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0988123456"
                      className="w-full h-10 pl-10 pr-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Địa chỉ Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-10 pl-10 pr-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                    Mật khẩu (tối thiểu 6 ký tự) *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
              </div>

              {/* Optional Security Question setup during registration */}
              <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/70 space-y-3">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-zinc-800">
                  <ShieldQuestion className="w-4 h-4 text-blue-600" />
                  <span>Câu hỏi bảo mật hỗ trợ khôi phục mật khẩu (Tùy chọn)</span>
                </div>
                <select
                  value={regQuestion}
                  onChange={(e) => setRegQuestion(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white border border-zinc-200 text-[12px] text-zinc-800 focus:outline-none"
                >
                  {PRESET_QUESTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={regAnswer}
                  onChange={(e) => setRegAnswer(e.target.value)}
                  placeholder="Nhập câu trả lời bảo mật của bạn..."
                  className="w-full h-9 px-3 rounded-xl bg-white border border-zinc-200 text-[12px] text-zinc-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
              >
                Tạo tài khoản mới
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD VIA SECURITY QUESTION */}
          {mode === 'FORGOT' && (
            <div className="space-y-4">
              {!recoveryUserId ? (
                <form onSubmit={handleLookupRecovery} className="space-y-4">
                  <p className="text-[13px] text-zinc-600 leading-relaxed">
                    Nhập Email hoặc Số điện thoại đã đăng ký để xác minh qua câu hỏi bảo mật.
                  </p>
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                      Email hoặc Số điện thoại cần khôi phục
                    </label>
                    <input
                      type="text"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      placeholder="VD: customer@hcshop.dev"
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    Tiếp tục kiểm tra Câu hỏi bảo mật
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-[13px] text-blue-950">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-0.5">
                      Câu hỏi bảo mật của bạn
                    </div>
                    <div className="font-bold">{recoveryQuestion}</div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                      Câu trả lời bảo mật *
                    </label>
                    <input
                      type="text"
                      value={recoveryAnswer}
                      onChange={(e) => setRecoveryAnswer(e.target.value)}
                      placeholder="Nhập câu trả lời (VD: Phở, HUCE, 68IT6)..."
                      className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                        Mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                        Xác nhận mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        value={recoveryConfirmPassword}
                        onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setRecoveryUserId(null)}
                      className="px-4 h-11 rounded-full border border-zinc-200 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Đổi tài khoản
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-11 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
                    >
                      Xác nhận đặt lại mật khẩu
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right column: Demo Quick-Fill & Active Session Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Session status */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Phiên đăng nhập hiện tại
              </span>
              {currentUser && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  {currentUser.role}
                </span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <div className="text-[14px] font-bold text-zinc-900">
                    {currentUser.fullName} ({currentUser.code})
                  </div>
                  <div className="text-[12px] text-zinc-500">
                    {currentUser.email} • {currentUser.phone}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    setFeedback({ ok: true, text: 'Đã đăng xuất khỏi phiên hiện tại.' });
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-[12px] font-medium text-zinc-800 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <p className="text-[13px] text-zinc-500">
                Bạn đang ở chế độ <strong>Khách vãng lai (Guest)</strong>. Hãy đăng nhập bên trái hoặc chọn nhanh tài khoản mẫu bên dưới.
              </p>
            )}
          </div>

          {/* Quick-Fill Test Accounts */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-[13px] font-bold text-zinc-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Tài khoản mẫu (Chọn nhanh)</span>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-2xl bg-[#f8f9fa] border border-zinc-200/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-zinc-900 truncate">
                        {u.fullName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700">
                        {u.role}
                      </span>
                      {u.isLocked && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Đã khóa
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {u.email} • MK: <code className="text-zinc-800">{u.passwordHash}</code>
                      {u.securityAnswerHash && (
                        <>
                          {' '}
                          • Đáp án BM: <code className="text-blue-700">{u.securityAnswerHash}</code>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        switchMode('LOGIN');
                        setLoginId(u.email);
                        setLoginPassword(u.passwordHash);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white border border-zinc-200 hover:border-zinc-900 text-[11px] font-medium text-zinc-800 transition-colors"
                    >
                      Chọn
                    </button>
                    {u.securityQuestion && (
                      <button
                        type="button"
                        title="Khôi phục mật khẩu"
                        onClick={() => {
                          switchMode('FORGOT');
                          setRecoveryIdentifier(u.email);
                        }}
                        className="p-1.5 rounded-full bg-white border border-zinc-200 hover:border-blue-600 text-blue-600"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
