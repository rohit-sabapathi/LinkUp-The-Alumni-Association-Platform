import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId="1009859219635-jpmqpp4hvpuj2j85vjn7g700pvpbcb3d.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
)
