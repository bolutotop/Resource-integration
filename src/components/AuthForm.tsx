"use client";

import { useState } from "react";
import styles from "./AuthForm.module.scss";
import { loginUser, registerUser } from "@/app/actions/user-auth";
import { Loader2, AlertCircle } from "lucide-react"; // 引入警告图标

export default function AuthForm() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 新增：专门用来显示红色的错误提示
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });

  // 切换动画
  const toggleForm = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setError(""); // 核心优化：切换时清空错误信息
    setIsAnimating(true);
    setIsSwitchOn((prev) => !prev);
    setTimeout(() => {
      setIsAnimating(false);
    }, 1500);
  };

  // 通用输入处理：输入时自动清除错误，体验更好
  const handleInputChange = (setter: any, data: any, field: string, value: string) => {
    setError(""); // 用户一打字，就清除错误
    setter({ ...data, [field]: value });
  };

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // 提交前先清空
    setLoading(true);
    
    const formData = new FormData();
    formData.append('email', loginData.email);
    formData.append('password', loginData.password);

    const res = await loginUser(formData);
    setLoading(false);
    
    if (res.success) {
      window.location.reload(); 
    } else {
      // 核心优化：不再 alert，而是设置错误状态
      setError(res.message || "登录失败");
    }
  };

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // 核心优化：前端校验密码长度，设置错误状态
    if (signupData.password.length < 8) {
      setError("密码长度不能少于 8 位");
      return; 
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', signupData.name);
    formData.append('email', signupData.email);
    formData.append('password', signupData.password);

    const res = await registerUser(formData);
    setLoading(false);

    if (res.success) {
      alert("注册成功！请登录"); // 成功提示保留 alert 或者换成 Toast 均可，这里暂留 alert 明确告知
      toggleForm(); 
    } else {
      // 核心优化：显示后端返回的错误（如邮箱已存在）
      setError(res.message || "注册失败");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.main}>
        
        {/* =======================
            表单 A (Sign In - 登录) 
           ======================= */}
        <div
          className={`${styles.container} ${styles.a_container} ${
            isSwitchOn ? styles.is_txl : ""
          } ${isSwitchOn ? styles.mobile_hidden : ""}`}
          id="a-container"
        >
          <form className={styles.form} id="a-form" onSubmit={handleLogin}>
            <h2 className={`${styles.form_title} ${styles.title}`}>Sign in to KaliVideo</h2>
            <span className={styles.form__span}>or use your email account</span>
            
            <input 
              className={styles.form__input} 
              type="email" 
              placeholder="Email" 
              required
              value={loginData.email}
              onChange={e => handleInputChange(setLoginData, loginData, 'email', e.target.value)}
            />
            <input 
              className={styles.form__input} 
              type="password" 
              placeholder="Password" 
              required
              value={loginData.password}
              onChange={e => handleInputChange(setLoginData, loginData, 'password', e.target.value)}
            />
            
            <a className={styles.form__link} href="#">Forgot your password?</a>
            
            {/* --- 核心优化：错误提示区域 --- */}
            {error && !isSwitchOn && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 px-4 py-2 rounded-lg animate-pulse">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className={`${styles.form__button} ${styles.button} flex items-center justify-center gap-2`}>
              {loading ? <Loader2 className="animate-spin" size={20}/> : "SIGN IN"}
            </button>

            <p className={styles.mobile_toggle_text}>
              Don't have an account? <span onClick={toggleForm}>Sign Up</span>
            </p>
          </form>
        </div>

        {/* =======================
            表单 B (Sign Up - 注册) 
           ======================= */}
        <div
          className={`${styles.container} ${styles.b_container} ${
            isSwitchOn ? `${styles.is_txl} ${styles.is_z200}` : ""
          } ${!isSwitchOn ? styles.mobile_hidden : ""}`}
          id="b-container"
        >
          <form className={styles.form} id="b-form" onSubmit={handleRegister}>
            <h2 className={`${styles.form_title} ${styles.title}`}>Create Account</h2>
            <span className={styles.form__span}>or use email for registration</span>
            
            <input 
              className={styles.form__input} 
              type="text" 
              placeholder="Name" 
              required
              value={signupData.name}
              onChange={e => handleInputChange(setSignupData, signupData, 'name', e.target.value)}
            />
            <input 
              className={styles.form__input} 
              type="email" 
              placeholder="Email" 
              required
              value={signupData.email}
              onChange={e => handleInputChange(setSignupData, signupData, 'email', e.target.value)}
            />
            <input 
              className={styles.form__input} 
              type="password" 
              placeholder="Password" 
              required
              value={signupData.password}
              onChange={e => handleInputChange(setSignupData, signupData, 'password', e.target.value)}
            />
            
            {/* --- 核心优化：错误提示区域 --- */}
            {error && isSwitchOn && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 px-4 py-2 rounded-lg animate-pulse">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
            
            <button type="submit" disabled={loading} className={`${styles.form__button} ${styles.button} flex items-center justify-center gap-2`}>
              {loading ? <Loader2 className="animate-spin" size={20}/> : "SIGN UP"}
            </button>

            <p className={styles.mobile_toggle_text}>
              Already have an account? <span onClick={toggleForm}>Sign In</span>
            </p>
          </form>
        </div>

        {/* =======================
            Switch 遮罩层 
           ======================= */}
        <div
          className={`${styles.switch} ${isSwitchOn ? styles.is_txr : ""} ${
            isAnimating ? styles.is_gx : ""
          }`}
          id="switch-cnt"
        >
          <div className={`${styles.switch__circle} ${isSwitchOn ? styles.is_txr : ""}`}></div>
          <div className={`${styles.switch__circle} ${styles["switch__circle--t"]} ${isSwitchOn ? styles.is_txr : ""}`}></div>

          <div className={`${styles.switch__container} ${isSwitchOn ? styles.is_hidden : ""}`} id="switch-c1">
            <h2 className={`${styles.switch__title} ${styles.title}`}>Hello Friend !</h2>
            <p className={`${styles.switch__description} ${styles.description}`}>
              Enter your personal details and start journey with us
            </p>
            <button onClick={toggleForm} className={`${styles.switch__button} ${styles.button}`}>
              SIGN UP
            </button>
          </div>

          <div className={`${styles.switch__container} ${!isSwitchOn ? styles.is_hidden : ""}`} id="switch-c2">
            <h2 className={`${styles.switch__title} ${styles.title}`}>Welcome Back !</h2>
            <p className={`${styles.switch__description} ${styles.description}`}>
              To keep connected with us please login with your personal info
            </p>
            <button onClick={toggleForm} className={`${styles.switch__button} ${styles.button}`}>
              SIGN IN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}