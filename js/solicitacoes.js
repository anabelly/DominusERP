console.log('Solicitações Dominus carregado - versão 20260916-ICON-FIX');

/* ========================================================= */
/* DOMINUS ERP - SOLICITAÇÕES INTERNAS                       */
/* ========================================================= */
/*
    MÓDULO DE SOLICITAÇÕES DE MATERIAIS

    OBJETIVO
    ---------------------------------------------------------
    Permitir que a Produção solicite materiais ao escritório sem
    precisar se deslocar até o setor Administrativo.

    FLUXO
    ---------------------------------------------------------
    1. O usuário logado abre a tela Solicitações.
    2. Informa Material, Quantidade e Finalidade.
    3. O sistema registra automaticamente:
       - número da solicitação;
       - data e hora;
       - ID do usuário;
       - login do solicitante.
    4. Administradores recebem uma notificação própria no canto
       superior direito, logo abaixo da notificação da Agenda.
    5. O Administrador pode marcar como ENTREGUE ou NEGAR.
    6. ENTREGUE registra automaticamente quem entregou e quando.
    7. NEGADO exige justificativa e registra quem negou e quando.
    8. Tudo permanece disponível no Histórico.
    9. Quem criou uma solicitação pode excluí-la enquanto ela
       ainda estiver Pendente.

    SEGURANÇA / PERMISSÕES
    ---------------------------------------------------------
    - A tela pode ser liberada para usuários do tipo Funcionário.
    - Somente Administradores podem Entregar ou Negar pedidos.
    - O próprio solicitante pode excluir apenas pedidos próprios ainda Pendentes.
    - No HISTÓRICO, o botão Excluir aparece somente para o login Master.
    - O Master pode excluir registros Pendentes, Entregues ou Negados.
    - O nome do solicitante/responsável nunca é digitado: vem da
      sessão do login atual.

    IMPORTANTE
    ---------------------------------------------------------
    Este módulo NÃO movimenta o Estoque automaticamente.
    Ele funciona como controle de pedidos internos. Assim não
    interfere em nenhuma funcionalidade que já existe no ERP.
*/


/* ========================================================= */
/* 01. ESTRUTURA E HELPERS                                   */
/* ========================================================= */

/* --------------------------------------------------------- */
/* garantirEstruturaSolicitacoes                             */
/* Garante compatibilidade com bancos criados antes do módulo. */
/* --------------------------------------------------------- */
function garantirEstruturaSolicitacoes(){

    if(!window.db){
        window.db = {};
    }

    if(!Array.isArray(window.db.solicitacoes)){
        window.db.solicitacoes = [];
    }

    if(!Number.isFinite(Number(window.db.ultimaSolicitacao))){
        window.db.ultimaSolicitacao = 0;
    }

    return window.db.solicitacoes;
}


/* --------------------------------------------------------- */
/* escaparHTMLSolicitacao                                    */
/* Evita que textos digitados sejam interpretados como HTML. */
/* --------------------------------------------------------- */
function escaparHTMLSolicitacao(valor){

    return String(valor ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}


/* --------------------------------------------------------- */
/* usuarioSolicitacaoAtual                                   */
/* Retorna o login atualmente autenticado no Dominus.        */
/* --------------------------------------------------------- */
function usuarioSolicitacaoAtual(){

    if(typeof window.usuarioAtualSistema === 'function'){
        return window.usuarioAtualSistema();
    }

    try{
        return JSON.parse(
            sessionStorage.getItem('dominus_usuario') || 'null'
        );
    }
    catch(e){
        console.error('Erro ao identificar usuário da solicitação:',e);
        return null;
    }
}


/* --------------------------------------------------------- */
/* usuarioSolicitacaoEhAdmin                                 */
/* Centraliza a verificação administrativa do módulo.        */
/* --------------------------------------------------------- */
function usuarioSolicitacaoEhAdmin(){

    if(typeof window.usuarioEhAdministrador === 'function'){
        return !!window.usuarioEhAdministrador();
    }

    const usuario = usuarioSolicitacaoAtual();

    return !!(
        usuario &&
        (usuario.master === true || usuario.tipo === 'administrador')
    );
}


/* --------------------------------------------------------- */
/* usuarioSolicitacaoEhMaster                                */
/* Retorna true SOMENTE para o login Master do Dominus.      */
/*                                                           */
/* IMPORTANTE:                                               */
/* - Administradores comuns podem atender solicitações;      */
/* - somente o Master pode excluir registros do HISTÓRICO.   */
/* --------------------------------------------------------- */
function usuarioSolicitacaoEhMaster(){

    const usuario = usuarioSolicitacaoAtual();

    return !!(
        usuario &&
        usuario.master === true
    );
}


/* --------------------------------------------------------- */
/* agoraISOsolicitacao                                       */
/* Data/hora completa usada nos registros e no histórico.    */
/* --------------------------------------------------------- */
function agoraISOsolicitacao(){
    return new Date().toISOString();
}


/* --------------------------------------------------------- */
/* formatarDataHoraSolicitacao                               */
/* Exibe datas no padrão brasileiro.                         */
/* --------------------------------------------------------- */
function formatarDataHoraSolicitacao(valor){

    if(!valor) return '-';

    const data = new Date(valor);

    if(Number.isNaN(data.getTime())) return '-';

    return data.toLocaleString('pt-BR',{
        day:'2-digit',
        month:'2-digit',
        year:'numeric',
        hour:'2-digit',
        minute:'2-digit'
    });
}


/* --------------------------------------------------------- */
/* gerarCodigoSolicitacao                                    */
/* Cria SOL-0001, SOL-0002, SOL-0003...                     */
/* --------------------------------------------------------- */
function gerarCodigoSolicitacao(){

    garantirEstruturaSolicitacoes();

    window.db.ultimaSolicitacao =
        Number(window.db.ultimaSolicitacao || 0) + 1;

    return (
        'SOL-' +
        String(window.db.ultimaSolicitacao).padStart(4,'0')
    );
}


/* --------------------------------------------------------- */
/* statusSolicitacaoHTML                                     */
/* Padroniza as etiquetas de status da tela.                 */
/* --------------------------------------------------------- */
function statusSolicitacaoHTML(status){

    const mapa = {
        Pendente:{
            fundo:'#fff7ed',
            cor:'#c2410c',
            borda:'#fed7aa',
            texto:'● Pendente'
        },
        Entregue:{
            fundo:'#ecfdf5',
            cor:'#047857',
            borda:'#a7f3d0',
            texto:'✓ Entregue'
        },
        Negado:{
            fundo:'#fef2f2',
            cor:'#b91c1c',
            borda:'#fecaca',
            texto:'✕ Negado'
        }
    };

    const cfg = mapa[status] || mapa.Pendente;

    return `
        <span style="
            display:inline-flex;
            align-items:center;
            padding:5px 9px;
            border-radius:999px;
            border:1px solid ${cfg.borda};
            background:${cfg.fundo};
            color:${cfg.cor};
            font-size:10px;
            font-weight:900;
            white-space:nowrap;
        ">
            ${cfg.texto}
        </span>
    `;
}


/* ========================================================= */
/* 02. RENDER PRINCIPAL                                      */
/* ========================================================= */

window.renderSolicitacoes = function(){

    garantirEstruturaSolicitacoes();

    const usuario = usuarioSolicitacaoAtual();
    const admin = usuarioSolicitacaoEhAdmin();
    const lista = window.db.solicitacoes;

    const pendentes = lista.filter(item => item.status === 'Pendente').length;
    const entregues = lista.filter(item => item.status === 'Entregue').length;
    const negadas = lista.filter(item => item.status === 'Negado').length;

    /*
        Administradores visualizam todos os pedidos pendentes.
        Funcionários visualizam em destaque somente os próprios.
    */
    const aguardando = lista
        .filter(item => {
            if(item.status !== 'Pendente') return false;
            if(admin) return true;
            return String(item.solicitanteId) === String(usuario?.id);
        })
        .sort((a,b) => String(b.dataSolicitacao).localeCompare(String(a.dataSolicitacao)));

    return `
        <style>
            .sol-grid-resumo{
                display:grid;
                grid-template-columns:repeat(3,minmax(0,1fr));
                gap:12px;
                margin:18px 0;
            }

            .sol-resumo-card{
                background:#fff;
                border:1px solid #e2e8f0;
                border-radius:15px;
                padding:15px 17px;
                box-shadow:0 5px 18px rgba(15,23,42,.05);
            }

            .sol-pendente-card{
                border:1px solid #e2e8f0;
                border-left:5px solid #f59e0b;
                border-radius:14px;
                padding:15px;
                background:#fff;
                margin-top:10px;
            }

            .sol-acoes{
                display:flex;
                gap:7px;
                flex-wrap:wrap;
                margin-top:12px;
            }

            .sol-btn-entregue,
            .sol-btn-negado{
                border:0;
                border-radius:9px;
                padding:9px 13px;
                color:#fff;
                font-size:11px;
                font-weight:900;
                cursor:pointer;
            }

            .sol-btn-entregue{ background:#059669; }
            .sol-btn-negado{ background:#dc2626; }

            .sol-tabela-wrap{
                width:100%;
                overflow-x:hidden;
                border:1px solid #e2e8f0;
                border-radius:13px;
            }

            /*
                HISTÓRICO RESPONSIVO
                -----------------------------------------------------
                A tabela ocupa somente a largura disponível da tela.
                Antes havia min-width:1050px, o que obrigava arrastar
                horizontalmente para alcançar o botão Excluir.
            */
            .sol-tabela{
                width:100%;
                border-collapse:collapse;
                table-layout:fixed;
                min-width:0;
            }

            .sol-tabela th,
            .sol-tabela td{
                white-space:normal;
                overflow-wrap:anywhere;
                word-break:normal;
            }

            .sol-tabela th:nth-child(1),
            .sol-tabela td:nth-child(1){ width:7%; }

            .sol-tabela th:nth-child(2),
            .sol-tabela td:nth-child(2){ width:12%; }

            .sol-tabela th:nth-child(3),
            .sol-tabela td:nth-child(3){ width:15%; }

            .sol-tabela th:nth-child(4),
            .sol-tabela td:nth-child(4){ width:6%; }

            .sol-tabela th:nth-child(5),
            .sol-tabela td:nth-child(5){ width:10%; }

            .sol-tabela th:nth-child(6),
            .sol-tabela td:nth-child(6){ width:9%; }

            .sol-tabela th:nth-child(7),
            .sol-tabela td:nth-child(7){ width:12%; }

            .sol-tabela th:nth-child(8),
            .sol-tabela td:nth-child(8){ width:11%; }

            .sol-tabela th:nth-child(9),
            .sol-tabela td:nth-child(9){ width:18%; }

            .sol-tabela td:nth-child(9) > div{
                flex-wrap:nowrap !important;
                align-items:center;
            }

            .sol-tabela td:nth-child(9) button{
                padding:6px 7px !important;
                font-size:9px !important;
                white-space:nowrap;
            }

            .sol-tabela th{
                text-align:left;
                padding:10px;
                font-size:9px;
                text-transform:uppercase;
                letter-spacing:.04em;
                color:#64748b;
                background:#f8fafc;
                border-bottom:1px solid #e2e8f0;
            }

            .sol-tabela td{
                padding:11px 10px;
                font-size:11px;
                color:#334155;
                border-bottom:1px solid #f1f5f9;
                vertical-align:middle;
            }

            @media(max-width:850px){
                .sol-grid-resumo{
                    grid-template-columns:1fr;
                }
            }
        </style>

        <div style="display:flex;flex-direction:column;gap:18px;">

            <!-- CABEÇALHO -->
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:15px;
                flex-wrap:wrap;
            ">
                <div>
                    <h1 style="margin:0;font-size:28px;">
                        📦 Solicitações
                    </h1>

                    <div style="margin-top:6px;color:#64748b;font-size:12px;">
                        Solicitação e acompanhamento de materiais internos
                    </div>
                </div>

                <button
                    type="button"
                    class="btn-action"
                    onclick="abrirNovaSolicitacao()"
                >
                    + Nova Solicitação
                </button>
            </div>

            <!-- USUÁRIO ATUAL -->
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                padding:11px 14px;
                border:1px solid #e2e8f0;
                border-radius:12px;
                background:#f8fafc;
            ">
                <div style="font-size:20px;">👤</div>
                <div>
                    <div style="font-size:9px;color:#94a3b8;font-weight:900;text-transform:uppercase;">
                        Login responsável
                    </div>
                    <div style="font-size:13px;color:#0f172a;font-weight:900;">
                        ${escaparHTMLSolicitacao(usuario?.usuario || '-')}
                    </div>
                </div>
            </div>

            <!-- RESUMO -->
            <div class="sol-grid-resumo">
                <div class="sol-resumo-card">
                    <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;">
                        Pendentes
                    </div>
                    <div style="font-size:27px;font-weight:950;color:#c2410c;margin-top:4px;">
                        ${admin ? pendentes : aguardando.length}
                    </div>
                </div>

                <div class="sol-resumo-card">
                    <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;">
                        Entregues
                    </div>
                    <div style="font-size:27px;font-weight:950;color:#047857;margin-top:4px;">
                        ${admin ? entregues : lista.filter(i => i.status === 'Entregue' && String(i.solicitanteId) === String(usuario?.id)).length}
                    </div>
                </div>

                <div class="sol-resumo-card">
                    <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;">
                        Negadas
                    </div>
                    <div style="font-size:27px;font-weight:950;color:#b91c1c;margin-top:4px;">
                        ${admin ? negadas : lista.filter(i => i.status === 'Negado' && String(i.solicitanteId) === String(usuario?.id)).length}
                    </div>
                </div>
            </div>

            <!-- PEDIDOS PENDENTES -->
            <div class="content-card">
                <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
                    <div>
                        <h2 style="margin:0;font-size:17px;color:#0f172a;">
                            ${admin ? 'Aguardando atendimento' : 'Minhas solicitações pendentes'}
                        </h2>
                        <div style="margin-top:4px;font-size:10px;color:#64748b;">
                            ${admin ? 'Pedidos que ainda precisam ser entregues ou negados.' : 'Pedidos que ainda aguardam resposta do Administrativo.'}
                        </div>
                    </div>
                </div>

                <div style="margin-top:12px;">
                    ${renderPendentesSolicitacoes(aguardando,admin)}
                </div>
            </div>

            <!-- HISTÓRICO -->
            <div class="content-card">
                <div style="display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap;">
                    <div>
                        <h2 style="margin:0;font-size:17px;color:#0f172a;">
                            Histórico de Solicitações
                        </h2>
                        <div style="margin-top:4px;font-size:10px;color:#64748b;">
                            Consulte pedidos pendentes, entregues e negados.
                        </div>
                    </div>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <input
                            id="sol-filtro-texto"
                            placeholder="Buscar material ou solicitante..."
                            oninput="filtrarHistoricoSolicitacoes()"
                            style="min-width:235px;"
                        >

                        <select
                            id="sol-filtro-status"
                            onchange="filtrarHistoricoSolicitacoes()"
                            style="min-width:145px;"
                        >
                            <option value="">Todos os status</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Entregue">Entregue</option>
                            <option value="Negado">Negado</option>
                        </select>
                    </div>
                </div>

                <div id="sol-historico-container" style="margin-top:14px;">
                    ${renderHistoricoSolicitacoes()}
                </div>
            </div>
        </div>
    `;
};


/* Registra a página no sistema modular do Dominus. */
if(typeof window.registerPage === 'function'){
    window.registerPage('solicitacoes',window.renderSolicitacoes);
}
else{
    window.pages = window.pages || {};
    window.pages.solicitacoes = window.renderSolicitacoes;
}


/* --------------------------------------------------------- */
/* usuarioPodeExcluirSolicitacao                            */
/* Permite exclusão somente pelo login que criou o pedido.  */
/* Para preservar o histórico de atendimento, solicitações  */
/* Entregues ou Negadas não podem mais ser excluídas.       */
/* --------------------------------------------------------- */
function usuarioPodeExcluirSolicitacao(item){

    if(!item || item.status !== 'Pendente') return false;

    const usuario = usuarioSolicitacaoAtual();

    if(!usuario) return false;

    return String(item.solicitanteId) === String(usuario.id);
}


/* ========================================================= */
/* 03. CARDS DE PENDENTES                                    */
/* ========================================================= */

function renderPendentesSolicitacoes(lista,admin){

    if(!lista.length){
        return `
            <div style="
                padding:28px 15px;
                text-align:center;
                border:1px dashed #cbd5e1;
                border-radius:12px;
                color:#64748b;
                font-size:11px;
            ">
                ✓ Nenhuma solicitação pendente no momento.
            </div>
        `;
    }

    return lista.map(item => `
        <div class="sol-pendente-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                <div>
                    <div style="font-size:10px;color:#94a3b8;font-weight:900;">
                        ${escaparHTMLSolicitacao(item.codigo || '-')}
                    </div>
                    <div style="font-size:16px;color:#0f172a;font-weight:950;margin-top:3px;">
                        ${escaparHTMLSolicitacao(item.material)}
                        <span style="color:#64748b;font-weight:800;"> · ${escaparHTMLSolicitacao(item.quantidade)}</span>
                    </div>
                    <div style="margin-top:5px;font-size:10px;color:#64748b;">
                        Solicitado por <strong>${escaparHTMLSolicitacao(item.solicitanteLogin || '-')}</strong>
                        · ${formatarDataHoraSolicitacao(item.dataSolicitacao)}
                    </div>
                </div>

                ${statusSolicitacaoHTML(item.status)}
            </div>

            <div style="
                margin-top:11px;
                padding:10px 12px;
                background:#f8fafc;
                border-radius:9px;
                color:#475569;
                font-size:11px;
                line-height:1.45;
            ">
                <strong>Finalidade:</strong>
                ${escaparHTMLSolicitacao(item.finalidade)}
            </div>

            ${admin ? `
                <div class="sol-acoes">
                    <button
                        type="button"
                        class="sol-btn-entregue"
                        onclick="marcarSolicitacaoEntregue('${escaparHTMLSolicitacao(item.id)}')"
                    >
                        ✓ Entregue
                    </button>

                    <button
                        type="button"
                        class="sol-btn-negado"
                        onclick="abrirNegarSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                    >
                        ✕ Negar
                    </button>

                    <button
                        type="button"
                        class="btn-action"
                        style="background:#475569;padding:9px 13px;font-size:11px;"
                        onclick="visualizarSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                    >
                        👁 Visualizar
                    </button>

                    ${usuarioPodeExcluirSolicitacao(item) ? `
                        <button
                            type="button"
                            class="btn-del"
                            style="padding:9px 13px;font-size:11px;"
                            onclick="excluirSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                        >
                            🗑 Excluir
                        </button>
                    ` : ''}
                </div>
            ` : `
                <div class="sol-acoes">
                    <button
                        type="button"
                        class="btn-action"
                        style="background:#475569;padding:9px 13px;font-size:11px;"
                        onclick="visualizarSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                    >
                        👁 Visualizar
                    </button>

                    ${usuarioPodeExcluirSolicitacao(item) ? `
                        <button
                            type="button"
                            class="btn-del"
                            style="padding:9px 13px;font-size:11px;"
                            onclick="excluirSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                        >
                            🗑 Excluir
                        </button>
                    ` : ''}
                </div>
            `}
        </div>
    `).join('');
}


/* ========================================================= */
/* 04. NOVA SOLICITAÇÃO                                      */
/* ========================================================= */

window.abrirNovaSolicitacao = function(){

    const usuario = usuarioSolicitacaoAtual();

    if(!usuario){
        alert('Não foi possível identificar o login atual.');
        return;
    }

    configModal({
        title:'📦 Nova Solicitação',
        size:'medium',
        confirmText:'Enviar Solicitação',
        body:`
            <div style="display:flex;flex-direction:column;gap:14px;">

                <div style="
                    padding:10px 12px;
                    border-radius:10px;
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                    font-size:11px;
                    color:#475569;
                ">
                    Solicitante:
                    <strong>${escaparHTMLSolicitacao(usuario.usuario)}</strong>
                    <br>
                    <span style="font-size:9px;color:#94a3b8;">
                        Este nome é preenchido automaticamente pelo login.
                    </span>
                </div>

                <div>
                    <label>Material *</label>
                    <input
                        id="sol-material"
                        placeholder="Ex.: Álcool"
                        maxlength="150"
                        autocomplete="off"
                    >
                </div>

                <div>
                    <label>Quantidade *</label>
                    <input
                        id="sol-quantidade"
                        placeholder="Ex.: 2 litros, 1 unidade, 3 rolos..."
                        maxlength="80"
                        autocomplete="off"
                    >
                </div>

                <div>
                    <label>Para que precisa? *</label>
                    <textarea
                        id="sol-finalidade"
                        rows="4"
                        maxlength="600"
                        placeholder="Ex.: Limpeza das chapas antes da aplicação"
                        style="resize:vertical;"
                    ></textarea>
                </div>
            </div>
        `,
        onConfirm:salvarNovaSolicitacao
    });
};


/* --------------------------------------------------------- */
/* salvarNovaSolicitacao                                     */
/* Grava o pedido e mantém o status inicial como Pendente.   */
/* --------------------------------------------------------- */
window.salvarNovaSolicitacao = async function(){

    garantirEstruturaSolicitacoes();

    const usuario = usuarioSolicitacaoAtual();
    const material = document.getElementById('sol-material')?.value.trim();
    const quantidade = document.getElementById('sol-quantidade')?.value.trim();
    const finalidade = document.getElementById('sol-finalidade')?.value.trim();

    if(!usuario){
        alert('Não foi possível identificar o login atual.');
        return;
    }

    if(!material || !quantidade || !finalidade){
        alert('Preencha Material, Quantidade e Para que precisa.');
        return;
    }

    const registro = {
        id:'sol-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
        codigo:gerarCodigoSolicitacao(),
        material,
        quantidade,
        finalidade,
        status:'Pendente',
        dataSolicitacao:agoraISOsolicitacao(),
        solicitanteId:usuario.id,
        solicitanteLogin:usuario.usuario,
        dataAtendimento:null,
        responsavelId:null,
        responsavelLogin:null,
        justificativaNegacao:''
    };

    window.db.solicitacoes.push(registro);

    try{
        await save();
    }
    catch(e){
        console.error('Erro ao salvar solicitação:',e);
        alert('Não foi possível salvar a solicitação.');
        return;
    }

    closeModal();

    /* Atualiza a página sem perder as demais informações do sistema. */
    await navigate('solicitacoes',false);

    /* Atualiza imediatamente a central caso o login seja Administrador. */
    atualizarNotificacaoSolicitacoes();
};


/* ========================================================= */
/* 05. EXCLUIR SOLICITAÇÃO                                   */
/* ========================================================= */
/*
    REGRA DE EXCLUSÃO
    ---------------------------------------------------------
    - Somente o login que criou a solicitação pode excluí-la.
    - A exclusão é permitida somente enquanto estiver Pendente.
    - Depois de Entregue ou Negada, o registro fica preservado
      no Histórico para manter a rastreabilidade do atendimento.
    - Ao excluir um pedido Pendente, a notificação administrativa
      é atualizada imediatamente.
*/
window.excluirSolicitacao = async function(id){

    garantirEstruturaSolicitacoes();

    const item = window.db.solicitacoes.find(
        solicitacao => String(solicitacao.id) === String(id)
    );

    if(!item){
        alert('Solicitação não encontrada.');
        return;
    }

    const ehMaster = usuarioSolicitacaoEhMaster();
    const podeExcluirPendenteProprio = usuarioPodeExcluirSolicitacao(item);

    /*
        REGRA DE EXCLUSÃO:

        1. Login Master:
           pode excluir qualquer solicitação, inclusive registros já
           Entregues ou Negados que aparecem no histórico.

        2. Demais logins:
           podem excluir SOMENTE uma solicitação própria enquanto ela
           ainda estiver Pendente. Isso mantém a função solicitada para
           quem acabou de criar um pedido errado.

        3. Nenhum outro login pode apagar histórico já atendido.
    */
    if(!ehMaster && !podeExcluirPendenteProprio){
        alert('Somente o login Master pode excluir registros do histórico.');
        return;
    }

    const textoStatus = item.status && item.status !== 'Pendente'
        ? `\nStatus atual: ${item.status}`
        : '';

    if(!confirm(
        `Excluir definitivamente a solicitação ${item.codigo || ''} - "${item.material}"?${textoStatus}\n\nEssa ação não poderá ser desfeita.`
    )){
        return;
    }

    try{
        window.db.solicitacoes = window.db.solicitacoes.filter(
            solicitacao => String(solicitacao.id) !== String(id)
        );

        await save();

        atualizarNotificacaoSolicitacoes();

        if(window.currentPage === 'solicitacoes'){
            await navigate('solicitacoes',false);
        }
    }
    catch(e){
        console.error('Erro ao excluir solicitação:',e);
        alert('Não foi possível excluir a solicitação.');
    }
};

/* ========================================================= */
/* 06. ENTREGAR                                              */
/* ========================================================= */

window.marcarSolicitacaoEntregue = async function(id){

    if(!usuarioSolicitacaoEhAdmin()){
        alert('Somente Administradores podem confirmar uma entrega.');
        return;
    }

    garantirEstruturaSolicitacoes();

    const item = window.db.solicitacoes.find(sol => String(sol.id) === String(id));

    if(!item){
        alert('Solicitação não encontrada.');
        return;
    }

    if(item.status !== 'Pendente'){
        alert('Esta solicitação já foi atendida.');
        return;
    }

    const confirmar = confirm(
        `Confirmar a entrega de "${item.material}" para ${item.solicitanteLogin}?`
    );

    if(!confirmar) return;

    const usuario = usuarioSolicitacaoAtual();

    item.status = 'Entregue';
    item.dataAtendimento = agoraISOsolicitacao();
    item.responsavelId = usuario?.id || null;
    item.responsavelLogin = usuario?.usuario || '-';
    item.justificativaNegacao = '';

    await save();

    atualizarNotificacaoSolicitacoes();

    if(window.currentPage === 'solicitacoes'){
        await navigate('solicitacoes',false);
    }
};


/* ========================================================= */
/* 07. NEGAR                                                 */
/* ========================================================= */

window.abrirNegarSolicitacao = function(id){

    if(!usuarioSolicitacaoEhAdmin()){
        alert('Somente Administradores podem negar uma solicitação.');
        return;
    }

    garantirEstruturaSolicitacoes();

    const item = window.db.solicitacoes.find(sol => String(sol.id) === String(id));

    if(!item || item.status !== 'Pendente'){
        alert('Solicitação pendente não encontrada.');
        return;
    }

    configModal({
        title:`✕ Negar ${escaparHTMLSolicitacao(item.codigo || 'Solicitação')}`,
        size:'medium',
        confirmText:'Confirmar Negativa',
        body:`
            <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="
                    padding:11px 12px;
                    background:#fef2f2;
                    border:1px solid #fecaca;
                    border-radius:10px;
                    color:#7f1d1d;
                    font-size:11px;
                ">
                    <strong>${escaparHTMLSolicitacao(item.material)}</strong>
                    · ${escaparHTMLSolicitacao(item.quantidade)}
                    <br>
                    Solicitado por ${escaparHTMLSolicitacao(item.solicitanteLogin)}
                </div>

                <div>
                    <label>Justificativa da negativa *</label>
                    <textarea
                        id="sol-justificativa-negacao"
                        rows="5"
                        maxlength="800"
                        placeholder="Informe por que o material foi negado..."
                        style="resize:vertical;"
                    ></textarea>
                </div>
            </div>
        `,
        onConfirm:async function(){
            await confirmarNegacaoSolicitacao(id);
        }
    });
};


/* --------------------------------------------------------- */
/* confirmarNegacaoSolicitacao                              */
/* --------------------------------------------------------- */
window.confirmarNegacaoSolicitacao = async function(id){

    if(!usuarioSolicitacaoEhAdmin()) return;

    const justificativa =
        document.getElementById('sol-justificativa-negacao')?.value.trim();

    if(!justificativa){
        alert('Informe a justificativa da negativa.');
        return;
    }

    const item = garantirEstruturaSolicitacoes()
        .find(sol => String(sol.id) === String(id));

    if(!item || item.status !== 'Pendente'){
        alert('Esta solicitação não está mais pendente.');
        closeModal();
        return;
    }

    const usuario = usuarioSolicitacaoAtual();

    item.status = 'Negado';
    item.dataAtendimento = agoraISOsolicitacao();
    item.responsavelId = usuario?.id || null;
    item.responsavelLogin = usuario?.usuario || '-';
    item.justificativaNegacao = justificativa;

    await save();

    closeModal();
    atualizarNotificacaoSolicitacoes();

    if(window.currentPage === 'solicitacoes'){
        await navigate('solicitacoes',false);
    }
};


/* ========================================================= */
/* 08. HISTÓRICO                                             */
/* ========================================================= */

function solicitacoesVisiveisNoHistorico(){

    garantirEstruturaSolicitacoes();

    const usuario = usuarioSolicitacaoAtual();

    /*
        Administrador consulta todo o histórico.
        Funcionário consulta apenas solicitações abertas pelo próprio login.
    */
    const lista = usuarioSolicitacaoEhAdmin()
        ? [...window.db.solicitacoes]
        : window.db.solicitacoes.filter(
            item => String(item.solicitanteId) === String(usuario?.id)
        );

    return lista.sort(
        (a,b) => String(b.dataSolicitacao).localeCompare(String(a.dataSolicitacao))
    );
}


function renderHistoricoSolicitacoes(listaForcada=null){

    const lista = Array.isArray(listaForcada)
        ? listaForcada
        : solicitacoesVisiveisNoHistorico();

    if(!lista.length){
        return `
            <div style="padding:28px;text-align:center;color:#64748b;font-size:11px;">
                Nenhuma solicitação encontrada.
            </div>
        `;
    }

    const linhas = lista.map(item => {

        const atendimento = item.dataAtendimento
            ? formatarDataHoraSolicitacao(item.dataAtendimento)
            : '-';

        return `
            <tr>
                <td><strong>${escaparHTMLSolicitacao(item.codigo || '-')}</strong></td>
                <td>${formatarDataHoraSolicitacao(item.dataSolicitacao)}</td>
                <td><strong>${escaparHTMLSolicitacao(item.material)}</strong></td>
                <td>${escaparHTMLSolicitacao(item.quantidade)}</td>
                <td>${escaparHTMLSolicitacao(item.solicitanteLogin || '-')}</td>
                <td>${statusSolicitacaoHTML(item.status)}</td>
                <td>${atendimento}</td>
                <td>${escaparHTMLSolicitacao(item.responsavelLogin || '-')}</td>
                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button
                            type="button"
                            class="btn-action"
                            style="padding:6px 9px;font-size:10px;background:#475569;"
                            onclick="visualizarSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                        >
                            Visualizar
                        </button>

                        ${usuarioSolicitacaoEhMaster() ? `
                            <button
                                type="button"
                                class="btn-del"
                                style="padding:6px 9px;font-size:10px;"
                                onclick="excluirSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                            >
                                Excluir
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="sol-tabela-wrap">
            <table class="sol-tabela">
                <thead>
                    <tr>
                        <th>Nº</th>
                        <th>Data solicitação</th>
                        <th>Material</th>
                        <th>Qtd.</th>
                        <th>Solicitante</th>
                        <th>Status</th>
                        <th>Data atendimento</th>
                        <th>Responsável</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `;
}


/* --------------------------------------------------------- */
/* filtrarHistoricoSolicitacoes                             */
/* --------------------------------------------------------- */
window.filtrarHistoricoSolicitacoes = function(){

    const texto = String(
        document.getElementById('sol-filtro-texto')?.value || ''
    ).trim().toLowerCase();

    const status =
        document.getElementById('sol-filtro-status')?.value || '';

    const filtrada = solicitacoesVisiveisNoHistorico().filter(item => {

        const alvo = [
            item.codigo,
            item.material,
            item.quantidade,
            item.solicitanteLogin,
            item.responsavelLogin,
            item.finalidade,
            item.justificativaNegacao
        ].join(' ').toLowerCase();

        const bateTexto = !texto || alvo.includes(texto);
        const bateStatus = !status || item.status === status;

        return bateTexto && bateStatus;
    });

    const container = document.getElementById('sol-historico-container');

    if(container){
        container.innerHTML = renderHistoricoSolicitacoes(filtrada);
    }
};


/* ========================================================= */
/* 09. VISUALIZAÇÃO COMPLETA                                 */
/* ========================================================= */

window.visualizarSolicitacao = function(id){

    const item = garantirEstruturaSolicitacoes()
        .find(sol => String(sol.id) === String(id));

    if(!item){
        alert('Solicitação não encontrada.');
        return;
    }

    const admin = usuarioSolicitacaoEhAdmin();
    const usuario = usuarioSolicitacaoAtual();

    /* Impede um funcionário de abrir por ID pedido de outro login. */
    if(
        !admin &&
        String(item.solicitanteId) !== String(usuario?.id)
    ){
        alert('Você não possui acesso a esta solicitação.');
        return;
    }

    const negativa = item.status === 'Negado'
        ? `
            <div style="
                margin-top:14px;
                padding:12px;
                background:#fef2f2;
                border:1px solid #fecaca;
                border-radius:10px;
            ">
                <div style="font-size:9px;color:#b91c1c;font-weight:900;text-transform:uppercase;">
                    Justificativa da negativa
                </div>
                <div style="margin-top:5px;color:#7f1d1d;font-size:12px;line-height:1.5;white-space:pre-wrap;">
                    ${escaparHTMLSolicitacao(item.justificativaNegacao || '-')}
                </div>
            </div>
        `
        : '';

    configModal({
        title:`📦 ${escaparHTMLSolicitacao(item.codigo || 'Solicitação')}`,
        size:'medium',
        confirmText:'Fechar',
        body:`
            <div style="display:flex;flex-direction:column;gap:13px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                    <div>
                        <div style="font-size:18px;font-weight:950;color:#0f172a;">
                            ${escaparHTMLSolicitacao(item.material)}
                        </div>
                        <div style="font-size:11px;color:#64748b;margin-top:3px;">
                            Quantidade: <strong>${escaparHTMLSolicitacao(item.quantidade)}</strong>
                        </div>
                    </div>
                    ${statusSolicitacaoHTML(item.status)}
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div style="padding:10px;background:#f8fafc;border-radius:9px;">
                        <div style="font-size:8px;color:#94a3b8;font-weight:900;text-transform:uppercase;">Solicitado por</div>
                        <div style="margin-top:3px;font-size:11px;font-weight:900;">${escaparHTMLSolicitacao(item.solicitanteLogin || '-')}</div>
                    </div>
                    <div style="padding:10px;background:#f8fafc;border-radius:9px;">
                        <div style="font-size:8px;color:#94a3b8;font-weight:900;text-transform:uppercase;">Data da solicitação</div>
                        <div style="margin-top:3px;font-size:11px;font-weight:900;">${formatarDataHoraSolicitacao(item.dataSolicitacao)}</div>
                    </div>
                    <div style="padding:10px;background:#f8fafc;border-radius:9px;">
                        <div style="font-size:8px;color:#94a3b8;font-weight:900;text-transform:uppercase;">Atendido por</div>
                        <div style="margin-top:3px;font-size:11px;font-weight:900;">${escaparHTMLSolicitacao(item.responsavelLogin || '-')}</div>
                    </div>
                    <div style="padding:10px;background:#f8fafc;border-radius:9px;">
                        <div style="font-size:8px;color:#94a3b8;font-weight:900;text-transform:uppercase;">Data do atendimento</div>
                        <div style="margin-top:3px;font-size:11px;font-weight:900;">${formatarDataHoraSolicitacao(item.dataAtendimento)}</div>
                    </div>
                </div>

                <div style="padding:12px;background:#f8fafc;border-radius:10px;">
                    <div style="font-size:9px;color:#94a3b8;font-weight:900;text-transform:uppercase;">
                        Para que precisa?
                    </div>
                    <div style="margin-top:5px;font-size:12px;color:#334155;line-height:1.5;white-space:pre-wrap;">
                        ${escaparHTMLSolicitacao(item.finalidade)}
                    </div>
                </div>

                ${negativa}
            </div>
        `,
        onConfirm:function(){
            closeModal();
        }
    });
};


/* ========================================================= */
/* 09. NOTIFICAÇÃO ADMINISTRATIVA                            */
/* ========================================================= */
/*
    A notificação de Solicitações é independente da Agenda.

    REGRAS:
    - só aparece para Administradores;
    - só aparece se houver pelo menos uma solicitação Pendente;
    - fica logo abaixo do botão de notificação da Agenda;
    - o badge mostra quantos pedidos estão pendentes;
    - abrir ou fechar a notificação NÃO remove o aviso;
    - permanece na frente em qualquer tela enquanto houver pendência;
    - desaparece somente quando não houver mais pedidos Pendentes
      (Entregue, Negado ou excluído pelo próprio solicitante).
*/

/*
    Guarda a última lista de pendências conhecida neste computador.
    Quando chegar uma solicitação NOVA, o painel abre automaticamente
    para o Administrativo ver o resumo, mesmo estando em outra tela.
*/
window._assinaturaPendenciasSolicitacoes =
    window._assinaturaPendenciasSolicitacoes || '';


function montarNotificacaoSolicitacoes(){

    let root = document.getElementById('solicitacoes-notificacao-root');

    if(root) return root;

    root = document.createElement('div');
    root.id = 'solicitacoes-notificacao-root';

    /*
        Estilos críticos ficam também INLINE para impedir que qualquer
        CSS de outra tela esconda ou reposicione a central.
    */
    root.style.position = 'fixed';
    root.style.right = '20px';
    root.style.top = '76px';
    root.style.zIndex = '90001';
    root.style.display = 'none';

    root.innerHTML = `
        <style>
            #solicitacoes-notificacao-root{
                position:fixed;
                right:20px;
                top:76px; /* fallback: logo abaixo do sino da Agenda */
                z-index:90001;
                font-family:'Segoe UI',sans-serif;
                display:none;
            }

            #solicitacoes-notificacao-botao{
                width:48px;
                height:48px;
                border:none;
                border-radius:15px;
                background:#111827;
                color:#fff;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:20px;
                cursor:pointer;
                transition:transform .15s ease, box-shadow .15s ease;
                box-shadow:0 12px 30px rgba(15,23,42,.24);
                position:relative;
            }

            #solicitacoes-notificacao-botao:hover{
                transform:translateY(-1px);
                box-shadow:0 16px 34px rgba(15,23,42,.28);
            }

            #solicitacoes-notificacao-badge{
                position:absolute;
                top:-6px;
                right:-6px;
                min-width:22px;
                height:22px;
                padding:0 5px;
                border-radius:999px;
                background:#ff1f2d;
                color:#fff;
                border:2px solid #fff;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:10px;
                font-weight:900;
            }

            #solicitacoes-notificacao-painel{
                position:absolute;
                top:58px;
                right:0;
                width:min(410px,calc(100vw - 30px));
                max-height:70vh;
                overflow:auto;
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:18px;
                box-shadow:0 24px 60px rgba(15,23,42,.25);
                display:none;
            }

            #solicitacoes-notificacao-painel.aberto{
                display:block;
            }

            .sol-notif-card{
                margin:10px;
                padding:12px;
                border:1px solid #e5e7eb;
                border-left:5px solid #f59e0b;
                border-radius:12px;
                background:#fff7ed;
            }
        </style>

        <button
            id="solicitacoes-notificacao-botao"
            type="button"
            title="Solicitações pendentes"
            onclick="toggleNotificacaoSolicitacoes(event)"
        >
            <span aria-hidden="true" style="font-size:21px;line-height:1;">📋</span>
            <span id="solicitacoes-notificacao-badge">0</span>
        </button>

        <div id="solicitacoes-notificacao-painel"></div>
    `;

    document.body.appendChild(root);

    /*
        Posiciona o botão exatamente abaixo do sino real da Agenda.
        Assim, se a posição do sino mudar no CSS da Agenda, a central
        de Solicitações acompanha automaticamente.
    */
    posicionarNotificacaoSolicitacoesAbaixoAgenda();

    return root;
}




/* --------------------------------------------------------- */
/* posicionarNotificacaoSolicitacoesAbaixoAgenda             */
/* Mantém o ícone de Solicitações logo abaixo do sino.       */
/* --------------------------------------------------------- */
function posicionarNotificacaoSolicitacoesAbaixoAgenda(){

    const root = document.getElementById('solicitacoes-notificacao-root');
    if(!root) return;

    /*
        IMPORTANTE:
        NÃO usamos o agenda.js e NÃO colocamos o botão dentro do sino.
        Apenas usamos uma posição fixa própria imediatamente abaixo da
        posição visual padrão do sino (top:18px / altura:48px).

        Isso torna os dois componentes 100% independentes.
    */
    root.style.position = 'fixed';
    root.style.right = '20px';
    root.style.top = '76px';
    root.style.zIndex = '90001';
}

/* --------------------------------------------------------- */
/* toggleNotificacaoSolicitacoes                            */
/* --------------------------------------------------------- */
window.toggleNotificacaoSolicitacoes = function(event){

    if(event) event.stopPropagation();

    const painel = document.getElementById('solicitacoes-notificacao-painel');

    if(!painel) return;

    painel.classList.toggle('aberto');
};


/* --------------------------------------------------------- */
/* fecharNotificacaoSolicitacoes                            */
/* --------------------------------------------------------- */
window.fecharNotificacaoSolicitacoes = function(){

    document
        .getElementById('solicitacoes-notificacao-painel')
        ?.classList.remove('aberto');
};


/* --------------------------------------------------------- */
/* atualizarNotificacaoSolicitacoes                         */
/* Sincroniza botão, badge e conteúdo do painel.             */
/* --------------------------------------------------------- */
window.atualizarNotificacaoSolicitacoes = function(){

    const root = montarNotificacaoSolicitacoes();

    posicionarNotificacaoSolicitacoesAbaixoAgenda();
    garantirEstruturaSolicitacoes();

    /* Funcionários nunca recebem a central administrativa. */
    if(!usuarioSolicitacaoEhAdmin()){
        root.style.display = 'none';
        fecharNotificacaoSolicitacoes();
        return;
    }

    const pendentes = window.db.solicitacoes
        .filter(item => item.status === 'Pendente')
        .sort((a,b) => String(b.dataSolicitacao).localeCompare(String(a.dataSolicitacao)));

    /* Sem pedido novo/pendente, o ícone inteiro desaparece. */
    if(!pendentes.length){
        root.style.display = 'none';
        fecharNotificacaoSolicitacoes();
        window._assinaturaPendenciasSolicitacoes = '';
        return;
    }

    /*
        IMPORTANTE: o CSS inicial do próprio componente possui
        #solicitacoes-notificacao-root { display:none; }.
        Portanto, usar display='' NÃO vence essa regra e o botão
        continuava invisível mesmo com solicitações pendentes.
        Quando houver pendência, forçamos explicitamente display:block.
    */
    root.style.display = 'block';

    const badge = document.getElementById('solicitacoes-notificacao-badge');
    const painel = document.getElementById('solicitacoes-notificacao-painel');

    if(badge){
        badge.innerText = pendentes.length > 99 ? '99+' : String(pendentes.length);
    }

    if(painel){
        painel.innerHTML = `
            <div style="
                position:sticky;
                top:0;
                z-index:2;
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                padding:14px 15px;
                background:#fff;
                border-bottom:1px solid #e5e7eb;
            ">
                <div>
                    <div style="font-size:13px;font-weight:950;color:#0f172a;">
                        Solicitações
                    </div>
                    <div style="margin-top:2px;font-size:9px;color:#64748b;">
                        Materiais aguardando atendimento · ${pendentes.length} pendente(s)
                    </div>
                </div>
                <button
                    type="button"
                    onclick="fecharNotificacaoSolicitacoes()"
                    style="border:0;background:#f1f5f9;border-radius:8px;width:28px;height:28px;cursor:pointer;"
                >✕</button>
            </div>

            ${pendentes.map(item => `
                <div class="sol-notif-card">
                    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
                        <div>
                            <div style="font-size:9px;color:#c2410c;font-weight:950;text-transform:uppercase;letter-spacing:.4px;">
                                ${escaparHTMLSolicitacao(item.codigo || '-')} · SOLICITAÇÃO
                            </div>
                            <div style="margin-top:2px;font-size:13px;font-weight:950;color:#0f172a;">
                                ${escaparHTMLSolicitacao(item.material)}
                                · ${escaparHTMLSolicitacao(item.quantidade)}
                            </div>
                        </div>
                        <span style="font-size:9px;color:#c2410c;font-weight:900;">PENDENTE</span>
                    </div>

                    <div style="margin-top:8px;padding:8px 10px;border:1px solid #fed7aa;border-radius:10px;background:#fff;">
                        <div style="font-size:8px;color:#c2410c;font-weight:950;text-transform:uppercase;letter-spacing:.4px;">Solicitado por</div>
                        <div style="margin-top:2px;font-size:12px;font-weight:950;color:#111827;">${escaparHTMLSolicitacao(item.solicitanteLogin || '-')}</div>
                        <div style="margin-top:3px;font-size:9px;color:#64748b;">${formatarDataHoraSolicitacao(item.dataSolicitacao)}</div>
                    </div>

                    <div style="margin-top:8px;font-size:10px;color:#475569;line-height:1.4;">
                        ${escaparHTMLSolicitacao(item.finalidade)}
                    </div>

                    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
                        <button
                            type="button"
                            onclick="marcarSolicitacaoEntregue('${escaparHTMLSolicitacao(item.id)}')"
                            style="border:0;border-radius:8px;background:#059669;color:#fff;padding:7px 9px;font-size:9px;font-weight:900;cursor:pointer;"
                        >
                            ✓ Entregue
                        </button>

                        <button
                            type="button"
                            onclick="abrirNegarSolicitacao('${escaparHTMLSolicitacao(item.id)}')"
                            style="border:0;border-radius:8px;background:#dc2626;color:#fff;padding:7px 9px;font-size:9px;font-weight:900;cursor:pointer;"
                        >
                            ✕ Negar
                        </button>

                        <button
                            type="button"
                            onclick="fecharNotificacaoSolicitacoes();navigate('solicitacoes')"
                            style="border:0;border-radius:8px;background:#475569;color:#fff;padding:7px 9px;font-size:9px;font-weight:900;cursor:pointer;"
                        >
                            Abrir tela
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    /*
        Se chegou uma NOVA solicitação, abre o resumo automaticamente.
        Fechar o painel não dá baixa e não remove o ícone.
        O ícone continua visível até todas as pendências receberem
        Entregue/Negado ou serem excluídas conforme as permissões.
    */
    const assinaturaAtual = pendentes
        .map(item => String(item.id))
        .sort()
        .join('|');

    if(
        window._assinaturaPendenciasSolicitacoes &&
        assinaturaAtual !== window._assinaturaPendenciasSolicitacoes
    ){
        painel?.classList.add('aberto');
    }

    window._assinaturaPendenciasSolicitacoes = assinaturaAtual;
};


/* ========================================================= */
/* 11. INICIALIZAÇÃO E SINCRONIZAÇÃO ENTRE COMPUTADORES      */
/* ========================================================= */
/*
    IMPORTANTE:

    A Produção e o Administrativo podem estar usando computadores
    diferentes. Por isso NÃO basta consultar apenas window.db, pois
    esse objeto representa a última cópia do banco carregada neste PC.

    A função abaixo consulta GET /db diretamente no servidor e atualiza
    SOMENTE window.db.solicitacoes. Dessa forma:

    - Alexandre pode criar uma solicitação no computador da Produção;
    - o computador Administrativo percebe a nova solicitação sozinho;
    - o ícone 📋 aparece mesmo que o Admin esteja no Dashboard, Agenda,
      Financeiro, Orçamentos ou qualquer outra tela;
    - não chamamos loadDB() completo a cada intervalo, evitando trocar
      todos os demais dados da tela enquanto alguém está trabalhando;
    - esta sincronização NÃO salva nada e NÃO altera outros módulos.
*/

window._sincronizandoSolicitacoesServidor = false;


/* --------------------------------------------------------- */
/* sincronizarSolicitacoesServidor                           */
/* Busca somente a lista atual de solicitações no banco.     */
/* --------------------------------------------------------- */
window.sincronizarSolicitacoesServidor = async function(){

    /*
        A central flutuante é administrativa. Se este login não for
        Administrador, não precisamos ficar consultando o servidor para
        montar a notificação. A própria tela de Solicitações continua
        funcionando normalmente para o funcionário autorizado.
    */
    if(!usuarioSolicitacaoEhAdmin()){
        atualizarNotificacaoSolicitacoes();
        return;
    }

    /* Evita duas consultas simultâneas caso uma resposta demore. */
    if(window._sincronizandoSolicitacoesServidor) return;

    window._sincronizandoSolicitacoesServidor = true;

    try{

        /*
            O parâmetro _ evita que navegador/proxy reutilize uma resposta
            antiga. cache:'no-store' reforça que queremos o banco atual.
        */
        const resposta = await fetch(
            `${API_URL}/db?_=${Date.now()}`,
            { cache:'no-store' }
        );

        if(!resposta.ok){
            throw new Error(`Servidor respondeu ${resposta.status}`);
        }

        const dadosServidor = await resposta.json();

        /* Garante que o objeto local existe sem tocar nos outros módulos. */
        if(!window.db || typeof window.db !== 'object'){
            window.db = {};
        }

        window.db.solicitacoes = Array.isArray(dadosServidor?.solicitacoes)
            ? dadosServidor.solicitacoes
            : [];

        /*
            Depois de receber a lista atual, atualizamos imediatamente
            botão, badge e resumo. Isso funciona em QUALQUER página.
        */
        atualizarNotificacaoSolicitacoes();
    }
    catch(e){
        /*
            Se o servidor estiver momentaneamente indisponível, não
            derrubamos o ERP. Mantemos a última informação local conhecida.
        */
        console.error('Erro ao sincronizar Solicitações com o servidor:',e);

        try{
            atualizarNotificacaoSolicitacoes();
        }
        catch(erroVisual){
            console.error('Erro ao atualizar a central de Solicitações:',erroVisual);
        }
    }
    finally{
        window._sincronizandoSolicitacoesServidor = false;
    }
};


/*
    Inicialização:
    cria o elemento flutuante no BODY e já consulta o servidor.
*/
setTimeout(function(){
    montarNotificacaoSolicitacoes();
    sincronizarSolicitacoesServidor();
},500);


/* Mantém o botão alinhado abaixo do sininho ao redimensionar. */
window.addEventListener('resize',function(){
    posicionarNotificacaoSolicitacoesAbaixoAgenda();
});


/*
    Consulta a cada 4 segundos.
    Assim um pedido feito no pavilhão aparece no Administrativo sem que
    seja necessário trocar de tela ou atualizar manualmente o Dominus.
*/
setInterval(function(){
    sincronizarSolicitacoesServidor();
},4000);


/* Fecha o painel ao clicar fora dele. */
document.addEventListener('click',function(event){

    const root = document.getElementById('solicitacoes-notificacao-root');

    if(root && !root.contains(event.target)){
        fecharNotificacaoSolicitacoes();
    }
});
