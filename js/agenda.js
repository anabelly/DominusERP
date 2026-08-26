/* ========================================================= */
/* DOMINUS ERP - AGENDA.JS                                   */
/* ========================================================= */
/*
    AGENDA + CENTRAL GLOBAL DE NOTIFICAÇÕES

    Este arquivo controla toda a tela de Agenda e também
    a central de notificações exibida nas demais telas do ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Manter estado e prioridades da Agenda
    2. Normalizar os dados da Agenda no banco
    3. Disponibilizar funções auxiliares
    4. Instalar os estilos próprios da Agenda
    5. Renderizar KPIs, calendário e tabela
    6. Controlar filtros e navegação mensal
    7. Cadastrar e editar compromissos
    8. Visualizar compromissos
    9. Marcar como realizado, reagendar e excluir
    10. Montar a central global de notificações
    11. Gerar avisos da Agenda e do Financeiro
    12. Registrar a página no sistema
    13. Exibir alerta obrigatório para compromissos de Alta Prioridade
    14. Restringir reagendamento de Alta Prioridade ao mesmo dia
    15. Inicializar e atualizar as notificações periodicamente

    ALERTA DE ALTA PRIORIDADE:
    Quando chega o horário de um compromisso de Alta Prioridade
    DO LOGIN ATUAL, é exibida uma notificação grande sobre qualquer
    tela do ERP.

    A notificação é obrigatória:
    - não possui botão X;
    - não fecha clicando fora;
    - permanece aberta até uma ação válida.

    As únicas ações principais são:
    - Concluir;
    - Reagendar.

    REAGENDAMENTO:
    Compromissos de Alta Prioridade podem alterar somente o horário.
    A data permanece obrigatoriamente no mesmo dia.
    Se o compromisso estiver atrasado de um dia anterior,
    o único reagendamento permitido é para hoje.

    PRIVACIDADE:
    O alerta aparece somente para o login proprietário do compromisso.
*/


/* ===================================================== */
/* DOMINUS ERP - AGENDA + CENTRAL DE NOTIFICAÇÕES       */
/* ===================================================== */

(function(){

    'use strict';

    /* ========================================================= */
    /* 01. ESTADO GLOBAL DA AGENDA                               */
    /* ========================================================= */
    /*
        Define:
        - cores e nomes das prioridades
        - mês atualmente exibido
        - filtros ativos
        - estado do painel de notificações
        - assinatura das últimas notificações

        Esses valores ficam disponíveis durante toda a sessão.
    */

    const PRIORIDADES = {
        baixa: {
            nome: 'Baixa',
            cor: '#2563eb',
            fundo: '#eff6ff',
            borda: '#bfdbfe'
        },
        media: {
            nome: 'Média',
            cor: '#d97706',
            fundo: '#fff7ed',
            borda: '#fed7aa'
        },
        alta: {
            nome: 'Alta',
            cor: '#dc2626',
            fundo: '#fef2f2',
            borda: '#fecaca'
        }
    };

    window.agendaMesVisual = window.agendaMesVisual || {
        ano: new Date().getFullYear(),
        mes: new Date().getMonth()
    };

    window.agendaFiltros = window.agendaFiltros || {
        texto: '',
        status: '',
        prioridade: ''
    };

    window.agendaPainelAberto = false;
    window.agendaUltimaAssinaturaNotificacoes = '';

    /*
        Controle do alerta obrigatório de Alta Prioridade.
        Um alerta é exibido por vez.
    */
    window.agendaAltaPrioridadeAbertaId =
        window.agendaAltaPrioridadeAbertaId
        ||
        null;

    /* ========================================================= */
    /* 02. NORMALIZAÇÃO DOS DADOS DA AGENDA                     */
    /* ========================================================= */
    /*
        Garante que window.db possua toda a estrutura esperada
        pela Agenda e pela central de notificações.

        Também normaliza compromissos antigos para evitar
        erros quando novos campos são adicionados.
    */

    /* ===================================================== */
    /* 02.1 GARANTIR E NORMALIZAR ESTRUTURA DO DB           */
    /* ===================================================== */
    /*
        Garante agenda[], agendaConfig e financeiroOk.
        Depois normaliza cada compromisso existente.
    */

    function garantirAgendaDB(){

        if(!window.db || typeof window.db !== 'object'){
            window.db = {};
        }

        if(!Array.isArray(window.db.agenda)){
            window.db.agenda = [];
        }

        if(
            !window.db.agendaConfig
            || typeof window.db.agendaConfig !== 'object'
            || Array.isArray(window.db.agendaConfig)
        ){
            window.db.agendaConfig = {};
        }

        if(
            !window.db.agendaConfig.financeiroOk
            || typeof window.db.agendaConfig.financeiroOk !== 'object'
            || Array.isArray(window.db.agendaConfig.financeiroOk)
        ){
            window.db.agendaConfig.financeiroOk = {};
        }

        window.db.agenda = window.db.agenda.map(item=>{

            /*
                Compromissos antigos pertencem ao administrador
                master, que era o único login existente.
            */

            const usuarioId =
                String(
                    item?.usuarioId
                    ||
                    'master-admin'
                );

            const loginResponsavel =
                loginPorUsuarioIdAgenda(
                    usuarioId,
                    item?.responsavel
                );

            return {

                id:
                    String(
                        item?.id
                        ||
                        gerarIdAgenda()
                    ),

                usuarioId,

                titulo:
                    String(
                        item?.titulo || ''
                    ).trim(),

                data:
                    String(
                        item?.data || ''
                    ),

                hora:
                    String(
                        item?.hora || ''
                    ),

                horaFim:
                    String(
                        item?.horaFim || ''
                    ),

                local:
                    String(
                        item?.local || ''
                    ),

                /*
                    O responsável não é mais digitado manualmente.
                    Ele sempre corresponde ao login proprietário.
                */

                responsavel:
                    loginResponsavel,

                prioridade:
                    normalizarPrioridade(
                        item?.prioridade
                    ),

                descricao:
                    String(
                        item?.descricao || ''
                    ),

                status:
                    normalizarStatusAgenda(
                        item?.status
                    ),

                criadoEm:
                    item?.criadoEm
                    ||
                    new Date()
                        .toISOString(),

                atualizadoEm:
                    item?.atualizadoEm
                    ||
                    null,

                realizadoEm:
                    item?.realizadoEm
                    ||
                    null,

                historicoReagendamentos:
                    Array.isArray(
                        item?.historicoReagendamentos
                    )
                    ?
                    item.historicoReagendamentos
                    :
                    []
            };
        });
    }

    /* ===================================================== */
    /* 02.1.1 USUÁRIO ATUAL DA AGENDA                       */
    /* ===================================================== */

    function usuarioAtualAgenda(){

        if(
            typeof window.usuarioAtualSistema ===
                'function'
        ){

            return window
                .usuarioAtualSistema();
        }

        return null;
    }


    /* ===================================================== */
    /* 02.1.2 LOGIN PELO ID DO USUÁRIO                      */
    /* ===================================================== */

    function loginPorUsuarioIdAgenda(
        usuarioId,
        fallback = ''
    ){

        if(
            String(
                usuarioId
            )
            ===
            'master-admin'
        ){

            return 'admin';
        }

        const usuario =
            (window.db?.usuariosSistema || [])
                .find(
                    item =>
                        String(
                            item.id || ''
                        )
                        ===
                        String(
                            usuarioId || ''
                        )
                );

        return (
            usuario?.usuario
            ||
            fallback
            ||
            'Usuário'
        );
    }


    /* ===================================================== */
    /* 02.1.3 VERIFICAR PROPRIETÁRIO                        */
    /* ===================================================== */

    function compromissoPertenceUsuarioAtualAgenda(
        item
    ){

        const usuario =
            usuarioAtualAgenda();

        if(
            !usuario
            ||
            !item
        ){

            return false;
        }

        return (
            String(
                item.usuarioId || ''
            )
            ===
            String(
                usuario.id || ''
            )
        );
    }


    /* ===================================================== */
    /* 02.1.4 AGENDA DO LOGIN ATUAL                          */
    /* ===================================================== */
    /*
        Cada login possui uma agenda completamente particular.

        Nem Administradores veem compromissos de outros logins.
        O Administrador possui acesso à tela Agenda, mas vê
        somente os compromissos do próprio login.
    */

    function agendaDoUsuarioAtual(){

        garantirAgendaDB();

        return window.db.agenda
            .filter(
                compromissoPertenceUsuarioAtualAgenda
            );
    }


    /* ===================================================== */
    /* 02.1.5 PODE VER AGENDA                               */
    /* ===================================================== */

    function usuarioAtualPodeVerAgenda(){

        return (
            typeof window.usuarioPodeAcessarPagina !==
                'function'
            ||
            window.usuarioPodeAcessarPagina(
                'agenda'
            )
        );
    }


    /* ===================================================== */
    /* 02.1.6 PODE VER FINANCEIRO                           */
    /* ===================================================== */

    function usuarioAtualPodeVerFinanceiro(){

        return (
            typeof window.usuarioPodeAcessarPagina !==
                'function'
            ||
            window.usuarioPodeAcessarPagina(
                'financeiro'
            )
        );
    }


    /* ===================================================== */
    /* 02.2 NORMALIZAR PRIORIDADE                            */
    /* ===================================================== */

    function normalizarPrioridade(valor){
        const v = String(valor || '').toLowerCase();
        if(v === 'baixa' || v === 'media' || v === 'alta'){
            return v;
        }
        return 'media';
    }

    /* ===================================================== */
    /* 02.3 NORMALIZAR STATUS                                */
    /* ===================================================== */

    function normalizarStatusAgenda(valor){
        const v = String(valor || '').toLowerCase();
        return v === 'realizado' ? 'realizado' : 'agendado';
    }

    /* ===================================================== */
    /* 02.4 GERAR ID DO COMPROMISSO                          */
    /* ===================================================== */

    function gerarIdAgenda(){
        return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }

    /* ========================================================= */
    /* 03. FUNÇÕES AUXILIARES / HELPERS                         */
    /* ========================================================= */
    /*
        Pequenas funções reutilizadas em várias partes da Agenda:
        - proteção de HTML
        - datas
        - moeda
        - nomes dos meses
        - prioridade
        - ordenação
        - busca de compromissos
        - horários
    */

    /* ===================================================== */
    /* 03.1 PROTEGER TEXTO INSERIDO NO HTML                  */
    /* ===================================================== */
    /*
        Converte caracteres especiais antes de exibir
        conteúdos digitados pelo usuário.
    */

    function escapeHTML(valor){
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* ===================================================== */
    /* 03.2 DATA LOCAL NO FORMATO YYYY-MM-DD                 */
    /* ===================================================== */

    function dataLocalISO(data = new Date()){
        return [
            data.getFullYear(),
            String(data.getMonth() + 1).padStart(2, '0'),
            String(data.getDate()).padStart(2, '0')
        ].join('-');
    }

    /* ===================================================== */
    /* 03.3 DATA PARA O FORMATO BRASILEIRO                   */
    /* ===================================================== */

    function dataBR(data){
        if(!data) return '-';
        const p = String(data).split('-');
        if(p.length !== 3) return escapeHTML(data);
        return `${p[2]}/${p[1]}/${p[0]}`;
    }

    /* ===================================================== */
    /* 03.4 FORMATAÇÃO DE MOEDA                              */
    /* ===================================================== */

    function moeda(valor){
        return Number(valor || 0).toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );
    }

    /* ===================================================== */
    /* 03.5 NOME DO MÊS                                      */
    /* ===================================================== */

    function nomeMes(mes){
        return [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro'
        ][mes] || '';
    }

    /* ===================================================== */
    /* 03.6 DADOS VISUAIS DA PRIORIDADE                      */
    /* ===================================================== */

    function prioridadeInfo(valor){
        return PRIORIDADES[normalizarPrioridade(valor)] || PRIORIDADES.media;
    }

    /* ===================================================== */
    /* 03.7 CHAVE DE ORDENAÇÃO POR DATA E HORA              */
    /* ===================================================== */

    function chaveDataHora(item){
        return `${item.data || '9999-12-31'} ${item.hora || '23:59'}`;
    }

    /* ===================================================== */
    /* 03.8 ORDENAR COMPROMISSOS                             */
    /* ===================================================== */
    /*
        Mantém agendados antes dos realizados.
        Agendados ficam em ordem crescente.
        Realizados ficam em ordem decrescente.
    */

    function compararCompromissos(a, b){
        const aRealizado = a.status === 'realizado';
        const bRealizado = b.status === 'realizado';

        if(aRealizado !== bRealizado){
            return aRealizado ? 1 : -1;
        }

        if(aRealizado && bRealizado){
            return chaveDataHora(b).localeCompare(chaveDataHora(a));
        }

        return chaveDataHora(a).localeCompare(chaveDataHora(b));
    }

    /* ===================================================== */
    /* 03.9 LOCALIZAR COMPROMISSO PELO ID                    */
    /* ===================================================== */

    function encontrarCompromisso(id){

        garantirAgendaDB();

        return agendaDoUsuarioAtual()
            .find(
                item =>
                    String(
                        item.id
                    )
                    ===
                    String(
                        id
                    )
            );
    }

    /* ===================================================== */
    /* 03.10 LOCALIZAR ÍNDICE DO COMPROMISSO                 */
    /* ===================================================== */

    function indexCompromisso(id){

        garantirAgendaDB();

        return window.db.agenda
            .findIndex(
                item =>
                    String(
                        item.id
                    )
                    ===
                    String(
                        id
                    )
                &&
                    compromissoPertenceUsuarioAtualAgenda(
                        item
                    )
            );
    }

    /* ===================================================== */
    /* 03.11 ATUALIZAR TELA DA AGENDA SE ESTIVER ABERTA     */
    /* ===================================================== */

    function atualizarPaginaAgendaSeAberta(){
        if(window.currentPage === 'agenda'){
            navigate('agenda', false);
        }
    }

    /* ===================================================== */
    /* 03.12 HORÁRIO ATUAL                                   */
    /* ===================================================== */

    function agoraHora(){
        const d = new Date();
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    /* ===================================================== */
    /* 03.13 DIFERENÇA DE DIAS EM RELAÇÃO A HOJE            */
    /* ===================================================== */

    function diasEntreHoje(dataISO){
        if(!dataISO) return 0;
        const hoje = dataLocalISO();
        const a = new Date(`${hoje}T12:00:00`);
        const b = new Date(`${dataISO}T12:00:00`);
        return Math.round((b - a) / 86400000);
    }

    /* ===================================================== */
    /* 03.14 DATA PERMITIDA PARA ALTA PRIORIDADE              */
    /* ===================================================== */
    /*
        Alta prioridade não pode ser empurrada para outro dia.

        - compromisso de hoje: mantém a própria data;
        - compromisso atrasado: só pode ser reagendado para hoje.

        Isso evita deixar um alerta vencido preso a uma data passada.
    */

    function dataPermitidaReagendamentoAltaAgenda(
        item
    ){

        const hoje =
            dataLocalISO();

        if(
            item?.data
            &&
            item.data >= hoje
        ){

            return item.data;
        }

        return hoje;
    }


    /* ===================================================== */
    /* 03.15 ALTA PRIORIDADE JÁ DEVE ALERTAR                 */
    /* ===================================================== */
    /*
        O alerta de tela cheia aparece:
        - se o compromisso de alta prioridade está atrasado;
        - ou quando chega o horário do compromisso de hoje.

        Compromissos futuros continuam visíveis apenas no sino
        até o horário programado.
    */

    function compromissoAltaPrioridadeDeveAlertarAgenda(
        item
    ){

        if(
            !item
            ||
            item.status !== 'agendado'
            ||
            item.prioridade !== 'alta'
            ||
            !item.data
        ){

            return false;
        }

        const hoje =
            dataLocalISO();

        if(
            item.data < hoje
        ){

            return true;
        }

        if(
            item.data > hoje
        ){

            return false;
        }

        /*
            Se não houver horário, considera o compromisso
            imediatamente pendente no dia.
        */

        if(
            !item.hora
        ){

            return true;
        }

        return (
            String(
                item.hora
            )
            .slice(
                0,
                5
            )
            <=
            agoraHora()
        );
    }


    /* ===================================================== */
    /* 03.16 PRÓXIMO ALERTA DE ALTA PRIORIDADE               */
    /* ===================================================== */

    function proximoCompromissoAltaPrioridadeAgenda(){

        garantirAgendaDB();

        if(
            !usuarioAtualPodeVerAgenda()
        ){

            return null;
        }

        return (
            agendaDoUsuarioAtual()
                .filter(
                    compromissoAltaPrioridadeDeveAlertarAgenda
                )
                .sort(
                    compararCompromissos
                )[0]
            ||
            null
        );
    }


    /* ========================================================= */
    /* 04. ESTILOS PRÓPRIOS DA AGENDA                           */
    /* ========================================================= */
    /*
        A Agenda injeta seu próprio bloco <style> no documento.

        Isso evita depender de alterações adicionais no style.css.

        O CSS inclui:
        - KPIs
        - calendário
        - painel lateral
        - filtros
        - central de notificações
        - responsividade
        - ajustes de impressão
    */

    /* ===================================================== */
    /* 04.1 INSTALAR CSS DA AGENDA                           */
    /* ===================================================== */
    /*
        Evita duplicação verificando primeiro #agenda-estilos.
    */

    function instalarEstilosAgenda(){

        if(document.getElementById('agenda-estilos')) return;

        const style = document.createElement('style');
        style.id = 'agenda-estilos';
        style.textContent = `

            .agenda-kpi-grid{
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
                gap:14px;
                margin-bottom:18px;
            }

            .agenda-kpi{
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:16px;
                padding:18px;
                box-shadow:0 6px 18px rgba(15,23,42,.04);
                position:relative;
                overflow:hidden;
            }

            .agenda-kpi::before{
                content:'';
                position:absolute;
                left:0;
                top:0;
                bottom:0;
                width:4px;
                background:#ff1f2d;
            }

            .agenda-kpi-label{
                font-size:11px;
                color:#64748b;
                text-transform:uppercase;
                letter-spacing:.08em;
                font-weight:800;
            }

            .agenda-kpi-value{
                font-size:27px;
                font-weight:900;
                margin-top:6px;
                color:#111827;
            }

            .agenda-layout{
                display:grid;
                grid-template-columns:minmax(0,1.45fr) minmax(290px,.65fr);
                gap:16px;
                align-items:start;
                margin-bottom:18px;
            }

            .agenda-calendario{
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:18px;
                overflow:hidden;
                box-shadow:0 6px 18px rgba(15,23,42,.04);
            }

            .agenda-cal-header{
                padding:16px 18px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                border-bottom:1px solid #e5e7eb;
            }

            .agenda-cal-grid{
                display:grid;
                grid-template-columns:repeat(7,minmax(0,1fr));
            }

            .agenda-dia-semana{
                padding:9px 6px;
                text-align:center;
                font-size:10px;
                font-weight:900;
                letter-spacing:.06em;
                color:#64748b;
                background:#f8fafc;
                border-bottom:1px solid #e5e7eb;
            }

            .agenda-dia{
                min-height:112px;
                padding:8px;
                border-right:1px solid #eef2f7;
                border-bottom:1px solid #eef2f7;
                background:#fff;
            }

            .agenda-dia.vazio{
                background:#fafafa;
            }

            .agenda-dia.hoje{
                background:#fff7f7;
                box-shadow:inset 0 0 0 2px rgba(255,31,45,.18);
            }

            .agenda-dia-num{
                font-size:11px;
                font-weight:900;
                color:#334155;
                margin-bottom:6px;
            }

            .agenda-dia.hoje .agenda-dia-num{
                display:inline-flex;
                width:24px;
                height:24px;
                align-items:center;
                justify-content:center;
                border-radius:50%;
                background:#ff1f2d;
                color:#fff;
            }

            .agenda-mini-evento{
                display:block;
                width:100%;
                border:0;
                border-left:4px solid var(--agenda-cor);
                background:var(--agenda-fundo);
                color:#1f2937;
                padding:5px 6px;
                border-radius:7px;
                font-size:10px;
                text-align:left;
                margin-bottom:4px;
                cursor:pointer;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            }

            .agenda-mini-evento.realizado{
                opacity:.52;
                text-decoration:line-through;
            }

            .agenda-lateral{
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:18px;
                overflow:hidden;
                box-shadow:0 6px 18px rgba(15,23,42,.04);
            }

            .agenda-lateral-head{
                padding:16px 18px;
                border-bottom:1px solid #e5e7eb;
            }

            .agenda-proximo-item{
                padding:13px 16px;
                border-bottom:1px solid #f1f5f9;
                cursor:pointer;
                transition:.15s;
            }

            .agenda-proximo-item:hover{
                background:#f8fafc;
            }

            .agenda-prioridade-pill,
            .agenda-status-pill{
                display:inline-flex;
                align-items:center;
                justify-content:center;
                border-radius:999px;
                padding:5px 9px;
                font-size:10px;
                font-weight:800;
                white-space:nowrap;
            }

            .agenda-filtros{
                display:grid;
                grid-template-columns:minmax(220px,1.5fr) minmax(150px,.6fr) minmax(150px,.6fr);
                gap:10px;
                align-items:end;
                margin-bottom:14px;
            }

            #agenda-notificacao-root{
                position:fixed;
                right:20px;
                top:18px;
                z-index:50000;
                font-family:'Segoe UI',sans-serif;
            }

            #agenda-notificacao-botao{
                width:48px;
                height:48px;
                border:none;
                border-radius:15px;
                background:#111827;
                color:#fff;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:21px;
                cursor:pointer;
                box-shadow:0 12px 30px rgba(15,23,42,.24);
                position:relative;
            }

            #agenda-notificacao-badge{
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

            #agenda-notificacao-painel{
                position:absolute;
                top:58px;
                right:0;
                width:min(400px,calc(100vw - 30px));
                max-height:72vh;
                overflow:auto;
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:18px;
                box-shadow:0 24px 60px rgba(15,23,42,.25);
                display:none;
            }

            #agenda-notificacao-painel.aberto{
                display:block;
            }

            .agenda-notif-head{
                padding:15px 16px;
                border-bottom:1px solid #e5e7eb;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                position:sticky;
                top:0;
                background:#fff;
                z-index:2;
            }

            .agenda-notif-card{
                margin:10px;
                padding:12px;
                border-radius:13px;
                border:1px solid var(--notif-borda,#e5e7eb);
                border-left:5px solid var(--notif-cor,#64748b);
                background:var(--notif-fundo,#fff);
            }

            .agenda-notif-actions{
                display:flex;
                gap:7px;
                margin-top:10px;
                flex-wrap:wrap;
            }

            .agenda-notif-actions button{
                border:none;
                border-radius:8px;
                padding:7px 10px;
                cursor:pointer;
                font-size:11px;
                font-weight:800;
            }

            /* ============================================= */
            /* ALERTA OBRIGATÓRIO - ALTA PRIORIDADE         */
            /* ============================================= */

            #agenda-alerta-alta-root{
                position:fixed;
                inset:0;
                z-index:90000;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:24px;
                background:rgba(15,23,42,.68);
                backdrop-filter:blur(5px);
                font-family:'Segoe UI',sans-serif;
            }

            .agenda-alerta-alta-card{
                width:min(560px,calc(100vw - 32px));
                overflow:hidden;
                border-radius:22px;
                background:#fff;
                border:1px solid #fecaca;
                box-shadow:0 30px 90px rgba(15,23,42,.38);
                animation:agendaAltaEntrada .18s ease-out;
            }

            @keyframes agendaAltaEntrada{
                from{
                    opacity:0;
                    transform:translateY(12px) scale(.98);
                }
                to{
                    opacity:1;
                    transform:translateY(0) scale(1);
                }
            }

            .agenda-alerta-alta-responsavel{
                padding:22px 20px 18px;
                text-align:center;
                background:#fff;
                border-bottom:1px solid #fee2e2;
            }

            .agenda-alerta-alta-responsavel-label{
                color:#991b1b;
                font-size:10px;
                font-weight:950;
                letter-spacing:.12em;
                text-transform:uppercase;
            }

            .agenda-alerta-alta-responsavel-nome{
                margin-top:5px;
                color:#991b1b;
                font-size:34px;
                font-weight:950;
                line-height:1.02;
                letter-spacing:.02em;
                text-transform:uppercase;
                word-break:break-word;
            }

            .agenda-alerta-alta-topo{
                display:flex;
                align-items:center;
                gap:14px;
                padding:18px 20px;
                color:#fff;
                background:
                    linear-gradient(
                        135deg,
                        #b91c1c,
                        #ef4444
                    );
            }

            .agenda-alerta-alta-icone{
                width:48px;
                height:48px;
                flex:0 0 48px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:15px;
                background:rgba(255,255,255,.15);
                font-size:24px;
            }

            .agenda-alerta-alta-corpo{
                padding:20px;
            }

            .agenda-alerta-alta-dados{
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:10px;
                margin-top:14px;
            }

            .agenda-alerta-alta-dado{
                padding:11px 12px;
                border:1px solid #e5e7eb;
                border-radius:11px;
                background:#f8fafc;
            }

            .agenda-alerta-alta-rotulo{
                display:block;
                margin-bottom:4px;
                color:#64748b;
                font-size:9px;
                font-weight:900;
                letter-spacing:.07em;
                text-transform:uppercase;
            }

            .agenda-alerta-alta-acoes{
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:10px;
                margin-top:18px;
            }

            .agenda-alerta-alta-acoes button{
                min-height:46px;
                border:0;
                border-radius:11px;
                cursor:pointer;
                color:#fff;
                font-size:12px;
                font-weight:900;
            }

            .agenda-alerta-alta-concluir{
                background:#16a34a;
            }

            .agenda-alerta-alta-reagendar{
                background:#7c3aed;
            }

            @media(max-width:560px){
                .agenda-alerta-alta-dados,
                .agenda-alerta-alta-acoes{
                    grid-template-columns:1fr;
                }
            }

            @media(max-width:1050px){
                .agenda-layout{
                    grid-template-columns:1fr;
                }
            }

            @media(max-width:760px){
                .agenda-filtros{
                    grid-template-columns:1fr;
                }

                .agenda-dia{
                    min-height:88px;
                    padding:5px;
                }

                .agenda-mini-evento{
                    font-size:9px;
                }
            }

            @media print{
                #agenda-notificacao-root,
                #agenda-alerta-alta-root{
                    display:none!important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ========================================================= */
    /* 05. RENDERIZAÇÃO DA TELA DE AGENDA                       */
    /* ========================================================= */
    /*
        Monta a tela principal da Agenda.

        A renderização inclui:
        - cabeçalho
        - botão Novo compromisso
        - indicadores
        - calendário mensal
        - próximos compromissos
        - filtros
        - tabela completa
    */

    /* ===================================================== */
    /* 05.1 RENDER PRINCIPAL DA AGENDA                       */
    /* ===================================================== */
    /*
        Calcula KPIs, aplica filtros e monta todo o HTML
        principal da página.
    */

    window.renderAgenda = function(){

        garantirAgendaDB();
        instalarEstilosAgenda();

        const hoje = dataLocalISO();
        const fim7 = new Date();
        fim7.setDate(fim7.getDate() + 7);
        const fim7ISO = dataLocalISO(fim7);

        const agendaUsuario =
            agendaDoUsuarioAtual();

        const agendados =
            agendaUsuario.filter(
                item =>
                    item.status ===
                    'agendado'
            );

        const hojeQtd = agendados.filter(item => item.data === hoje).length;
        const proximos7 = agendados.filter(item => item.data >= hoje && item.data <= fim7ISO).length;
        const altaQtd = agendados.filter(item => item.prioridade === 'alta' && item.data >= hoje).length;
        const atrasados = agendados.filter(item => item.data < hoje).length;

        const filtros = window.agendaFiltros;

        let lista = [
            ...agendaUsuario
        ];

        if(filtros.texto){
            const t = filtros.texto.toLowerCase();
            lista = lista.filter(item =>
                String(item.titulo || '').toLowerCase().includes(t)
                || String(item.responsavel || '').toLowerCase().includes(t)
                || String(item.local || '').toLowerCase().includes(t)
                || String(item.descricao || '').toLowerCase().includes(t)
            );
        }

        if(filtros.status){
            lista = lista.filter(item => item.status === filtros.status);
        }

        if(filtros.prioridade){
            lista = lista.filter(item => item.prioridade === filtros.prioridade);
        }

        lista.sort(compararCompromissos);

        return `
        <div style="display:flex;flex-direction:column;gap:18px;">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:16px;
                flex-wrap:wrap;
            ">
                <div>
                    <div style="font-size:30px;font-weight:900;color:#111827;">
                        📅 Agenda
                    </div>
                    <div style="color:#64748b;margin-top:5px;font-size:13px;">
                        Sua agenda particular • ${escapeHTML(usuarioAtualAgenda()?.usuario || '')}
                    </div>
                </div>

                <button
                    class="btn-action"
                    onclick="abrirNovoCompromissoAgenda()"
                    style="padding:11px 17px;">
                    + Novo compromisso
                </button>
            </div>

            <div class="agenda-kpi-grid">
                ${kpiAgenda('Hoje', hojeQtd, '#2563eb', 'Compromissos agendados para hoje')}
                ${kpiAgenda('Próximos 7 dias', proximos7, '#7c3aed', 'Agenda dos próximos sete dias')}
                ${kpiAgenda('Alta prioridade', altaQtd, '#dc2626', 'Compromissos futuros de alta prioridade')}
                ${kpiAgenda('Atrasados', atrasados, '#d97706', 'Pendentes de datas anteriores')}
            </div>

            <div class="agenda-layout">
                ${renderCalendarioAgenda()}
                ${renderProximosAgenda()}
            </div>

            <div class="content-card" style="padding:18px;">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:12px;
                    flex-wrap:wrap;
                    margin-bottom:14px;
                ">
                    <div>
                        <div style="font-size:18px;font-weight:900;color:#111827;">
                            Compromissos cadastrados
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:3px;">
                            Visualize, edite, reagende, conclua ou exclua compromissos
                        </div>
                    </div>

                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <span class="agenda-prioridade-pill" style="background:#eff6ff;color:#2563eb;">Baixa</span>
                        <span class="agenda-prioridade-pill" style="background:#fff7ed;color:#d97706;">Média</span>
                        <span class="agenda-prioridade-pill" style="background:#fef2f2;color:#dc2626;">Alta</span>
                    </div>
                </div>

                <div class="agenda-filtros">
                    <div>
                        <label>Pesquisar</label>
                        <input
                            value="${escapeHTML(filtros.texto)}"
                            placeholder="Título, local ou descrição..."
                            oninput="alterarFiltroAgenda('texto',this.value)">
                    </div>

                    <div>
                        <label>Status</label>
                        <select onchange="alterarFiltroAgenda('status',this.value)">
                            <option value="" ${!filtros.status ? 'selected' : ''}>Todos</option>
                            <option value="agendado" ${filtros.status === 'agendado' ? 'selected' : ''}>Agendados</option>
                            <option value="realizado" ${filtros.status === 'realizado' ? 'selected' : ''}>Realizados</option>
                        </select>
                    </div>

                    <div>
                        <label>Prioridade</label>
                        <select onchange="alterarFiltroAgenda('prioridade',this.value)">
                            <option value="" ${!filtros.prioridade ? 'selected' : ''}>Todas</option>
                            <option value="baixa" ${filtros.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                            <option value="media" ${filtros.prioridade === 'media' ? 'selected' : ''}>Média</option>
                            <option value="alta" ${filtros.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                        </select>
                    </div>
                </div>

                ${renderTabelaAgenda(lista)}
            </div>

        </div>
        `;
    };

    /* ===================================================== */
    /* 05.2 CARD DE INDICADOR / KPI                          */
    /* ===================================================== */

    function kpiAgenda(titulo, valor, cor, subtitulo){
        return `
        <div class="agenda-kpi" style="--kpi-cor:${cor};">
            <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${cor};"></div>
            <div class="agenda-kpi-label">${titulo}</div>
            <div class="agenda-kpi-value" style="color:${cor};">${valor}</div>
            <div style="font-size:10.5px;color:#94a3b8;margin-top:5px;">${subtitulo}</div>
        </div>
        `;
    }

    /* ===================================================== */
    /* 05.3 CALENDÁRIO MENSAL                                */
    /* ===================================================== */
    /*
        Monta a grade semanal e exibe até três compromissos
        diretamente em cada dia.
    */

    function renderCalendarioAgenda(){

        const ano = Number(window.agendaMesVisual.ano);
        const mes = Number(window.agendaMesVisual.mes);
        const hoje = dataLocalISO();
        const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
        const totalDias = new Date(ano, mes + 1, 0).getDate();
        const diasSemana = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];

        let celulas = diasSemana.map(d => `<div class="agenda-dia-semana">${d}</div>`).join('');

        for(let i = 0; i < primeiroDiaSemana; i++){
            celulas += `<div class="agenda-dia vazio"></div>`;
        }

        for(let dia = 1; dia <= totalDias; dia++){

            const data = `${ano}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
            const itens =
                agendaDoUsuarioAtual()
                .filter(
                    item =>
                        item.data ===
                        data
                )
                .sort(
                    compararCompromissos
                );

            const eventos = itens.slice(0,3).map(item => {
                const p = prioridadeInfo(item.prioridade);
                return `
                    <button
                        class="agenda-mini-evento ${item.status === 'realizado' ? 'realizado' : ''}"
                        style="--agenda-cor:${p.cor};--agenda-fundo:${p.fundo};"
                        title="${escapeHTML(item.responsavel ? item.responsavel + ' — ' + item.titulo : item.titulo)}"
                        onclick="event.stopPropagation();visualizarCompromissoAgenda('${item.id}')">
                        ${item.hora ? escapeHTML(item.hora) + ' · ' : ''}${escapeHTML(item.titulo)}
                    </button>
                `;
            }).join('');

            const restante = itens.length > 3
                ? `<div style="font-size:9px;color:#64748b;font-weight:800;padding:2px 3px;">+${itens.length - 3} compromisso(s)</div>`
                : '';

            celulas += `
                <div class="agenda-dia ${data === hoje ? 'hoje' : ''}">
                    <div class="agenda-dia-num">${dia}</div>
                    ${eventos}
                    ${restante}
                </div>
            `;
        }

        const totalCelulasDias = primeiroDiaSemana + totalDias;
        const faltam = (7 - (totalCelulasDias % 7)) % 7;
        for(let i = 0; i < faltam; i++){
            celulas += `<div class="agenda-dia vazio"></div>`;
        }

        return `
        <div class="agenda-calendario">
            <div class="agenda-cal-header">
                <div>
                    <div style="font-size:17px;font-weight:900;color:#111827;">
                        ${nomeMes(mes)} ${ano}
                    </div>
                    <div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">
                        Clique em um compromisso para visualizar
                    </div>
                </div>

                <div style="display:flex;gap:6px;align-items:center;">
                    <button class="btn-action" style="padding:7px 10px;background:#475569;" onclick="mudarMesAgenda(-1)">←</button>
                    <button class="btn-action" style="padding:7px 10px;background:#111827;" onclick="irMesAtualAgenda()">Hoje</button>
                    <button class="btn-action" style="padding:7px 10px;background:#475569;" onclick="mudarMesAgenda(1)">→</button>
                </div>
            </div>

            <div class="agenda-cal-grid">
                ${celulas}
            </div>
        </div>
        `;
    }

    /* ===================================================== */
    /* 05.4 PRÓXIMOS COMPROMISSOS                            */
    /* ===================================================== */
    /*
        Mostra os oito próximos compromissos agendados.
    */

    function renderProximosAgenda(){

        const hoje = dataLocalISO();
        const itens =
            agendaDoUsuarioAtual()
            .filter(
                item =>
                    item.status ===
                        'agendado'
                &&
                    item.data >=
                        hoje
            )
            .sort(
                compararCompromissos
            )
            .slice(
                0,
                8
            );

        const corpo = itens.length
            ? itens.map(item => {
                const p = prioridadeInfo(item.prioridade);
                const dias = diasEntreHoje(item.data);
                let quando = dataBR(item.data);
                if(dias === 0) quando = 'Hoje';
                if(dias === 1) quando = 'Amanhã';

                return `
                <div class="agenda-proximo-item" onclick="visualizarCompromissoAgenda('${item.id}')">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
                        <div style="min-width:0;">
                            ${
                                item.responsavel
                                    ?
                                    `
                                        <div style="
                                            margin-bottom:4px;
                                            color:${p.cor};
                                            font-size:10px;
                                            font-weight:900;
                                            text-transform:uppercase;
                                            letter-spacing:.06em;
                                        ">
                                            👤 ${escapeHTML(item.responsavel)}
                                        </div>
                                    `
                                    :
                                    ''
                            }
                            <div style="font-size:12px;font-weight:900;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${escapeHTML(item.titulo)}
                            </div>
                            <div style="font-size:10.5px;color:#64748b;margin-top:4px;">
                                ${quando}${item.hora ? ` · ${escapeHTML(item.hora)}` : ''}
                            </div>
                            ${item.local ? `<div style="font-size:10px;color:#94a3b8;margin-top:3px;">📍 ${escapeHTML(item.local)}</div>` : ''}
                        </div>
                        <span class="agenda-prioridade-pill" style="background:${p.fundo};color:${p.cor};">
                            ${p.nome}
                        </span>
                    </div>
                </div>
                `;
            }).join('')
            : `<div style="padding:25px;text-align:center;color:#94a3b8;font-size:12px;">Nenhum compromisso futuro agendado.</div>`;

        return `
        <div class="agenda-lateral">
            <div class="agenda-lateral-head">
                <div style="font-size:15px;font-weight:900;color:#111827;">Próximos compromissos</div>
                <div style="font-size:10.5px;color:#94a3b8;margin-top:3px;">Os oito próximos itens da agenda</div>
            </div>
            ${corpo}
        </div>
        `;
    }

    /* ===================================================== */
    /* 05.5 TABELA DE COMPROMISSOS                           */
    /* ===================================================== */
    /*
        Monta a listagem completa com status, prioridade
        e botões de ação.
    */

    function renderTabelaAgenda(lista){

        if(!lista.length){
            return `
            <div style="
                padding:35px;
                text-align:center;
                color:#94a3b8;
                border:1px dashed #cbd5e1;
                border-radius:14px;
            ">
                Nenhum compromisso encontrado com os filtros selecionados.
            </div>
            `;
        }

        const linhas = lista.map(item => {
            const p = prioridadeInfo(item.prioridade);
            const realizado = item.status === 'realizado';
            const atrasado = !realizado && item.data < dataLocalISO();

            return `
            <tr style="${realizado ? 'opacity:.62;' : ''}">
                <td>
                    <div style="font-weight:800;color:#111827;">${dataBR(item.data)}</div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:2px;">
                        ${escapeHTML(item.hora || '-')}${item.horaFim ? ` até ${escapeHTML(item.horaFim)}` : ''}
                    </div>
                </td>
                <td>
                    ${item.responsavel ? `
                        <div style="
                            display:inline-flex;
                            align-items:center;
                            gap:4px;
                            margin-bottom:4px;
                            padding:3px 7px;
                            border-radius:999px;
                            background:${p.fundo};
                            color:${p.cor};
                            border:1px solid ${p.borda};
                            font-size:9px;
                            font-weight:900;
                        ">
                            👤 ${escapeHTML(item.responsavel)}
                        </div>
                    ` : ''}
                    <div style="font-weight:800;color:#111827;">${escapeHTML(item.titulo)}</div>
                    ${item.local ? `<div style="font-size:10px;color:#94a3b8;margin-top:3px;">📍 ${escapeHTML(item.local)}</div>` : ''}
                </td>
                <td>
                    <span class="agenda-prioridade-pill" style="background:${p.fundo};color:${p.cor};border:1px solid ${p.borda};">
                        ${p.nome}
                    </span>
                </td>
                <td>
                    <span class="agenda-status-pill" style="
                        background:${realizado ? '#f0fdf4' : atrasado ? '#fff7ed' : '#f8fafc'};
                        color:${realizado ? '#15803d' : atrasado ? '#c2410c' : '#475569'};
                        border:1px solid ${realizado ? '#bbf7d0' : atrasado ? '#fed7aa' : '#e2e8f0'};
                    ">
                        ${realizado ? 'Realizado' : atrasado ? 'Atrasado' : 'Agendado'}
                    </span>
                </td>
                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn-action" style="padding:6px 9px;background:#111827;font-size:11px;" onclick="visualizarCompromissoAgenda('${item.id}')">👁 Ver</button>
                        <button class="btn-action" style="padding:6px 9px;background:#2563eb;font-size:11px;" onclick="editarCompromissoAgenda('${item.id}')">✏ Editar</button>
                        ${!realizado ? `<button class="btn-action" style="padding:6px 9px;background:#7c3aed;font-size:11px;" onclick="reagendarCompromissoAgenda('${item.id}')">↻ Reagendar</button>` : ''}
                        <button class="btn-del" style="padding:6px 9px;font-size:11px;" onclick="excluirCompromissoAgenda('${item.id}')">🗑 Excluir</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        return `
        <div style="overflow:auto;border:1px solid #e5e7eb;border-radius:14px;">
            <table style="margin-top:0;min-width:800px;">
                <thead>
                    <tr>
                        <th>Data / Hora</th>
                        <th>Compromisso</th>
                        <th>Prioridade</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
        `;
    }

    /* ========================================================= */
    /* 06. NAVEGAÇÃO DO CALENDÁRIO E FILTROS                    */
    /* ========================================================= */
    /*
        Controla:
        - mês anterior
        - mês seguinte
        - retorno ao mês atual
        - pesquisa por texto
        - filtro de status
        - filtro de prioridade
    */

    /* ===================================================== */
    /* 06.1 ALTERAR MÊS DO CALENDÁRIO                        */
    /* ===================================================== */

    window.mudarMesAgenda = function(delta){
        const d = new Date(
            window.agendaMesVisual.ano,
            window.agendaMesVisual.mes + Number(delta || 0),
            1
        );
        window.agendaMesVisual = {
            ano: d.getFullYear(),
            mes: d.getMonth()
        };
        navigate('agenda', false);
    };

    /* ===================================================== */
    /* 06.2 VOLTAR PARA O MÊS ATUAL                          */
    /* ===================================================== */

    window.irMesAtualAgenda = function(){
        const d = new Date();
        window.agendaMesVisual = {
            ano: d.getFullYear(),
            mes: d.getMonth()
        };
        navigate('agenda', false);
    };

    let timerFiltroAgenda = null;

    /* ===================================================== */
    /* 06.3 ALTERAR FILTROS                                  */
    /* ===================================================== */
    /*
        A pesquisa textual usa pequeno debounce de 280 ms.
    */

    window.alterarFiltroAgenda = function(campo, valor){
        window.agendaFiltros[campo] = valor || '';

        clearTimeout(timerFiltroAgenda);
        timerFiltroAgenda = setTimeout(()=>{
            navigate('agenda', false);
        }, campo === 'texto' ? 280 : 0);
    };

    /* ========================================================= */
    /* 07. CADASTRO E EDIÇÃO DE COMPROMISSOS                    */
    /* ========================================================= */
    /*
        Responsável por:
        - abrir formulário de novo compromisso
        - abrir formulário de edição
        - validar campos
        - criar registro
        - atualizar registro existente
        - salvar alterações no banco
    */

    /* ===================================================== */
    /* 07.1 NOVO COMPROMISSO                                 */
    /* ===================================================== */

    window.abrirNovoCompromissoAgenda = function(){
        abrirFormularioCompromissoAgenda(null);
    };

    /* ===================================================== */
    /* 07.2 EDITAR COMPROMISSO                               */
    /* ===================================================== */

    window.editarCompromissoAgenda = function(id){
        abrirFormularioCompromissoAgenda(encontrarCompromisso(id));
    };

    /* ===================================================== */
    /* 07.3 MONTAR FORMULÁRIO                                */
    /* ===================================================== */
    /*
        O mesmo formulário atende cadastro e edição.
    */

    function abrirFormularioCompromissoAgenda(item){

        garantirAgendaDB();

        const editando = !!item;
        const hoje = dataLocalISO();
        const prioridade = item?.prioridade || 'media';
        const status = item?.status || 'agendado';

        const html = `
        <div style="display:flex;flex-direction:column;gap:14px;">

            <div>
                <label>Título do compromisso *</label>
                <input id="agenda-titulo" value="${escapeHTML(item?.titulo || '')}" placeholder="Ex: Reunião com cliente">
            </div>

            <div class="form-row">
                <div>
                    <label>Data *</label>
                    <input type="date" id="agenda-data" value="${escapeHTML(item?.data || hoje)}">
                </div>
                <div>
                    <label>Prioridade *</label>
                    <select id="agenda-prioridade">
                        <option value="baixa" ${prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                        <option value="media" ${prioridade === 'media' ? 'selected' : ''}>Média</option>
                        <option value="alta" ${prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div>
                    <label>Hora *</label>
                    <input type="time" id="agenda-hora" value="${escapeHTML(item?.hora || agoraHora())}">
                </div>
                <div>
                    <label>Hora final</label>
                    <input type="time" id="agenda-hora-fim" value="${escapeHTML(item?.horaFim || '')}">
                </div>
            </div>

            <div>
                <label>Local</label>
                <input id="agenda-local" value="${escapeHTML(item?.local || '')}" placeholder="Ex: Escritório, cliente, endereço...">
            </div>

            ${editando ? `
            <div>
                <label>Status</label>
                <select id="agenda-status">
                    <option value="agendado" ${status === 'agendado' ? 'selected' : ''}>Agendado</option>
                    <option value="realizado" ${status === 'realizado' ? 'selected' : ''}>Realizado</option>
                </select>
            </div>
            ` : ''}

            <div>
                <label>Descrição / Observações</label>
                <textarea id="agenda-descricao" rows="5" placeholder="Informações importantes sobre o compromisso...">${escapeHTML(item?.descricao || '')}</textarea>
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:8px;
                padding:10px;
                border-radius:12px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
            ">
                <div style="font-size:10px;color:#2563eb;font-weight:800;">● Baixa — azul</div>
                <div style="font-size:10px;color:#d97706;font-weight:800;">● Média — laranja</div>
                <div style="font-size:10px;color:#dc2626;font-weight:800;">● Alta — vermelho</div>
            </div>

        </div>
        `;

        configModal({
            title: editando ? 'Editar compromisso' : 'Novo compromisso',
            body: html,
            confirmText: editando ? 'Salvar alterações' : 'Cadastrar compromisso',
            onConfirm: ()=> salvarCompromissoAgenda(item?.id || null)
        });
    }

    /* ===================================================== */
    /* 07.4 VALIDAR E SALVAR COMPROMISSO                     */
    /* ===================================================== */
    /*
        Exige título, data e hora.
        Também valida a hora final quando informada.
    */

    window.salvarCompromissoAgenda = async function(id = null){

        garantirAgendaDB();

        const usuario =
            usuarioAtualAgenda();

        if(
            !usuario
        ){

            alert(
                'Não foi possível identificar o login atual.'
            );

            return;
        }

        const titulo = document.getElementById('agenda-titulo')?.value.trim() || '';

        /*
            O responsável é sempre o próprio login.
        */

        const responsavel =
            String(
                usuario.usuario || ''
            ).trim();

        const data = document.getElementById('agenda-data')?.value || '';
        const hora = document.getElementById('agenda-hora')?.value || '';
        const horaFim = document.getElementById('agenda-hora-fim')?.value || '';
        const prioridade = normalizarPrioridade(document.getElementById('agenda-prioridade')?.value);
        const local = document.getElementById('agenda-local')?.value.trim() || '';
        const descricao = document.getElementById('agenda-descricao')?.value.trim() || '';
        const statusCampo = document.getElementById('agenda-status');
        const status = statusCampo ? normalizarStatusAgenda(statusCampo.value) : 'agendado';

        if(!titulo || !data || !hora){
            alert('Preencha título, data e hora do compromisso.');
            return;
        }

        if(horaFim && horaFim < hora){
            alert('A hora final não pode ser menor que a hora inicial.');
            return;
        }

        if(id){
            const idx = indexCompromisso(id);
            if(idx < 0){
                alert('Compromisso não encontrado.');
                return;
            }

            const atual = window.db.agenda[idx];
            window.db.agenda[idx] = {
                ...atual,

                usuarioId:
                    usuario.id,

                titulo,

                responsavel,

                data,
                hora,
                horaFim,
                prioridade,
                local,
                descricao,
                status,
                realizadoEm:
                    status === 'realizado'
                    ? (atual.realizadoEm || new Date().toISOString())
                    : null,
                atualizadoEm: new Date().toISOString()
            };
        }
        else{
            window.db.agenda.push({
                id: gerarIdAgenda(),

                usuarioId:
                    usuario.id,

                titulo,

                responsavel,

                data,
                hora,
                horaFim,
                prioridade,
                local,
                descricao,
                status: 'agendado',
                criadoEm: new Date().toISOString(),
                atualizadoEm: null,
                realizadoEm: null,
                historicoReagendamentos: []
            });
        }

        await save();
        closeModal();
        atualizarPaginaAgendaSeAberta();
        atualizarCentralNotificacoesAgenda(true);
    };

    /* ========================================================= */
    /* 08. VISUALIZAÇÃO DE COMPROMISSO                           */
    /* ========================================================= */
    /*
        Abre o compromisso em modo de visualização.

        Mostra:
        - título
        - data e horário
        - prioridade
        - responsável
        - local
        - status
        - descrição
        - histórico de reagendamentos
        - ações disponíveis
    */

    /* ===================================================== */
    /* 08.1 ABRIR VISUALIZAÇÃO DO COMPROMISSO                */
    /* ===================================================== */

    window.visualizarCompromissoAgenda = function(id){

        const item = encontrarCompromisso(id);
        if(!item) return;

        const p = prioridadeInfo(item.prioridade);
        const realizado = item.status === 'realizado';

        const historico = (item.historicoReagendamentos || []).length
            ? `
                <div style="margin-top:16px;">
                    <div style="font-size:11px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
                        Histórico de reagendamentos
                    </div>
                    ${(item.historicoReagendamentos || []).slice().reverse().map(h => `
                        <div style="font-size:11px;color:#64748b;padding:8px 0;border-bottom:1px solid #f1f5f9;">
                            ${dataBR(h.deData)} ${escapeHTML(h.deHora || '')}
                            →
                            <strong>${dataBR(h.paraData)} ${escapeHTML(h.paraHora || '')}</strong>
                        </div>
                    `).join('')}
                </div>
            `
            : '';

        const html = `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="
                padding:16px;
                border-radius:15px;
                background:${p.fundo};
                border:1px solid ${p.borda};
                border-left:5px solid ${p.cor};
            ">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                    <div>
                        <div style="font-size:20px;font-weight:900;color:#111827;">${escapeHTML(item.titulo)}</div>
                        <div style="font-size:12px;color:#64748b;margin-top:6px;">
                            📅 ${dataBR(item.data)} · 🕒 ${escapeHTML(item.hora)}${item.horaFim ? ` até ${escapeHTML(item.horaFim)}` : ''}
                        </div>
                    </div>
                    <span class="agenda-prioridade-pill" style="background:#fff;color:${p.cor};border:1px solid ${p.borda};">
                        ${p.nome}
                    </span>
                </div>
            </div>

            <div style="
                padding:14px 16px;
                border-radius:13px;
                background:#111827;
                color:#fff;
            ">
                <div style="
                    color:#94a3b8;
                    font-size:9px;
                    font-weight:900;
                    text-transform:uppercase;
                    letter-spacing:.08em;
                ">
                    Responsável
                </div>

                <div style="
                    margin-top:4px;
                    font-size:22px;
                    font-weight:950;
                    line-height:1.15;
                ">
                    ${escapeHTML(item.responsavel || 'Não informado')}
                </div>
            </div>

            ${item.local ? `
            <div>
                <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Local</div>
                <div style="font-size:13px;color:#334155;margin-top:4px;">📍 ${escapeHTML(item.local)}</div>
            </div>
            ` : ''}

            <div>
                <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Status</div>
                <div style="font-size:13px;color:${realizado ? '#15803d' : '#475569'};font-weight:800;margin-top:4px;">
                    ${realizado ? '✔ Realizado' : '● Agendado'}
                </div>
            </div>

            ${item.descricao ? `
            <div>
                <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Descrição / Observações</div>
                <div style="font-size:13px;color:#334155;line-height:1.6;margin-top:5px;white-space:pre-wrap;">${escapeHTML(item.descricao)}</div>
            </div>
            ` : ''}

            ${historico}

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
                <button class="btn-action" style="background:#2563eb;" onclick="closeModal();editarCompromissoAgenda('${item.id}')">✏ Editar</button>
                ${!realizado ? `
                    <button class="btn-action" style="background:#7c3aed;" onclick="closeModal();reagendarCompromissoAgenda('${item.id}')">↻ Reagendar</button>
                    <button class="btn-action" style="background:#16a34a;" onclick="closeModal();marcarCompromissoRealizadoAgenda('${item.id}')">✔ Marcar realizado</button>
                ` : ''}
            </div>
        </div>
        `;

        configModal({
            title: 'Compromisso',
            body: html,
            hideConfirm: true
        });
    };

    /* ========================================================= */
    /* 09. AÇÕES SOBRE COMPROMISSOS                              */
    /* ========================================================= */
    /*
        Agrupa as ações que alteram o estado de um compromisso:
        - marcar como realizado
        - abrir reagendamento
        - confirmar reagendamento
        - excluir compromisso
    */

    /* ===================================================== */
    /* 09.1 MARCAR COMO REALIZADO                            */
    /* ===================================================== */

    window.marcarCompromissoRealizadoAgenda = async function(id){

        const idx = indexCompromisso(id);
        if(idx < 0) return;

        window.db.agenda[idx].status = 'realizado';
        window.db.agenda[idx].realizadoEm = new Date().toISOString();
        window.db.agenda[idx].atualizadoEm = new Date().toISOString();

        await save();
        atualizarPaginaAgendaSeAberta();
        atualizarCentralNotificacoesAgenda(false);
    };

    /* ===================================================== */
    /* 09.2 ABRIR REAGENDAMENTO                              */
    /* ===================================================== */

    window.reagendarCompromissoAgenda = function(id){

        const item =
            encontrarCompromisso(
                id
            );

        if(!item) return;

        const altaPrioridade =
            item.prioridade ===
            'alta';

        const dataPermitida =
            altaPrioridade
                ?
                dataPermitidaReagendamentoAltaAgenda(
                    item
                )
                :
                item.data;

        const campoData =
            altaPrioridade
                ?
                `
                    <div>
                        <label>Data</label>

                        <div style="
                            min-height:42px;
                            display:flex;
                            align-items:center;
                            padding:10px 12px;
                            border:1px solid #fecaca;
                            border-radius:9px;
                            background:#fef2f2;
                            color:#b91c1c;
                            font-size:12px;
                            font-weight:900;
                        ">
                            ${dataBR(dataPermitida)}
                        </div>

                        <input
                            type="hidden"
                            id="agenda-reagendar-data"
                            value="${escapeHTML(dataPermitida)}">
                    </div>
                `
                :
                `
                    <div>
                        <label>Nova data *</label>
                        <input
                            type="date"
                            id="agenda-reagendar-data"
                            value="${escapeHTML(item.data)}">
                    </div>
                `;

        const avisoAlta =
            altaPrioridade
                ?
                `
                    <div style="
                        padding:11px 13px;
                        border-radius:10px;
                        background:#fff7ed;
                        border:1px solid #fed7aa;
                        color:#9a3412;
                        font-size:11px;
                        line-height:1.5;
                    ">
                        <strong>Alta Prioridade:</strong>
                        este compromisso só pode ser reagendado
                        para o mesmo dia. Você pode alterar apenas
                        o horário.
                    </div>
                `
                :
                '';

        const html = `
        <div style="display:flex;flex-direction:column;gap:14px;">

            <div style="padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">

                <div style="font-size:12px;font-weight:900;color:#111827;">
                    ${escapeHTML(item.titulo)}
                </div>

                <div style="font-size:10.5px;color:#64748b;margin-top:4px;">
                    Atual:
                    ${dataBR(item.data)}
                    ${item.hora ? `às ${escapeHTML(item.hora)}` : ''}
                </div>

            </div>

            ${avisoAlta}

            <div class="form-row">

                ${campoData}

                <div>
                    <label>Nova hora *</label>
                    <input
                        type="time"
                        id="agenda-reagendar-hora"
                        value="${escapeHTML(item.hora)}">
                </div>

            </div>

        </div>
        `;

        configModal({
            title:
                altaPrioridade
                    ?
                    'Reagendar Alta Prioridade'
                    :
                    'Reagendar compromisso',

            body:
                html,

            confirmText:
                'Confirmar reagendamento',

            onConfirm:
                () =>
                    confirmarReagendamentoAgenda(
                        id
                    )
        });
    };


    /* ===================================================== */
    /* 09.3 CONFIRMAR REAGENDAMENTO                          */
    /* ===================================================== */
    /*
        Salva o histórico da data/hora anterior antes
        de atualizar o compromisso.
    */

    window.confirmarReagendamentoAgenda = async function(id){

        const idx = indexCompromisso(id);
        if(idx < 0) return;

        const novaData = document.getElementById('agenda-reagendar-data')?.value || '';
        const novaHora = document.getElementById('agenda-reagendar-hora')?.value || '';

        if(!novaData || !novaHora){
            alert('Informe a nova data e a nova hora.');
            return;
        }

        const item = window.db.agenda[idx];

        /*
            Regra obrigatória:
            Alta Prioridade não pode ser reagendada para outro dia.
        */

        if(
            item.prioridade === 'alta'
        ){

            const dataPermitida =
                dataPermitidaReagendamentoAltaAgenda(
                    item
                );

            if(
                novaData !==
                dataPermitida
            ){

                alert(
                    'Compromissos de Alta Prioridade só podem ser reagendados para o mesmo dia.'
                );

                return;
            }
        }

        if(!Array.isArray(item.historicoReagendamentos)){
            item.historicoReagendamentos = [];
        }

        item.historicoReagendamentos.push({
            deData: item.data,
            deHora: item.hora,
            paraData: novaData,
            paraHora: novaHora,
            em: new Date().toISOString()
        });

        item.data = novaData;
        item.hora = novaHora;
        item.status = 'agendado';
        item.realizadoEm = null;
        item.atualizadoEm = new Date().toISOString();

        await save();
        closeModal();
        atualizarPaginaAgendaSeAberta();
        atualizarCentralNotificacoesAgenda(false);

        /*
            Se foi reagendado para um horário futuro do mesmo dia,
            o alerta desaparece e só volta quando chegar o novo horário.
        */
        atualizarAlertaAltaPrioridadeAgenda();
    };

    /* ===================================================== */
    /* 09.4 EXCLUIR COMPROMISSO                              */
    /* ===================================================== */

    window.excluirCompromissoAgenda = async function(id){

        const item = encontrarCompromisso(id);
        if(!item) return;

        if(!confirm(`Deseja excluir o compromisso "${item.titulo}"?`)){
            return;
        }

        const idx = indexCompromisso(id);
        if(idx >= 0){
            window.db.agenda.splice(idx, 1);
        }

        await save();
        atualizarPaginaAgendaSeAberta();
        atualizarCentralNotificacoesAgenda(false);
    };

    /* ========================================================= */
    /* 09.5 ALERTA OBRIGATÓRIO DE ALTA PRIORIDADE               */
    /* ========================================================= */
    /*
        Exibe uma camada sobre qualquer tela do ERP quando
        chega o horário de um compromisso de Alta Prioridade.

        O alerta não possui botão X e não fecha ao clicar fora.
        As únicas ações são:
        - Concluir
        - Reagendar
    */

    function removerAlertaAltaPrioridadeAgenda(){

        const root =
            document.getElementById(
                'agenda-alerta-alta-root'
            );

        if(root){
            root.remove();
        }

        window.agendaAltaPrioridadeAbertaId =
            null;
    }


    function renderAlertaAltaPrioridadeAgenda(
        item
    ){

        const atrasado =
            item.data <
            dataLocalISO();

        const dataExibicao =
            atrasado
                ?
                `${dataBR(item.data)} · ATRASADO`
                :
                dataBR(item.data);

        return `

            <div class="agenda-alerta-alta-card">

                <div class="agenda-alerta-alta-responsavel">

                    <div class="agenda-alerta-alta-responsavel-label">
                        Responsável
                    </div>

                    <div class="agenda-alerta-alta-responsavel-nome">
                        ${escapeHTML(
                            item.responsavel
                            ||
                            'Responsável não informado'
                        )}
                    </div>

                </div>

                <div class="agenda-alerta-alta-topo">

                    <div class="agenda-alerta-alta-icone">
                        ⚠
                    </div>

                    <div style="min-width:0;">

                        <div style="
                            font-size:10px;
                            font-weight:900;
                            letter-spacing:.09em;
                            text-transform:uppercase;
                            opacity:.9;
                        ">
                            Compromisso de Alta Prioridade
                        </div>

                        <div style="
                            margin-top:3px;
                            font-size:18px;
                            font-weight:900;
                            line-height:1.2;
                        ">
                            ${escapeHTML(item.titulo)}
                        </div>

                    </div>

                </div>


                <div class="agenda-alerta-alta-corpo">

                    <div style="
                        color:#475569;
                        font-size:12px;
                        line-height:1.55;
                    ">
                        Este compromisso de Alta Prioridade exige uma ação.
                        Esta notificação permanecerá na tela até você
                        concluir o compromisso ou reagendar o horário.
                    </div>


                    <div class="agenda-alerta-alta-dados">

                        <div class="agenda-alerta-alta-dado">

                            <span class="agenda-alerta-alta-rotulo">
                                Data
                            </span>

                            <strong style="
                                color:${atrasado ? '#b91c1c' : '#111827'};
                                font-size:12px;
                            ">
                                ${dataExibicao}
                            </strong>

                        </div>

                        <div class="agenda-alerta-alta-dado">

                            <span class="agenda-alerta-alta-rotulo">
                                Horário
                            </span>

                            <strong style="
                                color:#111827;
                                font-size:12px;
                            ">
                                ${escapeHTML(item.hora || '-')}
                            </strong>

                        </div>

                        ${
                            item.local
                                ?
                                `
                                    <div
                                        class="agenda-alerta-alta-dado"
                                        style="grid-column:1 / -1;"
                                    >

                                        <span class="agenda-alerta-alta-rotulo">
                                            Local
                                        </span>

                                        <strong style="
                                            color:#111827;
                                            font-size:12px;
                                        ">
                                            ${escapeHTML(item.local)}
                                        </strong>

                                    </div>
                                `
                                :
                                ''
                        }

                    </div>


                    ${
                        item.descricao
                            ?
                            `
                                <div style="
                                    margin-top:12px;
                                    padding:11px 12px;
                                    border-radius:10px;
                                    background:#f8fafc;
                                    border:1px solid #e2e8f0;
                                    color:#475569;
                                    font-size:11px;
                                    line-height:1.5;
                                ">
                                    ${escapeHTML(item.descricao)}
                                </div>
                            `
                            :
                            ''
                    }


                    <div class="agenda-alerta-alta-acoes">

                        <button
                            type="button"
                            class="agenda-alerta-alta-concluir"
                            onclick="concluirAlertaAltaPrioridadeAgenda('${item.id}')"
                        >
                            ✔ Concluir
                        </button>

                        <button
                            type="button"
                            class="agenda-alerta-alta-reagendar"
                            onclick="reagendarCompromissoAgenda('${item.id}')"
                        >
                            ↻ Reagendar
                        </button>

                    </div>

                    <div style="
                        margin-top:10px;
                        text-align:center;
                        color:#94a3b8;
                        font-size:9.5px;
                    ">
                        Alta Prioridade só pode ser reagendada
                        para o mesmo dia.
                    </div>

                </div>

            </div>

        `;
    }


    window.concluirAlertaAltaPrioridadeAgenda =
    async function(
        id
    ){

        removerAlertaAltaPrioridadeAgenda();

        await marcarCompromissoRealizadoAgenda(
            id
        );
    };


    function atualizarAlertaAltaPrioridadeAgenda(){

        instalarEstilosAgenda();
        garantirAgendaDB();

        const item =
            proximoCompromissoAltaPrioridadeAgenda();

        if(!item){

            removerAlertaAltaPrioridadeAgenda();

            return;
        }

        const rootAtual =
            document.getElementById(
                'agenda-alerta-alta-root'
            );

        /*
            Se o alerta correto já está aberto, não recria.
        */

        if(
            rootAtual
            &&
            window.agendaAltaPrioridadeAbertaId ===
                item.id
        ){

            return;
        }

        if(rootAtual){
            rootAtual.remove();
        }

        const root =
            document.createElement(
                'div'
            );

        root.id =
            'agenda-alerta-alta-root';

        root.innerHTML =
            renderAlertaAltaPrioridadeAgenda(
                item
            );

        document.body.appendChild(
            root
        );

        window.agendaAltaPrioridadeAbertaId =
            item.id;
    }


    /* ========================================================= */
    /* 10. CENTRAL GLOBAL DE NOTIFICAÇÕES                        */
    /* ========================================================= */
    /*
        Monta e atualiza o sino de notificações exibido
        sobre as telas do ERP.

        A central combina:
        - compromissos de hoje
        - compromissos atrasados
        - pagamentos vencendo hoje
        - valores a receber hoje
    */

    /* ===================================================== */
    /* 10.1 MONTAR SINO E PAINEL DE NOTIFICAÇÕES            */
    /* ===================================================== */

    function montarCentralNotificacoesAgenda(){

        instalarEstilosAgenda();

        if(document.getElementById('agenda-notificacao-root')) return;

        const root = document.createElement('div');
        root.id = 'agenda-notificacao-root';
        root.innerHTML = `
            <button id="agenda-notificacao-botao" onclick="toggleCentralNotificacoesAgenda(event)" title="Notificações">
                🔔
                <span id="agenda-notificacao-badge" style="display:none;">0</span>
            </button>
            <div id="agenda-notificacao-painel"></div>
        `;

        document.body.appendChild(root);
    }

    /* ===================================================== */
    /* 10.2 ASSINATURA DE ITEM FINANCEIRO                    */
    /* ===================================================== */
    /*
        Cria uma assinatura simples para identificar
        lançamentos já reconhecidos pelo usuário.
    */

    function assinaturaItemFinanceiro(item){
        const base = [
            item.tipo || '',
            item.vencimento || '',
            item.nome || '',
            item.descricao || '',
            Number(item.valor || 0).toFixed(2)
        ].join('|');

        let hash = 0;
        for(let i = 0; i < base.length; i++){
            hash = ((hash << 5) - hash) + base.charCodeAt(i);
            hash |= 0;
        }
        return String(hash);
    }

    /* ===================================================== */
    /* 10.3 FILTRAR LANÇAMENTOS FINANCEIROS DE HOJE          */
    /* ===================================================== */

    function itensFinanceirosHoje(tipo){

        garantirAgendaDB();

        const hoje = dataLocalISO();

        return (window.db.financeiro || []).filter(item => {
            if(item.tipo !== tipo) return false;
            if(item.vencimento !== hoje) return false;

            const status = String(item.status || 'Pendente').toLowerCase();

            if(tipo === 'Pagar'){
                return status !== 'pago';
            }

            return status !== 'recebido';
        });
    }

    /* ===================================================== */
    /* 10.4 VERIFICAR AVISO FINANCEIRO PENDENTE              */
    /* ===================================================== */

    function avisoFinanceiroPendente(tipo){

        const itens = itensFinanceirosHoje(tipo);
        if(!itens.length) return null;

        const hoje = dataLocalISO();
        const usuario =
            usuarioAtualAgenda();

        const chave =
            `${usuario?.id || 'sem-usuario'}|${hoje}|${tipo}`;
        const atuais = itens.map(assinaturaItemFinanceiro);
        const reconhecidos = Array.isArray(window.db.agendaConfig.financeiroOk[chave])
            ? window.db.agendaConfig.financeiroOk[chave]
            : [];

        const temNovo = atuais.some(sig => !reconhecidos.includes(sig));

        if(!temNovo && reconhecidos.length){
            return null;
        }

        return {
            tipo,
            itens,
            assinaturas: atuais,
            total: itens.reduce((acc, item) => acc + Number(item.valor || 0), 0)
        };
    }

    /* ===================================================== */
    /* 10.5 CONSTRUIR LISTA DE NOTIFICAÇÕES                  */
    /* ===================================================== */
    /*
        Junta compromissos pendentes e avisos financeiros.
    */

    function construirNotificacoesAgenda(){

        garantirAgendaDB();

        const hoje = dataLocalISO();
        const notificacoes = [];

        if(
            usuarioAtualPodeVerAgenda()
        ){

            agendaDoUsuarioAtual()
                .filter(
                    item =>
                        item.status ===
                            'agendado'
                    &&
                        item.data
                    &&
                        item.data <=
                            hoje
                )
                .sort(
                    compararCompromissos
                )
                .forEach(
                    item => {

                        notificacoes.push({

                            tipo:
                                'compromisso',

                            id:
                                item.id,

                            item
                        });
                    }
                );
        }

        /*
            Avisos financeiros só aparecem para quem possui
            acesso à tela Fluxo Financeiro.
        */

        if(
            usuarioAtualPodeVerFinanceiro()
        ){

            const pagar =
                avisoFinanceiroPendente(
                    'Pagar'
                );

            if(pagar){

                notificacoes.push({

                    tipo:
                        'financeiro-pagar',

                    dados:
                        pagar
                });
            }

            const receber =
                avisoFinanceiroPendente(
                    'Receber'
                );

            if(receber){

                notificacoes.push({

                    tipo:
                        'financeiro-receber',

                    dados:
                        receber
                });
            }
        }

        return notificacoes;
    }

    /* ===================================================== */
    /* 10.6 ASSINATURA DA LISTA DE NOTIFICAÇÕES              */
    /* ===================================================== */
    /*
        Permite detectar quando o conjunto de avisos mudou.
    */

    function assinaturaNotificacoes(lista){
        return lista.map(n => {
            if(n.tipo === 'compromisso'){
                return `C:${n.id}:${n.item.data}:${n.item.hora}:${n.item.status}:${n.item.responsavel || ''}`;
            }
            return `${n.tipo}:${n.dados.assinaturas.join(',')}`;
        }).join('||');
    }

    /* ===================================================== */
    /* 10.7 ABRIR / FECHAR CENTRAL                           */
    /* ===================================================== */

    window.toggleCentralNotificacoesAgenda = function(event){
        if(event) event.stopPropagation();
        window.agendaPainelAberto = !window.agendaPainelAberto;
        aplicarEstadoPainelNotificacoes();
    };

    /* ===================================================== */
    /* 10.8 APLICAR ESTADO VISUAL DO PAINEL                  */
    /* ===================================================== */

    function aplicarEstadoPainelNotificacoes(){
        const painel = document.getElementById('agenda-notificacao-painel');
        if(!painel) return;
        painel.classList.toggle('aberto', !!window.agendaPainelAberto);
    }

    /* ===================================================== */
    /* 10.9 FECHAR CENTRAL                                   */
    /* ===================================================== */

    window.fecharCentralNotificacoesAgenda = function(){
        window.agendaPainelAberto = false;
        aplicarEstadoPainelNotificacoes();
    };

    /* ===================================================== */
    /* 10.10 ATUALIZAR CENTRAL DE NOTIFICAÇÕES               */
    /* ===================================================== */
    /*
        Atualiza badge, painel, assinatura e abertura
        automática quando necessário.
    */

    window.atualizarCentralNotificacoesAgenda = function(autoAbrir = false){

        montarCentralNotificacoesAgenda();
        garantirAgendaDB();

        const painel = document.getElementById('agenda-notificacao-painel');
        const badge = document.getElementById('agenda-notificacao-badge');
        const root = document.getElementById('agenda-notificacao-root');

        if(!painel || !badge || !root) return;

        const podeUsarCentral =
            usuarioAtualPodeVerAgenda()
            ||
            usuarioAtualPodeVerFinanceiro();

        root.style.display =
            podeUsarCentral
                ?
                ''
                :
                'none';

        if(
            !podeUsarCentral
        ){

            removerAlertaAltaPrioridadeAgenda();

            return;
        }

        const lista = construirNotificacoesAgenda();
        const assinatura = assinaturaNotificacoes(lista);
        const mudou = assinatura !== window.agendaUltimaAssinaturaNotificacoes;

        badge.textContent = String(lista.length);
        badge.style.display = lista.length ? 'flex' : 'none';

        painel.innerHTML = renderPainelNotificacoes(lista);

        if(lista.length && (autoAbrir || (mudou && window.agendaUltimaAssinaturaNotificacoes))){
            window.agendaPainelAberto = true;
        }

        if(!lista.length){
            window.agendaPainelAberto = false;
        }

        window.agendaUltimaAssinaturaNotificacoes = assinatura;
        aplicarEstadoPainelNotificacoes();

        /*
            O sino continua funcionando normalmente.
            Além dele, verificamos se algum compromisso de
            Alta Prioridade já chegou ao horário de disparo.
        */

        atualizarAlertaAltaPrioridadeAgenda();
    };

    /* ===================================================== */
    /* 10.11 RENDERIZAR PAINEL                               */
    /* ===================================================== */

    function renderPainelNotificacoes(lista){

        const conteudo = lista.length
            ? lista.map(renderNotificacaoAgenda).join('')
            : `
                <div style="padding:30px 18px;text-align:center;">
                    <div style="font-size:30px;">✓</div>
                    <div style="font-size:13px;font-weight:900;color:#334155;margin-top:8px;">Tudo certo por aqui</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Nenhuma notificação pendente no momento.</div>
                </div>
            `;

        return `
            <div class="agenda-notif-head">
                <div>
                    <div style="font-size:14px;font-weight:900;color:#111827;">Notificações</div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:2px;">Agenda e financeiro de hoje</div>
                </div>
                <button style="border:0;background:transparent;cursor:pointer;font-size:18px;color:#64748b;" onclick="fecharCentralNotificacoesAgenda()">×</button>
            </div>
            ${conteudo}
        `;
    }

    /* ===================================================== */
    /* 10.12 RENDERIZAR CADA NOTIFICAÇÃO                     */
    /* ===================================================== */
    /*
        Trata separadamente:
        - compromisso
        - financeiro a pagar
        - financeiro a receber
    */

    function renderNotificacaoAgenda(n){

        if(n.tipo === 'compromisso'){
            const item = n.item;
            const p = prioridadeInfo(item.prioridade);
            const atrasado = item.data < dataLocalISO();

            return `
            <div class="agenda-notif-card" style="--notif-cor:${p.cor};--notif-fundo:${p.fundo};--notif-borda:${p.borda};">

                <div style="
                    margin-bottom:10px;
                    padding:9px 10px;
                    border-radius:10px;
                    background:${p.fundo};
                    border:1px solid ${p.borda};
                ">

                    <div style="
                        color:${p.cor};
                        font-size:8.5px;
                        font-weight:950;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                    ">
                        Responsável
                    </div>

                    <div style="
                        margin-top:2px;
                        color:#111827;
                        font-size:16px;
                        font-weight:950;
                        line-height:1.1;
                    ">
                        ${escapeHTML(
                            item.responsavel
                            ||
                            'Não informado'
                        )}
                    </div>

                </div>

                <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
                    <div style="min-width:0;">
                        <div style="font-size:11px;color:${p.cor};font-weight:900;text-transform:uppercase;letter-spacing:.05em;">
                            ${atrasado ? 'Compromisso atrasado' : 'Compromisso de hoje'} · ${p.nome}
                        </div>
                        <div style="font-size:13px;font-weight:900;color:#111827;margin-top:4px;">
                            ${escapeHTML(item.titulo)}
                        </div>
                        <div style="font-size:10.5px;color:#64748b;margin-top:4px;">
                            ${dataBR(item.data)}${item.hora ? ` · ${escapeHTML(item.hora)}` : ''}
                        </div>
                        ${item.local ? `<div style="font-size:10px;color:#64748b;margin-top:3px;">📍 ${escapeHTML(item.local)}</div>` : ''}
                    </div>
                </div>
                <div class="agenda-notif-actions">
                    <button style="background:#16a34a;color:#fff;" onclick="marcarCompromissoRealizadoAgenda('${item.id}')">✔ Realizado</button>
                    <button style="background:#7c3aed;color:#fff;" onclick="fecharCentralNotificacoesAgenda();reagendarCompromissoAgenda('${item.id}')">↻ Reagendar</button>
                </div>
            </div>
            `;
        }

        if(n.tipo === 'financeiro-pagar'){
            const qtd = n.dados.itens.length;
            return `
            <div class="agenda-notif-card" style="--notif-cor:#7c3aed;--notif-fundo:#faf5ff;--notif-borda:#e9d5ff;">
                <div style="font-size:11px;color:#7c3aed;font-weight:900;text-transform:uppercase;letter-spacing:.05em;">Financeiro</div>
                <div style="font-size:13px;font-weight:900;color:#111827;margin-top:4px;">
                    Você tem pagamentos para realizar hoje.
                </div>
                <div style="font-size:10.5px;color:#64748b;margin-top:5px;">
                    ${qtd} lançamento(s) · ${moeda(n.dados.total)}
                </div>
                <div class="agenda-notif-actions">
                    <button style="background:#111827;color:#fff;" onclick="okNotificacaoFinanceiraAgenda('Pagar')">OK</button>
                </div>
            </div>
            `;
        }

        const qtd = n.dados.itens.length;
        return `
        <div class="agenda-notif-card" style="--notif-cor:#16a34a;--notif-fundo:#f0fdf4;--notif-borda:#bbf7d0;">
            <div style="font-size:11px;color:#15803d;font-weight:900;text-transform:uppercase;letter-spacing:.05em;">Financeiro</div>
            <div style="font-size:13px;font-weight:900;color:#111827;margin-top:4px;">
                Você tem valores a receber hoje.
            </div>
            <div style="font-size:10.5px;color:#64748b;margin-top:5px;">
                ${qtd} lançamento(s) · ${moeda(n.dados.total)}
            </div>
            <div class="agenda-notif-actions">
                <button style="background:#111827;color:#fff;" onclick="okNotificacaoFinanceiraAgenda('Receber')">OK</button>
            </div>
        </div>
        `;
    }

    /* ===================================================== */
    /* 10.13 CONFIRMAR AVISO FINANCEIRO COM OK               */
    /* ===================================================== */
    /*
        Registra as assinaturas dos lançamentos reconhecidos
        para não repetir o mesmo aviso sem necessidade.
    */

    window.okNotificacaoFinanceiraAgenda = async function(tipo){

        garantirAgendaDB();

        const hoje = dataLocalISO();
        const usuario =
            usuarioAtualAgenda();

        const chave =
            `${usuario?.id || 'sem-usuario'}|${hoje}|${tipo}`;
        const atuais = itensFinanceirosHoje(tipo).map(assinaturaItemFinanceiro);
        const anteriores = Array.isArray(window.db.agendaConfig.financeiroOk[chave])
            ? window.db.agendaConfig.financeiroOk[chave]
            : [];

        window.db.agendaConfig.financeiroOk[chave] = [
            ...new Set([...anteriores, ...atuais])
        ];

        await save();
        atualizarCentralNotificacoesAgenda(false);
    };

    /* ========================================================= */
    /* 11. INICIALIZAÇÃO GLOBAL DA AGENDA                       */
    /* ========================================================= */
    /*
        Ao iniciar:
        - instala estilos
        - monta a central de notificações
        - aguarda o banco ficar disponível
        - faz a primeira atualização
        - atualiza notificações a cada 30 segundos
        - fecha o painel ao clicar fora
    */

    /* ===================================================== */
    /* 11.1 START GLOBAL                                     */
    /* ===================================================== */
    /*
        Aguarda o banco por algumas tentativas e mantém
        atualização periódica de 30 segundos.
    */

    function iniciarAgendaGlobal(){

        instalarEstilosAgenda();
        montarCentralNotificacoesAgenda();

        let tentativas = 0;

        const aguardarDB = setInterval(()=>{
            tentativas++;

            if(
                window.db
                && Array.isArray(window.db.financeiro)
            ){
                clearInterval(aguardarDB);
                garantirAgendaDB();
                atualizarCentralNotificacoesAgenda(true);
            }
            else if(tentativas >= 30){
                clearInterval(aguardarDB);
                garantirAgendaDB();
                atualizarCentralNotificacoesAgenda(false);
            }
        }, 150);

        /*
            Verificação global a cada 5 segundos.

            Isso faz a notificação de Alta Prioridade aparecer
            praticamente no horário marcado, sem depender de
            trocar de tela ou aguardar até 30 segundos.
        */

        setInterval(()=>{
            try{
                atualizarCentralNotificacoesAgenda(false);
            }
            catch(e){
                console.error('Agenda - notificações:', e);
            }
        }, 5000);

        document.addEventListener('click', event => {

            /*
                Clique fora fecha SOMENTE o painel do sininho.

                O alerta de Alta Prioridade não participa desta regra
                e, portanto, não pode ser dispensado clicando fora.
            */

            const root =
                document.getElementById(
                    'agenda-notificacao-root'
                );

            if(
                root
                &&
                window.agendaPainelAberto
                &&
                !root.contains(
                    event.target
                )
            ){

                fecharCentralNotificacoesAgenda();
            }
        });
    }

    /* ========================================================= */
    /* 12. REGISTRO DA PÁGINA E START                           */
    /* ========================================================= */
    /*
        Registra "agenda" no sistema de páginas do Dominus.

        Depois inicia a Agenda quando o DOM estiver pronto.
    */

    if(typeof window.registerPage === 'function'){
        registerPage('agenda', window.renderAgenda);
    }
    else{
        console.error('Agenda: registerPage não encontrado.');
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciarAgendaGlobal);
    }
    else{
        iniciarAgendaGlobal();
    }

    console.log('Agenda Dominus carregada.');

})();
