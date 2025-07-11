import { useState } from 'react'
import { supabase } from '../supabase/client'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('login')

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#fafbfc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 16px #0001',
        padding: '36px 32px 24px 32px',
        width: '500px',
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        alignContent: 'center',
      }}>
        {/* Logo */}
        <div style={{ width: 80, 
        height: 80, 
        marginBottom: 24, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
        }}>
          <img src="src/assets/Logo.png" alt="Logo"/>
        </div>
        <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 4, textAlign: 'center' }}>Bienvenido</div>
        <div style={{ color: '#888', fontSize: 15, marginBottom: 18, textAlign: 'center' }}>
          Inicia sesión o crea tu cuenta
        </div>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          width: '100%',
          marginBottom: 18,
          borderRadius: 8,
          background: '#f7f7fa',
          overflow: 'hidden'
        }}>
          <button
            style={{
              flex: 1,
              padding: '8px 0',
              fontWeight: 600,
              fontSize: 15,
              background: tab === 'login' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              color: tab === 'login' ? '#111827' : '#888'
            }}
            onClick={() => setTab('login')}
          >
            Iniciar Sesión
          </button>
          <button
            style={{
              flex: 1,
              padding: '8px 0',
              fontWeight: 600,
              fontSize: 15,
              background: tab === 'register' ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: tab === 'register' ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              color: tab === 'register' ? '#111827' : '#888'
            }}
            onClick={() => setTab('register')}
          >
            Registrarse
          </button>
        </div>
        {/* Form */}
        <form
          onSubmit={e => {
            e.preventDefault()
            tab === 'login' ? handleLogin() : handleSignUp()
          }}
          style={{ width: '100%' }}
        >
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Email</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f7f7fa',
              borderRadius: 8,
              border: '1px solid #eee',
              padding: '0 10px'
            }}>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '10px 0',
                  flex: 1,
                  fontSize: 15
                }}
              />
              <span style={{ color: '#bbb', fontSize: 18, marginLeft: 4 }}>📧</span>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Contraseña</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f7f7fa',
              borderRadius: 8,
              border: '1px solid #eee',
              padding: '0 10px'
            }}>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '10px 0',
                  flex: 1,
                  fontSize: 15
                }}
              />
              <span style={{ color: '#bbb', fontSize: 18, marginLeft: 4 }}>🔒</span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            fontSize: 13
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" style={{ accentColor: '#111827' }} disabled />
              Recordarme
            </label>
            <a href="#" style={{ color: '#111827', textDecoration: 'none', fontWeight: 500 }}>¿Olvidaste tu contraseña?</a>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 10, fontSize: 14 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 16,
              padding: '12px 0',
              marginBottom: 16,
              cursor: 'pointer'
            }}
          >
            {tab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>
        <div style={{
          width: '100%',
          borderTop: '1px solid #eee',
          margin: '16px 0 12px 0',
          textAlign: 'center',
          color: '#888',
          fontSize: 14
        }}>
          O continúa con
        </div>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: '#fff',
            color: '#222',
            border: '1px solid #eee',
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 16,
            padding: '10px 0',
            marginBottom: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <span style={{
            fontSize: 20,
            background: '#fff',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>G</span>
          Google
        </button>
        <div style={{
          width: '100%',
          marginTop: 10,
          textAlign: 'center',
          color: '#888',
          fontSize: 13
        }}>
          ¿Necesitas ayuda? <a href="#" style={{ color: '#111827', fontWeight: 500, textDecoration: 'none' }}>Contacta soporte</a>
        </div>
      </div>
    </div>
  )
}
// This component provides a simple authentication interface using Supabase.
// Users can log in or sign up with their email and password.