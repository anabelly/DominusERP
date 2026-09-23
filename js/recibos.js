/* ========================================================= */
/* DOMINUS ERP - RECIBOS.JS                                  */
/* ========================================================= */
/*
    RECIBOS E COMPROVANTES

    Este arquivo controla a criação e gerenciamento de
    recibos/comprovantes do Dominus ERP.

    PRINCIPAIS RESPONSABILIDADES:
    1. Renderizar a listagem de recibos
    2. Consultar recibos
    3. Gerar numeração automática
    4. Criar recibos manuais
    5. Adicionar itens e calcular totais
    6. Gerar recibos a partir de orçamentos
    7. Visualizar recibos
    8. Imprimir / gerar PDF
    9. Editar recibos
    10. Excluir recibos
    11. Receber automaticamente Termos de Serviço vindos de OS
    12. Visualizar, editar, imprimir e excluir Termos de Serviço
    13. Exibir clientes em ordem alfabética nos campos de seleção
    14. Registrar a página "recibos"

    TERMO AUTOMÁTICO:
    Quando uma Ordem de Serviço muda para "Concluída",
    é criado automaticamente um Termo de Recebimento de
    Produtos/Serviços nesta tela. O termo usa os dados do
    cliente e os itens da OS, inspirado no modelo utilizado
    pela empresa.
*/


/* ========================================================= */
/* 00. TERMO DE SERVIÇO AUTOMÁTICO                          */
/* ========================================================= */

/* --------------------------------------------------------- */
/* escaparHTMLTermoServico                                   */
/* Evita quebrar o HTML com textos digitados pelo usuário.   */
/* --------------------------------------------------------- */

function escaparHTMLTermoServico(
    valor
) {

    return String(
        valor
        ??
        ''
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


/* --------------------------------------------------------- */
/* ordenarClientesRecibos                                    */
/* Retorna uma cópia em ordem alfabética pelo nome.          */
/* --------------------------------------------------------- */
/*
    ORDEM ALFABÉTICA - CLIENTES DOS RECIBOS E COMPROVANTES

    A ordenação é somente visual.

    IMPORTANTE:
    - o array original do banco NÃO é reordenado;
    - códigos, IDs e vínculos permanecem intactos;
    - a comparação usa pt-BR;
    - diferenças de acentuação e maiúsculas/minúsculas não
      atrapalham a ordem apresentada nos campos de seleção.
*/

function ordenarClientesRecibos(
    lista
) {

    return [
        ...(
            Array.isArray(
                lista
            )
            ?
            lista
            :
            []
        )
    ]
    .sort(
        (a, b) =>
            String(
                a?.nome || ''
            )
            .localeCompare(
                String(
                    b?.nome || ''
                ),
                'pt-BR',
                {
                    sensitivity:'base'
                }
            )
    );
}


/* --------------------------------------------------------- */
/* ehTermoServico                                            */
/* Identifica documentos automáticos vindos de uma OS.       */
/* --------------------------------------------------------- */

function ehTermoServico(
    registro
) {

    return (
        registro
        &&
        registro.tipoDocumento ===
            'termo_servico'
    );
}


/* --------------------------------------------------------- */
/* origemDocumentoRecibo                                     */
/* As únicas origens visíveis são: Termo, Orçamento, Recibo. */
/* --------------------------------------------------------- */

function origemDocumentoRecibo(
    registro
) {

    if (
        ehTermoServico(
            registro
        )
    ) {

        return 'Termo';
    }

    if (
        String(
            registro?.origem || ''
        ).toLowerCase()
        ===
        'orcamento'
    ) {

        return 'Orçamento';
    }

    return 'Recibo';
}


/* --------------------------------------------------------- */
/* corOrigemDocumentoRecibo                                  */
/* Mantém a coluna Origem visualmente padronizada.           */
/* --------------------------------------------------------- */

function corOrigemDocumentoRecibo(
    registro
) {

    const origem =
        origemDocumentoRecibo(
            registro
        );

    if (
        origem ===
        'Termo'
    ) {

        return '#7c3aed';
    }

    if (
        origem ===
        'Orçamento'
    ) {

        return '#2563eb';
    }

    return '#16a34a';
}


/* --------------------------------------------------------- */
/* proximoNumeroDocumentoRecibo                              */
/* Uma única sequência para recibos e termos: REC-0001...    */
/* --------------------------------------------------------- */

function proximoNumeroDocumentoRecibo() {

    const numeros =
        (db.recibos || [])
            .map(
                registro => {

                    const match =
                        String(
                            registro.numero || ''
                        )
                        .match(
                            /^REC-(\d+)$/i
                        );

                    return match
                        ?
                        Number(
                            match[1]
                        )
                        :
                        0;
                }
            );

    const maior =
        numeros.length
            ?
            Math.max(
                ...numeros
            )
            :
            0;

    return (
        'REC-'
        +
        String(
            maior + 1
        )
        .padStart(
            4,
            '0'
        )
    );
}


/* --------------------------------------------------------- */
/* normalizarRegistrosRecibos                                */
/* Migra TERMO-xxxx e origem antiga para o padrão atual.     */
/* --------------------------------------------------------- */

function normalizarRegistrosRecibos(
    salvarAlteracoes = true
) {

    if (
        !Array.isArray(
            db.recibos
        )
    ) {

        db.recibos =
            [];

        return false;
    }

    let alterou =
        false;

    /*
        Primeiro encontra o maior REC já utilizado.
        Registros antigos TERMO-xxxx recebem os próximos números
        sem alterar os REC existentes.
    */

    let maior =
        0;

    db.recibos.forEach(
        registro => {

            const match =
                String(
                    registro.numero || ''
                )
                .match(
                    /^REC-(\d+)$/i
                );

            if (match) {

                maior =
                    Math.max(
                        maior,
                        Number(
                            match[1]
                        )
                        ||
                        0
                    );
            }
        }
    );

    db.recibos.forEach(
        registro => {

            if (
                !/^REC-\d+$/i.test(
                    String(
                        registro.numero || ''
                    )
                )
            ) {

                maior++;

                registro.numero =
                    'REC-'
                    +
                    String(
                        maior
                    )
                    .padStart(
                        4,
                        '0'
                    );

                alterou =
                    true;
            }

            const origemNova =
                ehTermoServico(
                    registro
                )
                    ?
                    'termo'
                    :
                    String(
                        registro.origem || ''
                    ).toLowerCase()
                    ===
                    'orcamento'
                        ?
                        'orcamento'
                        :
                        'recibo';

            if (
                registro.origem !==
                origemNova
            ) {

                registro.origem =
                    origemNova;

                alterou =
                    true;
            }
        }
    );

    if (
        alterou
        &&
        salvarAlteracoes
        &&
        typeof save ===
            'function'
    ) {

        Promise
            .resolve(
                save()
            )
            .catch(
                erro =>
                    console.error(
                        'Erro ao normalizar recibos/termos:',
                        erro
                    )
            );
    }

    return alterou;
}


/*
    Compatibilidade com o nome usado na criação automática
    do Termo vindo da OS. Agora ele usa a mesma sequência REC.
*/

window.proximoNumeroTermoServico =
function () {

    return proximoNumeroDocumentoRecibo();
};


/* --------------------------------------------------------- */
/* localizarClienteCadastroTermo                             */
/* Sempre busca os dados atuais na tela/cadastro de Clientes.*/
/* --------------------------------------------------------- */

function localizarClienteCadastroTermo(
    termo
) {

    const clientes =
        Array.isArray(
            db.clientes
        )
        ?
        db.clientes
        :
        [];

    /*
        Primeiro tenta pelo código interno.
        Se o termo for antigo e não possuir código, usa o nome.
    */

    if (
        termo?.clienteCodigo
    ) {

        const porCodigo =
            clientes.find(
                cliente =>
                    String(
                        cliente.codigo || ''
                    ).trim()
                    ===
                    String(
                        termo.clienteCodigo || ''
                    ).trim()
            );

        if (porCodigo) {

            return porCodigo;
        }
    }

    const nome =
        String(
            termo?.cliente || ''
        )
        .trim()
        .toLowerCase();

    if (!nome) {

        return null;
    }

    return (
        clientes.find(
            cliente =>
                String(
                    cliente.nome || ''
                )
                .trim()
                .toLowerCase()
                ===
                nome
        )
        ||
        null
    );
}


/* --------------------------------------------------------- */
/* normalizarTextoVinculoOrcamento                           */
/* Usado apenas para recuperar vínculos antigos.             */
/* --------------------------------------------------------- */

function normalizarTextoVinculoOrcamento(valor) {

    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}


/* --------------------------------------------------------- */
/* assinaturaItensVinculoOrcamento                           */
/* Compara os itens da OS/Termo com os itens do orçamento.   */
/* --------------------------------------------------------- */

function assinaturaItensVinculoOrcamento(itens) {

    return (Array.isArray(itens) ? itens : [])
        .map(item => {

            const descricao =
                normalizarTextoVinculoOrcamento(
                    item.produto || item.descricao || ''
                );

            const quantidade =
                String(
                    item.quantidade ?? item.qtd ?? ''
                ).trim();

            return `${descricao}|${quantidade}`;
        })
        .filter(item => item !== '|')
        .sort()
        .join('||');
}


/* --------------------------------------------------------- */
/* localizarOrcamentoPorClienteEItens                        */
/* Recupera orçamento antigo somente quando não é ambíguo.   */
/* --------------------------------------------------------- */

function localizarOrcamentoPorClienteEItens(clienteNome, itens) {

    const nomeCliente =
        normalizarTextoVinculoOrcamento(clienteNome);

    if (!nomeCliente || !Array.isArray(db.orcamentos)) {
        return null;
    }

    const orcamentosCliente =
        db.orcamentos.filter(orcamento =>
            normalizarTextoVinculoOrcamento(orcamento.cliente)
            === nomeCliente
        );

    if (!orcamentosCliente.length) {
        return null;
    }

    const assinatura =
        assinaturaItensVinculoOrcamento(itens);

    if (assinatura) {

        const exatos =
            orcamentosCliente.filter(orcamento =>
                assinaturaItensVinculoOrcamento(orcamento.itens)
                === assinatura
            );

        if (exatos.length === 1) {
            return exatos[0];
        }
    }

    const aprovados =
        orcamentosCliente.filter(orcamento =>
            String(orcamento.status || '').trim() === 'Aprovado'
        );

    if (aprovados.length === 1) {
        return aprovados[0];
    }

    if (orcamentosCliente.length === 1) {
        return orcamentosCliente[0];
    }

    return null;
}


/* --------------------------------------------------------- */
/* localizarOrcamentoDoTermo                                 */
/* Busca o nº do orçamento pela OS vinculada ou pelo próprio */
/* registro do termo.                                        */
/* --------------------------------------------------------- */

function localizarNumeroOrcamentoTermo(
    termo
) {

    if (termo?.orcamentoCodigo) {
        return String(termo.orcamentoCodigo).trim();
    }

    let osVinculada = null;

    if (
        termo?.osCodigo
        &&
        Array.isArray(db.ordensServico)
    ) {

        osVinculada =
            db.ordensServico.find(item =>
                String(item.codigo || '').trim()
                === String(termo.osCodigo || '').trim()
            ) || null;

        const numeroDaOS =
            osVinculada?.numeroOrcamento
            || osVinculada?.orcamentoCodigo
            || '';

        if (numeroDaOS) {
            termo.orcamentoCodigo = String(numeroDaOS).trim();
            return termo.orcamentoCodigo;
        }
    }

    /*
        Compatibilidade com OS antigas que perderam o vínculo
        quando foram editadas em uma versão anterior.
    */

    const orcamentoRecuperado =
        localizarOrcamentoPorClienteEItens(
            osVinculada?.cliente || termo?.cliente || '',
            osVinculada?.itens || termo?.itens || []
        );

    if (!orcamentoRecuperado?.codigo) {
        return '';
    }

    const numero =
        String(orcamentoRecuperado.codigo).trim();

    termo.orcamentoCodigo = numero;

    if (osVinculada) {
        osVinculada.numeroOrcamento = numero;
        osVinculada.tipoCriacao = 'orcamento';
    }

    if (typeof save === 'function') {
        Promise.resolve(save()).catch(erro =>
            console.error(
                'Erro ao salvar vínculo recuperado do orçamento:',
                erro
            )
        );
    }

    return numero;
}


/* --------------------------------------------------------- */
/* prepararTermoServicoParaExibicao                          */
/* Cria uma cópia do termo usando SEMPRE os dados atuais do  */
/* cadastro do cliente e o orçamento vinculado.              */
/* --------------------------------------------------------- */

function prepararTermoServicoParaExibicao(
    termo
) {

    if (!termo) {

        return termo;
    }

    const cliente =
        localizarClienteCadastroTermo(
            termo
        );

    const numeroOrcamento =
        localizarNumeroOrcamentoTermo(
            termo
        );

    const copia = {

        ...termo,

        /*
            Instalação / Entrega deve mostrar a data em que
            o termo foi gerado.
        */

        dataEntregaPrevista:
            termo.data
            ||
            termo.dataEntregaPrevista
            ||
            '',

        orcamentoCodigo:
            numeroOrcamento
    };

    if (!cliente) {

        return copia;
    }

    /*
        Todos os dados abaixo vêm diretamente do cadastro atual
        do cliente.
    */

    copia.clienteCodigo =
        cliente.codigo
        ||
        termo.clienteCodigo
        ||
        '';

    copia.cliente =
        cliente.nome
        ||
        termo.cliente
        ||
        '';

    copia.documento =
        cliente.documento
        ||
        '';

    copia.ie =
        cliente.rgie
        ||
        '';

    copia.rgie =
        cliente.rgie
        ||
        '';

    copia.contato =
        cliente.telefone
        ||
        '';

    copia.telefone =
        cliente.telefone
        ||
        '';

    copia.email =
        cliente.email
        ||
        '';

    copia.cep =
        cliente.cep
        ||
        '';

    copia.endereco =
        cliente.endereco
        ||
        '';

    copia.numeroEndereco =
        cliente.numero
        ||
        '';

    copia.bairro =
        cliente.bairro
        ||
        '';

    copia.cidade =
        cliente.cidade
        ||
        '';

    copia.estado =
        cliente.estado
        ||
        '';

    copia.observacoesCliente =
        cliente.obs
        ||
        '';

    copia.enderecoInstalacao =
        montarEnderecoCompletoTermo(
            cliente
        );

    return copia;
}


/* --------------------------------------------------------- */
/* montarEnderecoCompletoTermo                               */
/* Monta endereço completo usando o cadastro do cliente.     */
/* --------------------------------------------------------- */

function montarEnderecoCompletoTermo(
    cliente
) {

    const enderecoNumero =
        [
            cliente?.endereco,
            cliente?.numero
        ]
        .filter(Boolean)
        .join(', ');

    const cidadeEstado =
        [
            cliente?.cidade,
            cliente?.estado
        ]
        .filter(Boolean)
        .join(' - ');

    return [
        enderecoNumero,
        cliente?.bairro,
        cidadeEstado
    ]
    .filter(Boolean)
    .join(', ');
}


/* --------------------------------------------------------- */
/* montarDimensoesItemTermo                                  */
/* Exibe somente as dimensões existentes no item da OS.      */
/* --------------------------------------------------------- */

function montarDimensoesItemTermo(
    item
) {

    const partes =
        [];

    if (
        item?.altura
    ) {

        partes.push(
            `Alt.: ${item.altura}`
        );
    }

    if (
        item?.largura
    ) {

        partes.push(
            `Larg.: ${item.largura}`
        );
    }

    if (
        item?.comprimento
    ) {

        partes.push(
            `Comp.: ${item.comprimento}`
        );
    }

    return partes.join(
        ' • '
    );
}


/* --------------------------------------------------------- */
/* criarTermoServicoDaOS                                     */
/* Cria o termo quando a OS é colocada como Concluída.       */
/* --------------------------------------------------------- */

window.criarTermoServicoDaOS =
async function (
    os
) {

    if (
        !os
        ||
        os.status !==
            'Concluída'
    ) {

        return null;
    }

    if (
        !Array.isArray(
            db.recibos
        )
    ) {

        db.recibos =
            [];
    }

    /*
        Garante que qualquer TERMO-xxxx antigo seja convertido
        para a sequência única REC antes de criar um novo.
    */

    normalizarRegistrosRecibos(
        false
    );

    /*
        Não cria dois termos para a mesma OS.
    */

    const existente =
        db.recibos.find(
            r =>
                ehTermoServico(
                    r
                )
                &&
                String(
                    r.osCodigo || ''
                ).trim()
                ===
                String(
                    os.codigo || ''
                ).trim()
        );

    if (
        existente
    ) {

        return existente;
    }

    const cliente =
        (db.clientes || [])
            .find(
                c =>
                    String(
                        c.nome || ''
                    ).trim()
                    .toLowerCase()
                    ===
                    String(
                        os.cliente || ''
                    ).trim()
                    .toLowerCase()
            )
        ||
        {};

    const enderecoBase =
        [
            cliente.endereco,
            cliente.numero
        ]
        .filter(Boolean)
        .join(', ');

    const itens =
        (os.itens || [])
            .map(
                item => ({

                    descricao:
                        item.produto
                        ||
                        item.descricao
                        ||
                        '',

                    qtd:
                        item.quantidade
                        ||
                        item.qtd
                        ||
                        '',

                    dimensoes:
                        montarDimensoesItemTermo(
                            item
                        )
                })
            );

    const termo = {

        numero:
            proximoNumeroDocumentoRecibo(),

        data:
            new Date()
                .toISOString()
                .split('T')[0],

        tipoDocumento:
            'termo_servico',

        origem:
            'termo',

        osCodigo:
            os.codigo
            ||
            '',

        orcamentoCodigo:
            os.numeroOrcamento
            ||
            '',

        /*
            Para o termo, Instalação / Entrega corresponde
            sempre à data em que o documento foi gerado.
        */

        dataEntregaPrevista:
            new Date()
                .toISOString()
                .split('T')[0],

        clienteCodigo:
            cliente.codigo
            ||
            '',

        cliente:
            os.cliente
            ||
            cliente.nome
            ||
            '',

        documento:
            cliente.documento
            ||
            '',

        ie:
            cliente.rgie
            ||
            '',

        rgie:
            cliente.rgie
            ||
            '',

        contato:
            cliente.telefone
            ||
            '',

        telefone:
            cliente.telefone
            ||
            '',

        email:
            cliente.email
            ||
            '',

        cep:
            cliente.cep
            ||
            '',

        endereco:
            cliente.endereco
            ||
            '',

        numeroEndereco:
            cliente.numero
            ||
            '',

        complemento:
            '',

        bairro:
            cliente.bairro
            ||
            '',

        cidade:
            cliente.cidade
            ||
            '',

        estado:
            cliente.estado
            ||
            '',

        observacoesCliente:
            cliente.obs
            ||
            '',

        enderecoInstalacao:
            montarEnderecoCompletoTermo(
                cliente
            ),

        responsavelEquipe:
            '',

        observacoes:
            os.observacao
            ||
            '',

        itens,

        /*
            Campos que normalmente serão preenchidos/assinados
            pelo cliente na instalação.
        */

        resultadoRecebimento:
            '',

        restricoes:
            '',

        avaliacaoPrazo:
            '',

        avaliacaoEquipe:
            '',

        avaliacaoLimpeza:
            '',

        avaliacaoEpi:
            '',

        responsavelRecebimento:
            '',

        responsavelDocumento:
            '',

        responsavelFuncao:
            '',

        dataRecebimento:
            ''
    };

    db.recibos.push(
        termo
    );

    await save();

    return termo;
};


/* --------------------------------------------------------- */
/* montarHTMLTermoServico                                    */
/* Visual profissional do termo para tela e impressão.       */
/* --------------------------------------------------------- */

function montarHTMLTermoServico(
    termo,
    logoSrc = ''
) {

    const itens =
        Array.isArray(
            termo.itens
        )
        ?
        termo.itens
        :
        [];

    const itensHTML =
        itens.length
            ?
            itens.map(
                (item, i) => `

                    <tr>

                        <td class="term-center term-num">
                            ${i + 1}
                        </td>

                        <td>
                            <div class="term-item-title">
                                ${escaparHTMLTermoServico(
                                    item.descricao || '-'
                                )}
                            </div>

                            ${
                                item.dimensoes
                                    ?
                                    `
                                        <div class="term-item-sub">
                                            ${escaparHTMLTermoServico(
                                                item.dimensoes
                                            )}
                                        </div>
                                    `
                                    :
                                    ''
                            }
                        </td>

                        <td class="term-center term-qtd">
                            ${escaparHTMLTermoServico(
                                item.qtd || '-'
                            )}
                        </td>

                    </tr>

                `
            )
            .join('')
            :
            `
                <tr>
                    <td
                        colspan="3"
                        class="term-empty">
                        Nenhum produto/serviço informado.
                    </td>
                </tr>
            `;

    const logo =
        logoSrc
            ?
            `
                <img
                    class="term-logo"
                    src="${logoSrc}"
                    alt="WN Comunicação Visual">
            `
            :
            `
                <div class="term-logo-fallback">
                    WN Comunicação Visual
                </div>
            `;

    const dataEmissao =
        termo.data
            ?
            formatarDataBR(
                termo.data
            )
            :
            '-';

    const dataPrevista =
        termo.dataEntregaPrevista
            ?
            formatarDataBR(
                termo.dataEntregaPrevista
            )
            :
            '-';

    const cidadeEstado =
        [
            termo.cidade,
            termo.estado
        ]
        .filter(Boolean)
        .join(' - ');

    return `

<div class="term-page">

    <!-- CABEÇALHO -->

    <div class="term-header">

        <div class="term-brand">
            ${logo}
        </div>

        <div class="term-title-area">

            <div class="term-kicker">
                ${escaparHTMLTermoServico(
                    termo.numero || 'TERMO'
                )}
            </div>

            <h1>
                TERMO DE RECEBIMENTO
            </h1>

            <div class="term-subtitle">
                Produtos / Serviços
            </div>

        </div>

    </div>


    <!-- IDENTIFICAÇÃO DO DOCUMENTO -->

    <div class="term-top-grid">

        <div class="term-info-card">

            <span class="term-label">
                Orçamento
            </span>

            <strong>
                ${escaparHTMLTermoServico(
                    termo.orcamentoCodigo || '-'
                )}
            </strong>

        </div>

        <div class="term-info-card">

            <span class="term-label">
                Emissão
            </span>

            <strong>
                ${dataEmissao}
            </strong>

        </div>

        <div class="term-info-card">

            <span class="term-label">
                Instalação / Entrega
            </span>

            <strong>
                ${dataPrevista}
            </strong>

        </div>

    </div>


    <!-- DADOS DO CLIENTE -->

    <section class="term-section">

        <div class="term-section-title">
            Dados do Cliente
        </div>

        <div class="term-client-grid">

            <div class="term-field term-span-2">

                <span class="term-label">
                    Cliente
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.cliente || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    CPF / CNPJ
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.documento || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    RG / Inscrição Estadual
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.rgie
                        ||
                        termo.ie
                        ||
                        '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    Telefone
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.telefone
                        ||
                        termo.contato
                        ||
                        '-'
                    )}
                </strong>

            </div>

            <div class="term-field term-span-2">

                <span class="term-label">
                    E-mail
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.email || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    CEP
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.cep || '-'
                    )}
                </strong>

            </div>

            <div class="term-field term-span-2">

                <span class="term-label">
                    Endereço
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.endereco || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    Número
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.numeroEndereco || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    Complemento
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.complemento || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    Bairro
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.bairro || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    Cidade
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.cidade || '-'
                    )}
                </strong>

            </div>

            <div class="term-field">

                <span class="term-label">
                    Estado
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.estado || '-'
                    )}
                </strong>

            </div>

            ${
                termo.observacoesCliente
                    ?
                    `
                        <div class="term-field term-span-4">

                            <span class="term-label">
                                Observações do Cadastro do Cliente
                            </span>

                            <strong>
                                ${escaparHTMLTermoServico(
                                    termo.observacoesCliente
                                )}
                            </strong>

                        </div>
                    `
                    :
                    ''
            }

            <div class="term-field term-span-2">

                <span class="term-label">
                    Responsável da equipe pela Instalação / Entrega
                </span>

                <strong>
                    ${escaparHTMLTermoServico(
                        termo.responsavelEquipe || '____________________________________________'
                    )}
                </strong>

            </div>

        </div>

    </section>


    <!-- SERVIÇOS -->

    <section class="term-section">

        <div class="term-section-title">
            Produtos entregues / instalados ou serviços executados
        </div>

        <div class="term-table-wrap">

            <table class="term-table">

                <thead>

                    <tr>
                        <th class="term-num">
                            Item
                        </th>
                        <th>
                            Produto / Serviço
                        </th>
                        <th class="term-qtd">
                            Qtd.
                        </th>
                    </tr>

                </thead>

                <tbody>
                    ${itensHTML}
                </tbody>

            </table>

        </div>

        <div class="term-install-address">

            <span class="term-label">
                Endereço da Instalação
            </span>

            <strong>
                ${escaparHTMLTermoServico(
                    termo.enderecoInstalacao || '-'
                )}
            </strong>

        </div>

        ${
            termo.observacoes
                ?
                `
                    <div class="term-note">

                        <span class="term-label">
                            Observações da OS
                        </span>

                        <div>
                            ${escaparHTMLTermoServico(
                                termo.observacoes
                            )}
                        </div>

                    </div>
                `
                :
                ''
        }

    </section>


    <!-- CONFERÊNCIA -->

    <section class="term-section term-no-break">

        <div class="term-section-title">
            Conferência e avaliação
        </div>

        <p class="term-intro">
            Depois de conferido e avaliado os seguintes itens:
        </p>

        <ul class="term-check-list">
            <li>
                Existência de defeitos no material ou instalação;
            </li>
            <li>
                Má qualidade nos materiais ou defeitos na impressão de lonas ou adesivos;
            </li>
            <li>
                Instalação executada de forma errada ou fora de projeto.
            </li>
        </ul>

        <div class="term-consider">

            <div class="term-consider-title">
                Considero que:
            </div>

            <div class="term-choice">
                <span class="term-box"></span>
                Os produtos foram entregues e instalados plenamente, sem ressalvas.
            </div>

            <div class="term-choice">
                <span class="term-box"></span>
                Os produtos foram entregues e instalados com restrições ou defeitos,
                necessitando de adequação e conserto.
            </div>

            <div class="term-restrictions">
                ${
                    termo.restricoes
                        ?
                        escaparHTMLTermoServico(
                            termo.restricoes
                        )
                        :
                        '&nbsp;'
                }
            </div>

        </div>

    </section>


    <!-- AVALIAÇÃO TÉCNICA -->

    <section class="term-section term-no-break">

        <div class="term-section-title">
            Avaliação Técnica
        </div>

        <div class="term-rating-row">
            <span>Prazo de entrega do material</span>
            <span>Ótimo <b class="term-box"></b></span>
            <span>Bom <b class="term-box"></b></span>
            <span>Ruim <b class="term-box"></b></span>
        </div>

        <div class="term-rating-row">
            <span>Comportamento da equipe na instalação</span>
            <span>Ótimo <b class="term-box"></b></span>
            <span>Bom <b class="term-box"></b></span>
            <span>Ruim <b class="term-box"></b></span>
        </div>

        <div class="term-rating-row">
            <span>Limpeza do local após término da instalação</span>
            <span>Ótimo <b class="term-box"></b></span>
            <span>Bom <b class="term-box"></b></span>
            <span>Ruim <b class="term-box"></b></span>
        </div>

        <div class="term-rating-row">
            <span>Uso de EPI'S da equipe durante a instalação</span>
            <span>Ótimo <b class="term-box"></b></span>
            <span>Bom <b class="term-box"></b></span>
            <span>Ruim <b class="term-box"></b></span>
        </div>

    </section>


    <!-- RESPONSÁVEL / ASSINATURA -->

    <section class="term-section term-no-break">

        <div class="term-section-title">
            Responsável pelo Recebimento / Avaliação
        </div>

        <div class="term-receiver-grid">

            <div class="term-line-field term-span-2">
                <span class="term-label">Nome</span>
                <div>
                    ${escaparHTMLTermoServico(
                        termo.responsavelRecebimento || ''
                    )}
                </div>
            </div>

            <div class="term-line-field">
                <span class="term-label">RG / CPF / Matrícula</span>
                <div>
                    ${escaparHTMLTermoServico(
                        termo.responsavelDocumento || ''
                    )}
                </div>
            </div>

            <div class="term-line-field">
                <span class="term-label">Função</span>
                <div>
                    ${escaparHTMLTermoServico(
                        termo.responsavelFuncao || ''
                    )}
                </div>
            </div>

            <div class="term-line-field">
                <span class="term-label">Data</span>
                <div>
                    ${
                        termo.dataRecebimento
                            ?
                            formatarDataBR(
                                termo.dataRecebimento
                            )
                            :
                            ''
                    }
                </div>
            </div>

        </div>

        <div class="term-signatures">

            <div class="term-signature">
                Assinatura do Responsável pelo Recebimento
            </div>

            <div class="term-signature">
                WN Comunicação Visual
            </div>

        </div>

    </section>

</div>

    `;
}


/* --------------------------------------------------------- */
/* estilosTermoServico                                       */
/* CSS compartilhado pela visualização e pela impressão.     */
/* --------------------------------------------------------- */

function estilosTermoServico() {

    return `

        *{
            box-sizing:border-box;
        }

        .term-page{
            max-width:920px;
            margin:0 auto;
            padding:24px;
            background:#fff;
            color:#172033;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
        }

        .term-header{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:24px;
            padding:18px 20px;
            border-radius:18px;
            background:
                linear-gradient(
                    135deg,
                    #0f172a,
                    #1e293b
                );
            color:#fff;
            border-bottom:5px solid #7c3aed;
        }

        .term-brand{
            min-width:180px;
        }

        .term-logo{
            display:block;
            max-width:210px;
            max-height:72px;
            object-fit:contain;
        }

        .term-logo-fallback{
            font-size:18px;
            font-weight:900;
        }

        .term-title-area{
            text-align:right;
        }

        .term-kicker{
            margin-bottom:5px;
            color:#c4b5fd;
            font-size:10px;
            font-weight:900;
            letter-spacing:1.1px;
            text-transform:uppercase;
        }

        .term-title-area h1{
            margin:0;
            font-size:25px;
            letter-spacing:.5px;
        }

        .term-subtitle{
            margin-top:4px;
            color:#cbd5e1;
            font-size:12px;
        }

        .term-top-grid{
            display:grid;
            grid-template-columns:
                repeat(3,minmax(0,1fr));
            gap:10px;
            margin-top:14px;
        }

        .term-info-card,
        .term-field{
            padding:11px 12px;
            border:1px solid #e2e8f0;
            border-radius:11px;
            background:#f8fafc;
        }

        .term-label{
            display:block;
            margin-bottom:4px;
            color:#64748b;
            font-size:8px;
            font-weight:900;
            letter-spacing:.65px;
            text-transform:uppercase;
        }

        .term-info-card strong,
        .term-field strong{
            font-size:11px;
            line-height:1.35;
        }

        .term-section{
            margin-top:14px;
            padding:15px;
            border:1px solid #e2e8f0;
            border-radius:14px;
            background:#fff;
        }

        .term-section-title{
            margin-bottom:12px;
            color:#111827;
            font-size:14px;
            font-weight:900;
        }

        .term-client-grid{
            display:grid;
            grid-template-columns:
                repeat(4,minmax(0,1fr));
            gap:8px;
        }

        .term-span-2{
            grid-column:span 2;
        }

        .term-span-4{
            grid-column:1 / -1;
        }

        .term-table-wrap{
            overflow:hidden;
            border:1px solid #dbe3ed;
            border-radius:10px;
        }

        .term-table{
            width:100%;
            border-collapse:collapse;
            table-layout:fixed;
        }

        .term-table th{
            padding:8px;
            background:#1e293b;
            color:#fff;
            font-size:9px;
            text-align:left;
        }

        .term-table td{
            padding:8px;
            border-bottom:1px solid #e5e7eb;
            font-size:9px;
            vertical-align:top;
        }

        .term-table tbody tr:last-child td{
            border-bottom:none;
        }

        .term-center{
            text-align:center;
        }

        .term-num{
            width:45px;
        }

        .term-qtd{
            width:70px;
            text-align:center !important;
        }

        .term-item-title{
            font-weight:800;
            line-height:1.35;
        }

        .term-item-sub{
            margin-top:3px;
            color:#64748b;
            font-size:8px;
        }

        .term-empty{
            padding:18px !important;
            text-align:center;
            color:#64748b;
        }

        .term-install-address,
        .term-note{
            margin-top:10px;
            padding:10px 12px;
            border-radius:9px;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            font-size:10px;
            line-height:1.45;
        }

        .term-note{
            background:#fffbeb;
            border-color:#fde68a;
        }

        .term-intro{
            margin:0 0 8px;
            font-size:10px;
            font-weight:800;
        }

        .term-check-list{
            margin:0;
            padding-left:20px;
            color:#334155;
            font-size:9.5px;
            line-height:1.6;
        }

        .term-consider{
            margin-top:12px;
            padding-top:11px;
            border-top:1px solid #e5e7eb;
        }

        .term-consider-title{
            margin-bottom:8px;
            font-size:11px;
            font-weight:900;
        }

        .term-choice{
            display:flex;
            align-items:flex-start;
            gap:7px;
            margin:7px 0;
            font-size:9.5px;
            line-height:1.45;
        }

        .term-box{
            display:inline-block;
            flex:0 0 11px;
            width:11px;
            height:11px;
            margin-left:4px;
            border:1.4px solid #334155;
            border-radius:2px;
            vertical-align:-1px;
        }

        .term-restrictions{
            min-height:55px;
            margin-top:9px;
            padding:8px;
            border:1px dashed #94a3b8;
            border-radius:8px;
            font-size:9px;
            line-height:1.45;
        }

        .term-rating-row{
            display:grid;
            grid-template-columns:
                minmax(0,1fr)
                78px
                70px
                70px;
            gap:5px;
            align-items:center;
            padding:7px 8px;
            border-bottom:1px solid #e5e7eb;
            font-size:9px;
        }

        .term-rating-row:nth-child(even){
            background:#f8fafc;
        }

        .term-rating-row:last-child{
            border-bottom:none;
        }

        .term-receiver-grid{
            display:grid;
            grid-template-columns:
                1fr
                1fr
                130px;
            gap:10px;
        }

        .term-line-field{
            min-height:40px;
            padding:6px 2px 4px;
            border-bottom:1px solid #475569;
            font-size:10px;
        }

        .term-signatures{
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:55px;
            margin-top:58px;
        }

        .term-signature{
            padding-top:7px;
            border-top:1px solid #334155;
            text-align:center;
            color:#475569;
            font-size:9px;
        }

        .term-no-break{
            break-inside:avoid;
            page-break-inside:avoid;
        }

        @media print{

            @page{
                size:A4 portrait;
                margin:8mm;
            }

            body{
                margin:0;
                padding:0;
                background:#fff;
            }

            .term-page{
                max-width:none;
                width:100%;
                padding:0;
            }

            .term-header{
                border-radius:10px;
            }

        }

    `;
}


/* ========================================================= */
/* 01. TELA PRINCIPAL DE RECIBOS                           */
/* ========================================================= */

/* --------------------------------------------------------- */
/* renderRecibos */
/* Renderiza a listagem e as ações dos recibos. */
/* --------------------------------------------------------- */

window.renderRecibos = function () {

    if (!db.recibos) {
        db.recibos = [];
    }

    /*
        Filtro principal por origem.
        Valores disponíveis:
        - Todos
        - Orçamento
        - Termo
        - Recibo
    */

    if (
        typeof window.filtroOrigemRecibosAtual !==
            'string'
    ) {

        window.filtroOrigemRecibosAtual =
            'Todos';
    }

    /*
        Atualiza automaticamente registros antigos:
        - TERMO-xxxx -> sequência REC-xxxx
        - origem -> Termo, Orçamento ou Recibo
    */

    normalizarRegistrosRecibos();

    if (!db.ultimoRecibo) {
        db.ultimoRecibo = 0;
    }

    const registrosRecibosFiltrados =
        db.recibos
            .map(
                (registro, indiceReal) => ({

                    registro,

                    indiceReal
                })
            )
            .filter(
                item => {

                    if (
                        window.filtroOrigemRecibosAtual ===
                            'Todos'
                    ) {

                        return true;
                    }

                    return (
                        origemDocumentoRecibo(
                            item.registro
                        )
                        ===
                        window.filtroOrigemRecibosAtual
                    );
                }
            ).sort((a,b)=>{
                const na=Number(String(a.registro?.numero||'').replace(/\D/g,''))||0;
                const nb=Number(String(b.registro?.numero||'').replace(/\D/g,''))||0;
                if(nb!==na)return nb-na;
                return b.indiceReal-a.indiceReal;
            });

    let html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

    <!-- TOPO -->

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        flex-wrap:wrap;
        gap:15px;
    ">

        <div>

            <div style="
                font-size:28px;
                font-weight:700;
            ">
                🧾 Recibos / Comprovantes
            </div>

            <div style="
                color:#6b7280;
                margin-top:5px;
            ">
                Recibos, comprovantes e termos de serviço
            </div>

        </div>

        <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        ">

            <button
                class="btn-action"
                onclick="abrirConsultaRecibos()">

                🔍 Consultar

            </button>

            <button
                class="btn-action"
                style="background:#2563eb;"
                onclick="abrirGerarReciboOrcamento()">

                📄 Gerar de Orçamento

            </button>

            <button
                class="btn-action"
                style="background:#16a34a;"
                onclick="abrirModalRecibo()">

                + Novo Recibo/Termo

            </button>

        </div>

    </div>


    <!-- FILTRO DE ORIGEM -->

    <div style="
        width:180px;
        margin-top:10px;
        margin-left:auto;
    ">

        <label style="
            display:block;
            margin-bottom:5px;
            font-size:11px;
            color:#64748b;
            font-weight:700;
        ">
            Origem
        </label>

        <select
            id="filtro-origem-recibos"
            onchange="
                window.filtroOrigemRecibosAtual = this.value;
                navigate('recibos', false);
            "
            style="
                width:100%;
            "
        >

            <option
                value="Todos"
                ${
                    window.filtroOrigemRecibosAtual === 'Todos'
                    ? 'selected'
                    : ''
                }
            >
                Todas
            </option>

            <option
                value="Orçamento"
                ${
                    window.filtroOrigemRecibosAtual === 'Orçamento'
                    ? 'selected'
                    : ''
                }
            >
                Orçamento
            </option>

            <option
                value="Termo"
                ${
                    window.filtroOrigemRecibosAtual === 'Termo'
                    ? 'selected'
                    : ''
                }
            >
                Termo
            </option>

            <option
                value="Recibo"
                ${
                    window.filtroOrigemRecibosAtual === 'Recibo'
                    ? 'selected'
                    : ''
                }
            >
                Recibo
            </option>

        </select>

    </div>


    <!-- TABELA -->

    <div style="
    overflow:auto;
    border:1px solid #e5e7eb;
    border-radius:14px;
    background:#fff;
    ">

        <table style="
        width:100%;
        border-collapse:collapse;
        ">

            <thead>

                <tr>

                    <th>Número</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Origem</th>
                    <th>Ações</th>

                </tr>

            </thead>

            <tbody>
`;

    if (registrosRecibosFiltrados.length === 0) {

        html += `

<tr>

<td
colspan="6"
style="
text-align:center;
padding:30px;
color:#6b7280;
">

Nenhum documento encontrado para esta origem

</td>

</tr>
`;
    }

    registrosRecibosFiltrados.forEach(
        item => {

        const r =
            item.registro;

        const idx =
            item.indiceReal;

        html += `

<tr>

<td>

${r.numero || '-'}

</td>

<td>

${
r.data
? formatarDataBR(r.data)
: '-'
}

</td>

<td>

${r.cliente || '-'}

</td>

<td>

${
ehTermoServico(r)
? '—'
: formatarMoeda(
    r.total || 0
)
}

</td>

<td>

<span style="
background:${corOrigemDocumentoRecibo(r)};
color:#fff;
padding:6px 12px;
border-radius:999px;
font-size:12px;
font-weight:600;
">

${origemDocumentoRecibo(r)}

</span>

</td>

<td>

<div style="
display:flex;
gap:8px;
justify-content:center;
align-items:center;
flex-wrap:nowrap;
min-width:max-content;
">

<button
class="btn-action"
style="
padding:6px 10px;
font-size:12px;
background:#2563eb !important;
background:#eff6ff !important;color:#2563eb !important;border:1px solid #bfdbfe !important;box-shadow:none !important;"
onclick="visualizarRecibo(${idx})">

👁 Visualizar

</button>

<button
class="btn-action"
style="
background:#f59e0b;
padding:6px 10px;
font-size:12px;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
onclick="editarRecibo(${idx})">

✏ Editar

</button>

<button
class="btn-action"
style="
background:#7c3aed;
padding:6px 10px;
font-size:12px;
background:#dcfce7 !important;color:#15803d !important;border:1px solid #bbf7d0 !important;box-shadow:none !important;"
onclick="imprimirDocumentoRecibo(${idx})">

🖨 Imprimir

</button>

<button
class="btn-del"
style="
padding:6px 10px;
font-size:12px;
background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;"
onclick="excluirRecibo(${idx})">

🗑 Excluir

</button>

</div>

</td>

</tr>
`;
    });

    html += `

            </tbody>

        </table>

    </div>

</div>
`;

    return html;

};



/* ========================================================= */
/* 02. EXCLUIR RECIBO                                      */
/* ========================================================= */

/* --------------------------------------------------------- */
/* excluirRecibo */
/* Exclui um recibo após confirmação. */
/* --------------------------------------------------------- */

window.excluirRecibo = function(idx){

    const confirmar =

    confirm(
        'Deseja excluir este recibo?'
    );

    if(!confirmar) return;

    db.recibos.splice(
        idx,
        1
    );

    save();

    navigate(
        'recibos'
    );

};



/* ========================================================= */
/* 03. CONSULTA DE RECIBOS                                 */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirConsultaRecibos */
/* Abre a consulta de recibos. */
/* --------------------------------------------------------- */

window.abrirConsultaRecibos = function(){

const html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

    <div style="
    display:grid;
    grid-template-columns:
    repeat(
        auto-fit,
        minmax(
            220px,
            1fr
        )
    );
    gap:15px;
    ">

        <div>

            <label>

                Número

            </label>

            <input
            id="filtro-rec-numero">

        </div>

        <div>

            <label>

                Cliente

            </label>

            <input
            id="filtro-rec-cliente">

        </div>

        <div>

            <label>

                Origem

            </label>

            <select
                id="filtro-rec-origem"
            >

                <option value="">
                    Todas
                </option>

                <option value="Orçamento">
                    Orçamento
                </option>

                <option value="Termo">
                    Termo
                </option>

                <option value="Recibo">
                    Recibo
                </option>

            </select>

        </div>

        <div>

            <label>

                Data Inicial

            </label>

            <input
            type="date"
            id="filtro-rec-inicio">

        </div>

        <div>

            <label>

                Data Final

            </label>

            <input
            type="date"
            id="filtro-rec-fim">

        </div>

    </div>

    <div style="
    display:flex;
    justify-content:flex-end;
    gap:10px;
    ">

        <button
        class="btn-action"
        style="
        background:#6b7280;
        "
        onclick="closeModal()">

            Cancelar

        </button>

        <button
        class="btn-action"
        onclick="filtrarConsultaRecibos()">

            🔍 Consultar

        </button>

    </div>

    <div
    id="resultado-consulta-recibos">

    </div>

</div>
`;

configModal({

title:
'Consultar Recibos',

body:
html,

size:
'large',

confirmText:
'Fechar',

onConfirm(){

closeModal();

}

});

};



/* ========================================================= */
/* 04. FILTRAR CONSULTA                                    */
/* ========================================================= */

/* --------------------------------------------------------- */
/* filtrarConsultaRecibos */
/* Filtra por número, cliente, origem e período. */
/* --------------------------------------------------------- */

window.filtrarConsultaRecibos =
function(){

const numero =

document
.getElementById(
'filtro-rec-numero'
)
.value
.toLowerCase();

const cliente =

document
.getElementById(
'filtro-rec-cliente'
)
.value
.toLowerCase();

const origem =

document
.getElementById(
'filtro-rec-origem'
)
.value;

const dataInicio =

document
.getElementById(
'filtro-rec-inicio'
)
.value;

const dataFim =

document
.getElementById(
'filtro-rec-fim'
)
.value;

let recibos =

[...db.recibos];

if(numero){

recibos =
recibos.filter(r=>

(r.numero || '')
.toLowerCase()
.includes(numero)

);

}

if(cliente){

recibos =
recibos.filter(r=>

(r.cliente || '')
.toLowerCase()
.includes(cliente)

);

}

if(origem){

recibos =
recibos.filter(r=>

origemDocumentoRecibo(
    r
)
===
origem

);

}

if(dataInicio){

recibos =
recibos.filter(r=>

r.data >=
dataInicio

);

}

if(dataFim){

recibos =
recibos.filter(r=>

r.data <=
dataFim

);

}

let html = `

<div style="
overflow:auto;
border:1px solid #e5e7eb;
border-radius:12px;
">

<table style="
width:100%;
border-collapse:collapse;
">

<thead>

<tr>

<th>Número</th>
<th>Data</th>
<th>Cliente</th>
<th>Valor</th>
<th>Origem</th>
<th>Ações</th>

</tr>

</thead>

<tbody>
`;

if(
recibos.length === 0
){

html += `

<tr>

<td
colspan="6"
style="
text-align:center;
padding:25px;
color:#6b7280;
">

Nenhum recibo encontrado

</td>

</tr>
`;

}

recibos.forEach(r=>{

const idx =
db.recibos.indexOf(r);

html += `

<tr>

<td>

${r.numero}

</td>

<td>

${
r.data
? formatarDataBR(
r.data
)
: '-'
}

</td>

<td>

${r.cliente}

</td>

<td>

${
ehTermoServico(r)
? '—'
: formatarMoeda(
    r.total || 0
)
}

</td>

<td>

<span style="
background:${corOrigemDocumentoRecibo(r)};
color:#fff;
padding:6px 12px;
border-radius:999px;
font-size:12px;
font-weight:600;
">

${origemDocumentoRecibo(r)}

</span>

</td>

<td>

<div style="
display:flex;
gap:8px;
justify-content:center;
">

<button
class="btn-action"
style="
padding:6px 10px;
font-size:12px;
background:#2563eb !important;
background:#eff6ff !important;color:#2563eb !important;border:1px solid #bfdbfe !important;box-shadow:none !important;"
onclick="visualizarRecibo(${idx})">

👁 Visualizar

</button>

<button
class="btn-action"
style="
background:#f59e0b;
background:#fef3c7 !important;color:#b45309 !important;border:1px solid #fde68a !important;box-shadow:none !important;"
onclick="editarRecibo(${idx})">

✏ Editar

</button>

<button
class="btn-action"
style="
background:#7c3aed;
background:#dcfce7 !important;color:#15803d !important;border:1px solid #bbf7d0 !important;box-shadow:none !important;"
onclick="imprimirDocumentoRecibo(${idx})">

🖨 Imprimir

</button>

<button
class="btn-del"
onclick="excluirRecibo(${idx})" style="background:#fee2e2 !important;color:#dc2626 !important;border:1px solid #fecaca !important;box-shadow:none !important;">

🗑 Excluir

</button>

</div>

</td>

</tr>
`;

});

html += `

</tbody>

</table>

</div>
`;

document
.getElementById(
'resultado-consulta-recibos'
)
.innerHTML =
html;

};
/* ========================================================= */
/* 05. PRÓXIMO NÚMERO DO RECIBO                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* proximoNumeroRecibo */
/* Calcula o próximo número no padrão REC-0001. */
/* --------------------------------------------------------- */

window.proximoNumeroRecibo =
function(){

    return proximoNumeroDocumentoRecibo();
};


/* ========================================================= */
/* 06. NOVO RECIBO / TERMO MANUAL                           */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirModalRecibo */
/* Abre o formulário de um novo recibo manual. */
/* --------------------------------------------------------- */

window.abrirModalRecibo =
function(){

    if(!db.recibos){

        db.recibos = [];

    }

    normalizarRegistrosRecibos(
        false
    );

    const numero =
        proximoNumeroDocumentoRecibo();

    /* ===================================================== */
    /* CLIENTES DO NOVO RECIBO EM ORDEM ALFABÉTICA          */
    /* ===================================================== */
    /*
        O datalist do novo Recibo/Termo usa uma cópia
        ordenada. Os códigos dos clientes permanecem intactos.
    */

    const clientesLista =
        ordenarClientesRecibos(
            db.clientes || []
        )
            .map(
                cliente => `

                    <option value="${escaparHTMLTermoServico(
                        cliente.nome || ''
                    )}"></option>

                `
            )
            .join('');

    const html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

    <!-- TIPO DO DOCUMENTO -->

    <div style="
        display:grid;
        grid-template-columns:
            220px
            minmax(220px,1fr);
        gap:15px;
        padding:14px;
        border-radius:12px;
        border:1px solid #ddd6fe;
        background:#f5f3ff;
    ">

        <div>

            <label>
                Tipo
            </label>

            <select
                id="rec-tipo-documento"
                onchange="alternarTipoNovoDocumentoRecibo()"
            >

                <option value="recibo">
                    Recibo
                </option>

                <option value="termo">
                    Termo
                </option>

            </select>

        </div>

        <div>

            <label>
                Número
            </label>

            <input
                id="rec-numero"
                value="${numero}"
                disabled>

        </div>

    </div>


    <!-- DADOS DO CLIENTE -->

    <div>

        <h3 style="
            margin:0 0 12px;
        ">
            Dados do Cliente
        </h3>

        <div style="
        display:grid;
        grid-template-columns:
        repeat(
            auto-fit,
            minmax(
                210px,
                1fr
            )
        );
        gap:12px;
        ">

            <div>

                <label>
                    Cliente
                </label>

                <input
                    id="rec-cliente"
                    list="rec-clientes-lista"
                    onchange="preencherClienteNovoDocumentoRecibo(this.value)">

                <datalist id="rec-clientes-lista">
                    ${clientesLista}
                </datalist>

            </div>

            <div>

                <label>
                    CPF / CNPJ
                </label>

                <input
                    id="rec-documento">

            </div>

            <div>

                <label>
                    RG / Inscrição Estadual
                </label>

                <input
                    id="rec-ie">

            </div>

            <div>

                <label>
                    Telefone
                </label>

                <input
                    id="rec-telefone">

            </div>

            <div>

                <label>
                    E-mail
                </label>

                <input
                    id="rec-email">

            </div>

            <div>

                <label>
                    CEP
                </label>

                <input
                    id="rec-cep">

            </div>

            <div>

                <label>
                    Endereço
                </label>

                <input
                    id="rec-endereco">

            </div>

            <div>

                <label>
                    Número
                </label>

                <input
                    id="rec-numero-endereco">

            </div>

            <div>

                <label>
                    Bairro
                </label>

                <input
                    id="rec-bairro">

            </div>

            <div>

                <label>
                    Cidade
                </label>

                <input
                    id="rec-cidade">

            </div>

            <div>

                <label>
                    Estado
                </label>

                <input
                    id="rec-estado">

            </div>

            <div>

                <label>
                    Nº do Orçamento
                </label>

                <input
                    id="rec-orcamento"
                    placeholder="Opcional">

            </div>

        </div>

        <div style="
            margin-top:12px;
        ">

            <label>
                Observações do Cadastro do Cliente
            </label>

            <textarea
                id="rec-cliente-obs"
                rows="2"
                style="
                    resize:vertical;
                "
            ></textarea>

        </div>

    </div>


    <!-- PRODUTOS -->

    <hr>

    <h3>
        Produtos / Serviços
    </h3>

    <div
        id="rec-itens">
    </div>

    <button
        class="btn-action"
        type="button"
        onclick="adicionarItemRecibo()">

        + Adicionar

    </button>


    <!-- OBS -->

    <hr>

    <div>

        <label>
            Observação do Documento
        </label>

        <textarea
            id="rec-obs"
            rows="4"
            style="
                resize:vertical;
                overflow:hidden;
            "
            oninput="autoResize(this)"
        >Declaro que os produtos e/ou serviços descritos neste comprovante foram devidamente entregues/executados.</textarea>

    </div>


    <!-- TOTAL -->

    <h2
        id="rec-total-bloco"
        style="
            text-align:right;
            margin-top:10px;
        "
    >

        Total:

        <span id="rec-total">
            R$ 0,00
        </span>

    </h2>

</div>
`;

    configModal({

        title:
            'Novo Recibo/Termo',

        body:
            html,

        size:
            'fullscreen',

        confirmText:
            'Salvar Recibo',

        onConfirm(){

            salvarNovoRecibo();
        }
    });

    adicionarItemRecibo();

    alternarTipoNovoDocumentoRecibo();
};


/* --------------------------------------------------------- */
/* preencherClienteNovoDocumentoRecibo                       */
/* Preenche os campos com o cadastro existente do cliente.   */
/* --------------------------------------------------------- */

window.preencherClienteNovoDocumentoRecibo =
function (
    nome
) {

    const cliente =
        (db.clientes || [])
            .find(
                c =>
                    String(
                        c.nome || ''
                    ).trim()
                    .toLowerCase()
                    ===
                    String(
                        nome || ''
                    ).trim()
                    .toLowerCase()
            );

    if (!cliente) {
        return;
    }

    const campos = {

        'rec-documento':
            cliente.documento
            ||
            '',

        'rec-ie':
            cliente.rgie
            ||
            '',

        'rec-telefone':
            cliente.telefone
            ||
            '',

        'rec-email':
            cliente.email
            ||
            '',

        'rec-cep':
            cliente.cep
            ||
            '',

        'rec-endereco':
            cliente.endereco
            ||
            '',

        'rec-numero-endereco':
            cliente.numero
            ||
            '',

        'rec-bairro':
            cliente.bairro
            ||
            '',

        'rec-cidade':
            cliente.cidade
            ||
            '',

        'rec-estado':
            cliente.estado
            ||
            '',

        'rec-cliente-obs':
            cliente.obs
            ||
            ''
    };

    Object.entries(
        campos
    )
    .forEach(
        ([id, valor]) => {

            const campo =
                document.getElementById(
                    id
                );

            if (campo) {

                campo.value =
                    valor;
            }
        }
    );
};


/* --------------------------------------------------------- */
/* alternarTipoNovoDocumentoRecibo                           */
/* No mesmo modal alterna entre Recibo e Termo.              */
/* --------------------------------------------------------- */

window.alternarTipoNovoDocumentoRecibo =
function () {

    const tipo =
        document
            .getElementById(
                'rec-tipo-documento'
            )
            ?.value
        ||
        'recibo';

    const ehTermo =
        tipo ===
        'termo';

    document
        .querySelectorAll(
            '.rec-item'
        )
        .forEach(
            linha => {

                linha.style.gridTemplateColumns =
                    ehTermo
                        ?
                        '2fr 100px 190px 45px'
                        :
                        '2fr 100px 140px 140px 45px';

                const dimensoes =
                    linha.querySelector(
                        '.rec-dimensoes'
                    );

                const valor =
                    linha.querySelector(
                        '.rec-val'
                    );

                const totalItem =
                    linha.querySelector(
                        '.rec-total-item'
                    );

                if (dimensoes) {

                    dimensoes.style.display =
                        ehTermo
                            ?
                            ''
                            :
                            'none';
                }

                if (valor) {

                    valor.style.display =
                        ehTermo
                            ?
                            'none'
                            :
                            '';
                }

                if (totalItem) {

                    totalItem.style.display =
                        ehTermo
                            ?
                            'none'
                            :
                            '';
                }
            }
        );

    const totalBloco =
        document.getElementById(
            'rec-total-bloco'
        );

    if (totalBloco) {

        totalBloco.style.display =
            ehTermo
                ?
                'none'
                :
                '';
    }

    const titulo =
        document.getElementById(
            'modal-title'
        );

    if (titulo) {

        titulo.innerText =
            ehTermo
                ?
                'Novo Termo'
                :
                'Novo Recibo';
    }

    const confirmar =
        document.getElementById(
            'modal-confirm'
        );

    if (confirmar) {

        confirmar.innerText =
            ehTermo
                ?
                'Salvar Termo'
                :
                'Salvar Recibo';
    }

    calcularTotalRecibo();
};


/* ========================================================= */
/* 07. ADICIONAR ITEM AO RECIBO / TERMO                     */
/* ========================================================= */

/* ========================================================= */
/* 07. ADICIONAR ITEM AO RECIBO                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* adicionarItemRecibo */
/* Adiciona uma nova linha de produto/serviço. */
/* --------------------------------------------------------- */

window.adicionarItemRecibo =
function(
dados = {}
){

const div =

document
.getElementById(
'rec-itens'
);

if(!div)
return;

div.insertAdjacentHTML(

'beforeend',

`

<div
class="rec-item"
style="
display:grid;
grid-template-columns:
2fr
100px
140px
140px
45px;
gap:10px;
margin-bottom:10px;
">

<textarea
class="rec-desc"
rows="2"
placeholder="Descrição"
style="
resize:none;
overflow:hidden;
"
oninput="
autoResize(this);
calcularTotalRecibo();
"
>${dados.descricao || ''}</textarea>

<input
type="number"
class="rec-qtd"

value="${
dados.qtd || 1
}"

oninput="
calcularTotalRecibo()
">

<input
class="rec-dimensoes"
placeholder="Dimensões"
style="display:none;"
value="${dados.dimensoes || ''}">

<input
type="number"
step="0.01"

class="rec-val"

value="${
dados.valor || ''
}"

oninput="
calcularTotalRecibo()
">

<input
readonly
class="rec-total-item"
value="R$ 0,00">

<button
type="button"
class="btn-del"

onclick="

this
.parentElement
.remove();

calcularTotalRecibo();

">

✕

</button>

</div>

`

);

calcularTotalRecibo();

if(
    document.getElementById(
        'rec-tipo-documento'
    )
){

    alternarTipoNovoDocumentoRecibo();
}

};



/* ========================================================= */
/* 08. CALCULAR TOTAL DO RECIBO                            */
/* ========================================================= */

/* --------------------------------------------------------- */
/* calcularTotalRecibo */
/* Recalcula totais por item e total geral. */
/* --------------------------------------------------------- */

window.calcularTotalRecibo =
function(){

let total = 0;

document
.querySelectorAll(
'.rec-item'
)
.forEach(item=>{

const qtd =

Number(

item
.querySelector(
'.rec-qtd'
)
.value || 0

);

const valor =

Number(

item
.querySelector(
'.rec-val'
)
.value || 0

);

const totalItem =

qtd * valor;

item
.querySelector(
'.rec-total-item'
)
.value =

formatarMoeda(
totalItem
);

total +=
totalItem;

});

document
.getElementById(
'rec-total'
)
.innerText =

formatarMoeda(
total
);

};



/* ========================================================= */
/* 09. SALVAR NOVO RECIBO                                  */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarNovoRecibo */
/* Monta e salva um novo recibo manual. */
/* --------------------------------------------------------- */

window.salvarNovoRecibo =
async function(){

    normalizarRegistrosRecibos(
        false
    );

    const tipo =
        document
            .getElementById(
                'rec-tipo-documento'
            )
            ?.value
        ||
        'recibo';

    const ehTermo =
        tipo ===
        'termo';

    const itens =
        [];

    document
        .querySelectorAll(
            '.rec-item'
        )
        .forEach(
            item => {

                const descricao =
                    item
                        .querySelector(
                            '.rec-desc'
                        )
                        ?.value
                    ||
                    '';

                const qtd =
                    Number(
                        item
                            .querySelector(
                                '.rec-qtd'
                            )
                            ?.value
                        ||
                        0
                    );

                const dimensoes =
                    item
                        .querySelector(
                            '.rec-dimensoes'
                        )
                        ?.value
                        .trim()
                    ||
                    '';

                const valor =
                    ehTermo
                        ?
                        0
                        :
                        Number(
                            item
                                .querySelector(
                                    '.rec-val'
                                )
                                ?.value
                            ||
                            0
                        );

                if (
                    descricao
                    ||
                    qtd
                    ||
                    dimensoes
                ) {

                    itens.push({

                        descricao,

                        qtd,

                        dimensoes,

                        valor,

                        total:
                            qtd * valor
                    });
                }
            }
        );

    const total =
        ehTermo
            ?
            0
            :
            itens.reduce(
                (acc, item) =>
                    acc
                    +
                    item.total,
                0
            );

    const nomeCliente =
        document
            .getElementById(
                'rec-cliente'
            )
            ?.value
            .trim()
        ||
        '';

    const clienteCadastro =
        (db.clientes || [])
            .find(
                c =>
                    String(
                        c.nome || ''
                    ).trim()
                    .toLowerCase()
                    ===
                    nomeCliente
                        .toLowerCase()
            )
        ||
        {};

    const endereco =
        document
            .getElementById(
                'rec-endereco'
            )
            ?.value
            .trim()
        ||
        '';

    const numeroEndereco =
        document
            .getElementById(
                'rec-numero-endereco'
            )
            ?.value
            .trim()
        ||
        '';

    const bairro =
        document
            .getElementById(
                'rec-bairro'
            )
            ?.value
            .trim()
        ||
        '';

    const cidade =
        document
            .getElementById(
                'rec-cidade'
            )
            ?.value
            .trim()
        ||
        '';

    const estado =
        document
            .getElementById(
                'rec-estado'
            )
            ?.value
            .trim()
        ||
        '';

    const novoDocumento = {

        numero:
            proximoNumeroDocumentoRecibo(),

        data:
            new Date()
                .toISOString()
                .split('T')[0],

        tipoDocumento:
            ehTermo
                ?
                'termo_servico'
                :
                'recibo',

        origem:
            ehTermo
                ?
                'termo'
                :
                'recibo',

        clienteCodigo:
            clienteCadastro.codigo
            ||
            '',

        cliente:
            nomeCliente,

        documento:
            document
                .getElementById(
                    'rec-documento'
                )
                ?.value
                .trim()
            ||
            '',

        ie:
            document
                .getElementById(
                    'rec-ie'
                )
                ?.value
                .trim()
            ||
            '',

        rgie:
            document
                .getElementById(
                    'rec-ie'
                )
                ?.value
                .trim()
            ||
            '',

        telefone:
            document
                .getElementById(
                    'rec-telefone'
                )
                ?.value
                .trim()
            ||
            '',

        contato:
            document
                .getElementById(
                    'rec-telefone'
                )
                ?.value
                .trim()
            ||
            '',

        email:
            document
                .getElementById(
                    'rec-email'
                )
                ?.value
                .trim()
            ||
            '',

        cep:
            document
                .getElementById(
                    'rec-cep'
                )
                ?.value
                .trim()
            ||
            '',

        endereco,

        numeroEndereco,

        bairro,

        cidade,

        estado,

        observacoesCliente:
            document
                .getElementById(
                    'rec-cliente-obs'
                )
                ?.value
                .trim()
            ||
            '',

        orcamentoCodigo:
            document
                .getElementById(
                    'rec-orcamento'
                )
                ?.value
                .trim()
            ||
            '',

        enderecoInstalacao:
            [
                [
                    endereco,
                    numeroEndereco
                ]
                .filter(Boolean)
                .join(', '),

                bairro,

                [
                    cidade,
                    estado
                ]
                .filter(Boolean)
                .join(' - ')
            ]
            .filter(Boolean)
            .join(', '),

        observacoes:
            document
                .getElementById(
                    'rec-obs'
                )
                ?.value
            ||
            '',

        itens,

        total,

        responsavelEquipe:
            '',

        dataEntregaPrevista:
            ''
    };

    db.recibos.push(
        novoDocumento
    );

    await save();

    closeModal();

    navigate(
        'recibos'
    );
};


/* ========================================================= */
/* 10. GERAR RECIBO A PARTIR DE ORÇAMENTO                  */
/* ========================================================= */

/* ========================================================= */
/* 10. GERAR RECIBO A PARTIR DE ORÇAMENTO                  */
/* ========================================================= */

/* --------------------------------------------------------- */
/* abrirGerarReciboOrcamento */
/* Abre a seleção de orçamento para gerar recibo. */
/* --------------------------------------------------------- */

window.abrirGerarReciboOrcamento =
function(){

const aprovados =

(db.orcamentos || [])

.filter(o =>

(o.status || '')
.toLowerCase() ===
'aprovado'

);

if(

!aprovados.length

){

alert(
'Não existem orçamentos aprovados.'
);

return;

}

let options = `

<option value="">

Selecione

</option>

`;

aprovados.forEach((o,idx)=>{

options += `

<option value="${idx}">

${o.codigo}
—
${o.cliente}
—
${formatarMoeda(
o.total || 0
)}

</option>

`;

});

const html = `

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

<div>

<label>

Orçamento aprovado

</label>

<select
id="rec-orcamento">

${options}

</select>

</div>

</div>

`;

configModal({

title:
'Gerar Recibo de Orçamento',

body:
html,

size:
'medium',

confirmText:
'Gerar',

onConfirm(){

gerarReciboDeOrcamento();

}

});

};



/* ========================================================= */
/* 11. GERAR RECIBO                                        */
/* ========================================================= */

/* --------------------------------------------------------- */
/* gerarReciboDeOrcamento */
/* Inicia a geração de recibo a partir do orçamento selecionado. */
/* --------------------------------------------------------- */

window.gerarReciboDeOrcamento =
function(){

const idx =

document
.getElementById(
'rec-orcamento'
)
.value;

if(!idx){

alert(
'Selecione um orçamento.'
);

return;

}

const aprovados =

(db.orcamentos || [])

.filter(o =>

(o.status || '')
.toLowerCase() ===
'aprovado'

);

const o =

aprovados[idx];
console.log(o);

if(!o)
return;

const clienteCompleto =

(db.clientes || [])
.find(c =>

c.nome ===
o.cliente

) || {};

if(!db.recibos){

db.recibos = [];

}

if(!db.ultimoRecibo){

db.ultimoRecibo = 0;

}

/* ========================================================= */
/* 12. CONVERTER ITENS DO ORÇAMENTO                        */
/* ========================================================= */

const itens =

(o.itens || [])

.map(item=>({

descricao:

item.produto || '',

qtd:

item.qtd || 0,

valor:

item.valor || 0,

total:

item.total || 0

}));



/* ========================================================= */
/* 13. CRIAR REGISTRO DO RECIBO                            */
/* ========================================================= */

const novoRecibo = {

numero:
    proximoNumeroRecibo(),

data:

new Date()
.toISOString()
.split('T')[0],

cliente:

o.cliente || '',

clienteCodigo:

clienteCompleto.codigo ||

'',

documento:

clienteCompleto.documento ||

'',

ie:

clienteCompleto.rgie ||

'',

rgie:

clienteCompleto.rgie ||

'',

telefone:

clienteCompleto.telefone ||

o.telefone ||

'',

email:

clienteCompleto.email ||

o.email ||

'',

cep:

clienteCompleto.cep ||

'',

endereco:

clienteCompleto.endereco ||

'',

numeroEndereco:

clienteCompleto.numero ||

'',

bairro:

clienteCompleto.bairro ||

'',

cidade:

clienteCompleto.cidade ||

'',

estado:

clienteCompleto.estado ||

'',

observacoesCliente:

clienteCompleto.obs ||

'',

ac:

o.ac || '',

prazo:

o.prazo || '',

prazoEntrega:

o.prazoEntrega || '',

validade:

o.validade || '',

observacoes:

o.observacoes ||

'',

itens,

total:

o.total || 0,

origem:
'orcamento',

orcamentoCodigo:
o.codigo ||
o.numero ||
o.id ||
'-'

};

db.recibos.push(
novoRecibo
);



save();

closeModal();

navigate(
'recibos'
);

alert(
'Recibo gerado com sucesso.'
);

};

/* ========================================================= */
/* 14. VISUALIZAR RECIBO                                   */
/* ========================================================= */

/* --------------------------------------------------------- */
/* visualizarRecibo */
/* Abre um recibo em modo de visualização. */
/* --------------------------------------------------------- */

window.visualizarRecibo = function(index){

const r = db.recibos[index];

if(
    ehTermoServico(r)
){

    visualizarTermoServico(
        index
    );

    return;
}

let itensHTML = '';

(r.itens || []).forEach((item,i)=>{

itensHTML += `

<tr>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
">

${i+1}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
white-space:pre-line;
line-height:1.55;
">

${item.descricao || ''}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
">

${item.qtd || 0}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
">

${formatarMoeda(item.valor || 0)}

</td>

<td style="
padding:12px;
border-bottom:1px solid #d1d5db;
text-align:center;
font-weight:700;
">

${formatarMoeda(item.total || 0)}

</td>

</tr>

`;

});

configModal({

title:`Recibo ${r.numero}`,

size:'fullscreen',

confirmText:'🖨 Imprimir / PDF',

onConfirm(){

imprimirRecibo();

},

body:`

<div
id="print-recibo"
style="
background:#fff;
padding:20px;
font-family:Arial,sans-serif;
color:#000;
">

<!-- CABEÇALHO -->

<div style="
background:#0f172a;
color:#fff;
padding:20px;
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:14px;
">

<div>

<img
src="${window.location.href.replace(/[^/]*$/,'')}logo.png"
style="
max-width:220px;
max-height:80px;
object-fit:contain;
">

</div>

<div style="
text-align:right;
">

<div style="
font-size:36px;
font-weight:800;
letter-spacing:1px;
">

RECIBO

</div>

<div style="
margin-top:8px;
opacity:.85;
font-size:12px;
">

${
r.orcamentoCodigo
? `Referente ao orçamento: ${r.orcamentoCodigo}`
: `Recibo Manual`
}

</div>

<div style="
margin-top:4px;
opacity:.85;
font-size:12px;
">

Emitido em
${formatarDataBR(r.data)}

</div>

</div>

</div>

<!-- CLIENTE -->

<div style="
background:#f5f5f5;
padding:14px;
border-radius:14px;
margin-bottom:14px;
">

<div style="
font-size:17px;
font-weight:700;
margin-bottom:10px;
">

Dados do Cliente

</div>

<div style="
display:grid;
grid-template-columns:1fr 1fr;
gap:10px 16px;
line-height:1.35;
font-size:12px;
">

<div>
<b>Cliente:</b><br>
${r.cliente || '-'}
</div>

<div>
<b>Documento:</b><br>
${r.documento || '-'}
</div>

<div>
<b>Inscrição Estadual:</b><br>
${r.ie || '-'}
</div>

<div>
<b>Telefone:</b><br>
${r.telefone || '-'}
</div>

<div style="grid-column:1/3;">
<b>Endereço:</b><br>
${r.endereco || '-'}
</div>

</div>

</div>

<!-- PRODUTOS -->

<div style="
background:#f5f5f5;
padding:16px;
border-radius:14px;
margin-bottom:14px;
">

<div style="
font-size:18px;
font-weight:700;
margin-bottom:14px;
">

Produtos / Serviços

</div>

<table style="
width:100%;
border-collapse:collapse;
font-size:12px;
">

<thead>

<tr style="
background:#0f172a;
">

<th style="
padding:10px;
width:55px;
color:#fff;
">
ITEM
</th>

<th style="
padding:10px;
text-align:left;
color:#fff;
">
DESCRIÇÃO
</th>

<th style="
padding:10px;
width:80px;
color:#fff;
">
QTD
</th>

<th style="
padding:10px;
width:120px;
color:#fff;
">
VALOR UNIT.
</th>

<th style="
padding:10px;
width:120px;
color:#fff;
">
TOTAL
</th>

</tr>

</thead>

<tbody>

${itensHTML}

</tbody>

</table>

<!-- TOTAL -->

<div style="
display:flex;
justify-content:flex-end;
margin-top:18px;
">

<div style="
background:#0f172a;
color:#fff;
padding:10px 18px;
border-radius:10px;
text-align:center;
min-width:170px;
">

<div style="
font-size:9px;
opacity:.80;
letter-spacing:1px;
text-transform:uppercase;
">

VALOR TOTAL

</div>

<div style="
font-size:22px;
font-weight:800;
margin-top:4px;
line-height:1;
">

${formatarMoeda(r.total || 0)}

</div>

</div>

</div>

</div>

<!-- OBSERVAÇÃO -->

<div style="
background:#f5f5f5;
padding:10px 14px;
border-radius:12px;
margin-bottom:10px;
">

<div style="
font-size:15px;
font-weight:700;
margin-bottom:8px;
">

Observação

</div>

<div style="
white-space:pre-line;
line-height:1.35;
font-size:11px;
">

Declaro que os produtos e/ou serviços descritos neste comprovante foram devidamente entregues/executados.

${r.observacoes ? '\n' + r.observacoes : ''}

</div>

</div>

<!-- ASSINATURAS -->

<div
id="assinaturas"
style="
display:flex;
justify-content:space-between;
gap:60px;
margin-top:150px;
">

    <!-- CLIENTE -->

    <div style="
    flex:1;
    text-align:center;
    font-size:13px;
    ">

        <div style="
        border-top:1px solid #94a3b8;
        padding-top:10px;
        ">

            Assinatura do Cliente

        </div>

    </div>

    <!-- WN -->

    <div style="
    flex:1;
    text-align:center;
    font-size:13px;
    ">

        <div style="
        border-top:1px solid #94a3b8;
        padding-top:10px;
        ">

            WN Comunicação Visual

        </div>

    </div>

</div>

`

});

};

/* --------------------------------------------------------- */
/* imprimirDocumentoRecibo                                   */
/* Mesmo botão de impressão para Recibo, Orçamento e Termo.  */
/* --------------------------------------------------------- */

window.imprimirDocumentoRecibo =
function (
    index
) {

    const registro =
        db.recibos[index];

    if (!registro) {
        return;
    }

    if (
        ehTermoServico(
            registro
        )
    ) {

        imprimirTermoServico(
            index
        );

        return;
    }

    /*
        Para os recibos comuns, reutiliza exatamente o mesmo
        layout já usado pelo módulo. O modal é preparado e a
        impressão é disparada logo em seguida.
    */

    visualizarRecibo(
        index
    );

    setTimeout(
        () => {

            imprimirRecibo();
        },
        120
    );
};


/* ========================================================= */
/* 15. IMPRIMIR RECIBO / PDF                               */
/* ========================================================= */

/* --------------------------------------------------------- */
/* imprimirRecibo */
/* Monta e envia o recibo para impressão/PDF. */
/* --------------------------------------------------------- */

window.imprimirRecibo =
async function(){

    const conteudo =

        document.getElementById(
            'print-recibo'
        )?.innerHTML;

    if(!conteudo) return;

    const html = `

<html>

<head>

<title>
Recibo
</title>

<style>

*{

    -webkit-print-color-adjust:
    exact !important;

    print-color-adjust:
    exact !important;

    box-sizing:border-box;

}

body{

    font-family:Arial,sans-serif;

    background:#fff;

    margin:0;

    padding:30px;

    color:#000;

}

.page-break{

    page-break-before:always;

}

table{

    width:100%;

    border-collapse:collapse;

}

th,td{

    padding:10px;

    text-align:left;

}

img{

    display:block;

    max-width:220px;

    max-height:120px;

    object-fit:contain;

}

@page{

    size:A4;

    margin:12mm;

}

@media print{

    body{

        padding:0;

        background:#fff;

    }

    *{

        -webkit-print-color-adjust:
        exact !important;

        print-color-adjust:
        exact !important;

    }

}

</style>

</head>

<body>

${conteudo}

<script>

window.onload=()=>{

    setTimeout(()=>{

        window.print();

    },700);

};

</script>

</body>

</html>

`;

    try{

        await window.api
        .imprimirHTML(
            html
        );

    }

    catch(e){

        console.error(

            'Erro impressão:',

            e

        );

    }

};
/* ========================================================= */
/* 16. EDITAR RECIBO                                       */
/* ========================================================= */

/* --------------------------------------------------------- */
/* editarRecibo */
/* Abre um recibo existente para edição. */
/* --------------------------------------------------------- */

window.editarRecibo =
function(index){

const r =

db.recibos[index];

if(
    ehTermoServico(r)
){

    editarTermoServico(
        index
    );

    return;
}

configModal({

title:
`Editar ${r.numero}`,

size:
'fullscreen',

confirmText:
'Salvar',

onConfirm(){

salvarEdicaoRecibo(
index
);

},

body:`

<div style="
display:flex;
flex-direction:column;
gap:20px;
">

<div style="
display:grid;
grid-template-columns:
repeat(
auto-fit,
minmax(
220px,
1fr
)
);
gap:15px;
">

<div>

<label>

Cliente

</label>

<input
id="rec-cliente"
value="${
r.cliente || ''
}">

</div>

<div>

<label>

Documento

</label>

<input
id="rec-documento"
value="${
r.documento || ''
}">

</div>

<div>

<label>

Inscrição Estadual

</label>

<input
id="rec-ie"
value="${
r.ie || ''
}">

</div>

<div>

<label>

Telefone

</label>

<input
id="rec-telefone"
value="${
r.telefone || ''
}">

</div>

<div>

<label>

Endereço

</label>

<input
id="rec-endereco"
value="${
r.endereco || ''
}">

</div>

</div>

<hr>

<h3>

Produtos / Serviços

</h3>

<div
id="rec-itens">

</div>

<button
type="button"
class="btn-action"
onclick="
adicionarItemRecibo()
">

+ Adicionar

</button>

<hr>

<div>

<label>

Observações

</label>

<textarea
id="rec-obs"
rows="4"
style="
resize:none;
overflow:hidden;
"
oninput="
autoResize(this)
">${r.observacoes || ''}</textarea>

</div>

<h2 style="
text-align:right;
">

Total:

<span id="rec-total">

${
ehTermoServico(r)
? '—'
: formatarMoeda(
    r.total || 0
)
}

</span>

</h2>

</div>

`

});

/* CARREGAR ITENS */

if(

r.itens &&
r.itens.length

){

r.itens.forEach(item=>{

adicionarItemRecibo({

descricao:

item.descricao,

qtd:

item.qtd,

valor:

item.valor

});

});

}

else{

adicionarItemRecibo();

}

/* AUTO RESIZE */

document
.querySelectorAll(
'#rec-obs,.rec-desc'
)
.forEach(el=>{

autoResize(el);

});

calcularTotalRecibo();

};



/* ========================================================= */
/* 17. SALVAR EDIÇÃO DO RECIBO                             */
/* ========================================================= */

/* --------------------------------------------------------- */
/* salvarEdicaoRecibo */
/* Salva as alterações feitas no recibo. */
/* --------------------------------------------------------- */

window.salvarEdicaoRecibo =
function(index){

const itens = [];

document
.querySelectorAll(
'.rec-item'
)
.forEach(item=>{

const descricao =

item
.querySelector(
'.rec-desc'
)
.value;

const qtd =

Number(

item
.querySelector(
'.rec-qtd'
)
.value || 0

);

const valor =

Number(

item
.querySelector(
'.rec-val'
)
.value || 0

);

itens.push({

descricao,

qtd,

valor,

total:
qtd * valor

});

});

const total =

itens.reduce(

(acc,item)=>

acc +
item.total,

0

);

db.recibos[index] = {

...db.recibos[index],

cliente:

document
.getElementById(
'rec-cliente'
)
.value,

documento:

document
.getElementById(
'rec-documento'
)
.value,

ie:

document
.getElementById(
'rec-ie'
)
.value,

telefone:

document
.getElementById(
'rec-telefone'
)
.value,

endereco:

document
.getElementById(
'rec-endereco'
)
.value,

observacoes:

document
.getElementById(
'rec-obs'
)
.value,

itens,

total

};

save();

closeModal();

navigate(
'recibos'
);

};



/* ========================================================= */
/* 17.1 VISUALIZAR TERMO DE SERVIÇO                         */
/* ========================================================= */

window.visualizarTermoServico =
function (
    index
) {

    const termoOriginal =
        db.recibos[index];

    if (
        !ehTermoServico(
            termoOriginal
        )
    ) {

        return;
    }

    /*
        A visualização usa os dados atuais do cadastro do cliente,
        o número do orçamento vinculado e a data de geração do termo.
    */

    const termo =
        prepararTermoServicoParaExibicao(
            termoOriginal
        );

    const logoTela =
        window.location.href
            .replace(
                /[^/]*$/,
                ''
            )
        +
        'logo.png';

    const body = `

        <style>
            ${estilosTermoServico()}
        </style>

        ${montarHTMLTermoServico(
            termo,
            logoTela
        )}

    `;

    configModal({

        title:
            `Termo de Serviço ${termo.numero}`,

        size:
            'fullscreen',

        confirmText:
            '🖨 Imprimir',

        onConfirm(){

            imprimirTermoServico(
                index
            );
        },

        body
    });
};


/* ========================================================= */
/* 17.2 IMPRIMIR TERMO DE SERVIÇO                           */
/* ========================================================= */

window.imprimirTermoServico =
async function (
    index
) {

    const termoOriginal =
        db.recibos[index];

    if (
        !ehTermoServico(
            termoOriginal
        )
    ) {

        return;
    }

    /*
        A impressão também consulta o cadastro atual do cliente.
        Assim qualquer correção feita em Clientes aparece no termo
        sem precisar recriar o documento.
    */

    const termo =
        prepararTermoServicoParaExibicao(
            termoOriginal
        );

    let logoEmpresa =
        '';

    try{

        if(
            window.api
            &&
            typeof window.api.getLogoPath ===
                'function'
        ){

            logoEmpresa =
                await window.api
                    .getLogoPath();
        }

    }catch(erro){

        console.warn(
            'Não foi possível carregar a logo do termo:',
            erro
        );
    }

    const html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>
        ${escaparHTMLTermoServico(
            termo.numero || 'Termo de Serviço'
        )}
    </title>

    <style>

        *{
            -webkit-print-color-adjust:
                exact !important;

            print-color-adjust:
                exact !important;
        }

        html,
        body{
            margin:0;
            padding:0;
            background:#fff;
        }

        ${estilosTermoServico()}

    </style>

</head>

<body>

    ${montarHTMLTermoServico(
        termo,
        logoEmpresa
    )}

    <script>

        window.addEventListener(
            'load',
            function(){

                setTimeout(
                    function(){

                        window.print();

                    },
                    250
                );
            }
        );

    </script>

</body>

</html>

    `;

    try{

        if(
            window.api
            &&
            typeof window.api.imprimirHTML ===
                'function'
        ){

            await window.api
                .imprimirHTML(
                    html
                );

            return;
        }

    }catch(erro){

        console.error(
            'Erro ao imprimir termo:',
            erro
        );
    }

    const janela =
        window.open(
            '',
            '_blank'
        );

    if(
        !janela
    ){

        alert(
            'Não foi possível abrir a tela de impressão.'
        );

        return;
    }

    janela.document.write(
        html
    );

    janela.document.close();
};


/* ========================================================= */
/* 17.3 EDITAR TERMO DE SERVIÇO                             */
/* ========================================================= */

window.editarTermoServico =
function (
    index
) {

    const termoOriginal =
        db.recibos[index];

    if (
        !ehTermoServico(
            termoOriginal
        )
    ) {

        return;
    }

    const termo =
        prepararTermoServicoParaExibicao(
            termoOriginal
        );

    const body = `

<div style="
    display:flex;
    flex-direction:column;
    gap:18px;
">

    <div style="
        padding:14px 16px;
        border-radius:12px;
        background:#f5f3ff;
        border:1px solid #ddd6fe;
        color:#5b21b6;
        font-size:12px;
        line-height:1.55;
    ">

        Este termo foi criado automaticamente pela
        <strong>OS ${escaparHTMLTermoServico(
            termo.osCodigo || '-'
        )}</strong>.
        Você pode ajustar os dados antes da impressão.

    </div>


    <div style="
        display:grid;
        grid-template-columns:
            repeat(2,minmax(0,1fr));
        gap:12px;
    ">

        <div>

            <label>
                Cliente
            </label>

            <input
                id="termo-cliente"
                value="${escaparHTMLTermoServico(
                    termo.cliente || ''
                )}">

        </div>

        <div>

            <label>
                CPF / CNPJ
            </label>

            <input
                id="termo-documento"
                value="${escaparHTMLTermoServico(
                    termo.documento || ''
                )}">

        </div>

        <div>

            <label>
                RG / Inscrição Estadual
            </label>

            <input
                id="termo-ie"
                value="${escaparHTMLTermoServico(
                    termo.rgie
                    ||
                    termo.ie
                    ||
                    ''
                )}">

        </div>

        <div>

            <label>
                Contato
            </label>

            <input
                id="termo-contato"
                value="${escaparHTMLTermoServico(
                    termo.contato
                    ||
                    termo.telefone
                    ||
                    ''
                )}">

        </div>

        <div>

            <label>
                E-mail
            </label>

            <input
                id="termo-email"
                value="${escaparHTMLTermoServico(
                    termo.email || ''
                )}">

        </div>

        <div>

            <label>
                CEP
            </label>

            <input
                id="termo-cep"
                value="${escaparHTMLTermoServico(
                    termo.cep || ''
                )}">

        </div>

        <div>

            <label>
                Nº do Orçamento
            </label>

            <input
                id="termo-orcamento"
                value="${escaparHTMLTermoServico(
                    termo.orcamentoCodigo || ''
                )}">

        </div>

        <div>

            <label>
                Responsável da equipe pela Instalação / Entrega
            </label>

            <input
                id="termo-responsavel-equipe"
                value="${escaparHTMLTermoServico(
                    termo.responsavelEquipe || ''
                )}">

        </div>

        <div>

            <label>
                Endereço
            </label>

            <input
                id="termo-endereco"
                value="${escaparHTMLTermoServico(
                    termo.endereco || ''
                )}">

        </div>

        <div>

            <label>
                Número
            </label>

            <input
                id="termo-numero-endereco"
                value="${escaparHTMLTermoServico(
                    termo.numeroEndereco || ''
                )}">

        </div>

        <div>

            <label>
                Complemento
            </label>

            <input
                id="termo-complemento"
                value="${escaparHTMLTermoServico(
                    termo.complemento || ''
                )}">

        </div>

        <div>

            <label>
                Bairro
            </label>

            <input
                id="termo-bairro"
                value="${escaparHTMLTermoServico(
                    termo.bairro || ''
                )}">

        </div>

        <div>

            <label>
                Cidade
            </label>

            <input
                id="termo-cidade"
                value="${escaparHTMLTermoServico(
                    termo.cidade || ''
                )}">

        </div>

        <div>

            <label>
                Estado
            </label>

            <input
                id="termo-estado"
                value="${escaparHTMLTermoServico(
                    termo.estado || ''
                )}">

        </div>

        <div>

            <label>
                Data prevista da Instalação / Entrega
            </label>

            <input
                type="date"
                id="termo-data-entrega"
                value="${escaparHTMLTermoServico(
                    termo.dataEntregaPrevista || ''
                )}">

        </div>

        <div style="
            grid-column:1 / -1;
        ">

            <label>
                Endereço da Instalação
            </label>

            <input
                id="termo-endereco-instalacao"
                value="${escaparHTMLTermoServico(
                    termo.enderecoInstalacao || ''
                )}">

        </div>

    </div>

    <div>

        <label>
            Observações do Cadastro do Cliente
        </label>

        <textarea
            id="termo-cliente-obs"
            rows="3"
            style="
                resize:vertical;
            "
        >${escaparHTMLTermoServico(
            termo.observacoesCliente || ''
        )}</textarea>

    </div>


    <hr>


    <div>

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
            margin-bottom:10px;
        ">

            <h3 style="margin:0;">
                Produtos / Serviços
            </h3>

            <button
                type="button"
                class="btn-action"
                onclick="adicionarItemTermoServicoEdicao()">

                + Adicionar Item

            </button>

        </div>

        <div id="termo-itens-edicao"></div>

    </div>


    <div>

        <label>
            Observações da OS / Serviço
        </label>

        <textarea
            id="termo-observacoes"
            rows="4"
            style="
                resize:vertical;
            "
        >${escaparHTMLTermoServico(
            termo.observacoes || ''
        )}</textarea>

    </div>

</div>

    `;

    configModal({

        title:
            `Editar ${termo.numero}`,

        size:
            'fullscreen',

        confirmText:
            'Salvar Alterações',

        onConfirm(){

            salvarEdicaoTermoServico(
                index
            );
        },

        body
    });

    const container =
        document.getElementById(
            'termo-itens-edicao'
        );

    if(
        container
    ){

        container.innerHTML =
            '';
    }

    (termo.itens || [])
        .forEach(
            item => {

                adicionarItemTermoServicoEdicao(
                    item
                );
            }
        );

    if(
        !termo.itens
        ||
        !termo.itens.length
    ){

        adicionarItemTermoServicoEdicao();
    }
};


/* --------------------------------------------------------- */
/* adicionarItemTermoServicoEdicao                           */
/* Linha editável do produto/serviço do termo.               */
/* --------------------------------------------------------- */

window.adicionarItemTermoServicoEdicao =
function (
    dados = {}
) {

    const container =
        document.getElementById(
            'termo-itens-edicao'
        );

    if(
        !container
    ){

        return;
    }

    container.insertAdjacentHTML(
        'beforeend',
        `

        <div
            class="termo-item-edicao"
            style="
                display:grid;
                grid-template-columns:
                    minmax(0,1fr)
                    100px
                    220px
                    45px;
                gap:8px;
                align-items:start;
                margin-bottom:8px;
                padding:10px;
                border:1px solid #e5e7eb;
                border-radius:10px;
                background:#f8fafc;
            "
        >

            <textarea
                class="termo-item-desc"
                rows="2"
                placeholder="Produto / Serviço"
                style="
                    resize:vertical;
                "
            >${escaparHTMLTermoServico(
                dados.descricao || ''
            )}</textarea>

            <input
                class="termo-item-qtd"
                placeholder="Qtd."
                value="${escaparHTMLTermoServico(
                    dados.qtd || ''
                )}">

            <input
                class="termo-item-dimensoes"
                placeholder="Dimensões"
                value="${escaparHTMLTermoServico(
                    dados.dimensoes || ''
                )}">

            <button
                type="button"
                class="btn-del"
                onclick="
                    this.closest('.termo-item-edicao').remove()
                ">

                ✕

            </button>

        </div>

        `
    );
};


/* ========================================================= */
/* 17.4 SALVAR EDIÇÃO DO TERMO                              */
/* ========================================================= */

window.salvarEdicaoTermoServico =
async function (
    index
) {

    const termo =
        db.recibos[index];

    if(
        !ehTermoServico(
            termo
        )
    ){

        return;
    }

    const itens =
        [];

    document
        .querySelectorAll(
            '.termo-item-edicao'
        )
        .forEach(
            linha => {

                const descricao =
                    linha
                        .querySelector(
                            '.termo-item-desc'
                        )
                        ?.value
                        .trim()
                    ||
                    '';

                const qtd =
                    linha
                        .querySelector(
                            '.termo-item-qtd'
                        )
                        ?.value
                        .trim()
                    ||
                    '';

                const dimensoes =
                    linha
                        .querySelector(
                            '.termo-item-dimensoes'
                        )
                        ?.value
                        .trim()
                    ||
                    '';

                if(
                    descricao
                    ||
                    qtd
                    ||
                    dimensoes
                ){

                    itens.push({

                        descricao,

                        qtd,

                        dimensoes
                    });
                }
            }
        );

    db.recibos[index] = {

        ...termo,

        cliente:
            document
                .getElementById(
                    'termo-cliente'
                )
                ?.value
                .trim()
            ||
            '',

        documento:
            document
                .getElementById(
                    'termo-documento'
                )
                ?.value
                .trim()
            ||
            '',

        ie:
            document
                .getElementById(
                    'termo-ie'
                )
                ?.value
                .trim()
            ||
            '',

        rgie:
            document
                .getElementById(
                    'termo-ie'
                )
                ?.value
                .trim()
            ||
            '',

        contato:
            document
                .getElementById(
                    'termo-contato'
                )
                ?.value
                .trim()
            ||
            '',

        telefone:
            document
                .getElementById(
                    'termo-contato'
                )
                ?.value
                .trim()
            ||
            '',

        email:
            document
                .getElementById(
                    'termo-email'
                )
                ?.value
                .trim()
            ||
            '',

        cep:
            document
                .getElementById(
                    'termo-cep'
                )
                ?.value
                .trim()
            ||
            '',

        orcamentoCodigo:
            document
                .getElementById(
                    'termo-orcamento'
                )
                ?.value
                .trim()
            ||
            '',

        responsavelEquipe:
            document
                .getElementById(
                    'termo-responsavel-equipe'
                )
                ?.value
                .trim()
            ||
            '',

        endereco:
            document
                .getElementById(
                    'termo-endereco'
                )
                ?.value
                .trim()
            ||
            '',

        numeroEndereco:
            document
                .getElementById(
                    'termo-numero-endereco'
                )
                ?.value
                .trim()
            ||
            '',

        complemento:
            document
                .getElementById(
                    'termo-complemento'
                )
                ?.value
                .trim()
            ||
            '',

        bairro:
            document
                .getElementById(
                    'termo-bairro'
                )
                ?.value
                .trim()
            ||
            '',

        cidade:
            document
                .getElementById(
                    'termo-cidade'
                )
                ?.value
                .trim()
            ||
            '',

        estado:
            document
                .getElementById(
                    'termo-estado'
                )
                ?.value
                .trim()
            ||
            '',

        dataEntregaPrevista:
            document
                .getElementById(
                    'termo-data-entrega'
                )
                ?.value
            ||
            '',

        enderecoInstalacao:
            document
                .getElementById(
                    'termo-endereco-instalacao'
                )
                ?.value
                .trim()
            ||
            '',

        observacoesCliente:
            document
                .getElementById(
                    'termo-cliente-obs'
                )
                ?.value
                .trim()
            ||
            '',

        observacoes:
            document
                .getElementById(
                    'termo-observacoes'
                )
                ?.value
                .trim()
            ||
            '',

        itens
    };

    await save();

    closeModal();

    navigate(
        'recibos'
    );
};


/* ========================================================= */
/* 18. REGISTRAR PÁGINA NO SISTEMA                         */
/* ========================================================= */

registerPage(
'recibos',
renderRecibos
);