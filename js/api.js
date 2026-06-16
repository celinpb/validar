/**
 * api.js — Camada de comunicação com o backend (Apps Script Web App)
 *
 * Todas as chamadas ao backend passam por aqui.
 * O token de sessão é lido do sessionStorage automaticamente.
 *
 * Configuração: defina a constante API_URL abaixo com a URL
 * gerada ao publicar o Web App no Apps Script.
 */

//const API_URL = 'COLE_AQUI_A_URL_DO_SEU_WEB_APP'; // ← único lugar a editar

const API_URL = 'https://script.google.com/macros/s/AKfycbxOkgLJsxpCOhtNWEfle6ct94kroezT97HYkrBpWpb8LJHVOrP62d1zh1svIUTPmKiOAA/exec'; // ← único lugar a editar

// ─── Utilitários internos ──────────────────────────────────────────────────

function _getToken() {
  return sessionStorage.getItem('token') || '';
}

/**
 * Requisição GET — usada para leituras.
 * Parâmetros são serializados como query string.
 * O Apps Script não suporta CORS com headers personalizados,
 * por isso usamos mode:'no-cors' apenas como fallback — na prática
 * o Apps Script retorna os headers CORS corretos quando publicado
 * como "Qualquer pessoa".
 */
async function apiGet(action, params = {}) {
  const qs = new URLSearchParams({
    action,
    token: _getToken(),
    ...params
  }).toString();

  try {
    const res = await fetch(`${API_URL}?${qs}`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.ok) {
      // Sessão expirada → redireciona para login
      if (data.codigo === 401 || data.erro?.includes('Sessão inválida')) {
        _expirarSessao();
        return null;
      }
      throw new Error(data.erro || 'Erro desconhecido');
    }

    return data.dados;

  } catch (err) {
    console.error(`[API GET] ${action}:`, err.message);
    throw err;
  }
}

/**
 * Requisição POST — usada para escritas e ações com corpo de dados.
 */
async function apiPost(action, body = {}) {
  try {
    const payload = {
      action,
      token: _getToken(),
      ...body
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script exige text/plain para evitar preflight
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.ok) {
      if (data.codigo === 401 || data.erro?.includes('Sessão inválida')) {
        _expirarSessao();
        return null;
      }
      throw new Error(data.erro || 'Erro desconhecido');
    }

    return data.dados;

  } catch (err) {
    console.error(`[API POST] ${action}:`, err.message);
    throw err;
  }
}

function _expirarSessao() {
  sessionStorage.clear();
  window.location.href = 'index.html?sessao=expirada';
}

// ─── Endpoints públicos ────────────────────────────────────────────────────

const Api = {

  // Testa conexão com o backend
  ping: () => apiGet('ping'),

  // Carrega config completa (tema, campos, docs) — chamada única na inicialização
  getConfigCompleto: () => apiGet('getConfigCompleto'),

  // ── Autenticação ──────────────────────────────────────────────────────────

  auth: {
    login: (login, senha) =>
      apiPost('login', { login, senha }),

    logout: () =>
      apiPost('logout'),

    trocarSenha: (novaSenha) =>
      apiPost('trocarSenha', { novaSenha })
  },

  // ── Configurações (admin) ─────────────────────────────────────────────────

  config: {
    setValor: (chave, valor) =>
      apiPost('setConfigValor', { chave, valor }),

    setMultiplos: (pares) =>
      apiPost('setConfigMultiplos', { pares }),

    setCamposCadastro: (campos) =>
      apiPost('setCamposCadastro', { campos }),

    setDocumentos: (documentos) =>
      apiPost('setDocumentos', { documentos })
  },

  // ── Validação ─────────────────────────────────────────────────────────────

  validacao: {
    getDashboard: (formulario = '') =>
      apiGet('getDashboard', { formulario }),

    getProxima: (formulario = '', modoRevisao = false) =>
      apiGet('getProximaInscricao', {
        formulario,
        modoRevisao: String(modoRevisao)
      }),

    getByCPF: (cpf) =>
      apiGet('getInscricaoPorCPF', { cpf }),

    salvar: (payload) =>
      apiPost('salvarValidacao', payload),

    // Supervisor
    getComInvalido: (formulario = '', pagina = 1) =>
      apiGet('getInscricoesComInvalido', { formulario, pagina, porPagina: 30 }),

    getByLinha: (linha) =>
      apiGet('getInscricaoPorLinha', { linha: String(linha) })
  },

  // ── Usuários (admin) ──────────────────────────────────────────────────────

  usuarios: {
    listar: () =>
      apiGet('listarUsuarios'),

    criar: (usuario) =>
      apiPost('criarUsuario', { usuario }),

    editar: (userID, alteracoes) =>
      apiPost('editarUsuario', { userID, alteracoes }),

    desativar: (userID) =>
      apiPost('desativarUsuario', { userID }),

    redefinirSenha: (userID) =>
      apiPost('redefinirSenha', { userID })
  },

  // ── Auditoria ─────────────────────────────────────────────────────────────

  auditoria: {
    get: (filtros = {}) =>
      apiGet('getAuditoria', {
        userID:     filtros.userID     || '',
        acao:       filtros.acao       || '',
        entidade:   filtros.entidade   || '',
        dataInicio: filtros.dataInicio || '',
        dataFim:    filtros.dataFim    || '',
        pagina:     String(filtros.pagina    || 1),
        porPagina:  String(filtros.porPagina || 50)
      })
  }
};
