import { useState } from "react"


function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    



  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="signup-fullname">Full Name</label>
        <input
          id="signup-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="signup-dob">Date of Birth</label>
        <input
          id="signup-dob"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  )
}

export default SignupForm