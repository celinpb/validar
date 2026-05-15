/**
 * state.js — Estado global da aplicação em memória
 *
 * Armazena dados carregados da API para evitar chamadas repetidas.
 * Tudo aqui é perdido ao fechar/recarregar a aba — comportamento correto
 * para um sistema de validação com sessões curtas.
 *
 * O token e papel do usuário ficam no sessionStorage (persiste durante a aba).
 * Dados de config ficam aqui em memória (carregados uma vez por sessão).
 */

const State = {

  // ── Sessão do usuário ─────────────────────────────────────────────────────

  usuario: {
    get token()       { return sessionStorage.getItem('token') || ''; },
    get papel()       { return sessionStorage.getItem('papel') || ''; },
    get nome()        { return sessionStorage.getItem('nomeUsuario') || ''; },
    get userID()      { return sessionStorage.getItem('userID') || ''; },
    get logado()      { return !!sessionStorage.getItem('token'); },

    salvar({ token, papel, nome, userID }) {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('papel', papel);
      sessionStorage.setItem('nomeUsuario', nome);
      sessionStorage.setItem('userID', userID);
    },

    limpar() {
      sessionStorage.clear();
    }
  },

  // ── Configurações do sistema ──────────────────────────────────────────────
  // Carregadas uma vez em getConfigCompleto() e usadas em toda a sessão.

  config: null,       // Object: chave -> valor (aba Config)
  campos: null,       // Array de campos de cadastro (Config_Cadastro)
  documentos: null,   // Array de documentos (Config_Docs)

  carregarConfig(dados) {
    this.config     = dados.config     || {};
    this.campos     = dados.campos     || [];
    this.documentos = dados.documentos || [];
    this._aplicarTema();
  },

  // Aplica as cores do tema via variáveis CSS
  _aplicarTema() {
    if (!this.config) return;
    const mapa = {
      'cor_primaria':   '--cor-primaria',
      'cor_secundaria': '--cor-secundaria',
      'cor_fundo':      '--cor-fundo',
      'cor_texto':      '--cor-texto'
    };
    Object.entries(mapa).forEach(([chave, varCss]) => {
      const valor = this.config[chave];
      if (valor) document.documentElement.style.setProperty(varCss, valor);
    });
  },

  // Nome do sistema (para exibir no header)
  get nomeSistema() {
    return this.config?.sistema_nome || 'ValidaDoc';
  },

  // ── Formulários disponíveis ───────────────────────────────────────────────

  get formularios() {
    if (!this.config) return [];
    const forms = [];
    for (let n = 1; n <= 5; n++) {
      const id = this.config[`formulario${n}_id`];
      if (id) {
        forms.push({
          numero: n,
          id,
          nomevalor: this.config[`formulario${n}_nomevalor`] || `Formulário ${n}`,
          intervalo:  this.config[`formulario${n}_intervalo`]  || ''
        });
      }
    }
    return forms;
  },

  // ── Inscrição em validação atual ──────────────────────────────────────────

  inscricaoAtual: null,  // Objeto retornado por getProxima / getByCPF

  // ── Filtro de formulário ativo (persiste durante a sessão) ────────────────

  _formularioAtivo: '',
  get formularioAtivo()  { return this._formularioAtivo; },
  set formularioAtivo(v) { this._formularioAtivo = v || ''; },

  // ── Modo de trabalho do supervisor ────────────────────────────────────────

  _modoRevisao: false,
  get modoRevisao()  { return this._modoRevisao; },
  set modoRevisao(v) { this._modoRevisao = !!v; },

  // ── Helpers de permissão ──────────────────────────────────────────────────

  podeAdmin()      { return this.usuario.papel === 'admin'; },
  podeSupervisor() { return ['admin', 'supervisor'].includes(this.usuario.papel); },
  podeValidar()    { return ['admin', 'supervisor', 'validador'].includes(this.usuario.papel); },

  // ── Helpers para documentos ───────────────────────────────────────────────

  // Retorna apenas os docs ativos (ativo = true e SolicitarValidacao = true)
  get documentosAtivos() {
    return (this.documentos || []).filter(d => d.ativo);
  },

  // Busca o objeto de configuração de um doc pela chave ('doc01', etc.)
  getConfigDoc(chave) {
    return (this.documentos || []).find(d => d.chave === chave) || null;
  },

  // Busca o objeto de configuração de um campo de cadastro pela chave
  getConfigCampo(chave) {
    return (this.campos || []).find(c => c.chave === chave) || null;
  }
};
