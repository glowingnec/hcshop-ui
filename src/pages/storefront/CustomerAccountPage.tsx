import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  MapPin,
  Lock,
  ShieldQuestion,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ShippingAddress } from '../../types/domain';

type AccountTab = 'PROFILE' | 'ADDRESSES' | 'SECURITY';

const PRESET_QUESTIONS = [
  'Món ăn yêu thích?',
  'Trường đại học của bạn?',
  'Lớp đại học của bạn?',
  'Tên thú cưng đầu tiên của bạn?',
  'Thành phố nơi bạn sinh ra?',
];

export const CustomerAccountPage: React.FC = () => {
  const {
    currentUser,
    addresses,
    updateProfile,
    changePassword,
    updateSecurityQuestion,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AccountTab>('PROFILE');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Profile form state (UC-06)
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [dob, setDob] = useState(currentUser?.dob || '2005-05-19');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>(
    currentUser?.gender || 'Nam'
  );

  // Password form state (UC-04)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security question state (UC-05)
  const [secCurrentPassword, setSecCurrentPassword] = useState('');
  const [secQuestion, setSecQuestion] = useState(
    currentUser?.securityQuestion || PRESET_QUESTIONS[0]
  );
  const [secAnswer, setSecAnswer] = useState(
    currentUser?.securityAnswerHash || ''
  );

  // Address Modal state (UC-07)
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrProvince, setAddrProvince] = useState('Hà Nội');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrWard, setAddrWard] = useState('');
  const [addrDetail, setAddrDetail] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrOutOfZone, setAddrOutOfZone] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName);
      setPhone(currentUser.phone);
      setDob(currentUser.dob || '2005-05-19');
      setGender(currentUser.gender || 'Nam');
      setSecQuestion(currentUser.securityQuestion || PRESET_QUESTIONS[0]);
      setSecAnswer(currentUser.securityAnswerHash || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-zinc-200/80 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
          <UserIcon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">
          Vui lòng đăng nhập để quản lý hồ sơ
        </h2>
        <p className="text-[13px] text-zinc-500">
          Bạn cần đăng nhập tài khoản để cập nhật thông tin cá nhân, sổ địa chỉ và bảo mật.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
        >
          Đi tới trang Đăng nhập
        </Link>
      </div>
    );
  }

  const userAddresses = addresses.filter((a) => a.userId === currentUser.id);

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddrRecipient(currentUser.fullName);
    setAddrPhone(currentUser.phone);
    setAddrProvince('Hà Nội');
    setAddrDistrict('Quận Hai Bà Trưng');
    setAddrWard('Phường Đồng Tâm');
    setAddrDetail('');
    setAddrIsDefault(userAddresses.length === 0);
    setAddrOutOfZone(false);
    setShowAddressModal(true);
  };

  const openEditAddressModal = (addr: ShippingAddress) => {
    setEditingAddress(addr);
    setAddrRecipient(addr.recipientName);
    setAddrPhone(addr.phone);
    setAddrProvince(addr.province);
    setAddrDistrict(addr.district);
    setAddrWard(addr.ward);
    setAddrDetail(addr.detailAddress);
    setAddrIsDefault(addr.isDefault);
    setAddrOutOfZone(Boolean(addr.isOutOfDeliveryZone));
    setShowAddressModal(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      recipientName: addrRecipient,
      phone: addrPhone,
      province: addrProvince,
      district: addrDistrict,
      ward: addrWard,
      detailAddress: addrDetail,
      isDefault: addrIsDefault,
      isOutOfDeliveryZone: addrOutOfZone,
    };

    const res = editingAddress
      ? updateShippingAddress(editingAddress.id, payload)
      : addShippingAddress(payload);

    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setShowAddressModal(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateProfile({ fullName, phone, dob, gender });
    setFeedback({ ok: res.ok, text: res.message });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSecurityQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateSecurityQuestion({
      currentPassword: secCurrentPassword,
      securityQuestion: secQuestion,
      securityAnswer: secAnswer,
    });
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setSecCurrentPassword('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại cửa hàng
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Hồ sơ cá nhân & Sổ địa chỉ
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Quản lý thông tin tài khoản, địa chỉ nhận hàng và thiết lập bảo mật
          </p>
        </div>

        <Link
          to="/orders"
          className="px-4 py-2 rounded-full bg-white border border-zinc-200/80 text-[13px] font-medium text-zinc-800 hover:border-zinc-900 transition-colors"
        >
          Xem đơn hàng của tôi →
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-[13px] flex items-center justify-between gap-3 ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Card */}
        <div className="md:col-span-4 bg-white rounded-3xl border border-zinc-200/80 p-5 space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-400 to-purple-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-zinc-900 truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[12px] text-zinc-500 truncate">
                {currentUser.email}
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                Mã TV: {currentUser.code} • {currentUser.role}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('PROFILE');
                setFeedback(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-colors ${
                activeTab === 'PROFILE'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Thông tin cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ADDRESSES');
                setFeedback(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-colors ${
                activeTab === 'ADDRESSES'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>Sổ địa chỉ nhận hàng</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${
                  activeTab === 'ADDRESSES'
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {userAddresses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SECURITY');
                setFeedback(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-colors ${
                activeTab === 'SECURITY'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Mật khẩu & Bảo mật</span>
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-8">
          {/* TAB 1: PROFILE */}
          {activeTab === 'PROFILE' && (
            <form
              onSubmit={handleProfileSubmit}
              className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Thông tin cá nhân
                </h2>
                <p className="text-[13px] text-zinc-500 mt-0.5">
                  Cập nhật thông tin liên hệ và nhận thông báo đơn hàng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                    Số điện thoại (10 số) *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                    Địa chỉ Email (Định danh cố định)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full h-11 px-4 rounded-2xl bg-zinc-100 border border-zinc-200/60 text-[13px] text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                  Giới tính
                </label>
                <div className="flex items-center gap-3">
                  {(['Nam', 'Nữ', 'Khác'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors ${
                        gender === g
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-[#f8f9fa] text-zinc-700 border-zinc-200/80 hover:border-zinc-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 h-11 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADDRESS BOOK */}
          {activeTab === 'ADDRESSES' && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    Sổ địa chỉ nhận hàng
                  </h2>
                  <p className="text-[13px] text-zinc-500 mt-0.5">
                    Lưu tối đa 10 địa chỉ. Địa chỉ mặc định được áp dụng tự động khi thanh toán.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm địa chỉ mới
                </button>
              </div>

              {userAddresses.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#f8f9fa] border border-dashed border-zinc-300 text-center space-y-2">
                  <MapPin className="w-6 h-6 text-zinc-400 mx-auto" />
                  <p className="text-[13px] font-medium text-zinc-700">
                    Bạn chưa lưu địa chỉ nhận hàng nào.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        addr.isDefault
                          ? 'border-zinc-900 bg-[#f8f9fa]/70'
                          : 'border-zinc-200/80 bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-bold text-zinc-900">
                            {addr.recipientName}
                          </span>
                          <span className="text-zinc-300">|</span>
                          <span className="text-[13px] font-medium text-zinc-600">
                            {addr.phone}
                          </span>
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-900 text-white">
                              <Star className="w-3 h-3 fill-current" />
                              Mặc định
                            </span>
                          )}
                          {addr.isOutOfDeliveryZone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                              Ngoài vùng giao
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-zinc-600">
                          {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = setDefaultShippingAddress(addr.id);
                              setFeedback({ ok: res.ok, text: res.message });
                            }}
                            className="px-3 py-1.5 rounded-full border border-zinc-200 text-[12px] font-medium text-zinc-700 hover:border-zinc-900 transition-colors"
                          >
                            Đặt mặc định
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditAddressModal(addr)}
                          className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          title="Chỉnh sửa địa chỉ"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = deleteShippingAddress(addr.id);
                            setFeedback({ ok: res.ok, text: res.message });
                          }}
                          className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Xóa địa chỉ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PASSWORD & SECURITY QUESTION */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <form
                onSubmit={handlePasswordSubmit}
                className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    Đổi mật khẩu
                  </h2>
                  <p className="text-[13px] text-zinc-500 mt-0.5">
                    Mật khẩu mới tối thiểu 6 ký tự và không trùng với mật khẩu hiện tại.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                      Mật khẩu hiện tại *
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                      Mật khẩu mới *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="px-5 h-10 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>

              {/* Security Question Setup Card */}
              <form
                onSubmit={handleSecurityQuestionSubmit}
                className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                      <ShieldQuestion className="w-5 h-5 text-blue-600" />
                      <span>Câu hỏi bảo mật</span>
                    </h2>
                    <p className="text-[13px] text-zinc-500 mt-0.5">
                      Dùng để xác minh danh tính và đặt lại mật khẩu khi cần.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      currentUser.securityQuestion
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {currentUser.securityQuestion ? 'Đã thiết lập' : 'Chưa thiết lập'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                      Chọn câu hỏi bảo mật *
                    </label>
                    <select
                      value={secQuestion}
                      onChange={(e) => setSecQuestion(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                    >
                      {PRESET_QUESTIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                      Câu trả lời bảo mật *
                    </label>
                    <input
                      type="text"
                      value={secAnswer}
                      onChange={(e) => setSecAnswer(e.target.value)}
                      placeholder="Nhập câu trả lời..."
                      className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                      Xác nhận mật khẩu hiện tại *
                    </label>
                    <input
                      type="password"
                      value={secCurrentPassword}
                      onChange={(e) => setSecCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại để lưu"
                      className="w-full h-10 px-3.5 rounded-2xl bg-[#f8f9fa] border border-zinc-200/80 text-[13px] focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="px-5 h-10 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    Lưu Câu hỏi bảo mật
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Address Modal (UC-07) */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAddress}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {editingAddress ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Họ tên người nhận *
                </label>
                <input
                  type="text"
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="text"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-[13px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Tỉnh / Thành phố *
                </label>
                <input
                  type="text"
                  value={addrProvince}
                  onChange={(e) => setAddrProvince(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Quận / Huyện *
                </label>
                <input
                  type="text"
                  value={addrDistrict}
                  onChange={(e) => setAddrDistrict(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Phường / Xã *
                </label>
                <input
                  type="text"
                  value={addrWard}
                  onChange={(e) => setAddrWard(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-[13px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                Số nhà, tên đường cụ thể *
              </label>
              <input
                type="text"
                value={addrDetail}
                onChange={(e) => setAddrDetail(e.target.value)}
                placeholder="VD: Số 55 Giải Phóng"
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-[13px]"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-[13px] text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span>Đặt làm địa chỉ nhận hàng mặc định</span>
              </label>

              <label className="flex items-center gap-2 text-[12px] text-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrOutOfZone}
                  onChange={(e) => setAddrOutOfZone(e.target.checked)}
                  className="rounded border-amber-300"
                />
                <span>Đánh dấu địa chỉ ngoài vùng giao hàng</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-[13px] font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-800"
              >
                Lưu địa chỉ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
