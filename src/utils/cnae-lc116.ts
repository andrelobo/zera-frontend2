/**
 * Mapeamento entre códigos CNAE e itens da Lista de Serviços
 * anexa à Lei Complementar nº 116, de 31 de julho de 2003.
 *
 * - item: código do item da lista de serviços (LC 116/2003)
 * - descricao: descrição do serviço conforme LC 116/2003
 * - ctn: Código de Tributação Nacional — 6 dígitos
 *         Fonte: TabCtneNbs.xlsx — tabela oficial do governo federal (ABRASF/SPED)
 *         Formato: IISSDD onde II=item, SS=subitem, DD=desdobro (ex: "010101")
 * - nbs: Nomenclatura Brasileira de Serviços — opcional, apenas quando disponível em fonte oficial
 */

export interface LC116Item {
  item: string;
  descricao: string;
  ctn?: string;
  nbs?: string;
  /** Descrição oficial do CNAE conforme IBGE (CNAE 2.3 Subclasses) */
  cnaeDescricao?: string;
}

// Mapeamento item LC 116 → CTN (6 dígitos — fonte: TabCtneNbs.xlsx do governo federal)
// O CTN de 6 dígitos segue o padrão: IISSDD (item, subitem, desdobro nacional)
// Cada item mapeia para o primeiro CTN oficial (desdobro 01 do subitem 01)
const LC116_CTN: Record<string, string> = {
  // Grupo 01 — Serviços de Informática e congêneres
  '1.01': '010101',
  '1.02': '010201',
  '1.03': '010301',
  '1.04': '010401',
  '1.05': '010501',
  '1.06': '010601',
  '1.07': '010701',
  '1.08': '010801',
  '1.09': '010901',
  // Grupo 02 — Pesquisas e desenvolvimento
  '2.01': '020101',
  // Grupo 03 — Locação, cessão de direito de uso e congêneres
  '3.02': '030201',
  '3.03': '030301',
  '3.04': '030401',
  '3.05': '030501',
  // Grupo 04 — Saúde, assistência médica e congêneres
  '4.01': '040101',
  '4.02': '040201',
  '4.03': '040301',
  '4.04': '040401',
  '4.05': '040501',
  '4.06': '040601',
  '4.07': '040701',
  '4.08': '040801',
  '4.09': '040901',
  '4.10': '041001',
  '4.11': '041101',
  '4.12': '041201',
  '4.13': '041301',
  '4.14': '041401',
  '4.15': '041501',
  '4.16': '041601',
  '4.17': '041701',
  '4.18': '041801',
  '4.19': '041901',
  '4.20': '042001',
  '4.21': '042101',
  '4.22': '042201',
  '4.23': '042301',
  // Grupo 05 — Medicina e assistência veterinária
  '5.01': '050101',
  '5.02': '050201',
  '5.03': '050301',
  '5.04': '050401',
  '5.05': '050501',
  '5.06': '050601',
  '5.07': '050701',
  '5.08': '050801',
  '5.09': '050901',
  // Grupo 06 — Cuidados pessoais, estética, atividades físicas
  '6.01': '060101',
  '6.02': '060201',
  '6.03': '060301',
  '6.04': '060401',
  '6.05': '060501',
  '6.06': '060601',
  // Grupo 07 — Engenharia, arquitetura, construção civil
  '7.01': '070101',
  '7.02': '070201',
  '7.03': '070301',
  '7.04': '070401',
  '7.05': '070501',
  '7.06': '070601',
  '7.07': '070701',
  '7.08': '070801',
  '7.09': '070901',
  '7.10': '071001',
  '7.11': '071101',
  '7.12': '071201',
  '7.13': '071301',
  '7.16': '071601',
  '7.17': '071701',
  '7.18': '071801',
  '7.19': '071901',
  '7.20': '072001',
  '7.21': '072101',
  '7.22': '072201',
  // Grupo 08 — Educação, ensino, instrução
  '8.01': '080101',
  '8.02': '080201',
  // Grupo 09 — Hospedagem, turismo, viagens
  '9.01': '090101',
  '9.02': '090201',
  '9.03': '090301',
  // Grupo 10 — Intermediação e congêneres
  '10.01': '100101',
  '10.02': '100201',
  '10.03': '100301',
  '10.04': '100401',
  '10.05': '100501',
  '10.06': '100601',
  '10.07': '100701',
  '10.08': '100801',
  '10.09': '100901',
  '10.10': '101001',
  // Grupo 11 — Guarda, estacionamento, vigilância
  '11.01': '110101',
  '11.02': '110201',
  '11.03': '110301',
  '11.04': '110401',
  // Grupo 12 — Diversões, lazer, entretenimento
  '12.01': '120101',
  '12.02': '120201',
  '12.03': '120301',
  '12.04': '120401',
  '12.05': '120501',
  '12.06': '120601',
  '12.07': '120701',
  '12.08': '120801',
  '12.09': '120901',
  '12.10': '121001',
  '12.11': '121101',
  '12.12': '121201',
  '12.13': '121301',
  '12.14': '121401',
  '12.15': '121501',
  '12.16': '121601',
  '12.17': '121701',
  // Grupo 13 — Fonografia, fotografia, cinematografia
  '13.02': '130201',
  '13.03': '130301',
  '13.04': '130401',
  '13.05': '130501',
  // Grupo 14 — Serviços relativos a bens de terceiros
  '14.01': '140101',
  '14.02': '140201',
  '14.03': '140301',
  '14.04': '140401',
  '14.05': '140501',
  '14.06': '140601',
  '14.07': '140701',
  '14.08': '140801',
  '14.09': '140901',
  '14.10': '141001',
  '14.11': '141101',
  '14.12': '141201',
  '14.13': '141301',
  // Grupo 15 — Serviços relacionados ao setor bancário ou financeiro
  '15.01': '150101',
  '15.02': '150201',
  '15.03': '150301',
  '15.04': '150401',
  '15.05': '150501',
  '15.06': '150601',
  '15.07': '150701',
  '15.08': '150801',
  '15.09': '150901',
  '15.10': '151001',
  '15.11': '151101',
  '15.12': '151201',
  '15.13': '151301',
  '15.14': '151401',
  '15.15': '151501',
  '15.16': '151601',
  '15.17': '151701',
  '15.18': '151801',
  // Grupo 16 — Transporte de natureza municipal
  '16.01': '160101',
  '16.02': '160201',
  // Grupo 17 — Apoio técnico, administrativo, jurídico, contábil
  '17.01': '170101',
  '17.02': '170201',
  '17.03': '170301',
  '17.04': '170401',
  '17.05': '170501',
  '17.06': '170601',
  '17.08': '170801',
  '17.09': '170901',
  '17.10': '171001',
  '17.11': '171101',
  '17.12': '171201',
  '17.13': '171301',
  '17.14': '171401',
  '17.15': '171501',
  '17.16': '171601',
  '17.17': '171701',
  '17.18': '171801',
  '17.19': '171901',
  '17.20': '172001',
  '17.21': '172101',
  '17.22': '172201',
  '17.23': '172301',
  '17.24': '172401',
  '17.25': '172501',
  // Grupo 18 — Regulação de sinistros, seguros
  '18.01': '180101',
  // Grupo 19 — Loteria, bingos, apostas
  '19.01': '190101',
  // Grupo 20 — Serviços portuários, aeroportuários, terminais
  '20.01': '200101',
  '20.02': '200201',
  '20.03': '200301',
  // Grupo 21 — Registros públicos, cartorários e notariais
  '21.01': '210101',
  // Grupo 22 — Exploração de rodovia
  '22.01': '220101',
  // Grupo 23 — Programação e comunicação visual, desenho industrial
  '23.01': '230101',
  // Grupo 24 — Chaveiros, carimbos, placas
  '24.01': '240101',
  // Grupo 25 — Serviços funerários
  '25.01': '250101',
  '25.02': '250201',
  '25.03': '250301',
  '25.04': '250401',
  '25.05': '250501',
  // Grupo 26 — Correios, courrier, coleta e entrega
  '26.01': '260101',
  // Grupo 27 — Assistência social
  '27.01': '270101',
  // Grupo 28 — Avaliação de bens e serviços
  '28.01': '280101',
  // Grupo 29 — Biblioteconomia
  '29.01': '290101',
  // Grupo 30 — Biologia, biotecnologia e química
  '30.01': '300101',
  // Grupo 31 — Serviços técnicos em edificações, eletrônica
  '31.01': '310101',
  // Grupo 32 — Desenhos técnicos
  '32.01': '320101',
  // Grupo 33 — Desembaraço aduaneiro, despachantes
  '33.01': '330101',
  // Grupo 34 — Investigação, detetives particulares
  '34.01': '340101',
  // Grupo 35 — Reportagem, jornalismo
  '35.01': '350101',
  // Grupo 36 — Meteorologia
  '36.01': '360101',
  // Grupo 37 — Artistas, atletas, modelos
  '37.01': '370101',
  // Grupo 38 — Museologia
  '38.01': '380101',
  // Grupo 39 — Ourivesaria e lapidação
  '39.01': '390101',
  // Grupo 40 — Obras de arte sob encomenda
  '40.01': '400101',
};

/**
 * Mapeamento item LC 116 → NBS principal (Nomenclatura Brasileira de Serviços)
 * Fonte: AnexoVIII-CorrelacaoItemNBSIndOpCClassTrib_IBSCBS_V1.00.00
 * Portal Nacional NFS-e — atualizado em 27/10/2025
 * Utiliza o primeiro NBS listado para cada item (NBS principal).
 */
const LC116_NBS: Record<string, string> = {
  '1.01': '1.1502.10.00', '1.02': '1.1502.10.00', '1.03': '1.1506.10.00',
  '1.04': '1.1502.10.00', '1.05': '1.1103.21.00', '1.06': '1.1501.10.00',
  '1.07': '1.1501.30.00', '1.08': '1.1502.30.00', '1.09': '1.1703.10.00',
  '2.01': '1.1201.11.00',
  '3.02': '1.1103.33.00', '3.03': '1.1805.31.00', '3.04': '1.1001.12.10', '3.05': '1.0105.70.00',
  '4.01': '1.2301.22.00', '4.02': '1.2301.93.00', '4.03': '1.2301.11.00',
  '4.04': '1.2301.11.00', '4.05': '1.2301.99.00', '4.06': '1.2301.91.00',
  '4.07': '1.2301.99.00', '4.08': '1.2301.92.00', '4.09': '1.2301.99.00',
  '4.10': '1.2301.99.00', '4.11': '1.2301.12.00', '4.12': '1.2301.23.00',
  '4.13': '1.2301.99.00', '4.14': '1.2301.99.00', '4.15': '1.2301.22.00',
  '4.16': '1.2301.98.00', '4.17': '1.2201.11.00', '4.18': '1.2301.21.00',
  '4.19': '1.2301.95.00', '4.20': '1.2301.95.00', '4.21': '1.2301.96.00',
  '4.22': '1.0910.10.00', '4.23': '1.0910.10.00',
  '5.01': '1.1405.12.00', '5.02': '1.1405.11.00', '5.03': '1.1405.90.00',
  '5.04': '1.1405.90.00', '5.05': '1.1405.40.00', '5.06': '1.1405.40.00',
  '5.07': '1.1405.12.00', '5.08': '1.1405.60.00', '5.09': '1.1405.50.00',
  '6.01': '1.2602.10.00', '6.02': '1.2602.20.00', '6.03': '1.2602.30.00',
  '6.04': '1.2205.12.00', '6.05': '1.2602.30.00', '6.06': '1.2602.90.00',
  '7.01': '1.1402.11.00', '7.02': '1.0101.11.00', '7.03': '1.1402.11.00',
  '7.04': '1.0103.10.00', '7.05': '1.0101.11.00', '7.06': '1.0106.50.00',
  '7.07': '1.0107.40.00', '7.08': '1.0107.90.00', '7.09': '1.2406.10.00',
  '7.10': '1.1803.10.00', '7.11': '1.1409.11.00', '7.12': '1.2404.21.00',
  '7.13': '1.1803.21.00', '7.16': '1.1105.41.00', '7.17': '1.0105.11.00',
  '7.18': '1.2406.90.00', '7.19': '1.1402.15.00', '7.20': '1.1404.21.00',
  '7.21': '1.1404.19.00', '7.22': '1.1901.10.00',
  '8.01': '1.2201.11.00', '8.02': '1.2205.11.00',
  '9.01': '1.0303.11.00', '9.02': '1.1805.40.00', '9.03': '1.1805.50.00',
  '10.01': '1.0906.11.00', '10.02': '1.0607.00.00', '10.03': '1.2501.40.00',
  '10.04': '1.0905.90.00', '10.05': '1.1001.21.00', '10.06': '1.0502.29.00',
  '10.07': '1.1704.10.00', '10.08': '1.1406.20.00', '10.09': '1.0201.00.00',
  '10.10': '1.0201.00.00',
  '11.01': '1.0604.30.00', '11.02': '1.1802.50.00', '11.03': '1.1802.50.00',
  '11.04': '1.0601.10.00', '11.05': '1.1802.30.00',
  '12.01': '1.2502.20.00', '12.02': '1.2501.50.00', '12.03': '1.2502.20.00',
  '12.04': '1.2502.90.00', '12.05': '1.2504.21.00', '12.06': '1.2508.00.00',
  '12.07': '1.2502.20.00', '12.08': '1.1806.61.00', '12.09': '1.2505.90.00',
  '12.10': '1.2508.00.00', '12.11': '1.2505.20.00', '12.12': '1.2503.10.00',
  '12.13': '1.2501.21.00', '12.14': '1.2502.90.00', '12.15': '1.2502.90.00',
  '12.16': '1.2501.50.00', '12.17': '1.2508.00.00',
  '13.02': '1.2501.11.00', '13.03': '1.1408.11.00', '13.04': '1.1806.51.00',
  '13.05': '1.2101.10.00',
  '14.01': '1.2001.10.00', '14.02': '1.2001.10.00', '14.03': '1.2001.31.10',
  '14.04': '1.2002.90.00', '14.05': '1.1804.00.00', '14.06': '1.0106.12.00',
  '14.07': '1.2606.00.00', '14.08': '1.2101.22.00', '14.09': '1.2604.00.00',
  '14.10': '1.2601.10.00', '14.11': '1.2002.40.00', '14.12': '1.2001.31.10',
  '14.13': '1.0107.50.00', '14.14': '1.0604.40.00',
  '15.01': '1.0901.40.00', '15.02': '1.0901.21.00', '15.03': '1.1101.90.00',
  '15.04': '1.1301.30.00', '15.05': '1.1806.10.00', '15.06': '1.1301.30.00',
  '15.07': '1.0901.90.00', '15.08': '1.0901.33.00', '15.09': '1.0901.51.11',
  '15.10': '1.1806.20.00', '15.11': '1.0901.90.00', '15.12': '1.0905.30.00',
  '15.13': '1.0905.60.00', '15.14': '1.0901.40.00', '15.15': '1.0901.21.00',
  '15.16': '1.0901.90.00', '15.17': '1.0901.90.00', '15.18': '1.0901.31.00',
  '16.01': '1.0401.11.19', '16.02': '1.0401.21.90',
  '17.01': '1.1401.11.00', '17.02': '1.1411.00.00', '17.03': '1.1401.29.00',
  '17.04': '1.1801.11.00', '17.05': '1.1801.21.00', '17.06': '1.1406.11.00',
  '17.08': '1.1110.00.00', '17.09': '1.1404.41.00', '17.10': '1.1806.61.00',
  '17.11': '1.1806.63.00', '17.12': '1.1001.11.00', '17.13': '1.1806.90.00',
  '17.14': '1.1301.10.00', '17.15': '1.1301.40.00', '17.16': '1.1302.11.00',
  '17.17': '1.1806.90.00', '17.18': '1.0906.30.00', '17.19': '1.1302.21.00',
  '17.20': '1.0905.50.00', '17.21': '1.1415.00.00', '17.22': '1.1806.20.00',
  '17.23': '1.0908.00.00', '17.24': '1.2205.14.00', '17.25': '1.1406.33.00',
  '18.01': '1.0906.20.00',
  '19.01': '1.0905.11.00',
  '20.01': '1.0605.10.00', '20.02': '1.0606.11.00', '20.03': '1.0601.90.00',
  '21.01': '1.1304.00.00',
  '22.01': '1.0604.21.00',
  '23.01': '1.1409.21.00',
  '24.01': '1.2606.00.00',
  '25.01': '1.2603.00.00', '25.02': '1.2603.00.00', '25.03': '1.2603.00.00',
  '25.04': '1.2603.00.00', '25.05': '1.2603.00.00',
  '26.01': '1.0701.00.00',
  '27.01': '1.2304.11.00',
  '28.01': '1.1404.14.00',
  '29.01': '1.1705.10.00',
  '30.01': '1.1415.00.00',
  '31.01': '1.1415.00.00',
  '32.01': '1.1409.90.00',
  '33.01': '1.0204.00.00',
  '34.01': '1.1802.10.00',
  '35.01': '1.1401.31.00',
  '36.01': '1.1404.30.00',
  '37.01': '1.1806.81.00',
  '38.01': '1.2504.11.00',
  '39.01': '1.2002.20.00',
  '40.01': '1.1109.90.00',
};

/** Retorna o item LC116 com CTN (6 dígitos) e NBS a partir do item */
function getCtn(item: string): { ctn?: string; nbs?: string } {
  const ctn = LC116_CTN[item];
  const nbs = LC116_NBS[item];
  return { ...(ctn ? { ctn } : {}), ...(nbs ? { nbs } : {}) };
}


const CNAE_LC116_MAP: Record<string, LC116Item> = {
  // ─── 1 – Informática e Congêneres ───────────────────────────────────────────
  '6201500': { item: '1.01', descricao: 'Análise e desenvolvimento de sistemas.', cnaeDescricao: 'Desenvolvimento de programas de computador sob encomenda', ...getCtn('1.01') },
  '6202300': { item: '1.02', descricao: 'Programação.', cnaeDescricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis', ...getCtn('1.02') },
  '6203100': { item: '1.01', descricao: 'Análise e desenvolvimento de sistemas.', cnaeDescricao: 'Desenvolvimento e licenciamento de programas de computador não-customizáveis', ...getCtn('1.01') },
  '6204000': { item: '1.02', descricao: 'Programação.', cnaeDescricao: 'Consultoria em tecnologia da informação', ...getCtn('1.02') },
  '6209100': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Suporte técnico, manutenção e outros serviços em tecnologia da informação', ...getCtn('1.03') },
  '6311900': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet', ...getCtn('1.03') },
  '6319400': { item: '1.04', descricao: 'Elaboração de programas de computadores, inclusive de jogos eletrônicos.', cnaeDescricao: 'Portais, provedores de conteúdo e outros serviços de informação na internet', ...getCtn('1.04') },
  '6391700': { item: '1.09', descricao: 'Disponibilização, sem cessão definitiva, de conteúdos de áudio, vídeo, imagem e texto por meio da internet.', cnaeDescricao: 'Agências de notícias', ...getCtn('1.09') },
  '6399200': { item: '1.09', descricao: 'Disponibilização, sem cessão definitiva, de conteúdos de áudio, vídeo, imagem e texto por meio da internet.', cnaeDescricao: 'Outras atividades de prestação de serviços de informação não especificadas anteriormente', ...getCtn('1.09') },
  '6201501': { item: '1.01', descricao: 'Análise e desenvolvimento de sistemas.', cnaeDescricao: 'Desenvolvimento de programas de computador sob encomenda — web design', ...getCtn('1.01') },
  '6201502': { item: '1.08', descricao: 'Planejamento, confecção, manutenção e atualização de páginas eletrônicas.', cnaeDescricao: 'Desenvolvimento de programas de computador sob encomenda — páginas eletrônicas', ...getCtn('1.08') },
  '6202301': { item: '1.02', descricao: 'Programação.', cnaeDescricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis — desenvolvimento', ...getCtn('1.02') },
  '6209101': { item: '1.05', descricao: 'Licenciamento ou cessão de direito de uso de programas de computação.', cnaeDescricao: 'Suporte técnico, manutenção e outros serviços em TI — instalação', ...getCtn('1.05') },
  '6210800': { item: '1.05', descricao: 'Licenciamento ou cessão de direito de uso de programas de computação.', cnaeDescricao: 'Consultoria em tecnologia da informação — licenciamento', ...getCtn('1.05') },
  '6290600': { item: '1.07', descricao: 'Suporte técnico em informática, inclusive instalação, configuração e manutenção de programas de computação e bancos de dados.', cnaeDescricao: 'Outras atividades de tecnologia da informação', ...getCtn('1.07') },
  '6110801': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Serviços de telefonia fixa comutada — STFC', ...getCtn('1.03') },
  '6110802': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Serviços de redes de transporte de telecomunicações — SRTT', ...getCtn('1.03') },
  '6120501': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Telefonia móvel celular', ...getCtn('1.03') },
  '6120502': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Serviço móvel especializado — SME', ...getCtn('1.03') },
  '6130200': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Telecomunicações por satélite', ...getCtn('1.03') },
  '6141800': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Operadoras de televisão por assinatura por cabo', ...getCtn('1.03') },
  '6142600': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Operadoras de televisão por assinatura por microondas', ...getCtn('1.03') },
  '6143400': { item: '1.03', descricao: 'Processamento de dados e congêneres.', cnaeDescricao: 'Operadoras de televisão por assinatura por satélite', ...getCtn('1.03') },

  // ─── 2 – Pesquisas e Desenvolvimento ────────────────────────────────────────
  '7210000': { item: '2.01', descricao: 'Serviços de pesquisas e desenvolvimento de qualquer natureza.', cnaeDescricao: 'Pesquisa e desenvolvimento experimental em ciências físicas e naturais', ...getCtn('2.01') },
  '7220700': { item: '2.01', descricao: 'Serviços de pesquisas e desenvolvimento de qualquer natureza.', cnaeDescricao: 'Pesquisa e desenvolvimento experimental em ciências sociais e humanas', ...getCtn('2.01') },

  // ─── 3 – Locação, Cessão de Direito de Uso ─────────────────────────────────
  '7711000': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Locação de automóveis sem condutor', ...getCtn('3.01') },
  '7719501': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Locação de embarcações sem tripulação, exceto para fins recreativos', ...getCtn('3.01') },
  '7719502': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Locação de aeronaves sem tripulação', ...getCtn('3.01') },
  '7719599': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Locação de outros meios de transporte não especificados anteriormente, sem condutor', ...getCtn('3.01') },
  '7721700': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Aluguel de equipamentos recreativos e esportivos', ...getCtn('3.01') },
  '7722500': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Aluguel de fitas de vídeo, DVDs e congêneres', ...getCtn('3.01') },
  '7723300': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Aluguel de objetos do vestuário, jóias e acessórios', ...getCtn('3.01') },
  '7729201': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Aluguel de aparelhos de jogos eletrônicos', ...getCtn('3.01') },
  '7729202': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Aluguel de móveis, utensílios e aparelhos de uso doméstico e pessoal; instrumentos musicais', ...getCtn('3.01') },
  '7729299': { item: '3.01', descricao: 'Locação de bens móveis.', cnaeDescricao: 'Aluguel de outros objetos pessoais e domésticos não especificados anteriormente', ...getCtn('3.01') },
  '7810800': { item: '17.05', descricao: 'Fornecimento de mão-de-obra, mesmo em caráter temporário.', cnaeDescricao: 'Seleção e agenciamento de mão-de-obra', ...getCtn('17.05') },
  '7820500': { item: '17.05', descricao: 'Fornecimento de mão-de-obra, mesmo em caráter temporário.', cnaeDescricao: 'Locação de mão-de-obra temporária', ...getCtn('17.05') },
  '7830200': { item: '17.05', descricao: 'Fornecimento de mão-de-obra, mesmo em caráter temporário.', cnaeDescricao: 'Fornecimento e gestão de recursos humanos para terceiros', ...getCtn('17.05') },

  // ─── 4 – Saúde e Assistência Médica ────────────────────────────────────────
  '8610101': { item: '4.01', descricao: 'Medicina e biomedicina.', cnaeDescricao: 'Atividades de atendimento hospitalar — SUS', ...getCtn('4.01') },
  '8610102': { item: '4.01', descricao: 'Medicina e biomedicina.', cnaeDescricao: 'Atividades de atendimento hospitalar — exceto SUS', ...getCtn('4.01') },
  '8621601': { item: '4.02', descricao: 'Análises clínicas, patologia, eletricidade médica, radioterapia, quimioterapia, ultra-sonografia, ressonância magnética, radiologia, tomografia e congêneres.', cnaeDescricao: 'UTI móvel', ...getCtn('4.02') },
  '8621602': { item: '4.02', descricao: 'Análises clínicas, patologia, eletricidade médica, radioterapia, quimioterapia, ultra-sonografia, ressonância magnética, radiologia, tomografia e congêneres.', cnaeDescricao: 'Serviços móveis de atendimento a urgências, exceto por UTI móvel', ...getCtn('4.02') },
  '8622400': { item: '4.01', descricao: 'Medicina e biomedicina.', cnaeDescricao: 'Serviços de remoção de pacientes, exceto os serviços móveis de atendimento a urgências', ...getCtn('4.01') },
  '8630501': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Atividade médica ambulatorial com recursos para realização de procedimentos cirúrgicos', ...getCtn('4.02') },
  '8630502': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Atividade médica ambulatorial com recursos para realização de exames complementares', ...getCtn('4.02') },
  '8630503': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Atividade médica ambulatorial restrita a consultas', ...getCtn('4.02') },
  '8630504': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Atividade odontológica', ...getCtn('4.02') },
  '8630505': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Atividade odontológica — SUS', ...getCtn('4.02') },
  '8630506': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Serviços de vacinação e imunização humana', ...getCtn('4.02') },
  '8630507': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Atividades de reprodução humana assistida', ...getCtn('4.02') },
  '8640201': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Laboratórios de anatomia patológica e citológica', ...getCtn('4.02') },
  '8640202': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Laboratórios clínicos', ...getCtn('4.02') },
  '8640203': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Serviços de diálise e nefrologia', ...getCtn('4.02') },
  '8640204': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Serviços de tomografia', ...getCtn('4.02') },
  '8640205': { item: '4.02', descricao: 'Análises clínicas, patologia, radiologia, tomografia e congêneres.', cnaeDescricao: 'Serviços de diagnóstico por imagem com uso de radiação ionizante, exceto tomografia', ...getCtn('4.02') },
  '8650001': { item: '4.06', descricao: 'Enfermagem, inclusive serviços auxiliares.', cnaeDescricao: 'Atividades de enfermagem', ...getCtn('4.06') },
  '8650002': { item: '4.01', descricao: 'Medicina e biomedicina.', cnaeDescricao: 'Atividades de profissionais da nutrição', ...getCtn('4.01') },
  '8650003': { item: '4.01', descricao: 'Medicina e biomedicina.', cnaeDescricao: 'Atividades de psicologia e psicanálise', ...getCtn('4.01') },
  '8650004': { item: '4.08', descricao: 'Terapia ocupacional, fisioterapia e fonoaudiologia.', cnaeDescricao: 'Atividades de fisioterapia', ...getCtn('4.08') },
  '8650005': { item: '4.10', descricao: 'Nutrição.', cnaeDescricao: 'Atividades de terapia ocupacional', ...getCtn('4.10') },
  '8650006': { item: '4.08', descricao: 'Terapia ocupacional, fisioterapia e fonoaudiologia.', cnaeDescricao: 'Atividades de fonoaudiologia', ...getCtn('4.08') },
  '8650007': { item: '4.07', descricao: 'Serviços farmacêuticos.', cnaeDescricao: 'Atividades de terapia de nutrição enteral e parenteral', ...getCtn('4.07') },
  '8660700': { item: '4.05', descricao: 'Acupuntura.', cnaeDescricao: 'Atividades de práticas integrativas e complementares em saúde humana', ...getCtn('4.05') },
  '8690901': { item: '4.14', descricao: 'Próteses sob encomenda.', cnaeDescricao: 'Atividades de podologia', ...getCtn('4.14') },
  '8690902': { item: '4.01', descricao: 'Medicina e biomedicina.', cnaeDescricao: 'Atividades de condicionamento físico', ...getCtn('4.01') },
  '8690903': { item: '4.08', descricao: 'Terapia ocupacional, fisioterapia e fonoaudiologia.', cnaeDescricao: 'Atividades de acupuntura', ...getCtn('4.08') },
  '8690904': { item: '4.08', descricao: 'Terapia ocupacional, fisioterapia e fonoaudiologia.', cnaeDescricao: 'Atividades de musicoterapia', ...getCtn('4.08') },
  '8690999': { item: '4.23', descricao: 'Outros planos de saúde.', cnaeDescricao: 'Outras atividades de atenção à saúde humana não especificadas anteriormente', ...getCtn('4.23') },

  // ─── 5 – Medicina e Assistência Veterinária ────────────────────────────────
  '7500100': { item: '5.01', descricao: 'Medicina veterinária e zootecnia.', cnaeDescricao: 'Atividades veterinárias', ...getCtn('5.01') },

  // ─── 6 – Cuidados Pessoais e Estética ──────────────────────────────────────
  '9602501': { item: '6.01', descricao: 'Barbearia, cabeleireiros, manicuros, pedicuros e congêneres.', cnaeDescricao: 'Cabeleireiros', ...getCtn('6.01') },
  '9602502': { item: '6.02', descricao: 'Esteticistas, tratamento de pele, depilação e congêneres.', cnaeDescricao: 'Outras atividades de tratamento de beleza', ...getCtn('6.02') },
  '9609201': { item: '6.04', descricao: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.', cnaeDescricao: 'Clínicas de estética e similares', ...getCtn('6.04') },
  '9609202': { item: '6.04', descricao: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.', cnaeDescricao: 'Agências matrimoniais', ...getCtn('6.04') },
  '9609203': { item: '6.04', descricao: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.', cnaeDescricao: 'Alojamento, higiene e embelezamento de animais', ...getCtn('6.04') },
  '9311500': { item: '6.04', descricao: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.', cnaeDescricao: 'Gestão de instalações de esportes', ...getCtn('6.04') },
  '9312300': { item: '6.04', descricao: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.', cnaeDescricao: 'Clubes sociais, esportivos e similares', ...getCtn('6.04') },
  '9313100': { item: '6.04', descricao: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.', cnaeDescricao: 'Atividades de condicionamento físico', ...getCtn('6.04') },

  // ─── 7 – Engenharia, Arquitetura, Construção Civil ─────────────────────────
  '7111100': { item: '7.01', descricao: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres.', cnaeDescricao: 'Serviços de arquitetura', ...getCtn('7.01') },
  '7112000': { item: '7.01', descricao: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres.', cnaeDescricao: 'Serviços de engenharia', ...getCtn('7.01') },
  '7119701': { item: '7.01', descricao: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres.', cnaeDescricao: 'Serviços de cartografia, topografia e geodésia', ...getCtn('7.01') },
  '7119702': { item: '7.01', descricao: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres.', cnaeDescricao: 'Atividades de estudos geológicos', ...getCtn('7.01') },
  '7119799': { item: '7.01', descricao: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres.', cnaeDescricao: 'Atividades técnicas relacionadas à engenharia e arquitetura não especificadas anteriormente', ...getCtn('7.01') },
  '4110700': { item: '7.02', descricao: 'Execução, por administração, empreitada ou subempreitada, de obras de construção civil.', cnaeDescricao: 'Incorporação de empreendimentos imobiliários', ...getCtn('7.02') },
  '4120400': { item: '7.02', descricao: 'Execução, por administração, empreitada ou subempreitada, de obras de construção civil.', cnaeDescricao: 'Construção de edifícios', ...getCtn('7.02') },
  '4211101': { item: '7.02', descricao: 'Execução, por administração, empreitada ou subempreitada, de obras de construção civil.', cnaeDescricao: 'Construção de rodovias e ferrovias', ...getCtn('7.02') },
  '4321500': { item: '14.06', descricao: 'Instalação e montagem de aparelhos, máquinas e equipamentos.', cnaeDescricao: 'Instalação e manutenção elétrica', ...getCtn('14.06') },
  '4321501': { item: '14.06', descricao: 'Instalação e montagem de aparelhos, máquinas e equipamentos.', cnaeDescricao: 'Instalação e manutenção elétrica — instalação', ...getCtn('14.06') },
  '4321502': { item: '14.06', descricao: 'Instalação e montagem de aparelhos, máquinas e equipamentos.', cnaeDescricao: 'Instalação e manutenção elétrica — manutenção', ...getCtn('14.06') },
  '4322301': { item: '7.02', descricao: 'Execução de obras de construção civil.', cnaeDescricao: 'Instalações hidráulicas, sanitárias e de gás', ...getCtn('7.02') },
  '4322302': { item: '7.02', descricao: 'Execução de obras de construção civil.', cnaeDescricao: 'Instalação e manutenção de sistemas centrais de ar condicionado, de ventilação e refrigeração', ...getCtn('7.02') },
  '4399101': { item: '7.09', descricao: 'Varrição, coleta, remoção, incineração, tratamento, reciclagem e destinação final de lixo e resíduos.', cnaeDescricao: 'Administração de obras', ...getCtn('7.09') },
  '4399103': { item: '7.02', descricao: 'Execução de obras de construção civil.', cnaeDescricao: 'Obras de alvenaria', ...getCtn('7.02') },
  '4399199': { item: '7.02', descricao: 'Execução de obras de construção civil.', cnaeDescricao: 'Serviços especializados para construção não especificados anteriormente', ...getCtn('7.02') },
  '7120100': { item: '7.01', descricao: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres.', cnaeDescricao: 'Testes e análises técnicas', ...getCtn('7.01') },

  // ─── 8 – Educação e Instrução ───────────────────────────────────────────────
  '8511200': { item: '8.01', descricao: 'Ensino regular pré-escolar, fundamental, médio e superior.', cnaeDescricao: 'Educação infantil — creche', ...getCtn('8.01') },
  '8512100': { item: '8.01', descricao: 'Ensino regular pré-escolar, fundamental, médio e superior.', cnaeDescricao: 'Educação infantil — pré-escola', ...getCtn('8.01') },
  '8513900': { item: '8.01', descricao: 'Ensino regular pré-escolar, fundamental, médio e superior.', cnaeDescricao: 'Ensino fundamental', ...getCtn('8.01') },
  '8520100': { item: '8.01', descricao: 'Ensino regular pré-escolar, fundamental, médio e superior.', cnaeDescricao: 'Ensino médio', ...getCtn('8.01') },
  '8531700': { item: '8.01', descricao: 'Ensino regular pré-escolar, fundamental, médio e superior.', cnaeDescricao: 'Educação superior — graduação', ...getCtn('8.01') },
  '8532500': { item: '8.01', descricao: 'Ensino regular pré-escolar, fundamental, médio e superior.', cnaeDescricao: 'Educação superior — graduação e pós-graduação', ...getCtn('8.01') },
  '8533300': { item: '8.01', descricao: 'Ensino regular pré-escolar, fundamental, médio e superior.', cnaeDescricao: 'Educação superior — pós-graduação e extensão', ...getCtn('8.01') },
  '8541400': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional, avaliação de conhecimentos de qualquer natureza.', cnaeDescricao: 'Educação profissional de nível técnico', ...getCtn('8.02') },
  '8542200': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Educação profissional de nível tecnológico', ...getCtn('8.02') },
  '8550301': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Administração de caixas escolares', ...getCtn('8.02') },
  '8550302': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Atividades de apoio à educação, exceto caixas escolares', ...getCtn('8.02') },
  '8591100': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Ensino de esportes', ...getCtn('8.02') },
  '8592901': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Ensino de dança', ...getCtn('8.02') },
  '8592902': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Ensino de artes cênicas, exceto dança', ...getCtn('8.02') },
  '8592903': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Ensino de música', ...getCtn('8.02') },
  '8593700': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Ensino de idiomas', ...getCtn('8.02') },
  '8599601': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Formação de condutores', ...getCtn('8.02') },
  '8599602': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Cursos de pilotagem', ...getCtn('8.02') },
  '8599603': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Treinamento em informática', ...getCtn('8.02') },
  '8599604': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Treinamento em desenvolvimento profissional e gerencial', ...getCtn('8.02') },
  '8599605': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Cursos preparatórios para concursos', ...getCtn('8.02') },
  '8599699': { item: '8.02', descricao: 'Instrução, treinamento, orientação pedagógica e educacional.', cnaeDescricao: 'Outras atividades de ensino não especificadas anteriormente', ...getCtn('8.02') },

  // ─── 9 – Hospedagem, Turismo, Viagens ──────────────────────────────────────
  '5510801': { item: '9.01', descricao: 'Hospedagem de qualquer natureza em hotéis, apart-service condominiais, flat, apart-hotéis, hotéis residência e congêneres.', cnaeDescricao: 'Hotéis', ...getCtn('9.01') },
  '5510802': { item: '9.01', descricao: 'Hospedagem de qualquer natureza.', cnaeDescricao: 'Apart-hotéis', ...getCtn('9.01') },
  '5510803': { item: '9.01', descricao: 'Hospedagem de qualquer natureza.', cnaeDescricao: 'Motéis', ...getCtn('9.01') },
  '7911200': { item: '9.02', descricao: 'Agenciamento, organização, promoção, intermediação e execução de programas de turismo, passeios, viagens, excursões, hospedagens e congêneres.', cnaeDescricao: 'Agências de viagens', ...getCtn('9.02') },
  '7912100': { item: '9.02', descricao: 'Agenciamento, organização, promoção e intermediação de programas de turismo.', cnaeDescricao: 'Operadores turísticos', ...getCtn('9.02') },
  '7990200': { item: '9.03', descricao: 'Guias de turismo.', cnaeDescricao: 'Serviços de reservas e outros serviços de turismo não especificados anteriormente', ...getCtn('9.03') },

  // ─── 10 – Intermediação e Congêneres ────────────────────────────────────────
  '6611801': { item: '10.02', descricao: 'Agenciamento, corretagem ou intermediação de títulos em geral, valores mobiliários e contratos quaisquer.', cnaeDescricao: 'Bolsa de valores', ...getCtn('10.02') },
  '6611802': { item: '10.02', descricao: 'Agenciamento, corretagem ou intermediação de títulos em geral, valores mobiliários e contratos quaisquer.', cnaeDescricao: 'Bolsa de mercadorias', ...getCtn('10.02') },
  '6612601': { item: '10.01', descricao: 'Agenciamento, corretagem ou intermediação de câmbio, de seguros, de cartões de crédito, de planos de saúde e de planos de previdência privada.', cnaeDescricao: 'Corretoras de títulos e valores mobiliários', ...getCtn('10.01') },
  '6612602': { item: '10.01', descricao: 'Agenciamento, corretagem ou intermediação de câmbio, seguros e planos de previdência.', cnaeDescricao: 'Distribuidoras de títulos e valores mobiliários', ...getCtn('10.01') },
  '6612603': { item: '10.01', descricao: 'Agenciamento, corretagem ou intermediação de câmbio, seguros e planos de previdência.', cnaeDescricao: 'Corretoras de câmbio', ...getCtn('10.01') },
  '6612604': { item: '10.01', descricao: 'Agenciamento, corretagem ou intermediação de câmbio, seguros e planos de previdência.', cnaeDescricao: 'Corretoras e agentes de seguros', ...getCtn('10.01') },
  '6612605': { item: '10.01', descricao: 'Agenciamento, corretagem ou intermediação de câmbio, seguros e planos de previdência.', cnaeDescricao: 'Agentes de investimentos em aplicações financeiras', ...getCtn('10.01') },
  '6613400': { item: '10.04', descricao: 'Agenciamento, corretagem ou intermediação de contratos de arrendamento mercantil (leasing), de franquia (franchising) e de faturização (factoring).', cnaeDescricao: 'Administração de cartões de crédito', ...getCtn('10.04') },
  '6619301': { item: '10.09', descricao: 'Representação de qualquer natureza, inclusive comercial.', cnaeDescricao: 'Serviços de liquidação e custódia', ...getCtn('10.09') },
  '6619302': { item: '10.09', descricao: 'Representação de qualquer natureza, inclusive comercial.', cnaeDescricao: 'Correspondentes de instituições financeiras', ...getCtn('10.09') },
  '6622300': { item: '10.01', descricao: 'Agenciamento, corretagem ou intermediação de câmbio, seguros e planos de previdência.', cnaeDescricao: 'Corretores e agentes de seguros, de planos de previdência complementar e de saúde', ...getCtn('10.01') },
  '7490101': { item: '10.09', descricao: 'Representação de qualquer natureza, inclusive comercial.', cnaeDescricao: 'Serviços de tradução, interpretação e similares', ...getCtn('10.09') },
  '7490104': { item: '10.05', descricao: 'Agenciamento, corretagem ou intermediação de bens móveis ou imóveis.', cnaeDescricao: 'Atividades de intermediação e agenciamento de serviços e negócios em geral, exceto imobiliários', ...getCtn('10.05') },

  // ─── 11 – Guarda, Estacionamento, Vigilância ────────────────────────────────
  '8011101': { item: '11.02', descricao: 'Vigilância, segurança ou monitoramento de bens e pessoas.', cnaeDescricao: 'Atividades de vigilância e segurança privada — vigilância', ...getCtn('11.02') },
  '8011102': { item: '11.02', descricao: 'Vigilância, segurança ou monitoramento de bens e pessoas.', cnaeDescricao: 'Serviços de adestramento de cães de guarda', ...getCtn('11.02') },
  '8012900': { item: '11.02', descricao: 'Vigilância, segurança ou monitoramento de bens e pessoas.', cnaeDescricao: 'Atividades de transporte de valores', ...getCtn('11.02') },
  '8020001': { item: '11.02', descricao: 'Vigilância, segurança ou monitoramento de bens e pessoas.', cnaeDescricao: 'Atividades de monitoramento de sistemas de segurança eletrônica', ...getCtn('11.02') },
  '8020002': { item: '11.02', descricao: 'Vigilância, segurança ou monitoramento de bens e pessoas.', cnaeDescricao: 'Outras atividades de serviços de segurança', ...getCtn('11.02') },
  '5211701': { item: '11.01', descricao: 'Guarda e estacionamento de veículos terrestres automotores, de aeronaves e de embarcações.', cnaeDescricao: 'Armazéns gerais — emissão de warrant', ...getCtn('11.01') },
  '5211702': { item: '11.01', descricao: 'Guarda e estacionamento de veículos terrestres automotores, de aeronaves e de embarcações.', cnaeDescricao: 'Guarda-móveis', ...getCtn('11.01') },

  // ─── 12 – Diversões, Lazer, Entretenimento ──────────────────────────────────
  '9001901': { item: '12.01', descricao: 'Espetáculos teatrais.', cnaeDescricao: 'Produção teatral', ...getCtn('12.01') },
  '9001902': { item: '12.07', descricao: 'Shows, ballet, danças, desfiles, bailes, óperas, concertos, recitais, festivais e congêneres.', cnaeDescricao: 'Produção musical', ...getCtn('12.07') },
  '9001903': { item: '12.03', descricao: 'Espetáculos circenses.', cnaeDescricao: 'Produção de espetáculos de dança', ...getCtn('12.03') },
  '9001904': { item: '12.07', descricao: 'Shows, ballet, danças, desfiles, bailes, óperas, concertos, recitais, festivais e congêneres.', cnaeDescricao: 'Produção de espetáculos circenses, de marionetes e similares', ...getCtn('12.07') },
  '9001905': { item: '12.07', descricao: 'Shows, ballet, danças, desfiles, bailes, óperas, concertos, recitais, festivais e congêneres.', cnaeDescricao: 'Produção de espetáculos de rodeios, vaquejadas e similares', ...getCtn('12.07') },
  '9001906': { item: '12.01', descricao: 'Espetáculos teatrais.', cnaeDescricao: 'Atividades de sonorização e de iluminação', ...getCtn('12.01') },
  '9001999': { item: '12.07', descricao: 'Shows, ballet, danças, desfiles, bailes, óperas, concertos, recitais, festivais e congêneres.', cnaeDescricao: 'Artes cênicas, espetáculos e atividades complementares não especificados anteriormente', ...getCtn('12.07') },
  '9200301': { item: '12.13', descricao: 'Produção de eventos, espetáculos, shows e congêneres.', cnaeDescricao: 'Casas de bingo', ...getCtn('12.13') },
  '9200302': { item: '12.13', descricao: 'Produção de eventos, espetáculos, shows e congêneres.', cnaeDescricao: 'Exploração de apostas em corridas de cavalos', ...getCtn('12.13') },
  '9200399': { item: '12.13', descricao: 'Produção de eventos, espetáculos, shows e congêneres.', cnaeDescricao: 'Exploração de jogos de azar e apostas não especificados anteriormente', ...getCtn('12.13') },
  '9321200': { item: '12.05', descricao: 'Parques de diversões, centros de lazer e congêneres.', cnaeDescricao: 'Parques de diversão e parques temáticos', ...getCtn('12.05') },
  '9329801': { item: '12.05', descricao: 'Parques de diversões, centros de lazer e congêneres.', cnaeDescricao: 'Discotecas, danceterias, salões de dança e similares', ...getCtn('12.05') },
  '9329802': { item: '12.05', descricao: 'Parques de diversões, centros de lazer e congêneres.', cnaeDescricao: 'Exploração de boliches', ...getCtn('12.05') },
  '9329803': { item: '12.05', descricao: 'Parques de diversões, centros de lazer e congêneres.', cnaeDescricao: 'Exploração de jogos de sinuca, bilhar e similares', ...getCtn('12.05') },
  '9329804': { item: '12.17', descricao: 'Recreação e animação, inclusive em festas e eventos de qualquer natureza.', cnaeDescricao: 'Exploração de jogos eletrônicos recreativos', ...getCtn('12.17') },

  // ─── 13 – Fonografia, Fotografia, Cinematografia ────────────────────────────
  '5911101': { item: '13.03', descricao: 'Fotografia e cinematografia, inclusive revelação, ampliação, cópia, reprodução, trucagem e congêneres.', cnaeDescricao: 'Estúdios cinematográficos', ...getCtn('13.03') },
  '5911102': { item: '13.03', descricao: 'Fotografia e cinematografia.', cnaeDescricao: 'Produção de filmes para publicidade', ...getCtn('13.03') },
  '5911199': { item: '13.03', descricao: 'Fotografia e cinematografia.', cnaeDescricao: 'Atividades de produção cinematográfica, de vídeos e de programas de televisão não especificadas anteriormente', ...getCtn('13.03') },
  '5912001': { item: '13.02', descricao: 'Fonografia ou gravação de sons, inclusive trucagem, dublagem, mixagem e congêneres.', cnaeDescricao: 'Serviços de dublagem', ...getCtn('13.02') },
  '5912002': { item: '13.02', descricao: 'Fonografia ou gravação de sons.', cnaeDescricao: 'Serviços de mixagem sonora em produção audiovisual', ...getCtn('13.02') },
  '5912099': { item: '13.02', descricao: 'Fonografia ou gravação de sons.', cnaeDescricao: 'Atividades de pós-produção cinematográfica, de vídeos e de programas de televisão não especificadas anteriormente', ...getCtn('13.02') },
  '7420001': { item: '13.03', descricao: 'Fotografia e cinematografia.', cnaeDescricao: 'Atividades de produção de fotografias, exceto aérea e submarina', ...getCtn('13.03') },
  '7420002': { item: '13.03', descricao: 'Fotografia e cinematografia.', cnaeDescricao: 'Atividades de produção de fotografias aéreas e submarinas', ...getCtn('13.03') },
  '7420003': { item: '13.03', descricao: 'Fotografia e cinematografia.', cnaeDescricao: 'Laboratórios fotográficos', ...getCtn('13.03') },
  '7420004': { item: '13.03', descricao: 'Fotografia e cinematografia.', cnaeDescricao: 'Filmagem de festas e eventos', ...getCtn('13.03') },
  '7420005': { item: '13.03', descricao: 'Fotografia e cinematografia.', cnaeDescricao: 'Serviços de microfilmagem', ...getCtn('13.03') },

  // ─── 14 – Serviços relativos a bens de terceiros ────────────────────────────
  '9511800': { item: '14.01', descricao: 'Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas, veículos, aparelhos, equipamentos, motores, elevadores ou de qualquer objeto.', cnaeDescricao: 'Reparação e manutenção de computadores e de equipamentos periféricos', ...getCtn('14.01') },
  '9512600': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Reparação e manutenção de equipamentos de comunicação', ...getCtn('14.01') },
  '4520001': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Serviços de manutenção e reparação mecânica de veículos automotores', ...getCtn('14.01') },
  '4520002': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Serviços de lanternagem ou funilaria e pintura de veículos automotores', ...getCtn('14.01') },
  '3314701': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Manutenção e reparação de máquinas motrizes não-elétricas', ...getCtn('14.01') },
  '3314702': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Manutenção e reparação de equipamentos hidráulicos e pneumáticos, exceto válvulas', ...getCtn('14.01') },
  '3314703': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Manutenção e reparação de válvulas industriais', ...getCtn('14.01') },
  '3314799': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Manutenção e reparação de outras máquinas e equipamentos para usos industriais não especificados anteriormente', ...getCtn('14.01') },
  '9521500': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Reparação e manutenção de equipamentos eletroeletrônicos de uso pessoal e doméstico', ...getCtn('14.01') },
  '9529101': { item: '14.06', descricao: 'Instalação e montagem de aparelhos, máquinas e equipamentos.', cnaeDescricao: 'Reparação de calçados, bolsas e artigos de viagem', ...getCtn('14.06') },
  '9529102': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Chaveiros', ...getCtn('14.01') },
  '9529103': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Reparação de relógios', ...getCtn('14.01') },
  '9529104': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Reparação de bicicletas, triciclos e outros veículos não-motorizados', ...getCtn('14.01') },
  '9529105': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Reparação de artigos do mobiliário', ...getCtn('14.01') },
  '9529199': { item: '14.01', descricao: 'Manutenção e conservação de máquinas, veículos, equipamentos e qualquer objeto.', cnaeDescricao: 'Reparação e manutenção de outros objetos e equipamentos pessoais e domésticos não especificados anteriormente', ...getCtn('14.01') },

  // ─── 15 – Setor Bancário e Financeiro ──────────────────────────────────────
  '6410700': { item: '15.01', descricao: 'Administração de fundos quaisquer, de consórcio, de cartão de crédito ou débito e congêneres.', cnaeDescricao: 'Banco Central', ...getCtn('15.01') },
  '6421200': { item: '15.01', descricao: 'Administração de fundos quaisquer, de consórcio, de cartão de crédito ou débito e congêneres.', cnaeDescricao: 'Bancos comerciais', ...getCtn('15.01') },
  '6422100': { item: '15.01', descricao: 'Administração de fundos quaisquer.', cnaeDescricao: 'Bancos múltiplos, com carteira comercial', ...getCtn('15.01') },
  '6423900': { item: '15.01', descricao: 'Administração de fundos quaisquer.', cnaeDescricao: 'Caixas econômicas', ...getCtn('15.01') },
  '6431000': { item: '15.01', descricao: 'Administração de fundos quaisquer.', cnaeDescricao: 'Bancos múltiplos, sem carteira comercial', ...getCtn('15.01') },
  '6432800': { item: '15.01', descricao: 'Administração de fundos quaisquer.', cnaeDescricao: 'Bancos de investimento', ...getCtn('15.01') },
  '6450600': { item: '15.09', descricao: 'Arrendamento mercantil (leasing) de quaisquer bens.', cnaeDescricao: 'Sociedades de capitalização', ...getCtn('15.09') },
  '6499901': { item: '17.20', descricao: 'Consultoria e assessoria econômica ou financeira.', cnaeDescricao: 'Clubes de investimento', ...getCtn('17.20') },
  '6499999': { item: '17.20', descricao: 'Consultoria e assessoria econômica ou financeira.', cnaeDescricao: 'Outras atividades de serviços financeiros não especificadas anteriormente', ...getCtn('17.20') },

  // ─── 16 – Transporte de Natureza Municipal ─────────────────────────────────
  '4923001': { item: '16.01', descricao: 'Serviços de transporte de natureza municipal.', cnaeDescricao: 'Serviço de táxi', ...getCtn('16.01') },
  '4923002': { item: '16.01', descricao: 'Serviços de transporte de natureza municipal.', cnaeDescricao: 'Serviço de transporte por aplicativo', ...getCtn('16.01') },
  '4929901': { item: '16.01', descricao: 'Serviços de transporte de natureza municipal.', cnaeDescricao: 'Transporte rodoviário coletivo de passageiros, sob regime de fretamento, municipal', ...getCtn('16.01') },
  '4929902': { item: '16.01', descricao: 'Serviços de transporte de natureza municipal.', cnaeDescricao: 'Transporte rodoviário coletivo de passageiros, sob regime de fretamento, intermunicipal, interestadual e internacional', ...getCtn('16.01') },
  '4929903': { item: '16.01', descricao: 'Serviços de transporte de natureza municipal.', cnaeDescricao: 'Organização de excursões em veículos rodoviários próprios, municipal', ...getCtn('16.01') },
  '4929904': { item: '16.01', descricao: 'Serviços de transporte de natureza municipal.', cnaeDescricao: 'Organização de excursões em veículos rodoviários próprios, intermunicipal, interestadual e internacional', ...getCtn('16.01') },
  '4929999': { item: '16.01', descricao: 'Serviços de transporte de natureza municipal.', cnaeDescricao: 'Outros transportes rodoviários de passageiros não especificados anteriormente', ...getCtn('16.01') },

  // ─── 17 – Apoio Técnico, Administrativo, Jurídico, Contábil ────────────────
  '6911701': { item: '17.14', descricao: 'Advocacia.', cnaeDescricao: 'Serviços advocatícios', ...getCtn('17.14') },
  '6911702': { item: '17.14', descricao: 'Advocacia.', cnaeDescricao: 'Atividades auxiliares da justiça', ...getCtn('17.14') },
  '6920601': { item: '17.19', descricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.', cnaeDescricao: 'Atividades de contabilidade', ...getCtn('17.19') },
  '6920602': { item: '17.19', descricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.', cnaeDescricao: 'Atividades de consultoria e auditoria contábil e tributária', ...getCtn('17.19') },
  '7020400': { item: '17.01', descricao: 'Assessoria ou consultoria de qualquer natureza.', cnaeDescricao: 'Atividades de consultoria em gestão empresarial, exceto consultoria técnica específica', ...getCtn('17.01') },
  '7311400': { item: '17.06', descricao: 'Propaganda e publicidade, inclusive promoção de vendas.', cnaeDescricao: 'Agências de publicidade', ...getCtn('17.06') },
  '7312200': { item: '17.06', descricao: 'Propaganda e publicidade.', cnaeDescricao: 'Agenciamento de espaços para publicidade, exceto em veículos de comunicação', ...getCtn('17.06') },
  '7319001': { item: '17.06', descricao: 'Propaganda e publicidade.', cnaeDescricao: 'Criação de estandes para feiras e exposições', ...getCtn('17.06') },
  '7319002': { item: '17.06', descricao: 'Propaganda e publicidade.', cnaeDescricao: 'Promoção de vendas', ...getCtn('17.06') },
  '7319003': { item: '17.06', descricao: 'Propaganda e publicidade.', cnaeDescricao: 'Marketing direto', ...getCtn('17.06') },
  '7319004': { item: '17.06', descricao: 'Propaganda e publicidade.', cnaeDescricao: 'Consultoria em publicidade', ...getCtn('17.06') },
  '7410202': { item: '17.06', descricao: 'Propaganda e publicidade.', cnaeDescricao: 'Design de interiores', ...getCtn('17.06') },
  '7410201': { item: '23.01', descricao: 'Programação visual, comunicação visual e congêneres.', cnaeDescricao: 'Design', ...getCtn('23.01') },
  '7410203': { item: '17.06', descricao: 'Propaganda e publicidade.', cnaeDescricao: 'Design de produto', ...getCtn('17.06') },
  '8121400': { item: '7.10', descricao: 'Limpeza, manutenção e conservação de vias e logradouros públicos, imóveis, chaminés, piscinas, parques, jardins e congêneres.', cnaeDescricao: 'Limpeza em prédios e em domicílios', ...getCtn('7.10') },
  '8122200': { item: '7.10', descricao: 'Limpeza, manutenção e conservação de vias e logradouros públicos, imóveis.', cnaeDescricao: 'Imunização e controle de pragas urbanas', ...getCtn('7.10') },
  '8129000': { item: '7.10', descricao: 'Limpeza, manutenção e conservação.', cnaeDescricao: 'Atividades de limpeza não especificadas anteriormente', ...getCtn('7.10') },
  '8111700': { item: '7.10', descricao: 'Limpeza, manutenção e conservação.', cnaeDescricao: 'Serviços combinados para apoio a edifícios, exceto condomínios prediais', ...getCtn('7.10') },
  '8130300': { item: '7.11', descricao: 'Decoração e jardinagem, inclusive corte e poda de árvores.', cnaeDescricao: 'Atividades paisagísticas', ...getCtn('7.11') },

  // ─── 20 – Serviços Portuários, Aeroportuários ──────────────────────────────
  '5231101': { item: '20.01', descricao: 'Serviços portuários, ferroportuários, utilização de porto, movimentação de passageiros.', cnaeDescricao: 'Administração da infraestrutura portuária', ...getCtn('20.01') },
  '5231102': { item: '20.01', descricao: 'Serviços portuários.', cnaeDescricao: 'Operações de terminais', ...getCtn('20.01') },
  '5232000': { item: '20.01', descricao: 'Serviços portuários.', cnaeDescricao: 'Atividades de agenciamento marítimo', ...getCtn('20.01') },
  '5239700': { item: '20.01', descricao: 'Serviços portuários.', cnaeDescricao: 'Atividades auxiliares dos transportes aquaviários não especificadas anteriormente', ...getCtn('20.01') },
  '5240101': { item: '20.02', descricao: 'Serviços aeroportuários, utilização de aeroporto, movimentação de passageiros.', cnaeDescricao: 'Operação dos aeroportos e campos de aterrissagem', ...getCtn('20.02') },
  '5240199': { item: '20.02', descricao: 'Serviços aeroportuários.', cnaeDescricao: 'Atividades auxiliares dos transportes aéreos, exceto operação dos aeroportos', ...getCtn('20.02') },
  '5229001': { item: '33.01', descricao: 'Serviços de desembaraço aduaneiro, comissários, despachantes e congêneres.', cnaeDescricao: 'Serviços de apoio ao transporte por táxi, inclusive centrais de chamada', ...getCtn('33.01') },

  // ─── 21 – Registros Públicos, Cartorários e Notariais ──────────────────────
  '6912500': { item: '21.01', descricao: 'Serviços de registros públicos, cartorários e notariais.', cnaeDescricao: 'Cartórios', ...getCtn('21.01') },

  // ─── 23 – Programação Visual, Design, Desenho Industrial ───────────────────
  '7410299': { item: '23.01', descricao: 'Programação visual, comunicação visual e congêneres.', cnaeDescricao: 'Atividades de design não especificadas anteriormente', ...getCtn('23.01') },

  // ─── 25 – Serviços Funerários ──────────────────────────────────────────────
  '9603301': { item: '25.01', descricao: 'Funerais, inclusive fornecimento de caixão, urna ou esquife; aluguel de capela; transporte do corpo cadavérico; fornecimento de flores, coroas e outros paramentos; desembaraço de certidão de óbito; fornecimento de véu, essa e outros adornos; embalsamento, embelezamento, conservação ou restauração de cadáveres.', cnaeDescricao: 'Gestão e manutenção de cemitérios', ...getCtn('25.01') },
  '9603302': { item: '25.01', descricao: 'Funerais.', cnaeDescricao: 'Serviços de cremação', ...getCtn('25.01') },
  '9603303': { item: '25.01', descricao: 'Funerais.', cnaeDescricao: 'Serviços de sepultamento', ...getCtn('25.01') },
  '9603304': { item: '25.02', descricao: 'Cremação de corpos e partes de corpos cadavéricos.', cnaeDescricao: 'Serviços de funerárias', ...getCtn('25.02') },
  '9603305': { item: '25.01', descricao: 'Funerais.', cnaeDescricao: 'Serviços de somatoconservação', ...getCtn('25.01') },
  '9603399': { item: '25.01', descricao: 'Funerais.', cnaeDescricao: 'Atividades funerárias e serviços relacionados não especificados anteriormente', ...getCtn('25.01') },

  // ─── 28 – Avaliação de Bens e Serviços ──────────────────────────────────────
  '7490199': { item: '28.01', descricao: 'Serviços de avaliação de bens e serviços de qualquer natureza.', cnaeDescricao: 'Outras atividades profissionais, científicas e técnicas não especificadas anteriormente', ...getCtn('28.01') },

  // ─── 30 – Biologia, Biotecnologia e Química ────────────────────────────────
  '7110701': { item: '30.01', descricao: 'Serviços de biologia, biotecnologia e química.', cnaeDescricao: 'Atividades técnicas relacionadas à engenharia e arquitetura — serviços de desenho técnico', ...getCtn('30.01') },
  '7120000': { item: '30.01', descricao: 'Serviços de biologia, biotecnologia e química.', cnaeDescricao: 'Testes e análises técnicas', ...getCtn('30.01') },
  '7110703': { item: '30.01', descricao: 'Serviços de biologia, biotecnologia e química.', cnaeDescricao: 'Serviços de desenho técnico relacionados à arquitetura e engenharia — biologia', ...getCtn('30.01') },

  // ─── 31 – Serviços Técnicos em Edificações, Eletrônica, Mecânica ───────────
  '7110702': { item: '31.01', descricao: 'Serviços técnicos em edificações, eletrônica, eletrotécnica, mecânica, telecomunicações e congêneres.', cnaeDescricao: 'Atividades de estudos geológicos', ...getCtn('31.01') },

  // ─── 33 – Desembaraço Aduaneiro, Despachantes ──────────────────────────────
  '5229002': { item: '33.01', descricao: 'Serviços de desembaraço aduaneiro, comissários, despachantes e congêneres.', cnaeDescricao: 'Serviços de apoio ao transporte — organização logística', ...getCtn('33.01') },

  // ─── 35 – Reportagem, Jornalismo ────────────────────────────────────────────
  '6391701': { item: '35.01', descricao: 'Serviços de reportagem, assessoria de imprensa, jornalismo e relações públicas.', cnaeDescricao: 'Agências de notícias', ...getCtn('35.01') },
  '7410204': { item: '35.01', descricao: 'Serviços de reportagem, assessoria de imprensa, jornalismo e relações públicas.', cnaeDescricao: 'Design gráfico', ...getCtn('35.01') },

  // ─── 37 – Artistas, Atletas, Modelos ────────────────────────────────────────
  '9003500': { item: '37.01', descricao: 'Serviços de artistas, atletas, modelos e manequins.', cnaeDescricao: 'Gestão de espaços para artes cênicas, espetáculos e outras atividades artísticas', ...getCtn('37.01') },
  '7490106': { item: '37.01', descricao: 'Serviços de artistas, atletas, modelos e manequins.', cnaeDescricao: 'Serviços de avaliação de riscos e gerenciamento de seguros', ...getCtn('37.01') },
};

export interface CNAEEntry {
  codigo: string;
  /** Descrição oficial do CNAE conforme IBGE */
  descricao: string;
  /** Descrição da LC 116 (serviço tributável) */
  descricaoLC116: string;
  lc116: LC116Item;
}

/** Lista de todos os CNAEs mapeados com seus dados LC 116 */
export const CNAE_LIST: CNAEEntry[] = Object.entries(CNAE_LC116_MAP).map(([codigo, lc]) => ({
  codigo,
  descricao: lc.cnaeDescricao || lc.descricao,
  descricaoLC116: lc.descricao,
  lc116: lc,
}));

/**
 * Retorna o item da LC 116/2003 correspondente ao código CNAE informado.
 * Remove pontuação do código antes de buscar.
 */
export function getLC116Item(codigoCnae: string | number): LC116Item | null {
  const cleaned = String(codigoCnae).replace(/\D/g, '');
  return CNAE_LC116_MAP[cleaned] ?? null;
}

export function formatCNAECode(codigo: string): string {
  const str = codigo.replace(/\D/g, '').padStart(7, '0');
  if (str.length >= 7) {
    return `${str.slice(0, 4)}-${str.slice(4, 5)}/${str.slice(5, 7)}`;
  }
  return str;
}

