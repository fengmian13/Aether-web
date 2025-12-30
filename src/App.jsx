import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, RefreshCw, LogIn, UserPlus, Hash } from 'lucide-react';
import md5 from 'md5';

/**
 * Aether Frontend - Login & Register
 */

// --- 配置 ---
// 开发环境下，Vite 代理会将 /api 转发到 http://localhost:6060/api
const API_BASE_URL = "/api"; 
// 如果后端未启动，可以将此处改为 true 来查看纯前端效果
const MOCK_MODE = false; 

// --- API Service ---
const api = {
  // 获取验证码
  getCheckCode: async () => {
    if (MOCK_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            code: 200,
            data: {
              checkCode: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMzAiIGhlaWdodD0iNDgiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM0NzU1NjkiPkFCQ0Q8L3RleHQ+PC9zdmc+",
              checkCodeKey: "mock-uuid-key-" + Date.now()
            }
          });
        }, 300);
      });
    }
    try {
      const response = await fetch(`${API_BASE_URL}/account/checkCode`);
      // 处理非 200 响应
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return { code: 500, info: "网络连接失败，请检查后端是否启动" };
    }
  },

  // 登录
  login: async (formData) => {
    if (MOCK_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            code: 200,
            data: { userId: "1", nickName: "Mock User", token: "mock-token" }
          });
        }, 800);
      });
    }
    
    // Java后端通常期望 x-www-form-urlencoded 格式
    const params = new URLSearchParams();
    for (const key in formData) {
        params.append(key, formData[key]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      return await response.json();
    } catch (error) {
        return { code: 500, info: "请求失败" };
    }
  },

  // 注册
  register: async (formData) => {
    if (MOCK_MODE) return new Promise((r) => setTimeout(() => r({ code: 200 }), 800));
    
    const params = new URLSearchParams();
    for (const key in formData) {
        params.append(key, formData[key]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      return await response.json();
    } catch (error) {
        return { code: 500, info: "请求失败" };
    }
  }
};

// --- 组件 ---

const InputField = ({ icon: Icon, type = "text", placeholder, name, value, onChange, required = true }) => (
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm placeholder-gray-400 text-gray-700"
      placeholder={placeholder}
      required={required}
    />
  </div>
);

const CaptchaInput = ({ value, onChange, captchaSrc, onRefresh, loading }) => (
  <div className="flex gap-3 mb-4">
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Hash className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        name="checkCode"
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm placeholder-gray-400 text-gray-700"
        placeholder="验证码"
        required
      />
    </div>
    <div 
      className="w-32 h-[50px] bg-gray-100 rounded-xl overflow-hidden cursor-pointer relative group border border-gray-200 select-none"
      onClick={onRefresh}
      title="点击刷新验证码"
    >
      {captchaSrc ? (
        <img src={captchaSrc} alt="Captcha" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          {loading ? "加载中..." : "点击加载"}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  </div>
);

export default function AetherApp() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // 验证码状态
  const [captchaData, setCaptchaData] = useState({ img: "", key: "" });
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickName: "",
    sex: 1, // 1: 男, 0: 女 (对应后端的 Integer 类型)
    checkCode: ""
  });

  // 获取验证码
  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    const res = await api.getCheckCode();
    setLoadingCaptcha(false);
    if (res.code === 200) {
      setCaptchaData({
        img: res.data.checkCode,
        key: res.data.checkCodeKey
      });
    } else {
      setError(res.info || "无法连接到服务器，请确保 Java 后端已启动 (端口 6060)");
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // 切换登录/注册时重置表单
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      checkCode: "", 
      password: "", 
      confirmPassword: "" 
    }));
    setError("");
    setSuccessMsg("");
    if (!captchaData.key) fetchCaptcha(); 
  }, [isLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // 基础校验
    if (!formData.email || !formData.password || !formData.checkCode) {
      setError("请填写所有必填项");
      return;
    }
    if (!isLogin && !formData.nickName) {
      setError("请输入昵称");
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    const submitData = {
      ...formData,
      password: md5(formData.password), // 使用 js-md5 进行加密
      checkCodeKey: captchaData.key
    };
    if (!isLogin) {
      delete submitData.confirmPassword;
    }

    try {
      let res;
      if (isLogin) {
        res = await api.login(submitData);
        if (res.code === 200) {
          setSuccessMsg(`登录成功！欢迎回来，${res.data.nickName}`);
          console.log("Token:", res.data.token);
          // TODO: 将 res.data.token 存储到 localStorage
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("userInfo", JSON.stringify(res.data));
          // window.location.href = "/chat"; // 跳转到聊天页
        } else {
          setError(res.info || "登录失败");
          fetchCaptcha(); // 失败后刷新验证码
        }
      } else {
        res = await api.register(submitData);
        if (res.code === 200) {
          setSuccessMsg("注册成功！请登录");
          setFormData(prev => ({ ...prev, checkCode: "" }));
          setTimeout(() => setIsLogin(true), 1500);
        } else {
          setError(res.info || "注册失败");
          fetchCaptcha();
        }
      }
    } catch (err) {
      setError("发生未知错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans text-gray-800 selection:bg-blue-100">
      
      {/* 装饰背景 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{animationDuration: '8s'}} />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{animationDuration: '10s'}} />
      </div>

      <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/50 transition-all">
        
        {/* 左侧品牌区 */}
        <div className={`w-full md:w-5/12 p-10 flex flex-col justify-between transition-colors duration-500 ${isLogin ? 'bg-blue-600' : 'bg-purple-600'} text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center border border-white/10">
                <div className="w-3 h-3 rounded-full bg-white shadow-lg" />
              </div>
              <h1 className="text-2xl font-bold tracking-wider">Aether</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              {isLogin ? "欢迎回来" : "加入我们"}
            </h2>
            <p className="text-blue-100 leading-relaxed opacity-90 text-sm">
              {isLogin 
                ? "连接您的团队，开启高效的视频会议体验。Aether 让沟通无处不在。" 
                : "创建一个新账户，开始探索无缝的即时通讯与视频协作世界。"
              }
            </p>
          </div>

          <div className="relative z-10 mt-12">
             <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Current Version</div>
             <div className="font-medium text-sm">Aether 1.0.0</div>
          </div>
        </div>

        {/* 右侧表单区 */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-white/40">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {isLogin ? "登录账户" : "注册账户"}
            </h3>
            <p className="text-gray-500 text-sm">
              {isLogin ? "请输入您的凭据以访问系统" : "填写以下信息以创建您的个人资料"}
            </p>
          </div>

          {/* 提示消息 */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center animate-bounce-short">
              <span className="mr-2 font-bold">!</span> {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-3 rounded-lg bg-green-50 text-green-600 text-sm border border-green-100 flex items-center">
              <span className="mr-2">✓</span> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            
            <InputField 
              icon={Mail} 
              type="email" 
              name="email" 
              placeholder="电子邮箱" 
              value={formData.email} 
              onChange={handleChange} 
            />

            {!isLogin && (
              <>
                <InputField 
                  icon={User} 
                  name="nickName" 
                  placeholder="昵称" 
                  value={formData.nickName} 
                  onChange={handleChange} 
                />
                
                {/* 性别选择 */}
                <div className="flex gap-4 mb-4">
                  <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.sex == 1 ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="sex" 
                      value={1} 
                      checked={formData.sex == 1} 
                      onChange={(e) => setFormData({...formData, sex: 1})}
                      className="hidden" 
                    />
                    <span className="text-sm font-medium">男</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.sex == 0 ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="sex" 
                      value={0} 
                      checked={formData.sex == 0} 
                      onChange={(e) => setFormData({...formData, sex: 0})}
                      className="hidden" 
                    />
                    <span className="text-sm font-medium">女</span>
                  </label>
                </div>
              </>
            )}

            <InputField 
              icon={Lock} 
              type="password" 
              name="password" 
              placeholder="密码" 
              value={formData.password} 
              onChange={handleChange} 
            />

            {!isLogin && (
              <InputField 
                icon={Lock} 
                type="password" 
                name="confirmPassword" 
                placeholder="确认密码" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
              />
            )}

            <CaptchaInput 
              value={formData.checkCode}
              onChange={handleChange}
              captchaSrc={captchaData.img}
              onRefresh={fetchCaptcha}
              loading={loadingCaptcha}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-4 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
                ${isLogin ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:to-blue-400' : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:to-purple-400'}
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {isLogin ? "立即登录" : "创建账户"}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              {isLogin ? "还没有账户？" : "已经有账户了？"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className={`ml-2 font-semibold hover:underline ${isLogin ? 'text-blue-600' : 'text-purple-600'}`}
              >
                {isLogin ? "去注册" : "去登录"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}