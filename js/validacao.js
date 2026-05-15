/**
 * validacao.js — Tela principal de validação de documentos
 *
 * Fluxo:
 *   1. Painel de entrada (buscar por CPF ou próxima da fila)
 *   2. Tela de validação: dados do aluno + visualizador de docs + ações
 *   3. Ao salvar: opção de voltar ao painel ou avançar para a próxima
 */

// Estado local desta tela
let _inscricaoAtual = null;
let _salvando = false;

// ─── Ponto de entrada ─────────────────────────────────────────────────────

async function renderValidacao(container) {
  _inscricaoAtual = null;
  _renderPainelEntrada(container);
}

// ─── Painel de entrada ────────────────────────────────────────────────────

function _renderPainelEntrada(container) {
  container.innerHTML = `
    <div class="pagina-titulo">
      <h1>Validação de Documentos</h1>
      <p>Inicie pela próxima inscrição da fila ou busque pelo CPF</p>
    </div>

    <!-- Busca por CPF -->
    <div class="card" style="margin-bottom:var(--esp-5);max-width:600px">
      <div class="card-header">
        <h3>Buscar inscrição</h3>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:var(--esp-3);align-items:flex-end">
          <div class="form-grupo" style="flex:1;margin-bottom:0">
            <label class="form-label" for="input-cpf-busca">CPF do aluno</label>
            <input
              class="form-input"
              type="text"
              id="input-cpf-busca"
              placeholder="000.000.000-00"
              maxlength="14"
              oninput="mascararCPF(this)"
            >
          </div>
          <button class="btn btn-secundario" onclick="buscarPorCPF()">
            ${Icone.buscar()} Buscar
          </button>
        </div>
        <div id="msg-busca-cpf" style="margin-top:var(--esp-3)"></div>
      </div>
    </div>

    <!-- Próxima da fila -->
    <div class="card" style="max-width:600px">
      <div class="card-header">
        <h3>Fila de validação</h3>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:var(--esp-4)">
        <p style="font-size:var(--texto-sm);color:var(--cinza-500)">
          O sistema carregará automaticamente a próxima inscrição com status
          <span class="badge badge-pendente">Pendente</span> da fila.
          ${State.formularioAtivo ? `Filtro ativo: <strong>${State.formularioAtivo}</strong>` : ''}
        </p>

        <div id="msg-fila"></div>

        <button class="btn btn-destaque btn-lg" id="btn-proxima" onclick="carregarProxima()">
          ${Icone.validar()}
          Iniciar validação — próxima da fila
        </button>
      </div>
    </div>
  `;
}

// ─── Busca por CPF ────────────────────────────────────────────────────────

async function buscarPorCPF() {
  const input = document.getElementById('input-cpf-busca');
  const cpf   = input?.value.replace(/\D/g, '');
  const msg   = document.getElementById('msg-busca-cpf');

  if (!cpf || cpf.length !== 11) {
    msg.innerHTML = '<div class="alerta alerta-aviso">Informe um CPF válido com 11 dígitos.</div>';
    return;
  }

  msg.innerHTML = htmlCarregando('Buscando...');

  try {
    const res = await Api.validacao.getByCPF(cpf);
    msg.innerHTML = '';

    if (!res) return; // sessão expirada
    if (!res.inscricao) {
      msg.innerHTML = '<div class="alerta alerta-aviso">Nenhuma inscrição encontrada para este CPF.</div>';
      return;
    }

    _inscricaoAtual = res.inscricao;
    _renderTelaValidacao(document.getElementById('conteudo-principal'));

  } catch (e) {
    msg.innerHTML = `<div class="alerta alerta-erro">${e.message}</div>`;
  }
}

// ─── Próxima da fila ──────────────────────────────────────────────────────

async function carregarProxima() {
  const btn = document.getElementById('btn-proxima');
  const msg = document.getElementById('msg-fila');
  if (!btn) return;

  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> Buscando...`;

  try {
    const res = await Api.validacao.getProxima(State.formularioAtivo, State.modoRevisao);

    if (!res) return;
    if (!res.inscricao) {
      msg.innerHTML = `
        <div class="alerta alerta-sucesso">
          🎉 Não há mais inscrições pendentes na fila${State.formularioAtivo ? ` para "${State.formularioAtivo}"` : ''}.
        </div>`;
      btn.innerHTML = `${Icone.validar()} Verificar novamente`;
      btn.disabled = false;
      return;
    }

    _inscricaoAtual = res.inscricao;
    _renderTelaValidacao(document.getElementById('conteudo-principal'));

  } catch (e) {
    msg.innerHTML = `<div class="alerta alerta-erro">${e.message}</div>`;
    btn.disabled = false;
    btn.innerHTML = `${Icone.validar()} Iniciar validação — próxima da fila`;
  }
}

// ─── Tela de validação ────────────────────────────────────────────────────

function _renderTelaValidacao(container) {
  const insc = _inscricaoAtual;
  if (!insc) { renderValidacao(container); return; }

  const camposAtivos = (State.campos || []).filter(c => c.ativo);
  const docsAtivos   = (State.documentos || []).filter(d => d.ativo);

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--esp-4);margin-bottom:var(--esp-6);flex-wrap:wrap">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:var(--esp-3);margin-bottom:var(--esp-1)">
          <button class="btn btn-fantasma btn-sm" onclick="renderValidacao(document.getElementById('conteudo-principal'))">
            ${Icone.anterior()} Voltar
          </button>
          ${badgeStatus(insc.status)}
        </div>
        <h1 style="font-size:var(--texto-2xl);letter-spacing:-.02em">
          ${insc.nomeSocialBool && insc.nomeSocial ? insc.nomeSocial : insc.nomeCompleto}
        </h1>
        ${insc.nomeSocialBool && insc.nomeSocial
          ? `<div style="font-size:var(--texto-sm);color:var(--cinza-400)">Nome civil: ${insc.nomeCompleto}</div>`
          : ''}
        <div style="font-size:var(--texto-sm);color:var(--cinza-400);margin-top:var(--esp-1)">
          CPF: <strong>${_formatarCPF(insc.cpf)}</strong>
          · Inscrição: ${formatarDataHora(insc.inscricaoDataHora)}
          ${insc.formulario ? `· Formulário: <strong>${insc.formulario}</strong>` : ''}
        </div>
      </div>
    </div>

    <!-- Layout de duas colunas: dados + documentos -->
    <div style="display:grid;grid-template-columns:320px 1fr;gap:var(--esp-6);align-items:start">

      <!-- Coluna esquerda: dados do aluno -->
      <div style="display:flex;flex-direction:column;gap:var(--esp-5)">
        <div class="card">
          <div class="card-header"><h3>Dados do aluno</h3></div>
          <div class="card-body" style="padding:var(--esp-4)">
            ${camposAtivos.length === 0
              ? '<p style="font-size:var(--texto-sm);color:var(--cinza-400)">Nenhum campo de cadastro configurado.</p>'
              : camposAtivos.map(campo => `
                <div style="margin-bottom:var(--esp-4)">
                  <div style="font-size:var(--texto-xs);font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--cinza-400);font-family:var(--fonte-mono);margin-bottom:2px">
                    ${campo.rotulo}
                  </div>
                  <div style="font-size:var(--texto-sm);color:var(--cinza-700);font-weight:500">
                    ${insc.cads?.[campo.chave] || '—'}
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <!-- Observações gerais -->
        <div class="card">
          <div class="card-header"><h3>Observações</h3></div>
          <div class="card-body">
            <textarea
              class="form-textarea"
              id="campo-observacoes"
              placeholder="Observações gerais sobre esta inscrição (opcional)..."
              style="min-height:100px"
            >${insc.observacoes || ''}</textarea>
          </div>
        </div>

        <!-- Botões de ação -->
        <div style="display:flex;flex-direction:column;gap:var(--esp-3)">
          <button class="btn btn-primario btn-lg" onclick="salvarValidacao(false)" id="btn-salvar">
            ${Icone.validar()} Salvar validação
          </button>
          <button class="btn btn-destaque btn-lg" onclick="salvarValidacao(true)" id="btn-salvar-proxima">
            ${Icone.proximo()} Salvar e próxima
          </button>
        </div>
      </div>

      <!-- Coluna direita: documentos -->
      <div id="painel-documentos">
        ${_htmlDocumentos(docsAtivos, insc)}
      </div>

    </div>
  `;

  // Seleciona o primeiro documento por padrão
  const primeiroBotao = container.querySelector('.btn-selecionar-doc');
  if (primeiroBotao) primeiroBotao.click();
}

// ─── HTML dos documentos ──────────────────────────────────────────────────

function _htmlDocumentos(docs, insc) {
  const docsComLink = docs.filter(d => {
    const docInsc = insc.documentos?.find(di => di.chave === d.chave);
    return docInsc?.linkOriginal;
  });

  if (docsComLink.length === 0) {
    return htmlVazio('Sem documentos', 'Nenhum documento foi enviado nesta inscrição.', '📄');
  }

  return `
    <!-- Abas de documentos -->
    <div style="display:flex;flex-wrap:wrap;gap:var(--esp-2);margin-bottom:var(--esp-4)" id="abas-docs">
      ${docsComLink.map((d, i) => {
        const docInsc = insc.documentos?.find(di => di.chave === d.chave);
        const validacao = docInsc?.valido || '';
        return `
          <button
            class="btn btn-${validacao === 'valido' ? 'fantasma' : validacao === 'invalido' ? 'fantasma' : 'fantasma'} btn-sm btn-selecionar-doc"
            id="aba-${d.chave}"
            data-chave="${d.chave}"
            onclick="selecionarDoc('${d.chave}')"
            style="${i === 0 ? 'border-color:var(--cor-primaria);color:var(--cor-primaria)' : ''}"
          >
            ${_pontinhoStatus(validacao)}
            ${d.nome}
          </button>
        `;
      }).join('')}
    </div>

    <!-- Visualizador + painel de decisão -->
    ${docsComLink.map(d => {
      const docInsc = insc.documentos?.find(di => di.chave === d.chave);
      const cfgDoc  = State.getConfigDoc(d.chave);
      const motivos = cfgDoc?.motivos || [];

      return `
        <div id="painel-doc-${d.chave}" style="display:none">
          <div style="display:grid;grid-template-rows:auto auto;gap:var(--esp-4)">

            <!-- Visualizador de documento -->
            <div class="card">
              <div class="card-header" style="padding:var(--esp-3) var(--esp-4)">
                <span style="font-size:var(--texto-sm);font-weight:600">${d.nome}</span>
                <a href="${docInsc?.linkOriginal}" target="_blank" class="btn btn-fantasma btn-sm">
                  ${Icone.olho()} Abrir no Drive
                </a>
              </div>
              <div style="background:var(--cinza-100);border-radius:0 0 var(--raio-lg) var(--raio-lg);overflow:hidden;min-height:480px;position:relative">
                <iframe
                  src="${docInsc?.embedUrl || ''}"
                  style="width:100%;height:520px;border:none;display:block"
                  allow="autoplay"
                  loading="lazy"
                  title="${d.nome}"
                ></iframe>
              </div>
            </div>

            <!-- Painel de decisão -->
            <div class="card">
              <div class="card-header"><h3>Resultado da análise</h3></div>
              <div class="card-body">

                <!-- Botões de decisão -->
                <div style="display:flex;gap:var(--esp-3);margin-bottom:var(--esp-4)">
                  ${_btnDecisao(d.chave, 'valido',   '✓ Válido',       docInsc?.valido)}
                  ${_btnDecisao(d.chave, 'invalido', '✕ Inválido',     docInsc?.valido)}
                  ${_btnDecisao(d.chave, 'na',       '— Não se aplica',docInsc?.valido)}
                </div>

                <!-- Painel de motivo (visível apenas se inválido) -->
                <div id="painel-motivo-${d.chave}"
                     style="display:${docInsc?.valido === 'invalido' ? 'block' : 'none'}">
                  <div class="form-grupo">
                    <label class="form-label">Motivo (pré-definido)</label>
                    <select class="form-select" id="select-motivo-${d.chave}">
                      <option value="">Selecione um motivo...</option>
                      ${motivos.map(m => `<option value="${m}" ${docInsc?.motivo?.includes(m) ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-grupo" style="margin-bottom:0">
                    <label class="form-label">Motivo livre (opcional)</label>
                    <textarea
                      class="form-textarea"
                      id="texto-motivo-${d.chave}"
                      placeholder="Descreva o problema encontrado..."
                      style="min-height:70px"
                    >${_extrairMotivoLivre(docInsc?.motivo || '')}</textarea>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      `;
    }).join('')}
  `;
}

function _btnDecisao(chave, valor, label, selecionado) {
  const estilos = {
    valido:   'border:2px solid var(--cor-valido);background:var(--cor-valido-bg);color:var(--cor-valido)',
    invalido: 'border:2px solid var(--cor-invalido);background:var(--cor-invalido-bg);color:var(--cor-invalido)',
    na:       'border:2px solid var(--cinza-300);background:var(--cinza-100);color:var(--cinza-500)'
  };
  const base = 'border:2px solid var(--cinza-200);background:var(--branco);color:var(--cinza-500)';

  return `
    <button
      class="btn"
      id="btn-${valor}-${chave}"
      onclick="selecionarDecisao('${chave}','${valor}')"
      style="flex:1;${selecionado === valor ? estilos[valor] : base};font-weight:500;transition:all var(--trans-rapida)"
    >
      ${label}
    </button>
  `;
}

function _pontinhoStatus(valido) {
  const cores = {
    valido:   'var(--cor-valido)',
    invalido: 'var(--cor-invalido)',
    na:       'var(--cinza-300)'
  };
  const cor = cores[valido] || 'var(--cinza-200)';
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cor};margin-right:4px"></span>`;
}

// ─── Interações ───────────────────────────────────────────────────────────

function selecionarDoc(chave) {
  // Oculta todos os painéis
  document.querySelectorAll('[id^="painel-doc-"]').forEach(el => el.style.display = 'none');
  // Mostra o selecionado
  const painel = document.getElementById(`painel-doc-${chave}`);
  if (painel) painel.style.display = 'block';

  // Atualiza estilo das abas
  document.querySelectorAll('.btn-selecionar-doc').forEach(btn => {
    btn.style.borderColor = '';
    btn.style.color = '';
  });
  const abaAtiva = document.getElementById(`aba-${chave}`);
  if (abaAtiva) {
    abaAtiva.style.borderColor = 'var(--cor-primaria)';
    abaAtiva.style.color = 'var(--cor-primaria)';
  }
}

function selecionarDecisao(chave, valor) {
  // Atualiza estado interno
  if (!_inscricaoAtual) return;
  const docInsc = _inscricaoAtual.documentos?.find(d => d.chave === chave);
  if (docInsc) docInsc.valido = valor;

  // Atualiza visual dos botões
  const estilos = {
    valido:   'border:2px solid var(--cor-valido);background:var(--cor-valido-bg);color:var(--cor-valido)',
    invalido: 'border:2px solid var(--cor-invalido);background:var(--cor-invalido-bg);color:var(--cor-invalido)',
    na:       'border:2px solid var(--cinza-300);background:var(--cinza-100);color:var(--cinza-500)'
  };
  const base = 'border:2px solid var(--cinza-200);background:var(--branco);color:var(--cinza-500)';

  ['valido','invalido','na'].forEach(v => {
    const btn = document.getElementById(`btn-${v}-${chave}`);
    if (btn) btn.style.cssText = btn.style.cssText.replace(/border:[^;]+;background:[^;]+;color:[^;]+/, '')
      + (v === valor ? estilos[v] : base);
  });

  // Mostra/esconde painel de motivo
  const painelMotivo = document.getElementById(`painel-motivo-${chave}`);
  if (painelMotivo) {
    painelMotivo.style.display = valor === 'invalido' ? 'block' : 'none';
  }

  // Atualiza pontinho da aba
  const aba = document.getElementById(`aba-${chave}`);
  if (aba) {
    const pontinho = aba.querySelector('span');
    if (pontinho) {
      const cores = { valido: 'var(--cor-valido)', invalido: 'var(--cor-invalido)', na: 'var(--cinza-300)' };
      pontinho.style.background = cores[valor] || 'var(--cinza-200)';
    }
  }
}

// ─── Salvar validação ─────────────────────────────────────────────────────

async function salvarValidacao(avancar) {
  if (_salvando || !_inscricaoAtual) return;

  // Coleta resultado de cada documento
  const docsAtivos = (State.documentos || []).filter(d => d.ativo);
  const documentos = [];

  for (const d of docsAtivos) {
    const docInsc = _inscricaoAtual.documentos?.find(di => di.chave === d.chave);
    if (!docInsc?.linkOriginal) continue; // sem link, ignora

    const valido = docInsc.valido || '';

    // Se inválido, valida que tem ao menos um motivo
    let motivo = '';
    if (valido === 'invalido') {
      const motivoLista = document.getElementById(`select-motivo-${d.chave}`)?.value || '';
      const motivoLivre = document.getElementById(`texto-motivo-${d.chave}`)?.value?.trim() || '';
      if (!motivoLista && !motivoLivre) {
        Toast.aviso(`Informe o motivo de invalidação para: ${d.nome}`);
        selecionarDoc(d.chave);
        return;
      }
      motivo = JSON.stringify({ lista: motivoLista, livre: motivoLivre });
    }

    documentos.push({ chave: d.chave, valido, motivo });
  }

  const observacoes = document.getElementById('campo-observacoes')?.value?.trim() || '';

  _salvando = true;
  const btnSalvar  = document.getElementById('btn-salvar');
  const btnProxima = document.getElementById('btn-salvar-proxima');
  if (btnSalvar)  { btnSalvar.disabled  = true; btnSalvar.innerHTML  = '<div class="spinner"></div> Salvando...'; }
  if (btnProxima) { btnProxima.disabled = true; }

  try {
    const res = await Api.validacao.salvar({
      linhaReal:       _inscricaoAtual.linhaReal,
      observacoes,
      documentos,
      avancar,
      formularioFiltro: State.formularioAtivo,
      modoRevisao:      State.modoRevisao
    });

    if (!res) return;

    Toast.sucesso('Validação salva com sucesso!');

    if (avancar && res.proximaInscricao) {
      _inscricaoAtual = res.proximaInscricao;
      _renderTelaValidacao(document.getElementById('conteudo-principal'));
    } else if (avancar && !res.proximaInscricao) {
      Toast.info('Não há mais inscrições pendentes na fila.');
      renderValidacao(document.getElementById('conteudo-principal'));
    } else {
      renderValidacao(document.getElementById('conteudo-principal'));
    }

  } catch (e) {
    Toast.erro(`Erro ao salvar: ${e.message}`);
  } finally {
    _salvando = false;
  }
}

// ─── Utilitários locais ───────────────────────────────────────────────────

function mascararCPF(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
  input.value = v;
}

function _formatarCPF(cpf) {
  if (!cpf) return '—';
  const s = String(cpf).replace(/\D/g, '');
  if (s.length !== 11) return cpf;
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function _extrairMotivoLivre(motivoStr) {
  if (!motivoStr) return '';
  try {
    const obj = JSON.parse(motivoStr);
    return obj.livre || '';
  } catch { return motivoStr; }
}
