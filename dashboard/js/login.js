/**
 * LOGIN — Portal ArvoreSer
 * Arquivo: dashboard/js/login.js
 */

const AUTH_API_URL =
  "https://script.google.com/macros/s/AKfycbx26P7t-ednDkHrHqX1QPnOzbw097_n5ro5Y57bIuojrD9_AcSdBTNWkm3GNM-_UIlSMw/exec";

const AUTH_STORAGE_KEY = "arvoreser_auth";
const AUTH_TIMEOUT_MS = 15000;

document.addEventListener("DOMContentLoaded", iniciarLogin);

async function iniciarLogin() {

    // Estamos no Portal?
    const empresas = document.getElementById("companies");

    if (empresas) {

        criarJanelaLogin();

        const overlay = document.getElementById("loginOverlay");
        overlay.style.display = "none";

        empresas.querySelectorAll("[data-portal-login='true']").forEach(botao => {

            botao.addEventListener("click", () => {

                window.__empresaDestino = botao.dataset.url;
                exibirLogin();

            });

        });

        return;

    }

    // Estamos no Dashboard

    const sessao = lerSessaoLocal();

if (!sessao) {

    window.location.href = "../index.html";
    return;

}

if (sessionStorage.getItem("arvoreser_auth_ok") !== "1") {

    window.location.href = "../index.html";
    return;

}

liberarDashboard({
    perfil: sessao.perfil,
    nome: sessao.nome
});

}

function criarJanelaLogin() {
  if (document.getElementById("loginOverlay")) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "loginOverlay";

  overlay.innerHTML = `
    <div
      class="login-card"
      id="loginCard"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loginTitulo"
    >
      <img
        src="../logo-arvoreser.png"
        class="login-logo"
        alt="ArvoreSer Saúde Corporativa"
      >

      <div class="login-brand">
        <h2 id="loginTitulo">ArvoreSer</h2>
        <p class="login-subtitle">Saúde Corporativa</p>
      </div>

      <form id="loginForm" novalidate>
        <div class="login-field">
          <label for="loginUsuario">Login</label>
          <input
            type="text"
            id="loginUsuario"
            name="usuario"
            autocomplete="username"
            required
          >
        </div>

        <div class="login-field">
          <label for="loginSenha">Senha</label>
          <input
            type="password"
            id="loginSenha"
            name="senha"
            autocomplete="current-password"
            required
          >
        </div>

        <button type="submit" id="btnEntrar">
          <span class="login-spinner" aria-hidden="true"></span>
          <span id="btnEntrarTexto">Acessar</span>
        </button>

        <p
          id="loginMensagem"
          class="login-message"
          aria-live="polite"
        ></p>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const formulario = document.getElementById("loginForm");

  formulario.addEventListener("submit", autenticarPeloFormulario);
}

async function autenticarPeloFormulario(evento) {
  evento.preventDefault();
  limparErroLogin();

  const campoUsuario = document.getElementById("loginUsuario");
  const campoSenha = document.getElementById("loginSenha");

  const usuario = campoUsuario.value.trim();
  const senha = campoSenha.value;

  if (!usuario || !senha) {
    mostrarErroLogin("Preencha o login e a senha.");

    if (!usuario) {
      campoUsuario.focus();
    } else {
      campoSenha.focus();
    }

    return;
  }

  ativarCarregamentoLogin("Entrando...");

  try {
    const respostaDesafio = await chamarAuth("desafio", {
      usuario
    });

    if (
      respostaDesafio.status !== "ok" ||
      !respostaDesafio.desafio
    ) {
      throw new Error(
        respostaDesafio.message ||
        "Não foi possível iniciar o acesso."
      );
    }

    const hashSenha = await gerarSha256(senha);

    const prova = await gerarSha256(
      `${respostaDesafio.desafio}:${hashSenha}`
    );

    const respostaLogin = await chamarAuth("login", {
      usuario,
      desafio: respostaDesafio.desafio,
      prova
    });

    if (
      respostaLogin.status !== "ok" ||
      !respostaLogin.token
    ) {
      throw new Error(
        respostaLogin.message ||
        "Login ou senha inválidos."
      );
    }

    salvarSessaoLocal({
      token: respostaLogin.token,
      perfil: respostaLogin.perfil,
      nome: respostaLogin.nome
    });

    campoSenha.value = "";

    if (window.__empresaDestino) {

    sessionStorage.setItem(
        "arvoreser_auth_ok",
        "1"
    );

    window.location.href = window.__empresaDestino;
    return;

}

liberarDashboard({
    perfil: respostaLogin.perfil,
    nome: respostaLogin.nome
});

    delete window.__empresaDestino;
}

  catch (erro) {
    mostrarErroLogin(
      erro && erro.message
        ? erro.message
        : "Não foi possível acessar o Portal."
    );
  } finally {
    desativarCarregamentoLogin();
  }
}

function chamarAuth(operacao, parametros = {}) {
  return chamarJsonp(AUTH_API_URL, {
    action: "auth",
    operacao,
    ...parametros
  });
}

function chamarJsonp(url, parametros = {}) {
  return new Promise((resolve, reject) => {
    const callback =
      "__arvoreserCallback_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2);

    const script = document.createElement("script");
    const query = new URLSearchParams({
      ...parametros,
      callback
    });

    let finalizado = false;

    const limpar = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callback];
      } catch (_) {
        window[callback] = undefined;
      }
    };

    const timeout = window.setTimeout(() => {
      if (finalizado) {
        return;
      }

      finalizado = true;
      limpar();
      reject(
        new Error(
          "O servidor demorou para responder. Tente novamente."
        )
      );
    }, AUTH_TIMEOUT_MS);

    window[callback] = (resposta) => {
      if (finalizado) {
        return;
      }

      finalizado = true;
      window.clearTimeout(timeout);
      limpar();
      resolve(resposta || {});
    };

    script.onerror = () => {
      if (finalizado) {
        return;
      }

      finalizado = true;
      window.clearTimeout(timeout);
      limpar();
      reject(
        new Error(
          "Não foi possível conectar ao servidor."
        )
      );
    };

    script.src = `${url}?${query.toString()}`;
    document.head.appendChild(script);
  });
}

async function gerarSha256(texto) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error(
      "Este navegador não oferece o recurso de segurança necessário."
    );
  }

  const bytes = new TextEncoder().encode(String(texto));
  const hash = await window.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function salvarSessaoLocal(sessao) {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(sessao)
  );
}

function lerSessaoLocal() {
  try {
    const valor = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return valor ? JSON.parse(valor) : null;
  } catch (_) {
    limparSessaoLocal();
    return null;
  }
}

function limparSessaoLocal() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY); // limpa sessões antigas
}

function obterSessaoPortal() {
  return lerSessaoLocal();
}

async function sairDoPortal() {
  const sessao = lerSessaoLocal();

  limparSessaoLocal();

  if (sessao && sessao.token) {
    try {
      await chamarAuth("sair", {
        token: sessao.token
      });
    } catch (_) {
      // A sessão local já foi encerrada.
    }
  }

  window.location.reload();
}

function exibirLogin() {
  const overlay = document.getElementById("loginOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("login-success");
  overlay.style.display = "flex";

  window.setTimeout(() => {
    const campoUsuario =
      document.getElementById("loginUsuario");

    if (campoUsuario) {
      campoUsuario.focus();
    }
  }, 50);
}

function liberarDashboard(usuario) {
  document.documentElement.dataset.perfil =
    usuario && usuario.perfil
      ? usuario.perfil
      : "";

  document.documentElement.dataset.usuarioNome =
    usuario && usuario.nome
      ? usuario.nome
      : "";

  document.dispatchEvent(
    new CustomEvent("arvoreser:login", {
      detail: usuario || {}
    })
  );

  const overlay = document.getElementById("loginOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.add("login-success");

  window.setTimeout(() => {
    overlay.style.display = "none";
  }, 320);
  delete window.__empresaDestino;
}

function ativarCarregamentoLogin(textoBotao = "Entrando...") {
  const botao = document.getElementById("btnEntrar");
  const texto = document.getElementById("btnEntrarTexto");
  const usuario = document.getElementById("loginUsuario");
  const senha = document.getElementById("loginSenha");

  if (botao) {
    botao.disabled = true;
    botao.classList.add("loading");
  }

  if (texto) {
    texto.textContent = textoBotao;
  }

  if (usuario) {
    usuario.disabled = true;
  }

  if (senha) {
    senha.disabled = true;
  }
}

function desativarCarregamentoLogin() {
  const botao = document.getElementById("btnEntrar");
  const texto = document.getElementById("btnEntrarTexto");
  const usuario = document.getElementById("loginUsuario");
  const senha = document.getElementById("loginSenha");

  if (botao) {
    botao.disabled = false;
    botao.classList.remove("loading");
  }

  if (texto) {
    texto.textContent = "Acessar";
  }

  if (usuario) {
    usuario.disabled = false;
  }

  if (senha) {
    senha.disabled = false;
  }
}

function mostrarErroLogin(mensagem) {
  const card = document.getElementById("loginCard");
  const mensagemElemento =
    document.getElementById("loginMensagem");

  if (mensagemElemento) {
    mensagemElemento.textContent = mensagem;
    mensagemElemento.classList.add("visible");
  }

  if (card) {
    card.classList.remove("login-shake");
    void card.offsetWidth;
    card.classList.add("login-shake");
  }
}

function limparErroLogin() {
  const card = document.getElementById("loginCard");
  const mensagemElemento =
    document.getElementById("loginMensagem");

  if (mensagemElemento) {
    mensagemElemento.textContent = "";
    mensagemElemento.classList.remove("visible");
  }

  if (card) {
    card.classList.remove("login-shake");
  }
}
