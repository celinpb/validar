/**
 * config-sistema.js — Configurações do sistema (somente admin)
 * Inclui: info geral, editor de cores, campos de cadastro, documentos/motivos
 */

async function renderConfigSistema(container) {
  if (!State.podeAdmin()) {
    container.innerHTML = `<div class="alerta alerta-erro">Acesso restrito a administradores.</div>`;
    return;
  }

  // Garante que as configs estão carregadas
  const config = State.config || {};
  const campos = State.campos || [];
  const docs   = State.documentos || [];

  container.innerHTML = `
    <div class="pagina-titulo">
      <h1>Configurações do Sistema</h1>
      <p>Personalize o sistema, campos de cadastro e documentos</p>
    </div>

    <!-- Abas de configuração -->
    <div style="display:flex;gap:var(--esp-2);margin-bottom:var(--esp-6);border-bottom:2px solid var(--cinza-200);padding-bottom:0">
      ${['geral','cores','campos','documentos'].map((aba, i) => `
        <button
          class="btn btn-fantasma"
          id="cfg-aba-${aba}"
          onclick="_ativarAba('${aba}')"
          style="border-radius:var(--raio-md) var(--raio-md) 0 0;border-bottom:2px solid transparent;margin-bottom:-2px;${i===0?'border-bottom-color:var(--cor-primaria);color:var(--cor-primaria);font-weight:600':''}"
        >
          ${{ geral:'Geral', cores:'Cores', campos:'Campos de Cadastro', documentos:'Documentos' }[aba]}
        </button>
      `).join('')}
    </div>

    <!-- Painel: Geral -->
    <div id="cfg-painel-geral">
      <div class="card" style="max-width:600px">
        <div class="card-header"><h3>Informações gerais</h3></div>
        <div class="card-body">
          ${_campoConfig('sistema_nome',   'Nome do sistema',  config.sistema_nome   || '')}
          ${_campoConfig('sistema_escola', 'Nome da escola',   config.sistema_escola || '')}
          ${_campoConfig('senha_padrao',   'Senha padrão (novos usuários)', config.senha_padrao || '', 'password')}
        </div>
        <div class="card-footer">
          <button class="btn btn-primario" onclick="salvarConfigGeral()">Salvar</button>
        </div>
      </div>

      <!-- Formulários -->
      <div class="card" style="max-width:600px;margin-top:var(--esp-6)">
        <div class="card-header"><h3>Formulários Google</h3></div>
        <div class="card-body">
          <p style="font-size:var(--texto-sm);color:var(--cinza-400);margin-bottom:var(--esp-5)">
            Configure até 5 formulários. O campo "NomeValor" é o texto que aparece no sistema e deve
            corresponder ao valor enviado pelo formulário no campo de identificação.
          </p>
          ${[1,2,3,4,5].map(n => `
            <div style="border:1px solid var(--cinza-200);border-radius:var(--raio-md);padding:var(--esp-4);margin-bottom:var(--esp-4)">
              <div style="font-weight:600;font-size:var(--texto-sm);margin-bottom:var(--esp-3);color:var(--cinza-600)">
                Formulário ${n}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--esp-3)">
                ${_campoConfig(`formulario${n}_id`,        'ID do formulário', config[`formulario${n}_id`] || '', 'text', true)}
                ${_campoConfig(`formulario${n}_nomevalor`, 'Nome/Valor',       config[`formulario${n}_nomevalor`] || '', 'text', true)}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="card-footer">
          <button class="btn btn-primario" onclick="salvarConfigFormularios()">Salvar formulários</button>
        </div>
      </div>
    </div>

    <!-- Painel: Cores -->
    <div id="cfg-painel-cores" style="display:none">
      <div class="card" style="max-width:560px">
        <div class="card-header">
          <h3>Editor de cores</h3>
          <span style="font-size:var(--texto-xs);color:var(--cinza-400)">As cores são aplicadas em tempo real</span>
        </div>
        <div class="card-body">
          ${_campoColor('cor_primaria',   'Cor primária (sidebar, botões)',       config.cor_primaria   || '#6A5C5E')}
          ${_campoColor('cor_secundaria', 'Cor secundária (destaques, badges)',   config.cor_secundaria || '#DFAA86')}
          ${_campoColor('cor_fundo',      'Cor de destaque (botão principal)',    config.cor_fundo      || '#F37D56')}
          ${_campoColor('cor_texto',      'Cor de acento (badges de conclusão)',  config.cor_texto      || '#B4C8A3')}

          <!-- Preview -->
          <div style="margin-top:var(--esp-6);padding:var(--esp-5);background:var(--cinza-50);border-radius:var(--raio-lg);border:1px solid var(--cinza-200)">
            <div style="font-size:var(--texto-xs);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--cinza-400);font-family:var(--fonte-mono);margin-bottom:var(--esp-3)">Preview</div>
            <div style="display:flex;flex-wrap:wrap;gap:var(--esp-3)">
              <button class="btn btn-primario">Botão primário</button>
              <button class="btn btn-destaque">Botão destaque</button>
              <span class="badge badge-concluida">Concluída</span>
              <span class="badge badge-valido">Válido</span>
              <span class="badge badge-invalido">Inválido</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-secundario" onclick="restaurarCoresPadrao()">Restaurar padrão</button>
          <button class="btn btn-primario" onclick="salvarCores()">Salvar cores</button>
        </div>
      </div>
    </div>

    <!-- Painel: Campos de Cadastro -->
    <div id="cfg-painel-campos" style="display:none">
      <div class="card">
        <div class="card-header">
          <h3>Campos de Cadastro</h3>
          <span style="font-size:var(--texto-xs);color:var(--cinza-400)">
            Defina quais dados do aluno serão exibidos na tela de validação
          </span>
        </div>
        <div class="card-body">
          <div class="tabela-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Chave</th>
                  <th>Rótulo exibido</th>
                  <th>Tipo</th>
                  <th>Ordem</th>
                  <th>Ativo</th>
                </tr>
              </thead>
              <tbody id="tabela-campos">
                ${campos.map(c => `
                  <tr>
                    <td style="font-family:var(--fonte-mono);font-size:var(--texto-xs);color:var(--cinza-400)">${c.chave}</td>
                    <td>
                      <input class="form-input" type="text" value="${c.rotulo}"
                        onchange="atualizarCampo('${c.chave}','rotulo',this.value)"
                        style="min-width:160px">
                    </td>
                    <td>
                      <select class="form-select" style="min-width:100px"
                        onchange="atualizarCampo('${c.chave}','tipo',this.value)">
                        ${['Texto','Número','Data','CPF','Telefone'].map(t =>
                          `<option ${c.tipo === t ? 'selected':''} value="${t}">${t}</option>`
                        ).join('')}
                      </select>
                    </td>
                    <td>
                      <input class="form-input" type="number" value="${c.ordem}"
                        onchange="atualizarCampo('${c.chave}','ordem',Number(this.value))"
                        style="width:70px">
                    </td>
                    <td>
                      <input type="checkbox" ${c.ativo ? 'checked' : ''}
                        onchange="atualizarCampo('${c.chave}','ativo',this.checked)"
                        style="width:18px;height:18px;accent-color:var(--cor-primaria)">
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-primario" onclick="salvarCampos()">Salvar campos</button>
        </div>
      </div>
    </div>

    <!-- Painel: Documentos -->
    <div id="cfg-painel-documentos" style="display:none">
      <div class="card">
        <div class="card-header">
          <h3>Documentos a Validar</h3>
          <span style="font-size:var(--texto-xs);color:var(--cinza-400)">
            Separe os motivos de invalidação por ponto e vírgula sem espaços (ex: Ilegível;Vencido;Foto cortada)
          </span>
        </div>
        <div class="card-body" style="padding:0">
          <div style="overflow-x:auto">
            <table>
              <thead>
                <tr>
                  <th>Chave</th>
                  <th>Nome do documento</th>
                  <th>Motivos de invalidação</th>
                  <th>Ordem</th>
                  <th>Obrigatório</th>
                  <th>Solicitar</th>
                </tr>
              </thead>
              <tbody>
                ${docs.map(d => `
                  <tr>
                    <td style="font-family:var(--fonte-mono);font-size:var(--texto-xs);color:var(--cinza-400)">${d.chave}</td>
                    <td>
                      <input class="form-input" type="text" value="${d.nome}"
                        onchange="atualizarDoc('${d.chave}','nome',this.value)"
                        style="min-width:180px">
                    </td>
                    <td>
                      <input class="form-input" type="text"
                        value="${d.motivos?.join(';') || ''}"
                        placeholder="Motivo1;Motivo2"
                        onchange="atualizarDoc('${d.chave}','motivosStr',this.value)"
                        style="min-width:220px">
                    </td>
                    <td>
                      <input class="form-input" type="number" value="${d.ordem}"
                        onchange="atualizarDoc('${d.chave}','ordem',Number(this.value))"
                        style="width:70px">
                    </td>
                    <td style="text-align:center">
                      <input type="checkbox" ${d.obrigatorio ? 'checked' : ''}
                        onchange="atualizarDoc('${d.chave}','obrigatorio',this.checked)"
                        style="width:18px;height:18px;accent-color:var(--cor-primaria)">
                    </td>
                    <td style="text-align:center">
                      <input type="checkbox" ${d.ativo ? 'checked' : ''}
                        onchange="atualizarDoc('${d.chave}','ativo',this.checked)"
                        style="width:18px;height:18px;accent-color:var(--cor-primaria)">
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-primario" onclick="salvarDocumentos()">Salvar documentos</button>
        </div>
      </div>
    </div>
  `;
}

// ─── Abas ─────────────────────────────────────────────────────────────────

function _ativarAba(aba) {
  ['geral','cores','campos','documentos'].forEach(a => {
    const btn   = document.getElementById(`cfg-aba-${a}`);
    const painel = document.getElementById(`cfg-painel-${a}`);
    const ativo = a === aba;
    if (btn) {
      btn.style.borderBottomColor = ativo ? 'var(--cor-primaria)' : 'transparent';
      btn.style.color = ativo ? 'var(--cor-primaria)' : '';
      btn.style.fontWeight = ativo ? '600' : '';
    }
    if (painel) painel.style.display = ativo ? 'block' : 'none';
  });
}

// ─── Helpers de renderização ──────────────────────────────────────────────

function _campoConfig(chave, label, valor, tipo = 'text', compacto = false) {
  return `
    <div class="form-grupo" ${compacto ? '' : ''} style="${compacto ? 'margin-bottom:0' : ''}">
      <label class="form-label">${label}</label>
      <input class="form-input" type="${tipo}" id="cfg-${chave}" value="${valor}"
        ${tipo === 'password' ? 'autocomplete="new-password"' : ''}>
    </div>
  `;
}

function _campoColor(chave, label, valor) {
  return `
    <div style="display:flex;align-items:center;gap:var(--esp-4);margin-bottom:var(--esp-5)">
      <input type="color" id="cor-${chave}" value="${valor}"
        oninput="previewCor('${chave}',this.value)"
        style="width:48px;height:48px;border:2px solid var(--cinza-200);border-radius:var(--raio-md);cursor:pointer;padding:2px">
      <div style="flex:1">
        <div style="font-size:var(--texto-sm);font-weight:500;margin-bottom:2px">${label}</div>
        <div style="font-family:var(--fonte-mono);font-size:var(--texto-xs);color:var(--cinza-400)" id="hex-${chave}">${valor}</div>
      </div>
    </div>
  `;
}

// ─── Preview de cor ───────────────────────────────────────────────────────

function previewCor(chave, valor) {
  // Mapeia chave -> variável CSS
  const mapa = {
    cor_primaria:   '--cor-primaria',
    cor_secundaria: '--cor-secundaria',
    cor_fundo:      '--cor-fundo',
    cor_texto:      '--cor-texto'
  };
  const varCss = mapa[chave];
  if (varCss) document.documentElement.style.setProperty(varCss, valor);
  const hexEl = document.getElementById(`hex-${chave}`);
  if (hexEl) hexEl.textContent = valor;
}

// ─── Gerenciamento de estado local (campos e docs) ────────────────────────

// Cópia local editável — evita modificar State diretamente durante edição
let _camposEditaveis = null;
let _docsEditaveis   = null;

function atualizarCampo(chave, prop, valor) {
  if (!_camposEditaveis) _camposEditaveis = JSON.parse(JSON.stringify(State.campos));
  const campo = _camposEditaveis.find(c => c.chave === chave);
  if (campo) campo[prop] = valor;
}

function atualizarDoc(chave, prop, valor) {
  if (!_docsEditaveis) _docsEditaveis = JSON.parse(JSON.stringify(State.documentos));
  const doc = _docsEditaveis.find(d => d.chave === chave);
  if (doc) {
    if (prop === 'motivosStr') {
      doc.motivos = valor.split(';').map(m => m.trim()).filter(Boolean);
    } else {
      doc[prop] = valor;
    }
  }
}

// ─── Salvar ───────────────────────────────────────────────────────────────

async function salvarConfigGeral() {
  const pares = {};
  ['sistema_nome','sistema_escola','senha_padrao'].forEach(ch => {
    const el = document.getElementById(`cfg-${ch}`);
    if (el) pares[ch] = el.value;
  });
  await _salvarPares(pares, 'Configurações salvas!');
}

async function salvarConfigFormularios() {
  const pares = {};
  [1,2,3,4,5].forEach(n => {
    [`formulario${n}_id`, `formulario${n}_nomevalor`].forEach(ch => {
      const el = document.getElementById(`cfg-${ch}`);
      if (el) pares[ch] = el.value;
    });
  });
  await _salvarPares(pares, 'Formulários salvos!');
}

async function salvarCores() {
  const pares = {};
  ['cor_primaria','cor_secundaria','cor_fundo','cor_texto'].forEach(ch => {
    const el = document.getElementById(`cor-${ch}`);
    if (el) pares[ch] = el.value;
  });
  await _salvarPares(pares, 'Cores salvas e aplicadas!');
  // Atualiza State local
  Object.entries(pares).forEach(([k,v]) => { if (State.config) State.config[k] = v; });
}

function restaurarCoresPadrao() {
  const padrao = {
    cor_primaria:   '#6A5C5E',
    cor_secundaria: '#DFAA86',
    cor_fundo:      '#F37D56',
    cor_texto:      '#B4C8A3'
  };
  Object.entries(padrao).forEach(([ch, val]) => {
    const el = document.getElementById(`cor-${ch}`);
    if (el) el.value = val;
    previewCor(ch, val);
  });
}

async function salvarCampos() {
  if (!_camposEditaveis) _camposEditaveis = JSON.parse(JSON.stringify(State.campos));
  try {
    const res = await Api.config.setCamposCadastro(_camposEditaveis);
    if (res?.ok) {
      State.campos = _camposEditaveis;
      _camposEditaveis = null;
      Toast.sucesso('Campos de cadastro salvos!');
    } else {
      Toast.erro(res?.erro || 'Erro ao salvar.');
    }
  } catch (e) { Toast.erro(e.message); }
}

async function salvarDocumentos() {
  if (!_docsEditaveis) _docsEditaveis = JSON.parse(JSON.stringify(State.documentos));
  try {
    const res = await Api.config.setDocumentos(_docsEditaveis);
    if (res?.ok) {
      State.documentos = _docsEditaveis;
      _docsEditaveis = null;
      Toast.sucesso('Documentos salvos!');
    } else {
      Toast.erro(res?.erro || 'Erro ao salvar.');
    }
  } catch (e) { Toast.erro(e.message); }
}

async function _salvarPares(pares, mensagemSucesso) {
  try {
    const res = await Api.config.setMultiplos(pares);
    if (res?.ok) {
      // Atualiza State local
      Object.entries(pares).forEach(([k,v]) => { if (State.config) State.config[k] = v; });
      Toast.sucesso(mensagemSucesso);
    } else {
      Toast.erro(res?.erro || 'Erro ao salvar configurações.');
    }
  } catch (e) { Toast.erro(e.message); }
}
