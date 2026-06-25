import './tema.css'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const temaSalvo = localStorage.getItem("tema");
if (temaSalvo && temaSalvo !== "auto") {
  document.documentElement.setAttribute("data-tema", temaSalvo);
}

try {
  const corSalva = JSON.parse(localStorage.getItem("cor-acento"));
  if (corSalva?.acento) {
    const r = document.documentElement;
    r.style.setProperty("--cor-acento", corSalva.acento);
    r.style.setProperty("--cor-acento-hover", corSalva.hover);
    r.style.setProperty("--cor-acento-fundo-suave", corSalva.suave);
  }
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
