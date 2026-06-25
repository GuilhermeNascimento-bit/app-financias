import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MoedaProvider } from "./context/MoedaContext";
import PaginaLogin from "./pages/PaginaLogin";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import Dashboard from "./pages/dashboard/Dashboard";
import { escutarTransacoes } from "./firebase/transacoes";

function ConteudoApp() {
  const { usuario, carregando } = useAuth();
  const [verificandoTransacoes, setVerificandoTransacoes] = useState(true);
  const [precisaOnboarding, setPrecisaOnboarding] = useState(false);
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);

  useEffect(() => {
    if (!usuario) { setVerificandoTransacoes(false); return; }
    const unsubscribe = escutarTransacoes(usuario.uid, (transacoes) => {
      setPrecisaOnboarding(transacoes.length === 0);
      setVerificandoTransacoes(false);
    });
    return unsubscribe;
  }, [usuario]);

  if (carregando || verificandoTransacoes) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cor-fundo-pagina)" }}>
        <p style={{ color: "var(--cor-texto-secundario)", fontFamily: "sans-serif" }}>Carregando...</p>
      </div>
    );
  }

  if (!usuario) return <PaginaLogin />;

  if (precisaOnboarding && !onboardingConcluido) {
    return (
      <OnboardingWizard
        aoConcluir={() => {
          localStorage.removeItem("tutorial-completo");
          setOnboardingConcluido(true);
        }}
      />
    );
  }

  return <Dashboard />;
}

function App() {
  return (
    <MoedaProvider>
      <AuthProvider>
        <ConteudoApp />
      </AuthProvider>
    </MoedaProvider>
  );
}

export default App;
