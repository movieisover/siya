import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // 회원가입 시 비밀번호 확인 일치 검증
    if (isSignUp && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* 로고 */}
        <div style={styles.logoSection}>
          <h1 style={styles.logo}>시야</h1>
          <p style={styles.subtitle}>한국 주식 가치투자 분석</p>
        </div>

        {/* 탭 */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(isSignUp ? {} : styles.tabActive),
            }}
            onClick={() => { setIsSignUp(false); setError(''); setConfirmPassword(''); }}
          >
            로그인
          </button>
          <button
            style={{
              ...styles.tab,
              ...(isSignUp ? styles.tabActive : {}),
            }}
            onClick={() => { setIsSignUp(true); setError(''); setConfirmPassword(''); }}
          >
            회원가입
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          {isSignUp && (
            <div style={styles.field}>
              <label style={styles.label}>비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 다시 입력"
                required
                minLength={6}
                style={{
                  ...styles.input,
                  ...(confirmPassword && password !== confirmPassword
                    ? { borderColor: '#ef4444' }
                    : {}),
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <span style={styles.mismatchHint}>비밀번호가 일치하지 않습니다</span>
              )}
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? '처리 중...' : isSignUp ? '가입하기' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1117',
  },
  card: {
    width: 380,
    background: '#1a1d27',
    borderRadius: 16,
    padding: '40px 32px',
    border: '1px solid #2a2e3a',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: 700,
    color: '#4a9eff',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b8fa3',
    marginTop: 4,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    background: '#0f1117',
    borderRadius: 8,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: '#8b8fa3',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  tabActive: {
    background: '#4a9eff',
    color: '#fff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e4e6eb',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #2a2e3a',
    background: '#0f1117',
    color: '#e4e6eb',
    fontSize: 14,
    outline: 'none',
  },
  error: {
    padding: '8px 12px',
    borderRadius: 8,
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontSize: 13,
  },
  mismatchHint: {
    fontSize: 12,
    color: '#ef4444',
  },
  button: {
    padding: '12px 0',
    borderRadius: 8,
    border: 'none',
    background: '#4a9eff',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};
