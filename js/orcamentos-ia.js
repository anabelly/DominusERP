/* ===================================================== */
/* DOMINUS ERP - ASSISTENTE IA DE ORÇAMENTOS             */
/* ===================================================== */

(function () {

    'use strict';


    const IA =
        {};


    window.OrcamentosIA =
        IA;


    window.chatIAOrcamento =
        null;


    /* ================================================= */
    /* HELPERS                                           */
    /* ================================================= */

    IA.numero =
    function(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ''
        ) {
            return 0;
        }


        const n =
            Number(
                String(valor)
                .replace(',', '.')
            );


        return Number.isFinite(n)
            ? n
            : 0;
    };


    IA.moeda =
    function(valor) {

        return new Intl.NumberFormat(

            'pt-BR',

            {

                style:
                    'currency',

                currency:
                    'BRL'
            }

        )
        .format(
            IA.numero(
                valor
            )
        );
    };


    IA.esc =
    function(valor) {

        return String(
            valor ?? ''
        )
        .replaceAll(
            '&',
            '&amp;'
        )
        .replaceAll(
            '<',
            '&lt;'
        )
        .replaceAll(
            '>',
            '&gt;'
        )
        .replaceAll(
            '"',
            '&quot;'
        )
        .replaceAll(
            "'",
            '&#039;'
        );
    };


    IA.formatarMensagem =
    function(texto) {

        return IA
        .esc(
            texto
        )
        .replace(
            /\n/g,
            '<br>'
        );
    };


    /* ================================================= */
    /* ESTADO INICIAL                                    */
    /* ================================================= */

    IA.estadoInicial =
    function() {

        const p =
            window.db
                ?.centroCustos
                ?.parametros
            || {};


        return {

            clienteNome:
                '',

            clienteConfirmado:
                false,

            ac:
                '',

            servico:
                '',

            descricaoServico:
                '',

            enderecoDestino:
                '',

            idaVolta:
                true,

            veiculoId:
                '',

            materiais:
                [],

            maoDeObra:
                [],

            equipamentos:
                [],

            alugueis:
                [],

            outrosCustos:
                [],

            validade:
                '',

            prazoEntrega:
                '',

            formaPagamento:
                '',

            temNota:
                'sim',

            preContrato:
                'nao',

            observacoes:
                '',

            margemPercentual:
                IA.numero(
                    p.margemLucroPercentual
                ),

            metodoMargem:
                p.metodoMargem
                ||
                'acrescimo',

            precoFinalManual:
                0,

            solicitarRota:
                false,

            prontoParaGerar:
                false,

            confirmacaoGerar:
                false
        };
    };


    IA.criarSessao =
    function() {

        return {

            mensagens: [

                {

                    role:
                        'assistant',

                    content:
                        'Olá! 🤖 Me conte o que você precisa orçar. Pode escrever normalmente: cliente, serviço, medidas, endereço de instalação ou qualquer informação que você já tenha.'
                }

            ],

            estado:
                IA.estadoInicial(),

            rota:
                null,

            calculo:
                null,

            erroRota:
                '',

            aguardando:
                false,

            finalizado:
                false,

            modelo:
                ''
        };
    };


    /* ================================================= */
    /* ABRIR CHAT                                        */
    /* ================================================= */

    window.abrirAssistenteOrcamentoIA =
    async function() {

        window.chatIAOrcamento =
            IA.criarSessao();


        IA.renderChat();


        await IA.verificarStatus();
    };


    /* ================================================= */
    /* STATUS                                            */
    /* ================================================= */

    IA.verificarStatus =
    async function() {

        try {

            const response =
                await fetch(
                    `${API_URL}/ia/status`
                );


            const status =
                await response.json();


            const sessao =
                window.chatIAOrcamento;


            if (!sessao) {
                return;
            }


            sessao.modelo =
                status.modelo || '';


            if (
                !status.openaiConfigurada
            ) {

                sessao.mensagens.push({

                    role:
                        'assistant',

                    content:
                        '⚠️ A OpenAI ainda não está configurada no computador servidor. Configure a OPENAI_API_KEY para ativar a conversa.'
                });


                IA.atualizarMensagens();

                return;
            }


            if (
                !status.rotaConfigurada
            ) {

                sessao.mensagens.push({

                    role:
                        'assistant',

                    content:
                        'ℹ️ A IA está disponível, mas o cálculo automático de endereço e quilometragem ainda precisa da HEIGIT_API_KEY no servidor.'
                });


                IA.atualizarMensagens();
            }

        }

        catch(err) {

            console.error(
                'Status IA:',
                err
            );
        }
    };


    /* ================================================= */
    /* RENDER CHAT                                       */
    /* ================================================= */

    IA.renderChat =
    function() {

        configModal({

            title:
                '🤖 Assistente IA - Orçamento',

            hideConfirm:
                true,

            body: `

<div style="
display:flex;
flex-direction:column;
gap:12px;
">

    <div style="
        background:#f5f3ff;
        border:1px solid #ddd6fe;
        border-radius:12px;
        padding:12px 14px;
        color:#5b21b6;
        font-size:12px;
        line-height:1.5;
    ">

        Converse normalmente.
        A IA consulta os cadastros do Dominus,
        calcula custos e pergunta apenas
        o que estiver faltando.

    </div>


    <div
        id="chat-ia-mensagens"
        style="
            height:470px;
            overflow-y:auto;
            padding:14px;
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:12px;
        ">
    </div>


    <div
        id="chat-ia-status"
        style="
            min-height:18px;
            padding:0 3px;
            color:#6b7280;
            font-size:11px;
        ">
    </div>


    <div style="
        display:grid;
        grid-template-columns:1fr auto;
        gap:10px;
        align-items:end;
    ">

        <textarea
            id="entrada-chat-ia"
            rows="2"
            placeholder="Digite sua mensagem..."
            style="
                resize:none;
                min-height:48px;
                max-height:130px;
            "
            oninput="
                this.style.height='auto';
                this.style.height=Math.min(this.scrollHeight,130)+'px';
            "
            onkeydown="
                if(
                    event.key==='Enter'
                    &&
                    !event.shiftKey
                ){
                    event.preventDefault();
                    enviarMensagemIA();
                }
            ">
        </textarea>


        <button
            id="btn-enviar-chat-ia"
            class="btn-action"
            type="button"
            style="
                background:#7c3aed;
                height:48px;
                min-width:90px;
            "
            onclick="enviarMensagemIA()">

            Enviar

        </button>

    </div>


    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
    ">

        <button
            type="button"
            onclick="reiniciarConversaOrcamentoIA()"
            style="
                border:none;
                background:transparent;
                color:#6b7280;
                cursor:pointer;
                font-size:12px;
                padding:4px 0;
            ">

            ↻ Reiniciar conversa

        </button>


        <div
            id="chat-ia-modelo"
            style="
                color:#9ca3af;
                font-size:10px;
            ">
        </div>

    </div>

</div>
            `
        });


        IA.atualizarMensagens();


        setTimeout(
            () => {

                document
                .getElementById(
                    'entrada-chat-ia'
                )
                ?.focus();

            },
            100
        );
    };
        /* ================================================= */
    /* ATUALIZAR MENSAGENS                               */
    /* ================================================= */

    IA.atualizarMensagens =
    function() {

        const sessao =
            window.chatIAOrcamento;


        const box =
            document.getElementById(
                'chat-ia-mensagens'
            );


        if (
            !sessao ||
            !box
        ) {
            return;
        }


        box.innerHTML =

            sessao.mensagens
            .map(msg => {

                const ehIA =
                    msg.role
                    ===
                    'assistant';


                return `

<div style="
display:flex;
justify-content:${
    ehIA
    ?
    'flex-start'
    :
    'flex-end'
};
margin-bottom:12px;
">

    <div style="
        max-width:82%;
        padding:11px 14px;

        border-radius:${
            ehIA
            ?
            '14px 14px 14px 4px'
            :
            '14px 14px 4px 14px'
        };

        background:${
            ehIA
            ?
            '#f3f4f6'
            :
            '#7c3aed'
        };

        color:${
            ehIA
            ?
            '#111827'
            :
            '#fff'
        };

        font-size:14px;
        line-height:1.55;
        word-break:break-word;
    ">

        ${
            IA.formatarMensagem(
                msg.content
            )
        }

    </div>

</div>
                `;

            })
            .join('');


        /* ========================= */
        /* PENSANDO                  */
        /* ========================= */

        if (
            sessao.aguardando
        ) {

            box.insertAdjacentHTML(

                'beforeend',

                `

<div style="
display:flex;
justify-content:flex-start;
margin-bottom:12px;
">

    <div style="
        background:#f3f4f6;
        color:#6b7280;
        padding:10px 14px;
        border-radius:14px 14px 14px 4px;
        font-size:13px;
    ">

        Pensando...

    </div>

</div>
                `
            );
        }


        box.scrollTop =
            box.scrollHeight;


        /* ========================= */
        /* STATUS                    */
        /* ========================= */

        const status =
            document.getElementById(
                'chat-ia-status'
            );


        if (status) {

            if (
                sessao.aguardando
            ) {

                status.innerText =
                    'Consultando os dados do ERP e realizando os cálculos...';

            }

            else if (
                sessao.erroRota
            ) {

                status.innerText =
                    `Rota: ${sessao.erroRota}`;

            }

            else if (
                sessao.rota
                    ?.calculada
            ) {

                status.innerText =

                    `Rota: ${
                        sessao.rota
                            .distanciaIdaKm
                    } km de ida • ${
                        sessao.rota
                            .distanciaTotalKm
                    } km considerados`;
            }

            else {

                status.innerText =
                    '';
            }
        }


        /* ========================= */
        /* MODELO                    */
        /* ========================= */

        const modelo =
            document.getElementById(
                'chat-ia-modelo'
            );


        if (modelo) {

            modelo.innerText =
                sessao.modelo
                ?
                `IA: ${sessao.modelo}`
                :
                '';
        }


        /* ========================= */
        /* BLOQUEAR ENQUANTO PENSA   */
        /* ========================= */

        const input =
            document.getElementById(
                'entrada-chat-ia'
            );


        const botao =
            document.getElementById(
                'btn-enviar-chat-ia'
            );


        const bloquear =
            sessao.aguardando
            ||
            sessao.finalizado;


        if (input) {

            input.disabled =
                bloquear;
        }


        if (botao) {

            botao.disabled =
                bloquear;


            botao.style.opacity =
                bloquear
                ?
                '0.6'
                :
                '1';
        }
    };


    /* ================================================= */
    /* ENVIAR                                            */
    /* ================================================= */

    window.enviarMensagemIA =
    async function() {

        const sessao =
            window.chatIAOrcamento;


        if (
            !sessao
            ||
            sessao.aguardando
            ||
            sessao.finalizado
        ) {
            return;
        }


        const input =
            document.getElementById(
                'entrada-chat-ia'
            );


        if (!input) {
            return;
        }


        const texto =
            input.value.trim();


        if (!texto) {
            return;
        }


        input.value =
            '';


        input.style.height =
            'auto';


        sessao.mensagens.push({

            role:
                'user',

            content:
                texto
        });


        sessao.aguardando =
            true;


        sessao.erroRota =
            '';


        IA.atualizarMensagens();


        try {

            const response =
                await fetch(

                    `${API_URL}/ia/orcamento`,

                    {

                        method:
                            'POST',

                        headers: {

                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({

                                mensagem:
                                    texto,

                                mensagens:
                                    sessao
                                    .mensagens
                                    .slice(-24),

                                estado:
                                    sessao.estado,

                                rota:
                                    sessao.rota
                            })
                    }
                );


            const dados =
                await response.json();


            if (
                !response.ok
                ||
                !dados.ok
            ) {

                throw new Error(
                    dados.erro
                    ||
                    `Erro ${response.status}`
                );
            }


            sessao.estado =
                dados.estado;


            sessao.rota =
                dados.rota
                || null;


            sessao.calculo =
                dados.calculo
                || null;


            sessao.erroRota =
                dados.erroRota
                || '';


            sessao.modelo =
                dados.modelo
                || sessao.modelo;


            sessao.mensagens.push({

                role:
                    'assistant',

                content:
                    dados.resposta
                    ||
                    'Certo.'
            });


            sessao.aguardando =
                false;


            IA.atualizarMensagens();


            if (
                dados.gerarOrcamento
            ) {

                await IA.gerarOrcamento(
                    dados
                );
            }

        }

        catch(err) {

            console.error(
                'Erro IA:',
                err
            );


            sessao.aguardando =
                false;


            sessao.mensagens.push({

                role:
                    'assistant',

                content:
                    `Não consegui processar essa mensagem. ${err.message}`
            });


            IA.atualizarMensagens();
        }
    };


    /* ================================================= */
    /* REINICIAR                                         */
    /* ================================================= */

    window.reiniciarConversaOrcamentoIA =
    function() {

        const confirmar =
            confirm(
                'Deseja apagar a conversa e começar novamente?'
            );


        if (!confirmar) {
            return;
        }


        window.chatIAOrcamento =
            IA.criarSessao();


        IA.renderChat();


        IA.verificarStatus();
    };
        /* ================================================= */
    /* DESCRIÇÃO COMERCIAL                               */
    /* ================================================= */

    IA.descricaoComercial =
    function(estado) {

        const partes =
            [];


        if (
            estado.servico
        ) {

            partes.push(
                estado.servico
            );
        }


        if (
            estado.descricaoServico
        ) {

            partes.push(
                estado.descricaoServico
            );
        }


        if (
            estado.enderecoDestino
        ) {

            partes.push(
                `Local: ${estado.enderecoDestino}`
            );
        }


        return partes
        .filter(Boolean)
        .join('\n\n');
    };


    /* ================================================= */
    /* GERAR ORÇAMENTO                                   */
    /* ================================================= */

    IA.gerarOrcamento =
    async function(
        resposta
    ) {

        const sessao =
            window.chatIAOrcamento;


        if (
            !sessao
            ||
            sessao.finalizado
        ) {
            return;
        }


        const estado =
            resposta.estado;


        const calculo =
            resposta.calculo;


        if (
            !estado
            ||
            !calculo?.resumo
        ) {

            throw new Error(
                'A IA não retornou os dados finais do orçamento.'
            );
        }


        const cliente =
            (
                window.db.clientes
                || []
            )
            .find(
                c =>
                    c.nome
                    ===
                    estado.clienteNome
            );


        if (!cliente) {

            throw new Error(
                'Cliente não encontrado no cadastro.'
            );
        }


        if (
            !Array.isArray(
                window.db.orcamentos
            )
        ) {

            window.db.orcamentos =
                [];
        }


        const codigo =

            typeof
            window.obterProximoCodigoOrcamento
            ===
            'function'

            ?

            window
            .obterProximoCodigoOrcamento()

            :

            (
                Number(
                    window.db
                        .ultimoOrcamento
                    || 3687
                )
                +
                1
            );


        const precoBase =
            IA.numero(
                calculo
                    .resumo
                    .precoBaseCliente
            );


        const total =
            IA.numero(
                calculo
                    .resumo
                    .totalCliente
            );


        if (
            precoBase <= 0
            ||
            total <= 0
        ) {

            throw new Error(
                'O preço final calculado é inválido.'
            );
        }


        let observacoes =
            estado.observacoes
            || '';


        /* ========================= */
        /* REGRA ATUAL NOTA          */
        /* ========================= */

        if (
            estado.temNota
            ===
            'nao'
        ) {

            const texto =

                `Valor total do orçamento ${
                    IA.moeda(
                        precoBase
                    )
                } acrescido do valor de imposto.`;


            observacoes =
                observacoes.trim()
                ?
                `${observacoes.trim()}\n\n${texto}`
                :
                texto;
        }


        const novoOrcamento = {

            codigo,

            data:

                new Date()
                .toISOString()
                .split('T')[0],


            cliente:
                estado.clienteNome,


            ac:
                estado.ac
                || '',


            telefone:
                cliente.telefone
                || '',


            email:
                cliente.email
                || '',


            validade:
                estado.validade
                || '',


            prazo:
                estado.formaPagamento
                || '',


            prazoEntrega:
                estado.prazoEntrega
                || '',


            temNota:
                estado.temNota
                || 'sim',


            status:
                'Aguardando',


            preContrato:
                estado.preContrato
                || 'nao',


            observacoes,


            itens: [

                {

                    produto:

                        IA.descricaoComercial(
                            estado
                        ),


                    qtd:
                        1,


                    valor:
                        precoBase,


                    total:
                        precoBase
                }

            ],


            total,


            /* ========================= */
            /* DADOS INTERNOS DA IA      */
            /* ========================= */

            criadoComIA:
                true,


            origem:
                'IA',


            dadosIA:

                JSON.parse(
                    JSON.stringify(
                        estado
                    )
                ),


            rotaIA:

                resposta.rota
                ?

                JSON.parse(
                    JSON.stringify(
                        resposta.rota
                    )
                )

                :

                null,


            calculoInterno:

                JSON.parse(
                    JSON.stringify(
                        calculo
                    )
                )
        };


        window.db.orcamentos.push(
            novoOrcamento
        );


        window.db.ultimoOrcamento =
            novoOrcamento.codigo;


        sessao.finalizado =
            true;


        sessao.mensagens.push({

            role:
                'assistant',

            content:

                `✅ Orçamento ${
                    novoOrcamento.codigo
                } criado com sucesso. Total: ${
                    IA.moeda(
                        novoOrcamento.total
                    )
                }.`
        });


        IA.atualizarMensagens();


        await save();


        setTimeout(
            async () => {

                closeModal();


                await navigate(
                    'orcamentos',
                    false
                );


                alert(
                    `Orçamento ${novoOrcamento.codigo} criado com sucesso.`
                );

            },
            700
        );
    };


    /* ================================================= */
    /* DEBUG                                             */
    /* ================================================= */

    window.verDadosOrcamentoIA =
    function() {

        console.log(
            window.chatIAOrcamento
        );


        return window
            .chatIAOrcamento;
    };


})();