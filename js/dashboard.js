/**
 * dashboard.js — Painel de progresso e estatísticas
 * Acessível a todos os papéis; supervisores e admins veem mais detalhes.
 */

async function renderDashboard(container) {
  container.innerHTML = `
    <div class="pagina-titulo">
      <h1>Dashboard</h1>
      <p>Acompanhe o progresso das validações</p>
    </div>
    ${htmlCarregando('Buscando estatísticas...')}
  `;

  try {
    const dados = await Api.validacao.getDashboard(State.formularioAtivo);
    if (!dados) return;

    const pct = dados.total > 0
      ? Math.round((dados.concluida / dados.total) * 100)
      : 0;

    const pctAndamento = dados.total > 0
      ? Math.round((dados.em_andamento / dados.total) * 100)
      : 0;

    container.innerHTML = `
      <div class="pagina-titulo">
        <h1>Dashboard</h1>
        <p>Acompanhe o progresso das validações
          ${State.formularioAtivo ? `— <strong>${State.formularioAtivo}</strong>` : ''}
        </p>
      </div>

      <!-- Cards de contagem -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--esp-5);margin-bottom:var(--esp-8)">
        ${_cardContador('Total', dados.total, '📋', 'var(--cinza-600)', 'var(--cinza-100)')}
        ${_cardContador('Pendentes', dados.pendente, '🕐', 'var(--cor-pendente)', 'var(--cor-pendente-bg)')}
        ${_cardContador('Em andamento', dados.em_andamento, '⚡', 'var(--cor-andamento)', 'var(--cor-andamento-bg)')}
        ${_cardContador('Concluídas', dados.concluida, '✓', 'var(--cor-valido)', 'var(--cor-valido-bg)')}
        ${State.podeSupervisor() ? _cardContador('Com inválidos', dados.com_invalido, '⚠', 'var(--cor-invalido)', 'var(--cor-invalido-bg)') : ''}
      </div>

      <!-- Barra de progresso geral -->
      <div class="card" style="margin-bottom:var(--esp-6)">
        <div class="card-header">
          <h3>Progresso geral</h3>
          <span style="font-family:var(--fonte-mono);font-size:var(--texto-lg);font-weight:600;color:var(--cor-primaria)">${pct}%</span>
        </div>
        <div class="card-body">
          <div style="background:var(--cinza-200);border-radius:var(--raio-full);height:12px;overflow:hidden;margin-bottom:var(--esp-4)">
            <!-- Barra concluída -->
            <div style="display:flex;height:100%">
              <div style="
                width:${pct}%;
                background:var(--cor-valido);
                border-radius:var(--raio-full) 0 0 var(--raio-full);
                transition:width 1s cubic-bezier(.4,0,.2,1);
                min-width:${pct > 0 ? '4px' : '0'}
              "></div>
              <div style="
                width:${pctAndamento}%;
                background:var(--cor-andamento);
                transition:width 1s cubic-bezier(.4,0,.2,1);
              "></div>
            </div>
          </div>

          <!-- Legenda -->
          <div style="display:flex;gap:var(--esp-6);flex-wrap:wrap">
            ${_legenda('var(--cor-valido)',   'Concluídas',    dados.concluida)}
            ${_legenda('var(--cor-andamento)','Em andamento',  dados.em_andamento)}
            ${_legenda('var(--cinza-300)',    'Pendentes',     dados.pendente)}
            ${dados.com_invalido > 0 && State.podeSupervisor()
              ? _legenda('var(--cor-invalido)', 'Com inválidos', dados.com_invalido)
              : ''}
          </div>
        </div>
      </div>

      <!-- Ação rápida -->
      <div class="card">
        <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--esp-4)">
          <div>
            <div style="font-weight:600;color:var(--cinza-800);margin-bottom:var(--esp-1)">
              ${dados.pendente > 0 ? `${dados.pendente} inscrição(ões) aguardando validação` : 'Todas as inscrições foram processadas 🎉'}
            </div>
            <div style="font-size:var(--texto-sm);color:var(--cinza-400)">
              Clique em "Iniciar validação" para começar pela próxima da fila
            </div>
          </div>
          ${dados.pendente > 0 ? `
            <button class="btn btn-destaque btn-lg" onclick="navegarPara('validacao')">
              ${Icone.validar()}
              Iniciar validação
            </button>
          ` : ''}
          ${dados.com_invalido > 0 && State.podeSupervisor() ? `
            <button class="btn btn-secundario" onclick="navegarPara('invalidos')">
              ${Icone.revisao()}
              Ver documentos inválidos
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Botão de atualizar -->
      <div style="display:flex;justify-content:flex-end;margin-top:var(--esp-4)">
        <button class="btn btn-fantasma btn-sm" onclick="renderDashboard(document.getElementById('conteudo-principal'))">
          ${Icone.refresh()}
          Atualizar
        </button>
      </div>
    `;

  } catch (e) {
    container.innerHTML = `
      <div class="alerta alerta-erro">Erro ao carregar dashboard: ${e.message}</div>
    `;
  }
}

function _cardContador(titulo, valor, emoji, corTexto, corFundo) {
  return `
    <div class="card" style="border-top:3px solid ${corTexto}">
      <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:var(--esp-3)">
        <div>
          <div style="font-size:var(--texto-xs);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--cinza-400);font-family:var(--fonte-mono);margin-bottom:var(--esp-2)">
            ${titulo}
          </div>
          <div style="font-size:var(--texto-3xl);font-weight:600;color:${corTexto};font-family:var(--fonte-display);line-height:1">
            ${valor}
          </div>
        </div>
        <div style="width:48px;height:48px;border-radius:var(--raio-lg);background:${corFundo};display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">
          ${emoji}
        </div>
      </div>
    </div>
  `;
}

function _legenda(cor, label, valor) {
  return `
    <div style="display:flex;align-items:center;gap:var(--esp-2)">
      <div style="width:12px;height:12px;border-radius:3px;background:${cor};flex-shrink:0"></div>
      <span style="font-size:var(--texto-sm);color:var(--cinza-500)">${label}</span>
      <span style="font-size:var(--texto-sm);font-weight:600;color:var(--cinza-700)">${valor}</span>
    </div>
  `;
}
