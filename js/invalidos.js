/**
 * invalidos.js — Lista de inscrições com documentos inválidos (supervisor/admin)
 */

async function renderInvalidos(container) {
  container.innerHTML = `
    <div class="pagina-titulo">
      <h1>Documentos Inválidos</h1>
      <p>Inscrições com ao menos um documento reprovado — disponíveis para revisão</p>
    </div>
    ${htmlCarregando('Buscando inscrições...')}
  `;

  try {
    const res = await Api.validacao.getComInvalido(State.formularioAtivo);
    if (!res) return;

    if (res.inscricoes.length === 0) {
      container.innerHTML = `
        <div class="pagina-titulo"><h1>Documentos Inválidos</h1></div>
        ${htmlVazio('Sem documentos inválidos', 'Nenhuma inscrição possui documentos reprovados no momento.', '✅')}
      `;
      return;
    }

    container.innerHTML = `
      <div class="pagina-titulo">
        <h1>Documentos Inválidos</h1>
        <p>${res.total} inscrição(ões) com documentos reprovados</p>
      </div>

      <div class="card">
        <div class="tabela-wrapper">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>CPF</th>
                <th>Formulário</th>
                <th>Docs inválidos</th>
                <th>Validado em</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${res.inscricoes.map(insc => `
                <tr onclick="abrirInscricaoRevisao(${insc.linhaReal})">
                  <td style="font-weight:500">${insc.nome || '—'}</td>
                  <td style="font-family:var(--fonte-mono);font-size:var(--texto-xs)">${_fmtCPF(insc.cpf)}</td>
                  <td style="font-size:var(--texto-sm)">${insc.formulario || '—'}</td>
                  <td>
                    ${insc.docsInvalidos.map(d =>
                      `<span class="badge badge-invalido" style="margin-right:4px">${d}</span>`
                    ).join('')}
                  </td>
                  <td style="font-size:var(--texto-sm);color:var(--cinza-400)">${formatarDataHora(insc.validadoEm)}</td>
                  <td>${badgeStatus(insc.status)}</td>
                  <td>
                    <button class="btn btn-secundario btn-sm" onclick="event.stopPropagation();abrirInscricaoRevisao(${insc.linhaReal})">
                      ${Icone.revisao()} Revisar
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${res.totalPaginas > 1 ? `
          <div class="paginacao">
            <button class="btn btn-fantasma btn-sm" ${res.pagina <= 1 ? 'disabled' : ''}
              onclick="carregarPaginaInvalidos(${res.pagina - 1})">
              ${Icone.anterior()}
            </button>
            <span class="paginacao__info">Página ${res.pagina} de ${res.totalPaginas}</span>
            <button class="btn btn-fantasma btn-sm" ${res.pagina >= res.totalPaginas ? 'disabled' : ''}
              onclick="carregarPaginaInvalidos(${res.pagina + 1})">
              ${Icone.proximo()}
            </button>
          </div>
        ` : ''}
      </div>
    `;

  } catch (e) {
    container.innerHTML = `<div class="alerta alerta-erro">Erro: ${e.message}</div>`;
  }
}

async function abrirInscricaoRevisao(linhaReal) {
  const container = document.getElementById('conteudo-principal');
  container.innerHTML = htmlCarregando('Carregando inscrição...');

  try {
    const res = await Api.validacao.getByLinha(linhaReal);
    if (!res || !res.inscricao) {
      Toast.erro('Não foi possível carregar esta inscrição.');
      renderInvalidos(container);
      return;
    }
    // Reutiliza a tela de validação
    _inscricaoAtual = res.inscricao;
    _renderTelaValidacao(container);
  } catch (e) {
    Toast.erro(e.message);
  }
}

async function carregarPaginaInvalidos(pagina) {
  // Recarrega a tela com nova página (implementação simples via re-render)
  renderInvalidos(document.getElementById('conteudo-principal'));
}

function _fmtCPF(cpf) {
  if (!cpf) return '—';
  const s = String(cpf).replace(/\D/g,'');
  if (s.length !== 11) return cpf;
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
}
