/* ===================================================== */
/* DOMINUS ERP - AGENDA + CENTRAL DE NOTIFICAÇÕES       */
/* ===================================================== */

(function(){

    'use strict';

    /* ================================================= */
    /* ESTADO                                            */
    /* ================================================= */

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

    /* ================================================= */
    /* NORMALIZAÇÃO DO DB                                */
    /* ================================================= */

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

        window.db.agenda = window.db.agenda.map(item=>({
            id: String(item?.id || gerarIdAgenda()),
            titulo: String(item?.titulo || '').trim(),
            data: String(item?.data || ''),
            hora: String(item?.hora || ''),
            horaFim: String(item?.horaFim || ''),
            local: String(item?.local || ''),
            prioridade: normalizarPrioridade(item?.prioridade),
            descricao: String(item?.descricao || ''),
            status: normalizarStatusAgenda(item?.status),
            criadoEm: item?.criadoEm || new Date().toISOString(),
            atualizadoEm: item?.atualizadoEm || null,
            realizadoEm: item?.realizadoEm || null,
            historicoReagendamentos:
                Array.isArray(item?.historicoReagendamentos)
                ? item.historicoReagendamentos
                : []
        }));
    }

    function normalizarPrioridade(valor){
        const v = String(valor || '').toLowerCase();
        if(v === 'baixa' || v === 'media' || v === 'alta'){
            return v;
        }
        return 'media';
    }

    function normalizarStatusAgenda(valor){
        const v = String(valor || '').toLowerCase();
        return v === 'realizado' ? 'realizado' : 'agendado';
    }

    function gerarIdAgenda(){
        return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }

    /* ================================================= */
    /* HELPERS                                           */
    /* ================================================= */

    function escapeHTML(valor){
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function dataLocalISO(data = new Date()){
        return [
            data.getFullYear(),
            String(data.getMonth() + 1).padStart(2, '0'),
            String(data.getDate()).padStart(2, '0')
        ].join('-');
    }

    function dataBR(data){
        if(!data) return '-';
        const p = String(data).split('-');
        if(p.length !== 3) return escapeHTML(data);
        return `${p[2]}/${p[1]}/${p[0]}`;
    }

    function moeda(valor){
        return Number(valor || 0).toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );
    }

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

    function prioridadeInfo(valor){
        return PRIORIDADES[normalizarPrioridade(valor)] || PRIORIDADES.media;
    }

    function chaveDataHora(item){
        return `${item.data || '9999-12-31'} ${item.hora || '23:59'}`;
    }

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

    function encontrarCompromisso(id){
        garantirAgendaDB();
        return window.db.agenda.find(item => String(item.id) === String(id));
    }

    function indexCompromisso(id){
        garantirAgendaDB();
        return window.db.agenda.findIndex(item => String(item.id) === String(id));
    }

    function atualizarPaginaAgendaSeAberta(){
        if(window.currentPage === 'agenda'){
            navigate('agenda', false);
        }
    }

    function agoraHora(){
        const d = new Date();
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    function diasEntreHoje(dataISO){
        if(!dataISO) return 0;
        const hoje = dataLocalISO();
        const a = new Date(`${hoje}T12:00:00`);
        const b = new Date(`${dataISO}T12:00:00`);
        return Math.round((b - a) / 86400000);
    }

    /* ================================================= */
    /* CSS                                               */
    /* ================================================= */

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
                #agenda-notificacao-root{
                    display:none!important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ================================================= */
    /* RENDER DA TELA                                    */
    /* ================================================= */

    window.renderAgenda = function(){

        garantirAgendaDB();
        instalarEstilosAgenda();

        const hoje = dataLocalISO();
        const fim7 = new Date();
        fim7.setDate(fim7.getDate() + 7);
        const fim7ISO = dataLocalISO(fim7);

        const agendados = window.db.agenda.filter(item => item.status === 'agendado');
        const hojeQtd = agendados.filter(item => item.data === hoje).length;
        const proximos7 = agendados.filter(item => item.data >= hoje && item.data <= fim7ISO).length;
        const altaQtd = agendados.filter(item => item.prioridade === 'alta' && item.data >= hoje).length;
        const atrasados = agendados.filter(item => item.data < hoje).length;

        const filtros = window.agendaFiltros;

        let lista = [...window.db.agenda];

        if(filtros.texto){
            const t = filtros.texto.toLowerCase();
            lista = lista.filter(item =>
                String(item.titulo || '').toLowerCase().includes(t)
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
                        Compromissos, prioridades e lembretes do dia
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
            const itens = window.db.agenda
                .filter(item => item.data === data)
                .sort(compararCompromissos);

            const eventos = itens.slice(0,3).map(item => {
                const p = prioridadeInfo(item.prioridade);
                return `
                    <button
                        class="agenda-mini-evento ${item.status === 'realizado' ? 'realizado' : ''}"
                        style="--agenda-cor:${p.cor};--agenda-fundo:${p.fundo};"
                        title="${escapeHTML(item.titulo)}"
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

    function renderProximosAgenda(){

        const hoje = dataLocalISO();
        const itens = window.db.agenda
            .filter(item => item.status === 'agendado' && item.data >= hoje)
            .sort(compararCompromissos)
            .slice(0,8);

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

    /* ================================================= */
    /* NAVEGAÇÃO / FILTROS                               */
    /* ================================================= */

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

    window.irMesAtualAgenda = function(){
        const d = new Date();
        window.agendaMesVisual = {
            ano: d.getFullYear(),
            mes: d.getMonth()
        };
        navigate('agenda', false);
    };

    let timerFiltroAgenda = null;

    window.alterarFiltroAgenda = function(campo, valor){
        window.agendaFiltros[campo] = valor || '';

        clearTimeout(timerFiltroAgenda);
        timerFiltroAgenda = setTimeout(()=>{
            navigate('agenda', false);
        }, campo === 'texto' ? 280 : 0);
    };

    /* ================================================= */
    /* CADASTRO / EDIÇÃO                                 */
    /* ================================================= */

    window.abrirNovoCompromissoAgenda = function(){
        abrirFormularioCompromissoAgenda(null);
    };

    window.editarCompromissoAgenda = function(id){
        abrirFormularioCompromissoAgenda(encontrarCompromisso(id));
    };

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

    window.salvarCompromissoAgenda = async function(id = null){

        garantirAgendaDB();

        const titulo = document.getElementById('agenda-titulo')?.value.trim() || '';
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
                titulo,
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
                titulo,
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

    /* ================================================= */
    /* VISUALIZAR                                        */
    /* ================================================= */

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

    /* ================================================= */
    /* REALIZADO / REAGENDAR / EXCLUIR                   */
    /* ================================================= */

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

    window.reagendarCompromissoAgenda = function(id){

        const item = encontrarCompromisso(id);
        if(!item) return;

        const html = `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                <div style="font-size:12px;font-weight:900;color:#111827;">${escapeHTML(item.titulo)}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px;">
                    Atual: ${dataBR(item.data)} às ${escapeHTML(item.hora)}
                </div>
            </div>

            <div class="form-row">
                <div>
                    <label>Nova data *</label>
                    <input type="date" id="agenda-reagendar-data" value="${escapeHTML(item.data)}">
                </div>
                <div>
                    <label>Nova hora *</label>
                    <input type="time" id="agenda-reagendar-hora" value="${escapeHTML(item.hora)}">
                </div>
            </div>
        </div>
        `;

        configModal({
            title: 'Reagendar compromisso',
            body: html,
            confirmText: 'Confirmar reagendamento',
            onConfirm: ()=> confirmarReagendamentoAgenda(id)
        });
    };

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
    };

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

    /* ================================================= */
    /* CENTRAL DE NOTIFICAÇÕES                           */
    /* ================================================= */

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

    function avisoFinanceiroPendente(tipo){

        const itens = itensFinanceirosHoje(tipo);
        if(!itens.length) return null;

        const hoje = dataLocalISO();
        const chave = `${hoje}|${tipo}`;
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

    function construirNotificacoesAgenda(){

        garantirAgendaDB();

        const hoje = dataLocalISO();
        const notificacoes = [];

        window.db.agenda
            .filter(item => item.status === 'agendado' && item.data && item.data <= hoje)
            .sort(compararCompromissos)
            .forEach(item => {
                notificacoes.push({
                    tipo: 'compromisso',
                    id: item.id,
                    item
                });
            });

        const pagar = avisoFinanceiroPendente('Pagar');
        if(pagar){
            notificacoes.push({
                tipo: 'financeiro-pagar',
                dados: pagar
            });
        }

        const receber = avisoFinanceiroPendente('Receber');
        if(receber){
            notificacoes.push({
                tipo: 'financeiro-receber',
                dados: receber
            });
        }

        return notificacoes;
    }

    function assinaturaNotificacoes(lista){
        return lista.map(n => {
            if(n.tipo === 'compromisso'){
                return `C:${n.id}:${n.item.data}:${n.item.hora}:${n.item.status}`;
            }
            return `${n.tipo}:${n.dados.assinaturas.join(',')}`;
        }).join('||');
    }

    window.toggleCentralNotificacoesAgenda = function(event){
        if(event) event.stopPropagation();
        window.agendaPainelAberto = !window.agendaPainelAberto;
        aplicarEstadoPainelNotificacoes();
    };

    function aplicarEstadoPainelNotificacoes(){
        const painel = document.getElementById('agenda-notificacao-painel');
        if(!painel) return;
        painel.classList.toggle('aberto', !!window.agendaPainelAberto);
    }

    window.fecharCentralNotificacoesAgenda = function(){
        window.agendaPainelAberto = false;
        aplicarEstadoPainelNotificacoes();
    };

    window.atualizarCentralNotificacoesAgenda = function(autoAbrir = false){

        montarCentralNotificacoesAgenda();
        garantirAgendaDB();

        const painel = document.getElementById('agenda-notificacao-painel');
        const badge = document.getElementById('agenda-notificacao-badge');
        if(!painel || !badge) return;

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
    };

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

    function renderNotificacaoAgenda(n){

        if(n.tipo === 'compromisso'){
            const item = n.item;
            const p = prioridadeInfo(item.prioridade);
            const atrasado = item.data < dataLocalISO();

            return `
            <div class="agenda-notif-card" style="--notif-cor:${p.cor};--notif-fundo:${p.fundo};--notif-borda:${p.borda};">
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

    window.okNotificacaoFinanceiraAgenda = async function(tipo){

        garantirAgendaDB();

        const hoje = dataLocalISO();
        const chave = `${hoje}|${tipo}`;
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

    /* ================================================= */
    /* INICIALIZAÇÃO GLOBAL                              */
    /* ================================================= */

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

        setInterval(()=>{
            try{
                atualizarCentralNotificacoesAgenda(false);
            }
            catch(e){
                console.error('Agenda - notificações:', e);
            }
        }, 30000);

        document.addEventListener('click', event => {
            const root = document.getElementById('agenda-notificacao-root');
            if(
                root
                && window.agendaPainelAberto
                && !root.contains(event.target)
            ){
                fecharCentralNotificacoesAgenda();
            }
        });
    }

    /* ================================================= */
    /* REGISTRAR PÁGINA                                  */
    /* ================================================= */

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
