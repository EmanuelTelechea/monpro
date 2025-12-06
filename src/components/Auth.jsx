import { useState } from 'react'
import { supabase } from '../supabase/client'
import { Mail, Lock, LogIn, UserPlus, Loader2, Globe, HelpCircle, AlertTriangle, CheckCircle, AtSign } from 'lucide-react'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('login')
  const [rememberMe, setRememberMe] = useState(true)
  const [resetMessage, setResetMessage] = useState(null) 

  // --- PALETA DE COLORES FRANCÉS MODERNO (Minimalismo Sofisticado) ---
  const COLORS = {
    // Azul Navy profundo (Elegante y profesional)
    primary: '#002D62',      
    // Gris cálido/topo para acento
    accent: '#A9A9A9',      
    // Fondo muy claro (casi blanco)
    bg: '#F8F8F8',          
    // Blanco puro para la tarjeta
    card: '#FFFFFF',          
    // Borde gris perla sutil
    border: '#E0E0E0',        
    // Texto principal oscuro (casi negro)
    textMain: '#2C3E50',      
    // Texto secundario, muy claro
    textLight: '#8A9BA8',     
    // Rojo sofisticado para errores
    error: '#C0392B',         
    // Verde sutil para éxito
    success: '#27AE60',       
  }
  
  // --- Funciones de autenticación (sin cambios, solo se actualizó la lógica de sesión) ---
  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    setResetMessage(null)
    
    // El manejo de rememberMe en Supabase se basa en el ciclo de vida del token.
    // Aunque la opción 'rememberMe' se mantiene en el estado, la implementación específica de Supabase 
    // maneja la sesión con 'auto' por defecto, que puede persistir o no dependiendo de la configuración del token.
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    setResetMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)
    setResetMessage(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault(); 
    
    if (!email) {
      setError("Por favor, introduce tu correo electrónico para restablecer la contraseña.")
      setResetMessage(null)
      return
    }

    setLoading(true)
    setError(null)
    setResetMessage(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setError(error.message)
    } else {
      // Usamos el mensaje original en español
      setResetMessage("¡Correo de restablecimiento enviado! Revisa tu bandeja de entrada y spam para continuar.")
      setPassword('') 
    }
    setLoading(false)
  }

  // --- Estilos de Componentes (Actualizados al estilo francés profesional) ---

  const inputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    background: COLORS.bg,
    borderRadius: 6, // Bordes sutiles
    border: `1px solid ${COLORS.border}`,
    padding: '0 15px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  
  const inputStyle = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    padding: '12px 0',
    flex: 1,
    fontSize: 16,
    color: COLORS.textMain,
    // Usar una fuente serif o una sans-serif elegante para el campo de texto
    fontFamily: 'Georgia, serif', 
  }

  const primaryButtonStyle = {
    width: '100%',
    background: COLORS.primary,
    color: COLORS.card,
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 17,
    padding: '14px 0', 
    marginBottom: 18,
    cursor: 'pointer',
    transition: 'background 0.2s, opacity 0.2s',
    boxShadow: `0 4px 15px ${COLORS.primary}40`, // Sombra sutil pero definida
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    letterSpacing: '0.5px', // Espaciado de letra elegante
  }

  const secondaryButtonStyle = {
    width: '100%',
    background: COLORS.card,
    color: COLORS.textMain,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    fontWeight: 500,
    fontSize: 16,
    padding: '12px 0',
    marginBottom: 12,
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: COLORS.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px', 
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: COLORS.card,
        borderRadius: 10,
        boxShadow: '0 15px 45px rgba(0, 0, 0, 0.05)', // Sombra suave
        padding: '40px 35px',
        width: '100%',
        maxWidth: 420, // Más estrecho para una apariencia premium
        border: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif', // Fuente principal limpia
      }}>
        {/* Logo */}
        <div style={{ 
          width: 70, 
          height: 70, 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
        }}>
          <img src="src/assets/Logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }}/>
        </div>
        
        {/* Título Principal */}
        <div style={{ 
          fontWeight: 700, 
          fontSize: 30, 
          marginBottom: 6, 
          textAlign: 'center', 
          color: COLORS.textMain, 
          letterSpacing: '-0.5px' 
        }}>
          {/* Texto en español */}
          {tab === 'login' ? 'Bienvenido de Nuevo' : 'Crea tu Cuenta'}
        </div>
        
        {/* Subtítulo */}
        <div style={{ 
          color: COLORS.textLight, 
          fontSize: 15, 
          marginBottom: 30, 
          textAlign: 'center' 
        }}>
          {/* Texto en español */}
          {tab === 'login' ? 'Ingresa para acceder a tus proyectos.' : 'Regístrate para empezar a organizar.'}
        </div>
        
        {/* Tabs - Minimalistas y en alto contraste con el Navy */}
        <div style={{
          display: 'flex',
          width: '100%',
          marginBottom: 30,
          background: COLORS.card,
          borderBottom: `1px solid ${COLORS.border}`,
          gap: 10,
        }}>
          <button
            style={{
              flex: 1,
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 15,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'login' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              cursor: 'pointer',
              color: tab === 'login' ? COLORS.primary : COLORS.textLight,
              transition: 'all 0.3s',
              letterSpacing: '0.5px'
            }}
            onClick={() => { setTab('login'); setError(null); setResetMessage(null); }}
          >
            <LogIn size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Iniciar Sesión
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 15,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'register' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              cursor: 'pointer',
              color: tab === 'register' ? COLORS.primary : COLORS.textLight,
              transition: 'all 0.3s',
              letterSpacing: '0.5px'
            }}
            onClick={() => { setTab('register'); setError(null); setResetMessage(null); }}
          >
            <UserPlus size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Registrarse
          </button>
        </div>
        
        {/* Formulario */}
        <form
          onSubmit={e => {
            e.preventDefault()
            tab === 'login' ? handleLogin() : handleSignUp()
          }}
          style={{ width: '100%' }}
        >
          {/* Email Input */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: COLORS.textMain }}>Email</div>
            <div style={inputContainerStyle}>
              <AtSign size={18} color={COLORS.accent} />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>
          
          {/* Password Input (solo si está en la pestaña de login/register) */}
          {tab !== 'reset' && (
            <div style={{ marginBottom: 15 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: COLORS.textMain }}>Contraseña</div>
              <div style={inputContainerStyle}>
                <Lock size={18} color={COLORS.accent} />
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Opciones Adicionales */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 25,
            fontSize: 14
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.textMain, fontWeight: 500 }}>
              <input 
                type="checkbox" 
                style={{ accentColor: COLORS.primary, transform: 'scale(1.1)' }} 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              Recordarme
            </label>
            <a 
              href="#" 
              onClick={handlePasswordReset} 
              style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          
          {/* Mensajes de Estado (Error y Éxito) */}
          {error && (
            <div style={{ 
                color: COLORS.error, 
                background: `${COLORS.error}10`,
                border: `1px solid ${COLORS.error}`,
                padding: '10px 15px',
                borderRadius: 6,
                marginBottom: 20, 
                fontSize: 14,
                textAlign: 'center',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
            }}>
                <AlertTriangle size={16} />{error}
            </div>
          )}
          {resetMessage && (
            <div style={{ 
                color: COLORS.success, 
                background: `${COLORS.success}10`,
                border: `1px solid ${COLORS.success}`,
                padding: '10px 15px',
                borderRadius: 6,
                marginBottom: 20, 
                fontSize: 14,
                textAlign: 'center',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
            }}>
                <CheckCircle size={16} />{resetMessage}
            </div>
          )}
          
          {/* Submit Button */}
          {tab !== 'reset' && (
            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryButtonStyle,
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? <Loader2 size={20} className="spinner" /> : (
                tab === 'login' ? 'Iniciar Sesión' : 'Registrarse'
              )}
            </button>
          )}
        </form>
        
        {/* Separador - Líneas limpias y texto centrado */}
        <div style={{
          width: '100%',
          borderTop: `1px solid ${COLORS.border}`,
          margin: '10px 0 20px 0',
          textAlign: 'center',
          color: COLORS.textLight,
          fontSize: 14,
          position: 'relative',
        }}>
          <span style={{ 
            position: 'absolute', 
            top: '-10px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            background: COLORS.card, 
            padding: '0 10px',
            fontWeight: 500
          }}>
            O continúa con
          </span>
        </div>
        
        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            ...secondaryButtonStyle,
            opacity: loading ? 0.8 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <Globe size={18} color={COLORS.primary} />
          Google
        </button>
        
        {/* Footer Link */}
       <div style={{
          width: '100%',
          marginTop: 20,
          textAlign: 'center',
          color: COLORS.textLight,
          fontSize: 14
        }}>
          ¿Necesitas ayuda? 
          <a 
            href="mailto:soporte@tudominio.com?subject=Consulta%20de%20soporte%20desde%20Login" 
            style={{ color: COLORS.primary, fontWeight: 600, textDecoration: 'none' }}
          >
            <HelpCircle size={14} style={{ marginRight: 2, verticalAlign: 'text-bottom' }} />Contacta soporte
          </a>
        </div>
      </div>
      {/* Estilo para el spinner (necesario para la animación de carga) */}
      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}