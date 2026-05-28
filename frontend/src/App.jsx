// import { useState } from 'react'
// import './App.css'

// function App(){
//   const [tab, setTab] = useState('login') // 'login' or 'signup'
//   const [loginData, setLoginData] = useState({ email: '', password: '' })
//   const [signupData, setSignupData] = useState({ fullName: '', email: '', password: '', dob: '' })
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)

//   const handleLoginChange = (e) => {
//     const { name, value } = e.target
//     setLoginData(prev => ({ ...prev, [name]: value }))
//     setError('')
//   }

//   const handleSignupChange = (e) => {
//     const { name, value } = e.target
//     setSignupData(prev => ({ ...prev, [name]: value }))
//     setError('')
//   }

//   const handleLogin = async (e) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')
//     try {
//       const res = await fetch('http://localhost:4000/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(loginData)
//       })
//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error || 'Login failed')
//       localStorage.setItem('token', data.token)
//       localStorage.setItem('user', JSON.stringify(data.user))
//       alert(`Welcome ${data.user.fullName}!`)
//       setLoginData({ email: '', password: '' })
//     } catch (err) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleSignup = async (e) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')
//     try {
//       const res = await fetch('http://localhost:4000/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(signupData)
//       })
//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error || 'Registration failed')
//       localStorage.setItem('token', data.token)
//       localStorage.setItem('user', JSON.stringify(data.user))
//       alert(`Account created! Welcome ${data.user.fullName}!`)
//       setSignupData({ fullName: '', email: '', password: '', dob: '' })
//       setTab('login')
//     } catch (err) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h1>Online Judge</h1>
        
//         <div className="tab-switcher">
//           <button
//             className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
//             onClick={() => { setTab('login'); setError('') }}
//           >
//             Login
//           </button>
//           <button
//             className={`tab-btn ${tab === 'signup' ? 'active' : ''}`}
//             onClick={() => { setTab('signup'); setError('') }}
//           >
//             Sign Up
//           </button>
//         </div>

//         {error && <div className="error-box">{error}</div>}

//         {tab === 'login' ? (
//           <form onSubmit={handleLogin} className="auth-form">
//             <div className="form-group">
//               <label htmlFor="login-email">Email</label>
//               <input
//                 id="login-email"
//                 type="email"
//                 name="email"
//                 placeholder="you@example.com"
//                 value={loginData.email}
//                 onChange={handleLoginChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="login-password">Password</label>
//               <input
//                 id="login-password"
//                 type="password"
//                 name="password"
//                 placeholder="••••••••"
//                 value={loginData.password}
//                 onChange={handleLoginChange}
//                 required
//               />
//             </div>
//             <button type="submit" className="submit-btn" disabled={loading}>
//               {loading ? 'Logging in...' : 'Login'}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleSignup} className="auth-form">
//             <div className="form-group">
//               <label htmlFor="signup-fullname">Full Name</label>
//               <input
//                 id="signup-fullname"
//                 type="text"
//                 name="fullName"
//                 placeholder="John Doe"
//                 value={signupData.fullName}
//                 onChange={handleSignupChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="signup-email">Email</label>
//               <input
//                 id="signup-email"
//                 type="email"
//                 name="email"
//                 placeholder="you@example.com"
//                 value={signupData.email}
//                 onChange={handleSignupChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="signup-password">Password</label>
//               <input
//                 id="signup-password"
//                 type="password"
//                 name="password"
//                 placeholder="••••••••"
//                 value={signupData.password}
//                 onChange={handleSignupChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="signup-dob">Date of Birth</label>
//               <input
//                 id="signup-dob"
//                 type="date"
//                 name="dob"
//                 value={signupData.dob}
//                 onChange={handleSignupChange}
//               />
//             </div>
//             <button type="submit" className="submit-btn" disabled={loading}>
//               {loading ? 'Creating account...' : 'Sign Up'}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   )
// }

// export default App

import { useState } from 'react'
import LoginForm from './pages/Authentication/login'
import SignupForm from './pages/Authentication/signup'

function App2(){
  const [tab, setTab] = useState('login')
  return (
    <>
      <header>
          <h1>Online Judge</h1>
      </header>
      <div className="auth-container">
          <h2>Welcome to Online Judge</h2>
          <p>Please log in or sign up to continue.</p>
          <div className="button-group">
            <button className="login-btn" onClick={() => setTab('login')}>Login</button>
            <button className="signup-btn" onClick={() => setTab('signup')}>Sign Up</button>
          </div>
          <div className="display-box">
            {
              tab === 'login' ? <LoginForm /> : <SignupForm />
            }
          </div>
      </div>
      <footer>
          <p>&copy; 2024 Online Judge. All rights reserved.</p>
      </footer>
    </>
  )
}

export default App2