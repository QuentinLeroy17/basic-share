import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import {
  BasicFit,
  buildOauthURL,
  generateCodeVerifier,
  generateCodeChallenge,
  code2token,
  generateQrcodeData
} from './basicfit.js'
import './App.css'

function App() {
  const [member, setMember] = useState(null)
  const [qrData, setQrData] = useState('')

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const storedVerifier = sessionStorage.getItem('code_verifier')
    if (code && storedVerifier) {
      code2token(code, storedVerifier).then(token => {
        if (token) {
          localStorage.setItem('access_token', token.access_token)
          localStorage.setItem('refresh_token', token.refresh_token)
          localStorage.setItem('expires', Math.floor(Date.now() / 1000) + token.expires_in)
          window.history.replaceState({}, document.title, '/')
          loadMemberData(token.access_token)
        }
      })
    } else {
      const access = localStorage.getItem('access_token')
      const exp = parseInt(localStorage.getItem('expires') || '0')
      if (access && exp > Math.floor(Date.now() / 1000)) {
        loadMemberData(access)
      }
    }
  }, [])

  async function loadMemberData(token) {
    const api = new BasicFit(token)
    const m = await api.loadMember()
    if (m) {
      setMember(m)
    }
  }

  useEffect(() => {
    if (!member) return
    let active = true
    async function update() {
      if (!active) return
      const data = await generateQrcodeData(member.cardnumber, member.deviceId)
      setQrData(data)
    }
    update()
    const interval = setInterval(update, 5000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [member])

  const handleLogin = async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    sessionStorage.setItem('code_verifier', verifier)
    const state = generateCodeVerifier()
    window.location.href = buildOauthURL(state, challenge)
  }

  if (!member) {
    return (
      <div className="center">
        <button onClick={handleLogin}>Login with Basic-Fit</button>
      </div>
    )
  }

  return (
    <div className="center">
      <h2>{member.firstname} {member.lastname}</h2>
      <p>Card number: {member.cardnumber}</p>
      {qrData && <QRCode value={qrData} />}
    </div>
  )
}

export default App
