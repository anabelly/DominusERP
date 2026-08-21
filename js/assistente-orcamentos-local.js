/* ===================================================== */
/* DOMINUS ERP - ASSISTENTE LOCAL DE ORÇAMENTOS          */
/* IA PRÓPRIA POR REGRAS + DADOS INTERNOS DO ERP         */
/* ===================================================== */

'use strict';

(function () {


    /* ========================= */
    /* HELPERS */
    /* ========================= */

    const A =
        v =>
            Array.isArray(v)
            ?
            v
            :
            [];


    function n(v) {

        if (
            v === null
            ||
            v === undefined
            ||
            v === ''
        ) {

            return 0;

        }


        let s =
            String(v)
            .trim();


        if (
            s.includes(',')
        ) {

            s =
                s
                .replace(
                    /\./g,
                    ''
                )
                .replace(
                    ',',
                    '.'
                );

        }


        s =
            s.replace(
                /[^0-9.-]/g,
                ''
            );


        const x =
            Number(s);


        return Number.isFinite(x)
            ?
            x
            :
            0;

    }


    function round(
        v,
        c = 2
    ) {

        const f =
            10 ** c;


        return Math.round(

            (
                n(v)
                +
                Number.EPSILON
            )

            *

            f

        )
        /
        f;

    }


    function norm(v) {

        return String(
            v || ''
        )
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9\s.,x×/+-]/g,
            ' '
        )
        .replace(
            /\s+/g,
            ' '
        )
        .trim();

    }


    function esc(v) {

        return String(
            v ?? ''
        )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

    }


    function money(v) {

        return Number(
            v || 0
        )
        .toLocaleString(

            'pt-BR',

            {

                style:
                    'currency',

                currency:
                    'BRL'

            }

        );

    }


    function brNum(
        v,
        casas = 2
    ) {

        return Number(
            v || 0
        )
        .toLocaleString(

            'pt-BR',

            {

                minimumFractionDigits:
                    casas,

                maximumFractionDigits:
                    casas

            }

        );

    }


    function sim(v) {

        return [

            'sim',
            's',
            '1',
            'pode',
            'isso',
            'certo',
            'ok'

        ]
        .includes(
            norm(v)
        );

    }


    function nao(v) {

        return [

            'nao',
            'n',
            '2'

        ]
        .includes(
            norm(v)
        );

    }


    function pular(v) {

        return [

            'pular',
            'pula',
            'sem informar',
            'deixar em branco'

        ]
        .includes(
            norm(v)
        );

    }


    function hoje() {

        return new Date()
            .toISOString()
            .split('T')[0];

    }


    function somarDias(
        qtd
    ) {

        const d =
            new Date();


        d.setHours(
            12,
            0,
            0,
            0
        );


        d.setDate(
            d.getDate()
            +
            Number(
                qtd || 0
            )
        );


        return d
            .toISOString()
            .split('T')[0];

    }


    function parseNumeroLivre(
        texto
    ) {

        const m =
            String(
                texto || ''
            )
            .match(
                /-?\d[\d.,]*/
            );


        return m
            ?
            n(
                m[0]
            )
            :
            0;

    }


    function parseHoras(
        texto
    ) {

        const m =
            norm(texto)
            .match(
                /(\d+(?:[.,]\d+)?)\s*(?:h|hora|horas)\b/
            );


        return m
            ?
            n(
                m[1]
            )
            :
            parseNumeroLivre(
                texto
            );

    }


    function parseKm(
        texto
    ) {

        const m =
            norm(texto)
            .match(
                /(\d+(?:[.,]\d+)?)\s*(?:km|quilometro|quilometros)\b/
            );


        return m
            ?
            n(
                m[1]
            )
            :
            parseNumeroLivre(
                texto
            );

    }


    function parseMedida(
        texto
    ) {

        const m =
            String(
                texto || ''
            )
            .match(

                /(\d+(?:[.,]\d+)?)\s*(?:m)?\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:m)?/

            );


        if (!m) {

            return null;

        }


        const largura =
            n(
                m[1]
            );


        const altura =
            n(
                m[2]
            );


        if (
            !(
                largura > 0
                &&
                altura > 0
            )
        ) {

            return null;

        }


        return {

            largura,

            altura,

            area:
                round(
                    largura
                    *
                    altura,
                    3
                ),

            texto:
                `${brNum(largura)} x ${brNum(altura)} m`

        };

    }


    function parseValidade(
        texto
    ) {

        const raw =
            String(
                texto || ''
            )
            .trim();


        if (
            /^\d{4}-\d{2}-\d{2}$/
            .test(raw)
        ) {

            return raw;

        }


        const m =
            norm(texto)
            .match(
                /(\d+)\s*dias?/
            );


        return m
            ?
            somarDias(
                Number(
                    m[1]
                )
            )
            :
            '';

    }


    function tokens(v) {

        return norm(v)
            .split(' ')
            .filter(
                x =>
                    x.length >= 2
            );

    }


    function score(
        query,
        target
    ) {

        const q =
            norm(query);


        const t =
            norm(target);


        if (
            !q
            ||
            !t
        ) {

            return 0;

        }


        if (
            q === t
        ) {

            return 2000;

        }


        let pontos =
            0;


        if (
            t.includes(q)
        ) {

            pontos +=
                1000;

        }


        const tt =
            new Set(
                tokens(t)
            );


        for (
            const palavra
            of tokens(q)
        ) {

            if (
                tt.has(
                    palavra
                )
            ) {

                pontos +=
                    180;

            }
            else if (
                [
                    ...tt
                ]
                .some(

                    x =>
                        x.includes(
                            palavra
                        )
                        ||
                        palavra.includes(
                            x
                        )

                )
            ) {

                pontos +=
                    70;

            }

        }


        return pontos;

    }


    function buscar(
        query,
        itens,
        textoFn
    ) {

        return A(itens)

            .map(

                item => ({

                    item,

                    score:
                        score(
                            query,
                            textoFn(item)
                        )

                })

            )

            .filter(
                x =>
                    x.score > 0
            )

            .sort(
                (
                    a,
                    b
                ) =>
                    b.score
                    -
                    a.score
            );

    }


    function escolhaNumero(
        texto,
        opcoes
    ) {

        const t =
            String(
                texto || ''
            )
            .trim();


        if (
            !/^\d+$/
            .test(t)
        ) {

            return null;

        }


        return opcoes?.[
            Number(t) - 1
        ]
        ||
        null;

    }


    /* ========================= */
    /* DADOS DO ERP */
    /* ========================= */


    function centroCustos() {

        const cc =
            window.db
                ?.centroCustos
            ||
            {};


        return {

            enderecoOrigem:
                cc.enderecoOrigem
                ||
                {},


            combustiveis:
                A(
                    cc.combustiveis
                ),


            veiculos:
                A(
                    cc.veiculos
                ),


            equipamentos:
                A(
                    cc.equipamentos
                ),


            maoDeObra:{

                horasMensais:
                    n(
                        cc.maoDeObra
                            ?.horasMensais
                    )
                    ||
                    220,


                encargosPercentual:
                    n(
                        cc.maoDeObra
                            ?.encargosPercentual
                    )

            },


            parametros:{

                desperdicioPercentual:
                    n(
                        cc.parametros
                            ?.desperdicioPercentual
                    ),


                administrativoPercentual:
                    n(
                        cc.parametros
                            ?.administrativoPercentual
                    ),


                margemLucroPercentual:
                    n(
                        cc.parametros
                            ?.margemLucroPercentual
                    ),


                metodoMargem:
                    cc.parametros
                        ?.metodoMargem
                    ===
                    'margem'

                    ?

                    'margem'

                    :

                    'acrescimo'

            }

        };

    }


    function enderecoOrigemTexto() {

        const e =
            centroCustos()
                .enderecoOrigem;


        return [

            [
                e.logradouro,
                e.numero
            ]
            .filter(Boolean)
            .join(', '),

            e.bairro,

            [
                e.cidade,
                e.uf
            ]
            .filter(Boolean)
            .join(' - '),

            e.cep
                ?
                `CEP ${e.cep}`
                :
                ''

        ]
        .filter(Boolean)
        .join(', ');

    }


    function enderecoClienteTexto(
        cliente
    ) {

        if (!cliente) {

            return '';

        }


        return [

            [
                cliente.endereco,
                cliente.numero
            ]
            .filter(Boolean)
            .join(', '),

            cliente.bairro,

            [
                cliente.cidade,
                cliente.estado
                ||
                cliente.uf
            ]
            .filter(Boolean)
            .join(' - '),

            cliente.cep
                ?
                `CEP ${cliente.cep}`
                :
                ''

        ]
        .filter(Boolean)
        .join(', ');

    }


    function clienteAtual(s) {

        return A(
            window.db
                ?.clientes
        )
        .find(

            c =>
                String(
                    c.codigo ?? ''
                )
                ===
                String(
                    s.clienteCodigo ?? ''
                )

        )

        ||

        A(
            window.db
                ?.clientes
        )
        .find(

            c =>
                c.nome
                ===
                s.clienteNome

        )

        ||

        null;

    }


    function produtoPorCodigo(
        codigo
    ) {

        return A(
            window.db
                ?.produtos
        )
        .find(

            p =>
                String(
                    p.codigo ?? ''
                )
                ===
                String(
                    codigo ?? ''
                )

        )
        ||
        null;

    }


    function funcionarioPorId(
        id
    ) {

        return A(
            window.db
                ?.funcionarios
        )
        .find(

            f =>
                String(
                    f.id ?? ''
                )
                ===
                String(
                    id ?? ''
                )

        )
        ||
        null;

    }


    function veiculoPorId(
        id
    ) {

        return centroCustos()
            .veiculos
            .find(

                v =>
                    String(
                        v.id ?? ''
                    )
                    ===
                    String(
                        id ?? ''
                    )

            )
            ||
            null;

    }


    function equipamentoPorId(
        id
    ) {

        return centroCustos()
            .equipamentos
            .find(

                e =>
                    String(
                        e.id ?? ''
                    )
                    ===
                    String(
                        id ?? ''
                    )

            )
            ||
            null;

    }


    function clientesEncontrados(q) {

        return buscar(

            q,

            window.db
                ?.clientes,

            c =>
                [
                    c.codigo,
                    c.nome,
                    c.cidade,
                    c.estado
                ]
                .filter(Boolean)
                .join(' ')

        );

    }


    function produtosEncontrados(q) {

        return buscar(

            q,

            window.db
                ?.produtos,

            p =>
                [
                    p.codigo,
                    p.tipo,
                    p.descricao,
                    p.fornecedor
                ]
                .filter(Boolean)
                .join(' ')

        );

    }


    function funcionariosAtivos() {

        return A(
            window.db
                ?.funcionarios
        )
        .filter(

            f =>
                !f.status
                ||
                norm(
                    f.status
                )
                ===
                'ativo'

        );

    }


    function veiculosAtivos() {

        return centroCustos()
            .veiculos
            .filter(
                v =>
                    v.ativo
                    !==
                    false
            );

    }


    function equipamentosAtivos() {

        return centroCustos()
            .equipamentos
            .filter(
                e =>
                    e.ativo
                    !==
                    false
            );

    }


    /* ========================= */
    /* ESTADO */
    /* ========================= */


    function novoEstado() {

        const p =
            centroCustos()
                .parametros;


        return {

            etapa:
                'cliente_busca',


            clienteCodigo:
                '',


            clienteNome:
                '',


            servico:
                '',


            medidaTexto:
                '',


            largura:
                0,


            altura:
                0,


            area:
                0,


            materiais:
                [],


            maoDeObra:
                [],


            deslocamento:{

                usar:
                    false,

                enderecoDestino:
                    '',

                idaVolta:
                    true,

                rota:
                    null,

                kmManual:
                    0,

                veiculoId:
                    ''

            },


            equipamentos:
                [],


            outrosCustos:
                [],


            pagamento:
                '',


            prazoEntrega:
                '',


            validade:
                '',


            temNota:
                'sim',


            margemPercentual:
                p.margemLucroPercentual,


            metodoMargem:
                p.metodoMargem,


            opcoes:
                [],


            temporario:
                null,


            concluido:{

                cliente:
                    false,

                servico:
                    false,

                medida:
                    false,

                materiais:
                    false,

                maoDeObra:
                    false,

                deslocamento:
                    false,

                equipamentos:
                    false,

                outrosCustos:
                    false,

                pagamento:
                    false,

                prazoEntrega:
                    false,

                validade:
                    false,

                temNota:
                    false,

                margem:
                    false

            }

        };

    }


    function novaSessao() {

        window
            .assistenteOrcamentoLocal =
        {

            estado:
                novoEstado(),

            mensagens:
                [],

            calculo:
                null,

            ocupado:
                false

        };


        return window
            .assistenteOrcamentoLocal;

    }


    function sessao() {

        return window
            .assistenteOrcamentoLocal
        ||
        novaSessao();

    }


    function msgIA(
        texto
    ) {

        sessao()
            .mensagens
            .push({

                tipo:
                    'ia',

                texto:
                    String(
                        texto || ''
                    )

            });

    }


    function msgUser(
        texto
    ) {

        sessao()
            .mensagens
            .push({

                tipo:
                    'usuario',

                texto:
                    String(
                        texto || ''
                    )

            });

    }


    /* ========================= */
    /* CÁLCULO */
    /* ========================= */


    function calcular(s) {

        const cc =
            centroCustos();


        /* ===================== */
        /* MATERIAIS */
        /* ===================== */

        const materiais =
            s.materiais
            .map(

                item => {

                    const p =
                        produtoPorCodigo(
                            item.codigo
                        );


                    if (!p) {

                        return null;

                    }


                    const quantidade =
                        n(
                            item.quantidade
                        );


                    const valorUnitario =
                        n(
                            p.valor
                        );


                    return {

                        codigo:
                            String(
                                p.codigo ?? ''
                            ),

                        descricao:
                            p.descricao
                            ||
                            p.tipo
                            ||
                            '',

                        quantidade,

                        valorUnitario,

                        total:
                            round(
                                quantidade
                                *
                                valorUnitario
                            )

                    };

                }

            )
            .filter(Boolean);


        const custoMateriais =
            round(

                materiais
                .reduce(

                    (
                        a,
                        x
                    ) =>
                        a
                        +
                        x.total,

                    0

                )

            );


        const desperdicio =
            round(

                custoMateriais
                *
                cc.parametros
                    .desperdicioPercentual
                /
                100

            );


        /* ===================== */
        /* MÃO DE OBRA */
        /* ===================== */

        const mao =
            s.maoDeObra
            .map(

                item => {

                    const f =
                        funcionarioPorId(
                            item.id
                        );


                    if (!f) {

                        return null;

                    }


                    const horas =
                        n(
                            item.horas
                        );


                    const baseHora =
                        n(
                            f.salario
                        )
                        /
                        cc.maoDeObra
                            .horasMensais;


                    const custoHora =
                        baseHora
                        *
                        (
                            1
                            +
                            cc.maoDeObra
                                .encargosPercentual
                            /
                            100
                        );


                    return {

                        id:
                            String(
                                f.id ?? ''
                            ),

                        nome:
                            f.nome
                            ||
                            '',

                        cargo:
                            f.cargo
                            ||
                            '',

                        horas,

                        custoHora:
                            round(
                                custoHora,
                                4
                            ),

                        total:
                            round(
                                horas
                                *
                                custoHora
                            )

                    };

                }

            )
            .filter(Boolean);


        const custoMaoDeObra =
            round(

                mao.reduce(

                    (
                        a,
                        x
                    ) =>
                        a
                        +
                        x.total,

                    0

                )

            );


        /* ===================== */
        /* DESLOCAMENTO */
        /* ===================== */

        let deslocamento = {

            ativo:
                false,

            total:
                0

        };


        if (
            s.deslocamento.usar
            &&
            s.deslocamento.veiculoId
        ) {

            const v =
                veiculoPorId(
                    s.deslocamento
                        .veiculoId
                );


            if (v) {

                const combustivel =
                    cc.combustiveis
                    .find(

                        c =>
                            String(
                                c.id
                            )
                            ===
                            String(
                                v.combustivelId
                            )

                    );


                const km =
                    n(
                        s.deslocamento
                            .rota
                            ?.distanciaTotalKm

                        ||

                        s.deslocamento
                            .kmManual
                    );


                const consumo =
                    n(
                        v.consumoKmLitro
                    );


                const litros =
                    consumo > 0

                    ?

                    km
                    /
                    consumo

                    :

                    0;


                const custoCombustivel =
                    litros
                    *
                    n(
                        combustivel
                            ?.valorLitro
                    );


                const custoOperacional =
                    km
                    *
                    n(
                        v.custoOperacionalKm
                    );


                deslocamento = {

                    ativo:
                        true,

                    veiculoId:
                        String(
                            v.id ?? ''
                        ),

                    veiculo:
                        v.nome
                        ||
                        '',

                    placa:
                        v.placa
                        ||
                        '',

                    distanciaTotalKm:
                        round(
                            km,
                            2
                        ),

                    litros:
                        round(
                            litros,
                            3
                        ),

                    custoCombustivel:
                        round(
                            custoCombustivel
                        ),

                    custoOperacional:
                        round(
                            custoOperacional
                        ),

                    total:
                        round(
                            custoCombustivel
                            +
                            custoOperacional
                        )

                };

            }

        }


        /* ===================== */
        /* EQUIPAMENTOS */
        /* ===================== */

        const equipamentos =
            s.equipamentos
            .map(

                item => {

                    const e =
                        equipamentoPorId(
                            item.id
                        );


                    if (!e) {

                        return null;

                    }


                    const quantidade =
                        n(
                            item.quantidade
                        );


                    const valorUnitario =
                        n(
                            e.valor
                        );


                    return {

                        id:
                            String(
                                e.id ?? ''
                            ),

                        nome:
                            e.nome
                            ||
                            '',

                        tipoCalculo:
                            e.tipoCalculo
                            ||
                            'utilizacao',

                        quantidade,

                        valorUnitario,

                        total:
                            round(
                                quantidade
                                *
                                valorUnitario
                            )

                    };

                }

            )
            .filter(Boolean);


        const custoEquipamentos =
            round(

                equipamentos.reduce(

                    (
                        a,
                        x
                    ) =>
                        a
                        +
                        x.total,

                    0

                )

            );


        /* ===================== */
        /* OUTROS CUSTOS */
        /* ===================== */

        const outros =
            s.outrosCustos
            .map(

                x => ({

                    descricao:
                        x.descricao,

                    valor:
                        round(
                            n(
                                x.valor
                            )
                        )

                })

            );


        const outrosTotal =
            round(

                outros.reduce(

                    (
                        a,
                        x
                    ) =>
                        a
                        +
                        x.valor,

                    0

                )

            );


        /* ===================== */
        /* SUBTOTAL */
        /* ===================== */

        const subtotal =
            round(

                custoMateriais
                +
                desperdicio
                +
                custoMaoDeObra
                +
                deslocamento.total
                +
                custoEquipamentos
                +
                outrosTotal

            );


        /* ===================== */
        /* ADMINISTRATIVO */
        /* ===================== */

        const administrativo =
            round(

                subtotal
                *
                cc.parametros
                    .administrativoPercentual
                /
                100

            );


        const custoTotal =
            round(
                subtotal
                +
                administrativo
            );


        /* ===================== */
        /* MARGEM */
        /* ===================== */

        const margem =
            n(
                s.margemPercentual
            );


        let precoSugerido =
            custoTotal;


        let valorMargem =
            0;


        if (
            s.metodoMargem
            ===
            'margem'
        ) {

            if (
                margem > 0
                &&
                margem < 100
            ) {

                precoSugerido =
                    custoTotal
                    /
                    (
                        1
                        -
                        margem
                        /
                        100
                    );


                valorMargem =
                    precoSugerido
                    -
                    custoTotal;

            }

        }
        else {

            valorMargem =
                custoTotal
                *
                margem
                /
                100;


            precoSugerido =
                custoTotal
                +
                valorMargem;

        }


        precoSugerido =
            round(
                precoSugerido
            );


        valorMargem =
            round(
                valorMargem
            );


        /* ===================== */
        /* REGRA NOTA */
        /* ===================== */

        const acrescimoNota =
            s.temNota
            ===
            'nao'

            ?

            round(
                precoSugerido
                *
                0.12
            )

            :

            0;


        const totalCliente =
            round(
                precoSugerido
                +
                acrescimoNota
            );


        return {

            materiais:{

                detalhes:
                    materiais,

                total:
                    custoMateriais

            },


            maoDeObra:{

                detalhes:
                    mao,

                total:
                    custoMaoDeObra

            },


            deslocamento,


            equipamentos:{

                detalhes:
                    equipamentos,

                total:
                    custoEquipamentos

            },


            outrosCustos:{

                detalhes:
                    outros,

                total:
                    outrosTotal

            },


            resumo:{

                custoMateriais,

                desperdicioPercentual:
                    cc.parametros
                        .desperdicioPercentual,

                desperdicio,

                custoMaoDeObra,

                custoDeslocamento:
                    deslocamento.total,

                custoEquipamentos,

                outrosCustos:
                    outrosTotal,

                administrativoPercentual:
                    cc.parametros
                        .administrativoPercentual,

                administrativo,

                custoTotal,

                margemPercentual:
                    margem,

                metodoMargem:
                    s.metodoMargem,

                valorMargem,

                precoSugerido,

                acrescimoRegraNota:
                    acrescimoNota,

                totalCliente

            }

        };

    }


    /* ========================= */
    /* FORMATAR OPÇÕES */
    /* ========================= */


    function textoCliente(c) {

        const local =
            [
                c.cidade,
                c.estado
                ||
                c.uf
            ]
            .filter(Boolean)
            .join(' - ');


        return `${c.nome || 'Cliente'}${
            local
            ?
            ` | ${local}`
            :
            ''
        }`;

    }


    function textoProduto(p) {

        return `#${p.codigo ?? '-'} - ${
            p.descricao
            ||
            p.tipo
            ||
            'Produto'
        } | Estoque: ${
            p.quantidade ?? 0
        } | Custo: ${
            money(
                n(
                    p.valor
                )
            )
        }`;

    }


    function textoFuncionario(f) {

        return `${f.nome || 'Funcionário'}${
            f.cargo
            ?
            ` - ${f.cargo}`
            :
            ''
        }`;

    }


    function textoVeiculo(v) {

        const cc =
            centroCustos();


        const comb =
            cc.combustiveis
            .find(

                c =>
                    String(c.id)
                    ===
                    String(
                        v.combustivelId
                    )

            );


        return `${v.nome || 'Veículo'}${
            v.placa
            ?
            ` - ${v.placa}`
            :
            ''
        } | ${
            comb?.nome
            ||
            'Combustível'
        } | ${
            brNum(
                n(
                    v.consumoKmLitro
                ),
                2
            )
        } km/L`;

    }


    function textoEquipamento(e) {

        const tipo =
            e.tipoCalculo
            ===
            'hora'

            ?

            'hora'

            :

            e.tipoCalculo
            ===
            'dia'

            ?

            'dia'

            :

            'utilização';


        return `${e.nome || 'Equipamento'} | ${
            money(
                n(
                    e.valor
                )
            )
        } por ${tipo}`;

    }


    function listarOpcoes(
        titulo,
        opcoes,
        formatar
    ) {

        return `${titulo}

${
    opcoes
    .map(
        (
            x,
            i
        ) =>
            `${i + 1}. ${formatar(x)}`
    )
    .join('\n')
}

Digite o número da opção correta.`;

    }


    function prefixo(
        resp,
        proxima
    ) {

        return resp
            ?
            `${resp}\n\n${proxima}`
            :
            proxima;

    }


    /* ========================= */
    /* PRÓXIMA PERGUNTA */
    /* ========================= */


    function proxima(s) {

        if (
            !s.concluido.cliente
        ) {

            s.etapa =
                'cliente_busca';

            s.opcoes =
                [];

            return (
                'Digite o nome, parte do nome ou código do cliente para eu pesquisar no cadastro.'
            );

        }


        if (
            !s.concluido.servico
        ) {

            s.etapa =
                'servico';

            return (
                'Qual serviço será realizado?'
            );

        }


        if (
            !s.concluido.medida
        ) {

            s.etapa =
                'medida';

            return (
                'Qual a medida ou quantidade do serviço? Ex.: "6 x 1,20 m", "10 unidades" ou "pular".'
            );

        }


        if (
            !s.concluido.materiais
        ) {

            s.etapa =
                'materiais_sim_nao';

            return (
                'Deseja incluir materiais do estoque no cálculo?\n\n1. Sim\n2. Não'
            );

        }


        if (
            !s.concluido.maoDeObra
        ) {

            s.etapa =
                'mao_sim_nao';

            return (
                'Haverá mão de obra de funcionários da empresa?\n\n1. Sim\n2. Não'
            );

        }


        if (
            !s.concluido.deslocamento
        ) {

            s.etapa =
                'deslocamento_sim_nao';

            return (
                'Haverá deslocamento para execução, instalação ou atendimento?\n\n1. Sim\n2. Não'
            );

        }


        if (
            !s.concluido.equipamentos
        ) {

            s.etapa =
                'equipamento_sim_nao';

            return (
                'Será utilizado algum equipamento próprio cadastrado no Centro de Custos?\n\n1. Sim\n2. Não'
            );

        }


        if (
            !s.concluido.outrosCustos
        ) {

            s.etapa =
                'outros_sim_nao';

            return (
                'Existe algum outro custo? Ex.: aluguel, frete terceirizado, guindaste, hospedagem.\n\n1. Sim\n2. Não'
            );

        }


        if (
            !s.concluido.pagamento
        ) {

            s.etapa =
                'pagamento';

            return (
                'Qual a forma de pagamento? Digite "pular" para deixar em branco.'
            );

        }


        if (
            !s.concluido.prazoEntrega
        ) {

            s.etapa =
                'prazo';

            return (
                'Qual o prazo de entrega? Digite "pular" para deixar em branco.'
            );

        }


        if (
            !s.concluido.validade
        ) {

            s.etapa =
                'validade';

            return (
                'Qual a validade do orçamento? Ex.: 7 dias, 15 dias ou "pular".'
            );

        }


        if (
            !s.concluido.temNota
        ) {

            s.etapa =
                'nota';

            return (
                'O orçamento será com nota?\n\n1. Sim\n2. Não'
            );

        }


        if (
            !s.concluido.margem
        ) {

            s.etapa =
                'margem_confirmar';


            const metodo =
                s.metodoMargem
                ===
                'margem'

                ?

                'margem sobre preço de venda'

                :

                'acréscimo sobre custo';


            return (
                `O Centro de Custos está configurado com ${
                    brNum(
                        s.margemPercentual,
                        2
                    )
                }% de ${metodo}. Deseja manter?\n\n1. Sim\n2. Não, alterar`
            );

        }


        return resumoFinal(
            s
        );

    }


    /* ========================= */
    /* CONSULTAR ROTA */
    /* ========================= */


    async function consultarRota(s) {

        const origem =
            enderecoOrigemTexto();


        const destino =
            s.deslocamento
                .enderecoDestino;


        if (!origem) {

            throw new Error(
                'O Endereço de Origem não está preenchido no Centro de Custos.'
            );

        }


        if (!destino) {

            throw new Error(
                'O endereço de destino está vazio.'
            );

        }


        const base =
            window.API_URL
            ||
            'http://127.0.0.1:3000';


        const response =
            await fetch(

                `${base}/rota/calcular`,

                {

                    method:
                        'POST',

                    headers:{

                        'Content-Type':
                            'application/json'

                    },

                    body:
                        JSON.stringify({

                            origem,

                            destino,

                            idaVolta:
                                s.deslocamento
                                    .idaVolta

                        })

                }

            );


        const texto =
            await response.text();


        let body;


        try {

            body =
                JSON.parse(
                    texto
                );

        }
        catch(e){

            throw new Error(
                'O servidor de rotas retornou uma resposta inválida.'
            );

        }


        if (
            !response.ok
            ||
            !body.ok
        ) {

            throw new Error(
                body.erro
                ||
                'Não foi possível calcular a rota.'
            );

        }


        return body;

    }


    /* ========================= */
    /* RESUMO FINAL */
    /* ========================= */


    function resumoFinal(s) {

        const c =
            calcular(s);


        sessao()
            .calculo =
                c;


        s.etapa =
            'confirmar_final';


        const r =
            c.resumo;


        const linhasMateriais =
            c.materiais
                .detalhes
                .length

            ?

            c.materiais
                .detalhes
                .map(
                    x =>
                        `• ${x.quantidade} x ${x.descricao} = ${money(x.total)}`
                )
                .join('\n')

            :

            '• Nenhum';


        const linhasMao =
            c.maoDeObra
                .detalhes
                .length

            ?

            c.maoDeObra
                .detalhes
                .map(
                    x =>
                        `• ${x.nome} - ${brNum(x.horas,2)}h = ${money(x.total)}`
                )
                .join('\n')

            :

            '• Nenhuma';


        const linhasEq =
            c.equipamentos
                .detalhes
                .length

            ?

            c.equipamentos
                .detalhes
                .map(
                    x =>
                        `• ${x.nome} - ${x.quantidade} ${x.tipoCalculo} = ${money(x.total)}`
                )
                .join('\n')

            :

            '• Nenhum';


        return [

            '════════════════════════════',

            'RESUMO FINAL DO ORÇAMENTO',

            '════════════════════════════',

            '',

            `Cliente: ${s.clienteNome}`,

            `Serviço: ${s.servico}`,

            s.medidaTexto
                ?
                `Medida/Quantidade: ${s.medidaTexto}`
                :
                null,

            '',

            'MATERIAIS',

            linhasMateriais,

            `Subtotal materiais: ${money(r.custoMateriais)}`,

            `Desperdício (${brNum(r.desperdicioPercentual,2)}%): ${money(r.desperdicio)}`,

            '',

            'MÃO DE OBRA',

            linhasMao,

            `Total mão de obra: ${money(r.custoMaoDeObra)}`,

            '',

            'DESLOCAMENTO',

            c.deslocamento.ativo

                ?

                `• ${c.deslocamento.veiculo} | ${brNum(c.deslocamento.distanciaTotalKm,2)} km | ${money(c.deslocamento.total)}`

                :

                '• Nenhum',

            '',

            'EQUIPAMENTOS',

            linhasEq,

            `Total equipamentos: ${money(r.custoEquipamentos)}`,

            '',

            `Outros custos: ${money(r.outrosCustos)}`,

            `Administrativo (${brNum(r.administrativoPercentual,2)}%): ${money(r.administrativo)}`,

            `CUSTO TOTAL: ${money(r.custoTotal)}`,

            `Margem: ${brNum(r.margemPercentual,2)}% (${r.metodoMargem})`,

            `Valor da margem: ${money(r.valorMargem)}`,

            `Preço sugerido: ${money(r.precoSugerido)}`,

            s.temNota
            ===
            'nao'

                ?

                `Regra sem nota (+12%): ${money(r.acrescimoRegraNota)}`

                :

                null,

            '',

            `TOTAL PARA O CLIENTE: ${money(r.totalCliente)}`,

            '',

            'Posso gerar o orçamento?',

            '',

            '1. Sim, gerar',

            '2. Não, quero alterar alguma coisa'

        ]
        .filter(
            x =>
                x !== null
        )
        .join('\n');

    }


    /* ========================= */
    /* PROCESSAR */
    /* ========================= */


    async function processar(
        texto
    ) {

        const s =
            sessao()
                .estado;


        const t =
            norm(
                texto
            );


        /* ===================== */
        /* COMANDOS */
        /* ===================== */

        if (
            [
                'reiniciar',
                'recomecar',
                'novo orcamento'
            ]
            .includes(t)
        ) {

            sessao()
                .estado =
                    novoEstado();


            sessao()
                .calculo =
                    null;


            return proxima(
                sessao()
                    .estado
            );

        }


        if (
            [
                'resumo',
                'ver resumo',
                'mostrar resumo'
            ]
            .includes(t)
        ) {

            return resumoFinal(
                s
            );

        }


        switch(
            s.etapa
        ) {


            /* ===================== */
            /* CLIENTE */
            /* ===================== */

            case 'cliente_busca': {

                const achados =
                    clientesEncontrados(
                        texto
                    )
                    .slice(
                        0,
                        8
                    )
                    .map(
                        x =>
                            x.item
                    );


                if (
                    !achados.length
                ) {

                    return (
                        'Não encontrei clientes relacionados a essa busca. Digite outro nome, parte do nome ou código.'
                    );

                }


                s.opcoes =
                    achados;


                s.etapa =
                    'cliente_escolher';


                return listarOpcoes(

                    'Encontrei estes clientes. Confirme qual é o correto:',

                    achados,

                    textoCliente

                );

            }


            case 'cliente_escolher': {

                const escolhido =
                    escolhaNumero(
                        texto,
                        s.opcoes
                    );


                if (!escolhido) {

                    const achados =
                        clientesEncontrados(
                            texto
                        )
                        .slice(
                            0,
                            8
                        )
                        .map(
                            x =>
                                x.item
                        );


                    if (
                        achados.length
                    ) {

                        s.opcoes =
                            achados;


                        return listarOpcoes(

                            'Atualizei a pesquisa. Qual é o cliente correto?',

                            achados,

                            textoCliente

                        );

                    }


                    return (
                        'Escolha um dos números mostrados ou digite outra parte do nome para pesquisar novamente.'
                    );

                }


                s.clienteCodigo =
                    String(
                        escolhido.codigo
                        ??
                        ''
                    );


                s.clienteNome =
                    escolhido.nome
                    ||
                    '';


                s.concluido.cliente =
                    true;


                s.opcoes =
                    [];


                return prefixo(

                    `Cliente confirmado: ${s.clienteNome}.`,

                    proxima(s)

                );

            }


            /* ===================== */
            /* SERVIÇO */
            /* ===================== */

            case 'servico': {

                if (
                    !String(texto)
                        .trim()
                ) {

                    return (
                        'Informe o serviço que será realizado.'
                    );

                }


                s.servico =
                    String(texto)
                    .trim();


                s.concluido.servico =
                    true;


                return prefixo(

                    `Serviço registrado: ${s.servico}.`,

                    proxima(s)

                );

            }


            /* ===================== */
            /* MEDIDA */
            /* ===================== */

            case 'medida': {

                if (
                    pular(texto)
                ) {

                    s.medidaTexto =
                        '';


                    s.concluido.medida =
                        true;


                    return prefixo(

                        'Vou seguir sem medida específica.',

                        proxima(s)

                    );

                }


                const m =
                    parseMedida(
                        texto
                    );


                if (m) {

                    s.largura =
                        m.largura;


                    s.altura =
                        m.altura;


                    s.area =
                        m.area;


                    s.medidaTexto =
                        `${m.texto} | Área: ${brNum(m.area,2)} m²`;


                    s.concluido.medida =
                        true;


                    return prefixo(

                        `Medida registrada. Área calculada: ${brNum(m.area,2)} m².`,

                        proxima(s)

                    );

                }


                if (
                    parseNumeroLivre(
                        texto
                    )
                    >
                    0
                ) {

                    s.medidaTexto =
                        String(texto)
                        .trim();


                    s.concluido.medida =
                        true;


                    return prefixo(

                        `Quantidade/medida registrada: ${s.medidaTexto}.`,

                        proxima(s)

                    );

                }


                return (
                    'Não consegui identificar. Use algo como "6 x 1,20 m", "10 unidades" ou "pular".'
                );

            }


            /* ===================== */
            /* MATERIAIS */
            /* ===================== */

            case 'materiais_sim_nao': {

                if (
                    nao(texto)
                ) {

                    s.concluido.materiais =
                        true;


                    return prefixo(

                        'Sem materiais do estoque.',

                        proxima(s)

                    );

                }


                if (
                    !sim(texto)
                ) {

                    return (
                        'Escolha 1 para incluir materiais ou 2 para seguir sem materiais.'
                    );

                }


                s.etapa =
                    'material_busca';


                return (
                    'Digite o material que deseja procurar no estoque. Ex.: "ACM preto fosco".'
                );

            }


            case 'material_busca': {

                const achados =
                    produtosEncontrados(
                        texto
                    )
                    .slice(
                        0,
                        10
                    )
                    .map(
                        x =>
                            x.item
                    );


                if (
                    !achados.length
                ) {

                    return (
                        'Não encontrei material relacionado no estoque. Tente outra descrição, tipo ou código.'
                    );

                }


                s.opcoes =
                    achados;


                s.etapa =
                    'material_escolher';


                return listarOpcoes(

                    'Encontrei estes materiais. Escolha exatamente qual será utilizado:',

                    achados,

                    textoProduto

                );

            }


            case 'material_escolher': {

                if (
                    t ===
                    'buscar'
                ) {

                    s.opcoes =
                        [];


                    s.etapa =
                        'material_busca';


                    return (
                        'Digite uma nova descrição, tipo ou código para pesquisar no estoque.'
                    );

                }


                const escolhido =
                    escolhaNumero(
                        texto,
                        s.opcoes
                    );


                if (
                    !escolhido
                ) {

                    return (
                        'Digite o número do material correto. Se nenhum servir, digite "buscar" para fazer outra pesquisa.'
                    );

                }


                s.temporario =
                    escolhido;


                s.opcoes =
                    [];


                s.etapa =
                    'material_quantidade';


                return (
                    `Material selecionado: ${textoProduto(escolhido)}.\n\nQual quantidade será utilizada?`
                );

            }


            case 'material_quantidade': {

                if (
                    t ===
                    'buscar'
                ) {

                    s.temporario =
                        null;


                    s.etapa =
                        'material_busca';


                    return (
                        'Digite uma nova descrição para pesquisar no estoque.'
                    );

                }


                const q =
                    parseNumeroLivre(
                        texto
                    );


                if (
                    !(q > 0)
                ) {

                    return (
                        'Informe uma quantidade maior que zero.'
                    );

                }


                const p =
                    s.temporario;


                if (!p) {

                    s.etapa =
                        'material_busca';


                    return (
                        'O material perdeu a seleção. Pesquise novamente.'
                    );

                }


                const estoqueInformado =
                    p.quantidade
                    !==
                    undefined
                    &&
                    p.quantidade
                    !==
                    null
                    &&
                    p.quantidade
                    !==
                    '';


                const estoque =
                    n(
                        p.quantidade
                    );


                if (
                    estoqueInformado
                    &&
                    q > estoque
                ) {

                    s.temporario = {

                        produto:
                            p,

                        quantidade:
                            q

                    };


                    s.etapa =
                        'material_estoque_confirmar';


                    return (
                        `A quantidade informada (${q}) é maior que o estoque atual (${estoque}). Deseja considerar essa quantidade mesmo assim?\n\n1. Sim\n2. Não, informar outra quantidade`
                    );

                }


                adicionarMaterial(
                    s,
                    p,
                    q
                );


                s.temporario =
                    null;


                s.etapa =
                    'material_mais';


                return (
                    `Material incluído: ${
                        p.descricao
                        ||
                        p.tipo
                    } | ${q} x ${
                        money(
                            n(
                                p.valor
                            )
                        )
                    } = ${
                        money(
                            q
                            *
                            n(
                                p.valor
                            )
                        )
                    }.\n\nDeseja adicionar outro material?\n\n1. Sim\n2. Não`
                );

            }


            case 'material_estoque_confirmar': {

                if (
                    sim(texto)
                ) {

                    const {
                        produto,
                        quantidade
                    } =
                        s.temporario;


                    adicionarMaterial(
                        s,
                        produto,
                        quantidade
                    );


                    s.temporario =
                        null;


                    s.etapa =
                        'material_mais';


                    return (
                        'Quantidade mantida e material incluído.\n\nDeseja adicionar outro material?\n\n1. Sim\n2. Não'
                    );

                }


                if (
                    nao(texto)
                ) {

                    const p =
                        s.temporario
                            ?.produto;


                    s.temporario =
                        p
                        ||
                        null;


                    s.etapa =
                        'material_quantidade';


                    return (
                        'Informe a nova quantidade.'
                    );

                }


                return (
                    'Escolha 1 para manter a quantidade ou 2 para alterar.'
                );

            }


            case 'material_mais': {

                if (
                    sim(texto)
                ) {

                    s.etapa =
                        'material_busca';


                    return (
                        'Digite o próximo material que deseja pesquisar.'
                    );

                }


                if (
                    nao(texto)
                ) {

                    s.concluido.materiais =
                        true;


                    return prefixo(

                        'Materiais concluídos.',

                        proxima(s)

                    );

                }


                return (
                    'Escolha 1 para adicionar outro material ou 2 para continuar.'
                );

            }


            /* ===================== */
            /* MÃO DE OBRA */
            /* ===================== */

            case 'mao_sim_nao': {

                if (
                    nao(texto)
                ) {

                    s.concluido.maoDeObra =
                        true;


                    return prefixo(

                        'Sem mão de obra interna no cálculo.',

                        proxima(s)

                    );

                }


                if (
                    !sim(texto)
                ) {

                    return (
                        'Escolha 1 para incluir funcionários ou 2 para seguir sem mão de obra.'
                    );

                }


                const opcoes =
                    funcionariosAtivos();


                if (
                    !opcoes.length
                ) {

                    s.concluido.maoDeObra =
                        true;


                    return prefixo(

                        'Não há funcionários ativos cadastrados. Vou seguir sem mão de obra interna.',

                        proxima(s)

                    );

                }


                s.opcoes =
                    opcoes;


                s.etapa =
                    'funcionario_escolher';


                return listarOpcoes(

                    'Escolha o funcionário que participará do serviço:',

                    opcoes,

                    textoFuncionario

                );

            }


            case 'funcionario_escolher': {

                const escolhido =
                    escolhaNumero(
                        texto,
                        s.opcoes
                    );


                if (
                    !escolhido
                ) {

                    return (
                        'Digite o número do funcionário correto.'
                    );

                }


                s.temporario =
                    escolhido;


                s.opcoes =
                    [];


                s.etapa =
                    'funcionario_horas';


                return (
                    `Funcionário selecionado: ${textoFuncionario(escolhido)}.\n\nQuantas horas de trabalho serão consideradas?`
                );

            }


            case 'funcionario_horas': {

                const h =
                    parseHoras(
                        texto
                    );


                if (
                    !(h > 0)
                ) {

                    return (
                        'Informe uma quantidade de horas maior que zero. Ex.: 6 horas.'
                    );

                }


                const f =
                    s.temporario;


                adicionarFuncionario(
                    s,
                    f,
                    h
                );


                const calcTemp =
                    calcular(s)
                    .maoDeObra
                    .detalhes
                    .find(

                        x =>
                            String(x.id)
                            ===
                            String(f.id)

                    );


                s.temporario =
                    null;


                s.etapa =
                    'funcionario_mais';


                return (
                    `${f.nome} incluído com ${brNum(h,2)}h. Custo calculado: ${money(calcTemp?.total || 0)}.\n\nDeseja incluir outro funcionário?\n\n1. Sim\n2. Não`
                );

            }


            case 'funcionario_mais': {

                if (
                    sim(texto)
                ) {

                    const opcoes =
                        funcionariosAtivos();


                    s.opcoes =
                        opcoes;


                    s.etapa =
                        'funcionario_escolher';


                    return listarOpcoes(

                        'Escolha o próximo funcionário:',

                        opcoes,

                        textoFuncionario

                    );

                }


                if (
                    nao(texto)
                ) {

                    s.concluido.maoDeObra =
                        true;


                    return prefixo(

                        'Mão de obra concluída.',

                        proxima(s)

                    );

                }


                return (
                    'Escolha 1 para adicionar outro funcionário ou 2 para continuar.'
                );

            }


            /* ===================== */
            /* DESLOCAMENTO */
            /* ===================== */

            case 'deslocamento_sim_nao': {

                if (
                    nao(texto)
                ) {

                    s.deslocamento.usar =
                        false;


                    s.concluido.deslocamento =
                        true;


                    return prefixo(

                        'Sem deslocamento.',

                        proxima(s)

                    );

                }


                if (
                    !sim(texto)
                ) {

                    return (
                        'Escolha 1 se haverá deslocamento ou 2 se não haverá.'
                    );

                }


                s.deslocamento.usar =
                    true;


                const cliente =
                    clienteAtual(s);


                const endereco =
                    enderecoClienteTexto(
                        cliente
                    );


                if (endereco) {

                    s.temporario =
                        endereco;


                    s.etapa =
                        'endereco_origem_escolha';


                    return (
                        `O cliente possui este endereço cadastrado:\n\n${endereco}\n\nO serviço será realizado nesse endereço?\n\n1. Sim, usar este endereço\n2. Não, informar outro endereço`
                    );

                }


                s.etapa =
                    'endereco_manual';


                return (
                    'O cliente não possui endereço completo cadastrado. Digite o endereço onde o serviço será realizado, incluindo cidade e UF.'
                );

            }


            case 'endereco_origem_escolha': {

                if (
                    sim(texto)
                ) {

                    s.deslocamento
                        .enderecoDestino =
                            String(
                                s.temporario
                                ||
                                ''
                            );


                    s.temporario =
                        null;


                    s.etapa =
                        'ida_volta';


                    return (
                        'Como devo considerar o deslocamento?\n\n1. Ida e volta\n2. Somente ida'
                    );

                }


                if (
                    nao(texto)
                ) {

                    s.temporario =
                        null;


                    s.etapa =
                        'endereco_manual';


                    return (
                        'Digite o endereço onde o serviço será realizado, incluindo cidade e UF.'
                    );

                }


                return (
                    'Escolha 1 para usar o endereço cadastrado ou 2 para informar outro.'
                );

            }


            case 'endereco_manual': {

                if (
                    String(texto)
                        .trim()
                        .length
                    <
                    8
                ) {

                    return (
                        'Digite um endereço mais completo, preferencialmente com número, cidade e UF.'
                    );

                }


                s.deslocamento
                    .enderecoDestino =
                        String(texto)
                        .trim();


                s.etapa =
                    'ida_volta';


                return (
                    'Como devo considerar o deslocamento?\n\n1. Ida e volta\n2. Somente ida'
                );

            }


            case 'ida_volta': {

                if (
                    t === '1'
                    ||
                    t === 'sim'
                    ||
                    t === 'ida e volta'
                ) {

                    s.deslocamento
                        .idaVolta =
                            true;

                }
                else if (
                    t === '2'
                    ||
                    t === 'somente ida'
                    ||
                    t === 'so ida'
                ) {

                    s.deslocamento
                        .idaVolta =
                            false;

                }
                else {

                    return (
                        'Escolha 1 para ida e volta ou 2 para somente ida.'
                    );

                }


                try {

                    const rota =
                        await consultarRota(
                            s
                        );


                    s.deslocamento.rota =
                        rota;


                    s.deslocamento.kmManual =
                        0;


                    const opcoes =
                        veiculosAtivos();


                    if (
                        !opcoes.length
                    ) {

                        s.deslocamento.usar =
                            false;


                        s.concluido.deslocamento =
                            true;


                        return prefixo(

                            `Rota calculada: ${brNum(rota.distanciaTotalKm,2)} km, mas não há veículo ativo cadastrado. Vou seguir sem custo de deslocamento.`,

                            proxima(s)

                        );

                    }


                    s.opcoes =
                        opcoes;


                    s.etapa =
                        'veiculo_escolher';


                    return (
                        `${formatarRota(rota)}\n\n${
                            listarOpcoes(
                                'Agora escolha o veículo:',
                                opcoes,
                                textoVeiculo
                            )
                        }`
                    );

                }
                catch(e){

                    s.deslocamento.rota =
                        null;


                    s.etapa =
                        'km_manual';


                    return (
                        `Não consegui calcular a rota automaticamente: ${e.message}\n\nPara não travar o orçamento, informe a quilometragem TOTAL que deve ser considerada. Ex.: 24 km.`
                    );

                }

            }


            case 'km_manual': {

                const km =
                    parseKm(
                        texto
                    );


                if (
                    !(km > 0)
                ) {

                    return (
                        'Informe a distância total em km. Ex.: 24 km.'
                    );

                }


                s.deslocamento.kmManual =
                    km;


                const opcoes =
                    veiculosAtivos();


                if (
                    !opcoes.length
                ) {

                    s.deslocamento.usar =
                        false;


                    s.concluido.deslocamento =
                        true;


                    return prefixo(

                        'Distância registrada, mas não há veículo ativo cadastrado. Vou seguir sem deslocamento.',

                        proxima(s)

                    );

                }


                s.opcoes =
                    opcoes;


                s.etapa =
                    'veiculo_escolher';


                return listarOpcoes(

                    'Distância registrada. Escolha o veículo:',

                    opcoes,

                    textoVeiculo

                );

            }


            case 'veiculo_escolher': {

                const v =
                    escolhaNumero(
                        texto,
                        s.opcoes
                    );


                if (!v) {

                    return (
                        'Digite o número do veículo correto.'
                    );

                }


                s.deslocamento
                    .veiculoId =
                        String(
                            v.id ?? ''
                        );


                s.opcoes =
                    [];


                s.concluido.deslocamento =
                    true;


                const d =
                    calcular(s)
                        .deslocamento;


                return prefixo(

                    `Veículo confirmado: ${v.nome}.
Distância considerada: ${brNum(d.distanciaTotalKm,2)} km.
Combustível: ${money(d.custoCombustivel)}.
Custo operacional: ${money(d.custoOperacional)}.
Total do deslocamento: ${money(d.total)}.`,

                    proxima(s)

                );

            }


            /* ===================== */
            /* EQUIPAMENTOS */
            /* ===================== */

            case 'equipamento_sim_nao': {

                if (
                    nao(texto)
                ) {

                    s.concluido.equipamentos =
                        true;


                    return prefixo(

                        'Sem equipamentos próprios.',

                        proxima(s)

                    );

                }


                if (
                    !sim(texto)
                ) {

                    return (
                        'Escolha 1 para incluir equipamentos ou 2 para seguir sem eles.'
                    );

                }


                const opcoes =
                    equipamentosAtivos();


                if (
                    !opcoes.length
                ) {

                    s.concluido.equipamentos =
                        true;


                    return prefixo(

                        'Não há equipamentos ativos cadastrados. Vou seguir sem equipamentos.',

                        proxima(s)

                    );

                }


                s.opcoes =
                    opcoes;


                s.etapa =
                    'equipamento_escolher';


                return listarOpcoes(

                    'Escolha o equipamento:',

                    opcoes,

                    textoEquipamento

                );

            }


            case 'equipamento_escolher': {

                const e =
                    escolhaNumero(
                        texto,
                        s.opcoes
                    );


                if (!e) {

                    return (
                        'Digite o número do equipamento correto.'
                    );

                }


                s.temporario =
                    e;


                s.opcoes =
                    [];


                s.etapa =
                    'equipamento_quantidade';


                const unidade =
                    e.tipoCalculo
                    ===
                    'hora'

                    ?

                    'horas'

                    :

                    e.tipoCalculo
                    ===
                    'dia'

                    ?

                    'dias'

                    :

                    'utilizações';


                return (
                    `Equipamento selecionado: ${textoEquipamento(e)}.\n\nQuantas ${unidade} serão consideradas?`
                );

            }


            case 'equipamento_quantidade': {

                const q =
                    parseNumeroLivre(
                        texto
                    );


                if (
                    !(q > 0)
                ) {

                    return (
                        'Informe uma quantidade maior que zero.'
                    );

                }


                const e =
                    s.temporario;


                adicionarEquipamento(
                    s,
                    e,
                    q
                );


                s.temporario =
                    null;


                s.etapa =
                    'equipamento_mais';


                return (
                    `${e.nome} incluído: ${q} x ${money(n(e.valor))} = ${money(q * n(e.valor))}.\n\nDeseja adicionar outro equipamento?\n\n1. Sim\n2. Não`
                );

            }


            case 'equipamento_mais': {

                if (
                    sim(texto)
                ) {

                    const opcoes =
                        equipamentosAtivos();


                    s.opcoes =
                        opcoes;


                    s.etapa =
                        'equipamento_escolher';


                    return listarOpcoes(

                        'Escolha o próximo equipamento:',

                        opcoes,

                        textoEquipamento

                    );

                }


                if (
                    nao(texto)
                ) {

                    s.concluido.equipamentos =
                        true;


                    return prefixo(

                        'Equipamentos concluídos.',

                        proxima(s)

                    );

                }


                return (
                    'Escolha 1 para adicionar outro equipamento ou 2 para continuar.'
                );

            }


            /* ===================== */
            /* OUTROS CUSTOS */
            /* ===================== */

            case 'outros_sim_nao': {

                if (
                    nao(texto)
                ) {

                    s.concluido.outrosCustos =
                        true;


                    return prefixo(

                        'Sem outros custos.',

                        proxima(s)

                    );

                }


                if (
                    !sim(texto)
                ) {

                    return (
                        'Escolha 1 para incluir outro custo ou 2 para seguir sem outros custos.'
                    );

                }


                s.etapa =
                    'outro_descricao';


                return (
                    'Digite a descrição do custo. Ex.: aluguel de andaime.'
                );

            }


            case 'outro_descricao': {

                if (
                    !String(texto)
                        .trim()
                ) {

                    return (
                        'Informe a descrição do custo.'
                    );

                }


                s.temporario = {

                    descricao:
                        String(texto)
                        .trim()

                };


                s.etapa =
                    'outro_valor';


                return (
                    `Qual o valor total de "${s.temporario.descricao}"?`
                );

            }


            case 'outro_valor': {

                const valor =
                    parseNumeroLivre(
                        texto
                    );


                if (
                    !(valor > 0)
                ) {

                    return (
                        'Informe um valor maior que zero.'
                    );

                }


                s.outrosCustos
                    .push({

                        descricao:
                            s.temporario
                                .descricao,

                        valor

                    });


                s.temporario =
                    null;


                s.etapa =
                    'outro_mais';


                return (
                    `Custo incluído: ${money(valor)}.\n\nDeseja adicionar outro custo?\n\n1. Sim\n2. Não`
                );

            }


            case 'outro_mais': {

                if (
                    sim(texto)
                ) {

                    s.etapa =
                        'outro_descricao';


                    return (
                        'Digite a descrição do próximo custo.'
                    );

                }


                if (
                    nao(texto)
                ) {

                    s.concluido.outrosCustos =
                        true;


                    return prefixo(

                        'Outros custos concluídos.',

                        proxima(s)

                    );

                }


                return (
                    'Escolha 1 para adicionar outro custo ou 2 para continuar.'
                );

            }


            /* ===================== */
            /* PAGAMENTO */
            /* ===================== */

            case 'pagamento': {

                s.pagamento =
                    pular(texto)

                    ?

                    ''

                    :

                    String(texto)
                    .trim();


                s.concluido.pagamento =
                    true;


                return prefixo(

                    s.pagamento

                    ?

                    `Pagamento: ${s.pagamento}.`

                    :

                    'Pagamento deixado em branco.',

                    proxima(s)

                );

            }


            /* ===================== */
            /* PRAZO */
            /* ===================== */

            case 'prazo': {

                s.prazoEntrega =
                    pular(texto)

                    ?

                    ''

                    :

                    String(texto)
                    .trim();


                s.concluido.prazoEntrega =
                    true;


                return prefixo(

                    s.prazoEntrega

                    ?

                    `Prazo de entrega: ${s.prazoEntrega}.`

                    :

                    'Prazo deixado em branco.',

                    proxima(s)

                );

            }


            /* ===================== */
            /* VALIDADE */
            /* ===================== */

            case 'validade': {

                if (
                    pular(texto)
                ) {

                    s.validade =
                        '';


                    s.concluido.validade =
                        true;


                    return prefixo(

                        'Validade deixada em branco.',

                        proxima(s)

                    );

                }


                const data =
                    parseValidade(
                        texto
                    );


                if (!data) {

                    return (
                        'Use, por exemplo, "7 dias", "15 dias", uma data AAAA-MM-DD ou "pular".'
                    );

                }


                s.validade =
                    data;


                s.concluido.validade =
                    true;


                return prefixo(

                    `Validade registrada: ${data}.`,

                    proxima(s)

                );

            }


            /* ===================== */
            /* NOTA */
            /* ===================== */

            case 'nota': {

                if (
                    sim(texto)
                ) {

                    s.temNota =
                        'sim';

                }
                else if (
                    nao(texto)
                ) {

                    s.temNota =
                        'nao';

                }
                else {

                    return (
                        'Escolha 1 para orçamento com nota ou 2 para sem nota.'
                    );

                }


                s.concluido.temNota =
                    true;


                return prefixo(

                    s.temNota
                    ===
                    'sim'

                    ?

                    'Orçamento com nota.'

                    :

                    'Orçamento sem nota. Vou aplicar a mesma regra de +12% já usada no Dominus.',

                    proxima(s)

                );

            }


            /* ===================== */
            /* MARGEM */
            /* ===================== */

            case 'margem_confirmar': {

                if (
                    sim(texto)
                ) {

                    s.concluido.margem =
                        true;


                    return resumoFinal(
                        s
                    );

                }


                if (
                    nao(texto)
                ) {

                    s.etapa =
                        'margem_valor';


                    return (
                        'Qual percentual deseja usar? Ex.: 35'
                    );

                }


                return (
                    'Escolha 1 para manter a margem do Centro de Custos ou 2 para alterar.'
                );

            }


            case 'margem_valor': {

                const m =
                    parseNumeroLivre(
                        texto
                    );


                if (
                    m < 0
                ) {

                    return (
                        'A margem não pode ser negativa.'
                    );

                }


                s.margemPercentual =
                    m;


                s.etapa =
                    'margem_metodo';


                return (
                    'Qual método deseja usar?\n\n1. Acréscimo sobre o custo\n2. Margem sobre preço de venda'
                );

            }


            case 'margem_metodo': {

                if (
                    t === '1'
                ) {

                    s.metodoMargem =
                        'acrescimo';

                }
                else if (
                    t === '2'
                ) {

                    if (
                        s.margemPercentual
                        >=
                        100
                    ) {

                        return (
                            'Para margem sobre preço de venda, o percentual precisa ser menor que 100%.'
                        );

                    }


                    s.metodoMargem =
                        'margem';

                }
                else {

                    return (
                        'Escolha 1 para acréscimo ou 2 para margem sobre preço de venda.'
                    );

                }


                s.concluido.margem =
                    true;


                return resumoFinal(
                    s
                );

            }


            /* ===================== */
            /* CONFIRMAR FINAL */
            /* ===================== */

            case 'confirmar_final': {

                if (
                    sim(texto)
                    ||
                    t.includes(
                        'gerar'
                    )
                    ||
                    t.includes(
                        'salvar'
                    )
                ) {

                    return {

                        gerar:
                            true,

                        texto:
                            'Perfeito. Vou gerar o orçamento com o valor calculado.'

                    };

                }


                if (
                    nao(texto)
                    ||
                    t.includes(
                        'alterar'
                    )
                ) {

                    s.etapa =
                        'alterar_escolha';


                    return menuAlteracoes();

                }


                return (
                    'Escolha 1 para gerar o orçamento ou 2 para alterar alguma informação.'
                );

            }


            /* ===================== */
            /* ALTERAÇÕES */
            /* ===================== */

            case 'alterar_escolha': {

                const escolha =
                    parseInt(
                        String(texto)
                        .trim(),
                        10
                    );


                const mapa = {

                    1:[
                        'cliente',
                        'cliente_busca'
                    ],

                    2:[
                        'servico',
                        'servico'
                    ],

                    3:[
                        'medida',
                        'medida'
                    ],

                    4:[
                        'materiais',
                        'materiais_sim_nao'
                    ],

                    5:[
                        'maoDeObra',
                        'mao_sim_nao'
                    ],

                    6:[
                        'deslocamento',
                        'deslocamento_sim_nao'
                    ],

                    7:[
                        'equipamentos',
                        'equipamento_sim_nao'
                    ],

                    8:[
                        'outrosCustos',
                        'outros_sim_nao'
                    ],

                    9:[
                        'pagamento',
                        'pagamento'
                    ],

                    10:[
                        'prazoEntrega',
                        'prazo'
                    ],

                    11:[
                        'validade',
                        'validade'
                    ],

                    12:[
                        'temNota',
                        'nota'
                    ],

                    13:[
                        'margem',
                        'margem_confirmar'
                    ]

                };


                const item =
                    mapa[
                        escolha
                    ];


                if (!item) {

                    return menuAlteracoes();

                }


                resetarCampo(
                    s,
                    item[0]
                );


                s.etapa =
                    item[1];


                return perguntaEtapaAtual(
                    s
                );

            }

        }


        return proxima(
            s
        );

    }


    /* ========================= */
    /* ADICIONAR MATERIAL */
    /* ========================= */


    function adicionarMaterial(
        s,
        p,
        q
    ) {

        const existente =
            s.materiais
            .find(

                x =>
                    String(
                        x.codigo
                    )
                    ===
                    String(
                        p.codigo
                    )

            );


        if (existente) {

            existente.quantidade =
                q;

        }
        else {

            s.materiais
            .push({

                codigo:
                    String(
                        p.codigo ?? ''
                    ),

                quantidade:
                    q

            });

        }

    }


    /* ========================= */
    /* ADICIONAR FUNCIONÁRIO */
    /* ========================= */


    function adicionarFuncionario(
        s,
        f,
        h
    ) {

        const existente =
            s.maoDeObra
            .find(

                x =>
                    String(
                        x.id
                    )
                    ===
                    String(
                        f.id
                    )

            );


        if (existente) {

            existente.horas =
                h;

        }
        else {

            s.maoDeObra
            .push({

                id:
                    String(
                        f.id ?? ''
                    ),

                horas:
                    h

            });

        }

    }


    /* ========================= */
    /* ADICIONAR EQUIPAMENTO */
    /* ========================= */


    function adicionarEquipamento(
        s,
        e,
        q
    ) {

        const existente =
            s.equipamentos
            .find(

                x =>
                    String(
                        x.id
                    )
                    ===
                    String(
                        e.id
                    )

            );


        if (existente) {

            existente.quantidade =
                q;

        }
        else {

            s.equipamentos
            .push({

                id:
                    String(
                        e.id ?? ''
                    ),

                quantidade:
                    q

            });

        }

    }


    /* ========================= */
    /* FORMATAR ROTA */
    /* ========================= */


    function formatarRota(
        rota
    ) {

        return [

            'Rota calculada automaticamente:',

            `Origem encontrada: ${rota.origemEncontrada}`,

            `Destino encontrado: ${rota.destinoEncontrado}`,

            `Distância de ida: ${brNum(rota.distanciaIdaKm,2)} km`,

            `Distância considerada: ${brNum(rota.distanciaTotalKm,2)} km`,

            `Tempo estimado de ida: ${rota.duracaoIdaMin} min`,

            'Fonte de rota: OpenStreetMap + OSRM'

        ]
        .join('\n');

    }


    /* ========================= */
    /* MENU ALTERAÇÕES */
    /* ========================= */


    function menuAlteracoes() {

        return [

            'O que deseja alterar?',

            '',

            '1. Cliente',

            '2. Serviço',

            '3. Medidas/quantidade',

            '4. Materiais',

            '5. Mão de obra',

            '6. Deslocamento',

            '7. Equipamentos',

            '8. Outros custos',

            '9. Pagamento',

            '10. Prazo de entrega',

            '11. Validade',

            '12. Nota',

            '13. Margem'

        ]
        .join('\n');

    }


    /* ========================= */
    /* RESETAR CAMPO */
    /* ========================= */


    function resetarCampo(
        s,
        campo
    ) {

        s.concluido[
            campo
        ] =
            false;


        s.opcoes =
            [];


        s.temporario =
            null;


        if (
            campo ===
            'cliente'
        ) {

            s.clienteCodigo =
                '';

            s.clienteNome =
                '';

        }


        if (
            campo ===
            'servico'
        ) {

            s.servico =
                '';

        }


        if (
            campo ===
            'medida'
        ) {

            s.medidaTexto =
                '';

            s.largura =
                0;

            s.altura =
                0;

            s.area =
                0;

        }


        if (
            campo ===
            'materiais'
        ) {

            s.materiais =
                [];

        }


        if (
            campo ===
            'maoDeObra'
        ) {

            s.maoDeObra =
                [];

        }


        if (
            campo ===
            'deslocamento'
        ) {

            s.deslocamento = {

                usar:
                    false,

                enderecoDestino:
                    '',

                idaVolta:
                    true,

                rota:
                    null,

                kmManual:
                    0,

                veiculoId:
                    ''

            };

        }


        if (
            campo ===
            'equipamentos'
        ) {

            s.equipamentos =
                [];

        }


        if (
            campo ===
            'outrosCustos'
        ) {

            s.outrosCustos =
                [];

        }


        if (
            campo ===
            'pagamento'
        ) {

            s.pagamento =
                '';

        }


        if (
            campo ===
            'prazoEntrega'
        ) {

            s.prazoEntrega =
                '';

        }


        if (
            campo ===
            'validade'
        ) {

            s.validade =
                '';

        }


        if (
            campo ===
            'temNota'
        ) {

            s.temNota =
                'sim';

        }


        if (
            campo ===
            'margem'
        ) {

            const p =
                centroCustos()
                    .parametros;


            s.margemPercentual =
                p.margemLucroPercentual;


            s.metodoMargem =
                p.metodoMargem;

        }

    }


    /* ========================= */
    /* PERGUNTA ETAPA */
    /* ========================= */


    function perguntaEtapaAtual(s) {

        if (
            s.etapa
            ===
            'margem_confirmar'
        ) {

            const metodo =
                s.metodoMargem
                ===
                'margem'

                ?

                'margem sobre preço de venda'

                :

                'acréscimo sobre custo';


            return (
                `O Centro de Custos está configurado com ${brNum(s.margemPercentual,2)}% de ${metodo}. Deseja manter?\n\n1. Sim\n2. Não, alterar`
            );

        }


        const mapa = {

            cliente_busca:
                'Digite o nome, parte do nome ou código do cliente.',

            servico:
                'Qual serviço será realizado?',

            medida:
                'Qual a nova medida ou quantidade?',

            materiais_sim_nao:
                'Deseja incluir materiais do estoque?\n\n1. Sim\n2. Não',

            mao_sim_nao:
                'Haverá mão de obra de funcionários?\n\n1. Sim\n2. Não',

            deslocamento_sim_nao:
                'Haverá deslocamento?\n\n1. Sim\n2. Não',

            equipamento_sim_nao:
                'Deseja incluir equipamentos?\n\n1. Sim\n2. Não',

            outros_sim_nao:
                'Deseja incluir outros custos?\n\n1. Sim\n2. Não',

            pagamento:
                'Qual a forma de pagamento?',

            prazo:
                'Qual o prazo de entrega?',

            validade:
                'Qual a validade do orçamento?',

            nota:
                'O orçamento será com nota?\n\n1. Sim\n2. Não'

        };


        return mapa[
            s.etapa
        ]
        ||
        proxima(s);

    }


    /* ========================= */
    /* GERAR ORÇAMENTO */
    /* ========================= */


    async function gerarOrcamento() {

        const s =
            sessao()
                .estado;


        const calc =
            calcular(s);


        if (
            !(
                calc.resumo
                    .totalCliente
                >
                0
            )
        ) {

            msgIA(
                'O valor calculado está zerado. Inclua pelo menos um custo antes de gerar o orçamento.'
            );


            renderizar();


            return;

        }


        const cliente =
            clienteAtual(s)
            ||
            {};


        const codigo =
            typeof window
                .obterProximoCodigoOrcamento
            ===
            'function'

            ?

            window
                .obterProximoCodigoOrcamento()

            :

            Math.max(

                3687,

                ...A(
                    window.db
                        ?.orcamentos
                )
                .map(
                    o =>
                        Number(
                            o.codigo
                        )
                        ||
                        0
                )

            )
            +
            1;


        const descricao =
            [

                s.servico,

                s.medidaTexto

            ]
            .filter(Boolean)
            .join(
                ' - '
            );


        const novo = {

            codigo,

            data:
                hoje(),

            cliente:
                s.clienteNome,

            ac:
                '',

            telefone:
                cliente.telefone
                ||
                '',

            email:
                cliente.email
                ||
                '',

            validade:
                s.validade
                ||
                '',

            prazo:
                s.pagamento
                ||
                '',

            prazoEntrega:
                s.prazoEntrega
                ||
                '',

            temNota:
                s.temNota,

            status:
                'Aguardando',

            preContrato:
                'nao',

            observacoes:
                '',

            itens:[

                {

                    produto:
                        descricao
                        ||
                        s.servico,

                    qtd:
                        1,

                    valor:
                        calc.resumo
                            .precoSugerido,

                    total:
                        calc.resumo
                            .precoSugerido

                }

            ],

            total:
                calc.resumo
                    .totalCliente,


            /* ===================== */
            /* DADOS INTERNOS */
            /* ===================== */

            calculoInterno:{

                origem:
                    'Assistente Dominus Local',

                estado:
                    JSON.parse(
                        JSON.stringify(
                            s
                        )
                    ),

                calculo:
                    JSON.parse(
                        JSON.stringify(
                            calc
                        )
                    )

            }

        };


        window.db.orcamentos =
            A(
                window.db
                    .orcamentos
            );


        window.db
            .orcamentos
            .push(
                novo
            );


        window.db
            .ultimoOrcamento =
                codigo;


        if (
            typeof window.save
            ===
            'function'
        ) {

            await window.save();

        }
        else if (
            typeof window.saveDB
            ===
            'function'
        ) {

            await window.saveDB();

        }


        if (
            typeof window.closeModal
            ===
            'function'
        ) {

            window.closeModal();

        }


        if (
            typeof window.navigate
            ===
            'function'
        ) {

            await window.navigate(
                'orcamentos',
                false
            );

        }


        window.assistenteOrcamentoLocal =
            null;


        alert(

            `Orçamento #${codigo} criado com sucesso.\n\nTotal: ${money(novo.total)}`

        );

    }


    /* ========================= */
    /* INTERFACE */
    /* ========================= */


    function renderizar() {

        const ss =
            sessao();


        const calc =
            calcular(
                ss.estado
            );


        ss.calculo =
            calc;


        const mensagens =
            ss.mensagens
            .map(

                m => {

                    const ia =
                        m.tipo
                        ===
                        'ia';


                    return `

                        <div
                            style="
                                display:flex;
                                justify-content:${ia ? 'flex-start' : 'flex-end'};
                                margin-bottom:12px;
                            "
                        >

                            <div
                                style="
                                    max-width:84%;
                                    background:${ia ? '#f3f4f6' : '#7c3aed'};
                                    color:${ia ? '#111827' : '#fff'};
                                    padding:12px 14px;
                                    border-radius:${ia ? '6px 16px 16px 16px' : '16px 6px 16px 16px'};
                                    line-height:1.5;
                                    white-space:normal;
                                "
                            >

                                ${
                                    esc(
                                        m.texto
                                    )
                                    .replace(
                                        /\n/g,
                                        '<br>'
                                    )
                                }

                            </div>

                        </div>

                    `;

                }

            )
            .join('');


        configModal({

            title:
                '🤖 Assistente Dominus - Orçamento',

            hideConfirm:
                true,

            body:`

                <div
                    style="
                        display:grid;
                        grid-template-columns:1fr auto;
                        gap:10px;
                        align-items:center;
                        margin-bottom:10px;
                        padding:10px 12px;
                        border-radius:10px;
                        background:#ecfdf5;
                        border:1px solid #a7f3d0;
                        color:#065f46;
                        font-size:12px;
                    "
                >

                    <span>
                        ● Assistente local
                        • usa apenas dados do Dominus
                        • internet somente para rota
                    </span>


                    <strong>
                        Total atual:
                        ${
                            money(
                                calc.resumo
                                    .totalCliente
                            )
                        }
                    </strong>

                </div>


                <div
                    id="chat-assistente-local"
                    style="
                        height:450px;
                        overflow:auto;
                        padding:14px;
                        background:#fff;
                        border-radius:12px;
                        border:1px solid #e5e7eb;
                    "
                >

                    ${mensagens}

                </div>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        margin-top:12px;
                    "
                >

                    <textarea
                        id="entrada-assistente-local"
                        rows="2"
                        placeholder="Digite sua resposta..."
                        style="
                            flex:1;
                            resize:none;
                            padding:11px 12px;
                            border:1px solid #d1d5db;
                            border-radius:10px;
                            font-family:inherit;
                        "
                        onkeydown="
                            if(
                                event.key==='Enter'
                                &&
                                !event.shiftKey
                            ){
                                event.preventDefault();
                                enviarMensagemAssistenteLocal();
                            }
                        "
                    ></textarea>


                    <button
                        type="button"
                        class="btn-action"
                        style="
                            width:110px;
                            background:#7c3aed;
                        "
                        onclick="
                            enviarMensagemAssistenteLocal()
                        "
                    >

                        Enviar

                    </button>

                </div>


                <div
                    style="
                        margin-top:8px;
                        color:#6b7280;
                        font-size:11px;
                    "
                >

                    Comandos:
                    <b>resumo</b>
                    •
                    <b>reiniciar</b>

                </div>

            `

        });


        setTimeout(

            ()=>{

                const box =
                    document
                    .getElementById(
                        'chat-assistente-local'
                    );


                if (box) {

                    box.scrollTop =
                        box.scrollHeight;

                }


                const input =
                    document
                    .getElementById(
                        'entrada-assistente-local'
                    );


                if (input) {

                    input.focus();

                }

            },

            50

        );

    }


    /* ========================= */
    /* ABRIR ASSISTENTE */
    /* ========================= */


    window
        .abrirAssistenteOrcamentoIA =
    function(){

        novaSessao();


        msgIA(

            'Olá! 🤖 Sou o Assistente Dominus Local.\n\n' +

            'Vou montar o orçamento passo a passo usando clientes, estoque, funcionários, veículos, equipamentos e parâmetros do Centro de Custos.\n\n' +

            'Eu nunca seleciono cliente, material, funcionário, veículo ou equipamento sem sua confirmação.\n\n' +

            'Digite o nome, parte do nome ou código do cliente.'

        );


        renderizar();

    };


    /* ========================= */
    /* ENVIAR */
    /* ========================= */


    window
        .enviarMensagemAssistenteLocal =
    async function(){

        const ss =
            sessao();


        if (
            ss.ocupado
        ) {

            return;

        }


        const input =
            document
            .getElementById(
                'entrada-assistente-local'
            );


        if (!input) {

            return;

        }


        const texto =
            input.value
            .trim();


        if (!texto) {

            return;

        }


        input.value =
            '';


        ss.ocupado =
            true;


        msgUser(
            texto
        );


        renderizar();


        try {

            const resposta =
                await processar(
                    texto
                );


            if (
                resposta
                &&
                typeof resposta
                ===
                'object'
                &&
                resposta.gerar
            ) {

                msgIA(
                    resposta.texto
                );


                renderizar();


                await gerarOrcamento();


                return;

            }


            msgIA(
                resposta
            );

        }
        catch(e){

            console.error(
                'Assistente Dominus Local:',
                e
            );


            msgIA(

                `Ocorreu um erro interno: ${
                    e.message
                    ||
                    e
                }`

            );

        }
        finally {

            ss.ocupado =
                false;

        }


        renderizar();

    };


    /* ========================= */
    /* COMPATIBILIDADE */
    /* ========================= */


    window.renderChatIA =
        renderizar;


    window.criarOrcamentoComIA =
        gerarOrcamento;


    console.log(
        'Assistente Dominus Local completo carregado.'
    );


})();