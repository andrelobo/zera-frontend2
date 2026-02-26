/**
 * Tabela completa do Código de Tributação Nacional (CTN)
 * Fonte: CodTribNac.xlsx — Portal Nacional de NFS-e (ABRASF/SPED)
 * Formato: IISSDD (Item, Subitem, Desdobro Nacional)
 * 
 * Inclui apenas os registros com código de 6 dígitos (nível desdobro).
 * Registros sem código são cabeçalhos de grupo/subitem.
 */

export interface CTNEntry {
  codigo: string;   // 6 dígitos — ex: "010101"
  item: string;     // ex: "01"
  subitem: string;  // ex: "01"
  desdobro: string; // ex: "01"
  descricao: string;
  /** Label formatado: "II.SS" — ex: "1.01" */
  itemFormatado: string;
  /** NBS principal — Nomenclatura Brasileira de Serviços (fonte: AnexoVIII gov.br) */
  nbs?: string;
}

/**
 * NBS principal por item LC 116 — Fonte: AnexoVIII-CorrelacaoItemNBSIndOpCClassTrib_IBSCBS_V1.00.00
 * Portal Nacional NFS-e (gov.br) — atualizado 27/10/2025
 */
const NBS_BY_ITEM: Record<string, string> = {
  '01': '1.1502.10.00', '02': '1.1201.11.00', '03': '1.1103.33.00',
  '04': '1.2301.22.00', '05': '1.1405.12.00', '06': '1.2602.10.00',
  '07': '1.1402.11.00', '08': '1.2201.11.00', '09': '1.0303.11.00',
  '10': '1.0906.11.00', '11': '1.0604.30.00', '12': '1.2502.20.00',
  '13': '1.2501.11.00', '14': '1.2001.10.00', '15': '1.0901.40.00',
  '16': '1.0401.11.19', '17': '1.1401.11.00', '18': '1.0906.20.00',
  '19': '1.0905.11.00', '20': '1.0605.10.00', '21': '1.1304.00.00',
  '22': '1.0604.21.00', '23': '1.1409.21.00', '24': '1.2606.00.00',
  '25': '1.2603.00.00', '26': '1.0701.00.00', '27': '1.2304.11.00',
  '28': '1.1404.14.00', '29': '1.1705.10.00', '30': '1.1415.00.00',
  '31': '1.1415.00.00', '32': '1.1409.90.00', '33': '1.0204.00.00',
  '34': '1.1802.10.00', '35': '1.1401.31.00', '36': '1.1404.30.00',
  '37': '1.1806.81.00', '38': '1.2504.11.00', '39': '1.2002.20.00',
  '40': '1.1109.90.00',
};

function fmt(item: string, subitem: string): string {
  return `${parseInt(item, 10)}.${subitem}`;
}

function e(codigo: string, item: string, subitem: string, desdobro: string, descricao: string): CTNEntry {
  const nbs = NBS_BY_ITEM[item];
  return { codigo, item, subitem, desdobro, descricao, itemFormatado: fmt(item, subitem), ...(nbs ? { nbs } : {}) };
}

export const CTN_DATA: CTNEntry[] = [
  // ─── 01 — Serviços de Informática e congêneres ──────────────────────────
  e('010101','01','01','01','Análise e desenvolvimento de sistemas.'),
  e('010201','01','02','01','Programação.'),
  e('010301','01','03','01','Processamento de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.'),
  e('010302','01','03','02','Armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.'),
  e('010401','01','04','01','Elaboração de programas de computadores, inclusive de jogos eletrônicos, independentemente da arquitetura construtiva da máquina em que o programa será executado, incluindo tablets, smartphones e congêneres.'),
  e('010501','01','05','01','Licenciamento ou cessão de direito de uso de programas de computação.'),
  e('010601','01','06','01','Assessoria e consultoria em informática.'),
  e('010701','01','07','01','Suporte técnico em informática, inclusive instalação, configuração e manutenção de programas de computação e bancos de dados.'),
  e('010801','01','08','01','Planejamento, confecção, manutenção e atualização de páginas eletrônicas.'),
  e('010901','01','09','01','Disponibilização, sem cessão definitiva, de conteúdos de áudio por meio da internet.'),
  e('010902','01','09','02','Disponibilização, sem cessão definitiva, de conteúdos de vídeo, imagem e texto por meio da internet, respeitada a imunidade de livros, jornais e periódicos.'),

  // ─── 02 — Pesquisas e desenvolvimento ───────────────────────────────────
  e('020101','02','01','01','Serviços de pesquisas e desenvolvimento de qualquer natureza.'),

  // ─── 03 — Locação, cessão de direito de uso e congêneres ───────────────
  e('030201','03','02','01','Cessão de direito de uso de marcas e de sinais de propaganda.'),
  e('030301','03','03','01','Exploração de salões de festas, centro de convenções, stands e congêneres, para realização de eventos ou negócios de qualquer natureza.'),
  e('030302','03','03','02','Exploração de escritórios virtuais e congêneres, para realização de eventos ou negócios de qualquer natureza.'),
  e('030303','03','03','03','Exploração de quadras esportivas, estádios, ginásios, canchas e congêneres, para realização de eventos ou negócios de qualquer natureza.'),
  e('030304','03','03','04','Exploração de auditórios, casas de espetáculos e congêneres, para realização de eventos ou negócios de qualquer natureza.'),
  e('030305','03','03','05','Exploração de parques de diversões e congêneres, para realização de eventos ou negócios de qualquer natureza.'),
  e('030401','03','04','01','Locação, sublocação, arrendamento, direito de passagem ou permissão de uso, compartilhado ou não, de ferrovia.'),
  e('030402','03','04','02','Locação, sublocação, arrendamento, direito de passagem ou permissão de uso, compartilhado ou não, de rodovia.'),
  e('030403','03','04','03','Locação, sublocação, arrendamento, direito de passagem ou permissão de uso, compartilhado ou não, de postes, cabos, dutos e condutos de qualquer natureza.'),
  e('030501','03','05','01','Cessão de andaimes, palcos, coberturas e outras estruturas de uso temporário.'),

  // ─── 04 — Saúde, assistência médica e congêneres ───────────────────────
  e('040101','04','01','01','Medicina.'),
  e('040102','04','01','02','Biomedicina.'),
  e('040201','04','02','01','Análises clínicas e congêneres.'),
  e('040202','04','02','02','Patologia e congêneres.'),
  e('040203','04','02','03','Eletricidade médica e congêneres.'),
  e('040204','04','02','04','Radioterapia, quimioterapia e congêneres.'),
  e('040205','04','02','05','Ultra-sonografia, ressonância magnética, radiologia, tomografia e congêneres.'),
  e('040301','04','03','01','Hospitais e congêneres.'),
  e('040302','04','03','02','Laboratórios e congêneres.'),
  e('040303','04','03','03','Clínicas, sanatórios, manicômios, casas de saúde, prontos-socorros, ambulatórios e congêneres.'),
  e('040401','04','04','01','Instrumentação cirúrgica.'),
  e('040501','04','05','01','Acupuntura.'),
  e('040601','04','06','01','Enfermagem, inclusive serviços auxiliares.'),
  e('040701','04','07','01','Serviços farmacêuticos.'),
  e('040801','04','08','01','Terapia ocupacional.'),
  e('040802','04','08','02','Fisioterapia.'),
  e('040803','04','08','03','Fonoaudiologia.'),
  e('040901','04','09','01','Terapias de qualquer espécie destinadas ao tratamento físico, orgânico e mental.'),
  e('041001','04','10','01','Nutrição.'),
  e('041101','04','11','01','Obstetrícia.'),
  e('041201','04','12','01','Odontologia.'),
  e('041301','04','13','01','Ortóptica.'),
  e('041401','04','14','01','Próteses sob encomenda.'),
  e('041501','04','15','01','Psicanálise.'),
  e('041601','04','16','01','Psicologia.'),
  e('041701','04','17','01','Casas de repouso e congêneres.'),
  e('041702','04','17','02','Casas de recuperação e congêneres.'),
  e('041703','04','17','03','Creches e congêneres.'),
  e('041704','04','17','04','Asilos e congêneres.'),
  e('041801','04','18','01','Inseminação artificial, fertilização in vitro e congêneres.'),
  e('041901','04','19','01','Bancos de sangue, leite, pele, olhos, óvulos, sêmen e congêneres.'),
  e('042001','04','20','01','Coleta de sangue, leite, tecidos, sêmen, órgãos e materiais biológicos de qualquer espécie.'),
  e('042101','04','21','01','Unidade de atendimento, assistência ou tratamento móvel e congêneres.'),
  e('042201','04','22','01','Planos de medicina de grupo ou individual e convênios para prestação de assistência médica, hospitalar, odontológica e congêneres.'),
  e('042301','04','23','01','Outros planos de saúde que se cumpram através de serviços de terceiros contratados, credenciados, cooperados ou apenas pagos pelo operador do plano mediante indicação do beneficiário.'),

  // ─── 05 — Medicina e assistência veterinária ───────────────────────────
  e('050101','05','01','01','Medicina veterinária.'),
  e('050102','05','01','02','Zootecnia.'),
  e('050201','05','02','01','Hospitais e congêneres, na área veterinária.'),
  e('050202','05','02','02','Clínicas, ambulatórios, prontos-socorros e congêneres, na área veterinária.'),
  e('050301','05','03','01','Laboratórios de análise na área veterinária.'),
  e('050401','05','04','01','Inseminação artificial, fertilização in vitro e congêneres.'),
  e('050501','05','05','01','Bancos de sangue e de órgãos e congêneres.'),
  e('050601','05','06','01','Coleta de sangue, leite, tecidos, sêmen, órgãos e materiais biológicos de qualquer espécie.'),
  e('050701','05','07','01','Unidade de atendimento, assistência ou tratamento móvel e congêneres.'),
  e('050801','05','08','01','Guarda, tratamento, amestramento, embelezamento, alojamento e congêneres.'),
  e('050901','05','09','01','Planos de atendimento e assistência médico-veterinária.'),

  // ─── 06 — Cuidados pessoais, estética, atividades físicas ─────────────
  e('060101','06','01','01','Barbearia, cabeleireiros, manicuros, pedicuros e congêneres.'),
  e('060201','06','02','01','Esteticistas, tratamento de pele, depilação e congêneres.'),
  e('060301','06','03','01','Banhos, duchas, sauna, massagens e congêneres.'),
  e('060401','06','04','01','Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.'),
  e('060501','06','05','01','Centros de emagrecimento, spa e congêneres.'),
  e('060601','06','06','01','Aplicação de tatuagens, piercings e congêneres.'),

  // ─── 07 — Engenharia, arquitetura, construção civil ────────────────────
  e('070101','07','01','01','Engenharia e congêneres.'),
  e('070102','07','01','02','Agronomia e congêneres.'),
  e('070103','07','01','03','Agrimensura e congêneres.'),
  e('070104','07','01','04','Arquitetura, urbanismo e congêneres.'),
  e('070105','07','01','05','Geologia e congêneres.'),
  e('070106','07','01','06','Paisagismo e congêneres.'),
  e('070201','07','02','01','Execução, por administração, de obras de construção civil, hidráulica ou elétrica e de outras obras semelhantes.'),
  e('070202','07','02','02','Execução, por empreitada ou subempreitada, de obras de construção civil, hidráulica ou elétrica e de outras obras semelhantes.'),
  e('070301','07','03','01','Elaboração de planos diretores, estudos de viabilidade, estudos organizacionais e outros, relacionados com obras e serviços de engenharia.'),
  e('070302','07','03','02','Elaboração de anteprojetos, projetos básicos e projetos executivos para trabalhos de engenharia.'),
  e('070401','07','04','01','Demolição.'),
  e('070501','07','05','01','Reparação, conservação e reforma de edifícios e congêneres.'),
  e('070502','07','05','02','Reparação, conservação e reforma de estradas, pontes, portos e congêneres.'),
  e('070601','07','06','01','Colocação e instalação de tapetes, carpetes, cortinas e congêneres, com material fornecido pelo tomador do serviço.'),
  e('070602','07','06','02','Colocação e instalação de assoalhos, revestimentos de parede, vidros, divisórias, placas de gesso e congêneres, com material fornecido pelo tomador do serviço.'),
  e('070701','07','07','01','Recuperação, raspagem, polimento e lustração de pisos e congêneres.'),
  e('070801','07','08','01','Calafetação.'),
  e('070901','07','09','01','Varrição, coleta e remoção de lixo, rejeitos e outros resíduos quaisquer.'),
  e('070902','07','09','02','Incineração, tratamento, reciclagem, separação e destinação final de lixo, rejeitos e outros resíduos quaisquer.'),
  e('071001','07','10','01','Limpeza, manutenção e conservação de vias e logradouros públicos, parques, jardins e congêneres.'),
  e('071002','07','10','02','Limpeza, manutenção e conservação de imóveis, chaminés, piscinas e congêneres.'),
  e('071101','07','11','01','Decoração.'),
  e('071102','07','11','02','Jardinagem, inclusive corte e poda de árvores.'),
  e('071201','07','12','01','Controle e tratamento de efluentes de qualquer natureza e de agentes físicos, químicos e biológicos.'),
  e('071301','07','13','01','Dedetização, desinfecção, desinsetização, imunização, higienização, desratização, pulverização e congêneres.'),
  e('071601','07','16','01','Florestamento, reflorestamento, semeadura, adubação, reparação de solo, plantio, silagem, colheita, corte e descascamento de árvores, silvicultura, exploração florestal e congêneres.'),
  e('071701','07','17','01','Escoramento, contenção de encostas e serviços congêneres.'),
  e('071801','07','18','01','Limpeza e dragagem de rios, portos, canais, baías, lagos, lagoas, represas, açudes e congêneres.'),
  e('071901','07','19','01','Acompanhamento e fiscalização da execução de obras de engenharia, arquitetura e urbanismo.'),
  e('072001','07','20','01','Aerofotogrametria (inclusive interpretação), cartografia, mapeamento e congêneres.'),
  e('072002','07','20','02','Levantamentos batimétricos, geográficos, geodésicos, geológicos, geofísicos e congêneres.'),
  e('072003','07','20','03','Levantamentos topográficos e congêneres.'),
  e('072101','07','21','01','Pesquisa, perfuração, cimentação, mergulho, perfilagem, concretação, testemunhagem, pescaria, estimulação e outros serviços relacionados com a exploração e explotação de petróleo, gás natural e de outros recursos minerais.'),
  e('072201','07','22','01','Nucleação e bombardeamento de nuvens e congêneres.'),

  // ─── 08 — Educação, ensino, instrução ──────────────────────────────────
  e('080101','08','01','01','Ensino regular pré-escolar, fundamental e médio.'),
  e('080102','08','01','02','Ensino regular superior.'),
  e('080201','08','02','01','Instrução, treinamento, orientação pedagógica e educacional, avaliação de conhecimentos de qualquer natureza.'),

  // ─── 09 — Hospedagem, turismo, viagens ─────────────────────────────────
  e('090101','09','01','01','Hospedagem em hotéis, hotelaria marítima e congêneres.'),
  e('090102','09','01','02','Hospedagem em pensões, albergues, pousadas, hospedarias, ocupação por temporada com fornecimento de serviços e congêneres.'),
  e('090103','09','01','03','Hospedagem em motéis e congêneres.'),
  e('090104','09','01','04','Hospedagem em apart-service condominiais, flat, apart-hotéis, hotéis residência, residence-service, suite service e congêneres.'),
  e('090201','09','02','01','Agenciamento e intermediação de programas de turismo, passeios, viagens, excursões, hospedagens e congêneres.'),
  e('090202','09','02','02','Organização, promoção e execução de programas de turismo, passeios, viagens, excursões, hospedagens e congêneres.'),
  e('090301','09','03','01','Guias de turismo.'),

  // ─── 10 — Intermediação e congêneres ───────────────────────────────────
  e('100101','10','01','01','Agenciamento, corretagem ou intermediação de câmbio.'),
  e('100102','10','01','02','Agenciamento, corretagem ou intermediação de seguros.'),
  e('100103','10','01','03','Agenciamento, corretagem ou intermediação de cartões de crédito.'),
  e('100104','10','01','04','Agenciamento, corretagem ou intermediação de planos de saúde.'),
  e('100105','10','01','05','Agenciamento, corretagem ou intermediação de planos de previdência privada.'),
  e('100201','10','02','01','Agenciamento, corretagem ou intermediação de títulos em geral e valores mobiliários.'),
  e('100202','10','02','02','Agenciamento, corretagem ou intermediação de contratos quaisquer.'),
  e('100301','10','03','01','Agenciamento, corretagem ou intermediação de direitos de propriedade industrial, artística ou literária.'),
  e('100401','10','04','01','Agenciamento, corretagem ou intermediação de contratos de arrendamento mercantil (leasing).'),
  e('100402','10','04','02','Agenciamento, corretagem ou intermediação de contratos de franquia (franchising).'),
  e('100403','10','04','03','Agenciamento, corretagem ou intermediação de faturização (factoring).'),
  e('100501','10','05','01','Agenciamento, corretagem ou intermediação de bens móveis ou imóveis, não abrangidos em outros itens ou subitens, por quaisquer meios.'),
  e('100502','10','05','02','Agenciamento, corretagem ou intermediação de bens móveis ou imóveis realizados no âmbito de Bolsas de Mercadorias e Futuros, por quaisquer meios.'),
  e('100601','10','06','01','Agenciamento marítimo.'),
  e('100701','10','07','01','Agenciamento de notícias.'),
  e('100801','10','08','01','Agenciamento de publicidade e propaganda, inclusive o agenciamento de veiculação por quaisquer meios.'),
  e('100901','10','09','01','Representação de qualquer natureza, inclusive comercial.'),
  e('101001','10','10','01','Distribuição de bens de terceiros.'),

  // ─── 11 — Guarda, estacionamento, vigilância ──────────────────────────
  e('110101','11','01','01','Guarda e estacionamento de veículos terrestres automotores.'),
  e('110102','11','01','02','Guarda e estacionamento de aeronaves e de embarcações.'),
  e('110201','11','02','01','Vigilância, segurança ou monitoramento de bens, pessoas e semoventes.'),
  e('110301','11','03','01','Escolta, inclusive de veículos e cargas.'),
  e('110401','11','04','01','Armazenamento, depósito, guarda de bens de qualquer espécie.'),
  e('110402','11','04','02','Carga, descarga, arrumação de bens de qualquer espécie.'),
  e('110501','11','05','01','Serviços relacionados ao monitoramento e rastreamento a distância, em qualquer via ou local, de veículos, cargas, pessoas e semoventes em circulação ou movimento.'),

  // ─── 12 — Diversões, lazer, entretenimento ────────────────────────────
  e('120101','12','01','01','Espetáculos teatrais.'),
  e('120201','12','02','01','Exibições cinematográficas.'),
  e('120301','12','03','01','Espetáculos circenses.'),
  e('120401','12','04','01','Programas de auditório.'),
  e('120501','12','05','01','Parques de diversões, centros de lazer e congêneres.'),
  e('120601','12','06','01','Boates, taxi-dancing e congêneres.'),
  e('120701','12','07','01','Shows, ballet, danças, desfiles, bailes, óperas, concertos, recitais, festivais e congêneres.'),
  e('120801','12','08','01','Feiras, exposições, congressos e congêneres.'),
  e('120901','12','09','01','Bilhares.'),
  e('120902','12','09','02','Boliches.'),
  e('120903','12','09','03','Diversões eletrônicas ou não.'),
  e('121001','12','10','01','Corridas e competições de animais.'),
  e('121101','12','11','01','Competições esportivas ou de destreza física ou intelectual, com ou sem a participação do espectador.'),
  e('121201','12','12','01','Execução de música.'),
  e('121301','12','13','01','Produção, mediante ou sem encomenda prévia, de eventos, espetáculos, entrevistas, shows, ballet, danças, desfiles, bailes, teatros, óperas, concertos, recitais, festivais e congêneres.'),
  e('121401','12','14','01','Fornecimento de música para ambientes fechados ou não, mediante transmissão por qualquer processo.'),
  e('121501','12','15','01','Desfiles de blocos carnavalescos ou folclóricos, trios elétricos e congêneres.'),
  e('121601','12','16','01','Exibição de filmes, entrevistas, musicais, espetáculos, shows, concertos, desfiles, óperas, competições esportivas, de destreza intelectual ou congêneres.'),
  e('121701','12','17','01','Recreação e animação, inclusive em festas e eventos de qualquer natureza.'),

  // ─── 13 — Fonografia, fotografia, cinematografia ──────────────────────
  e('130201','13','02','01','Fonografia ou gravação de sons, inclusive trucagem, dublagem, mixagem e congêneres.'),
  e('130301','13','03','01','Fotografia e cinematografia, inclusive revelação, ampliação, cópia, reprodução, trucagem e congêneres.'),
  e('130401','13','04','01','Reprografia, microfilmagem e digitalização.'),
  e('130501','13','05','01','Composição gráfica, inclusive confecção de impressos gráficos, fotocomposição, clicheria, zincografia, litografia e fotolitografia.'),

  // ─── 14 — Serviços relativos a bens de terceiros ──────────────────────
  e('140101','14','01','01','Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas, veículos, aparelhos, equipamentos, motores, elevadores ou de qualquer objeto.'),
  e('140201','14','02','01','Assistência técnica.'),
  e('140301','14','03','01','Recondicionamento de motores.'),
  e('140401','14','04','01','Recauchutagem ou regeneração de pneus.'),
  e('140501','14','05','01','Restauração, recondicionamento, acondicionamento, pintura, beneficiamento, lavagem, secagem, tingimento, galvanoplastia, anodização, corte, recorte, plastificação, costura, acabamento, polimento e congêneres de objetos quaisquer.'),
  e('140601','14','06','01','Instalação e montagem de aparelhos, máquinas e equipamentos, inclusive montagem industrial, prestados ao usuário final, exclusivamente com material por ele fornecido.'),
  e('140701','14','07','01','Colocação de molduras e congêneres.'),
  e('140801','14','08','01','Encadernação, gravação e douração de livros, revistas e congêneres.'),
  e('140901','14','09','01','Alfaiataria e costura, quando o material for fornecido pelo usuário final, exceto aviamento.'),
  e('141001','14','10','01','Tinturaria e lavanderia.'),
  e('141101','14','11','01','Tapeçaria e reforma de estofamentos em geral.'),
  e('141201','14','12','01','Funilaria e lanternagem.'),
  e('141301','14','13','01','Carpintaria.'),
  e('141302','14','13','02','Serralheria.'),
  e('141401','14','14','01','Guincho intramunicipal.'),
  e('141402','14','14','02','Guindaste e içamento.'),
  e('141403','14','14','03','Guincho intramunicipal em construção civil.'),
  e('141404','14','14','04','Guindaste e içamento em construção civil.'),

  // ─── 15 — Setor bancário ou financeiro ─────────────────────────────────
  e('150101','15','01','01','Administração de fundos quaisquer e congêneres.'),
  e('150102','15','01','02','Administração de consórcio e congêneres.'),
  e('150103','15','01','03','Administração de cartão de crédito ou débito e congêneres.'),
  e('150104','15','01','04','Administração de carteira de clientes e congêneres.'),
  e('150105','15','01','05','Administração de cheques pré-datados e congêneres.'),
  e('150201','15','02','01','Abertura de conta-corrente no País.'),
  e('150202','15','02','02','Abertura de conta-corrente no exterior.'),
  e('150203','15','02','03','Abertura de conta de investimentos e aplicação no País.'),
  e('150204','15','02','04','Abertura de conta de investimentos e aplicação no exterior.'),
  e('150205','15','02','05','Abertura de caderneta de poupança no País.'),
  e('150206','15','02','06','Abertura de caderneta de poupança no exterior.'),
  e('150207','15','02','07','Abertura de contas em geral no País, não abrangida em outro subitem.'),
  e('150208','15','02','08','Abertura de contas em geral no exterior, não abrangida em outro subitem.'),
  e('150301','15','03','01','Locação de cofres particulares.'),
  e('150302','15','03','02','Manutenção de cofres particulares.'),
  e('150303','15','03','03','Locação de terminais eletrônicos.'),
  e('150304','15','03','04','Manutenção de terminais eletrônicos.'),
  e('150305','15','03','05','Locação de terminais de atendimento.'),
  e('150306','15','03','06','Manutenção de terminais de atendimento.'),
  e('150307','15','03','07','Locação de bens e equipamentos em geral.'),
  e('150308','15','03','08','Manutenção de bens e equipamentos em geral.'),
  e('150401','15','04','01','Fornecimento ou emissão de atestados em geral, inclusive atestado de idoneidade, atestado de capacidade financeira e congêneres.'),
  e('150501','15','05','01','Cadastro, elaboração de ficha cadastral, renovação cadastral e congêneres.'),
  e('150502','15','05','02','Inclusão no Cadastro de Emitentes de Cheques sem Fundos - CCF.'),
  e('150503','15','05','03','Exclusão no Cadastro de Emitentes de Cheques sem Fundos - CCF.'),
  e('150504','15','05','04','Inclusão em quaisquer outros bancos cadastrais.'),
  e('150505','15','05','05','Exclusão em quaisquer outros bancos cadastrais.'),
  e('150601','15','06','01','Emissão, reemissão e fornecimento de avisos, comprovantes e documentos em geral.'),
  e('150602','15','06','02','Abono de firmas.'),
  e('150603','15','06','03','Coleta e entrega de documentos, bens e valores.'),
  e('150604','15','06','04','Comunicação com outra agência ou com a administração central.'),
  e('150605','15','06','05','Licenciamento eletrônico de veículos.'),
  e('150606','15','06','06','Transferência de veículos.'),
  e('150607','15','06','07','Agenciamento fiduciário ou depositário.'),
  e('150608','15','06','08','Devolução de bens em custódia.'),
  e('150701','15','07','01','Acesso, movimentação, atendimento e consulta a contas em geral, por qualquer meio ou processo.'),
  e('150702','15','07','02','Acesso a terminais de atendimento, inclusive vinte e quatro horas.'),
  e('150703','15','07','03','Acesso a outro banco e à rede compartilhada.'),
  e('150704','15','07','04','Fornecimento de saldo, extrato e demais informações relativas a contas em geral, por qualquer meio ou processo.'),
  e('150801','15','08','01','Emissão, reemissão, alteração, cessão, substituição, cancelamento e registro de contrato de crédito.'),
  e('150802','15','08','02','Estudo, análise e avaliação de operações de crédito.'),
  e('150803','15','08','03','Emissão, concessão, alteração ou contratação de aval, fiança, anuência e congêneres.'),
  e('150804','15','08','04','Serviços relativos à abertura de crédito, para quaisquer fins.'),
  e('150901','15','09','01','Arrendamento mercantil (leasing) de quaisquer bens.'),
  e('151001','15','10','01','Serviços relacionados a cobranças em geral.'),
  e('151002','15','10','02','Serviços relacionados a recebimentos em geral.'),
  e('151003','15','10','03','Serviços relacionados a pagamentos em geral.'),
  e('151004','15','10','04','Serviços relacionados a fornecimento de posição de cobrança, recebimento ou pagamento.'),
  e('151005','15','10','05','Serviços relacionados a emissão de carnês, fichas de compensação, impressos e documentos em geral.'),
  e('151101','15','11','01','Devolução de títulos, protesto de títulos, sustação de protesto, manutenção de títulos, reapresentação de títulos, e demais serviços a eles relacionados.'),
  e('151201','15','12','01','Custódia em geral, inclusive de títulos e valores mobiliários.'),
  e('151301','15','13','01','Serviços relacionados a operações de câmbio em geral.'),
  e('151302','15','13','02','Serviços relacionados a emissão de registro de exportação ou de crédito.'),
  e('151303','15','13','03','Serviços relacionados a cobrança ou depósito no exterior.'),
  e('151304','15','13','04','Serviços relacionados a emissão, fornecimento e cancelamento de cheques de viagem.'),
  e('151305','15','13','05','Serviços relacionados a fornecimento, transferência, cancelamento e demais serviços relativos a carta de crédito de importação, exportação e garantias recebidas.'),
  e('151306','15','13','06','Serviços relacionados a envio e recebimento de mensagens em geral relacionadas a operações de câmbio.'),
  e('151401','15','14','01','Fornecimento, emissão, reemissão de cartão magnético, cartão de crédito, cartão de débito, cartão salário e congêneres.'),
  e('151402','15','14','02','Renovação de cartão magnético, cartão de crédito, cartão de débito, cartão salário e congêneres.'),
  e('151403','15','14','03','Manutenção de cartão magnético, cartão de crédito, cartão de débito, cartão salário e congêneres.'),
  e('151501','15','15','01','Compensação de cheques e títulos quaisquer.'),
  e('151502','15','15','02','Serviços relacionados a depósito, inclusive depósito identificado, a saque de contas quaisquer, por qualquer meio ou processo.'),
  e('151601','15','16','01','Emissão, reemissão, liquidação, alteração, cancelamento e baixa de ordens de pagamento, ordens de crédito e similares, por qualquer meio ou processo.'),
  e('151602','15','16','02','Serviços relacionados à transferência de valores, dados, fundos, pagamentos e similares, inclusive entre contas em geral.'),
  e('151701','15','17','01','Emissão e fornecimento de cheques quaisquer, avulso ou por talão.'),
  e('151702','15','17','02','Devolução de cheques quaisquer, avulso ou por talão.'),
  e('151703','15','17','03','Sustação, cancelamento e oposição de cheques quaisquer, avulso ou por talão.'),
  e('151801','15','18','01','Serviços relacionados a crédito imobiliário, de avaliação e vistoria de imóvel ou obra.'),
  e('151802','15','18','02','Serviços relacionados a crédito imobiliário, de análise técnica e jurídica.'),
  e('151803','15','18','03','Serviços relacionados a crédito imobiliário, de emissão, reemissão, alteração, transferência e renegociação de contrato.'),
  e('151804','15','18','04','Serviços relacionados a crédito imobiliário, de emissão e reemissão do termo de quitação.'),
  e('151805','15','18','05','Demais serviços relacionados a crédito imobiliário.'),

  // ─── 16 — Transporte de natureza municipal ─────────────────────────────
  e('160101','16','01','01','Serviços de transporte coletivo municipal rodoviário de passageiros.'),
  e('160102','16','01','02','Serviços de transporte coletivo municipal metroviário de passageiros.'),
  e('160103','16','01','03','Serviços de transporte coletivo municipal ferroviário de passageiros.'),
  e('160104','16','01','04','Serviços de transporte coletivo municipal aquaviário de passageiros.'),
  e('160201','16','02','01','Outros serviços de transporte de natureza municipal.'),

  // ─── 17 — Apoio técnico, administrativo, jurídico, contábil ────────────
  e('170101','17','01','01','Assessoria ou consultoria de qualquer natureza, não contida em outros itens desta lista.'),
  e('170102','17','01','02','Análise, exame, pesquisa, coleta, compilação e fornecimento de dados e informações de qualquer natureza, inclusive cadastro e similares.'),
  e('170201','17','02','01','Datilografia, digitação, estenografia e congêneres.'),
  e('170202','17','02','02','Expediente, secretaria em geral, apoio e infra-estrutura administrativa e congêneres.'),
  e('170203','17','02','03','Resposta audível e congêneres.'),
  e('170204','17','02','04','Redação, edição, revisão e congêneres.'),
  e('170205','17','02','05','Interpretação, tradução e congêneres.'),
  e('170301','17','03','01','Planejamento, coordenação, programação ou organização técnica.'),
  e('170302','17','03','02','Planejamento, coordenação, programação ou organização financeira.'),
  e('170303','17','03','03','Planejamento, coordenação, programação ou organização administrativa.'),
  e('170401','17','04','01','Recrutamento, agenciamento, seleção e colocação de mão-de-obra.'),
  e('170501','17','05','01','Fornecimento de mão-de-obra, mesmo em caráter temporário, inclusive de empregados ou trabalhadores, avulsos ou temporários, contratados pelo prestador de serviço.'),
  e('170601','17','06','01','Propaganda e publicidade, inclusive promoção de vendas, planejamento de campanhas ou sistemas de publicidade, elaboração de desenhos, textos e demais materiais publicitários.'),
  e('170801','17','08','01','Franquia (franchising).'),
  e('170901','17','09','01','Perícias, laudos, exames técnicos e análises técnicas.'),
  e('171001','17','10','01','Planejamento, organização e administração de feiras, exposições e congêneres.'),
  e('171002','17','10','02','Planejamento, organização e administração de congressos e congêneres.'),
  e('171101','17','11','01','Organização de festas e recepções.'),
  e('171102','17','11','02','Bufê (exceto o fornecimento de alimentação e bebidas, que fica sujeito ao ICMS).'),
  e('171201','17','12','01','Administração em geral, inclusive de bens e negócios de terceiros.'),
  e('171301','17','13','01','Leilão e congêneres.'),
  e('171401','17','14','01','Advocacia.'),
  e('171501','17','15','01','Arbitragem de qualquer espécie, inclusive jurídica.'),
  e('171601','17','16','01','Auditoria.'),
  e('171701','17','17','01','Análise de Organização e Métodos.'),
  e('171801','17','18','01','Atuária e cálculos técnicos de qualquer natureza.'),
  e('171901','17','19','01','Contabilidade, inclusive serviços técnicos e auxiliares.'),
  e('172001','17','20','01','Consultoria e assessoria econômica ou financeira.'),
  e('172101','17','21','01','Estatística.'),
  e('172201','17','22','01','Cobrança em geral.'),
  e('172301','17','23','01','Assessoria, análise, avaliação, atendimento, consulta, cadastro, seleção, gerenciamento de informações, administração de contas a receber ou a pagar e em geral, relacionados a operações de faturização (factoring).'),
  e('172401','17','24','01','Apresentação de palestras, conferências, seminários e congêneres.'),
  e('172501','17','25','01','Inserção de textos, desenhos e outros materiais de propaganda e publicidade, em qualquer meio.'),

  // ─── 18 — Regulação de sinistros, seguros ──────────────────────────────
  e('180101','18','01','01','Serviços de regulação de sinistros vinculados a contratos de seguros e congêneres.'),
  e('180102','18','01','02','Serviços de inspeção e avaliação de riscos para cobertura de contratos de seguros e congêneres.'),
  e('180103','18','01','03','Serviços de prevenção e gerência de riscos seguráveis e congêneres.'),

  // ─── 19 — Loteria, bingos, apostas ─────────────────────────────────────
  e('190101','19','01','01','Serviços de distribuição e venda de bilhetes e demais produtos de loteria, cartões, pules ou cupons de apostas, sorteios, prêmios, inclusive os decorrentes de títulos de capitalização e congêneres.'),
  e('190102','19','01','02','Serviços de distribuição e venda de bingos e congêneres.'),

  // ─── 20 — Serviços portuários, aeroportuários, terminais ──────────────
  e('200101','20','01','01','Serviços portuários, ferroportuários (prestado em terra).'),
  e('200102','20','01','02','Serviços portuários, ferroportuários (prestado em águas marinhas).'),
  e('200201','20','02','01','Serviços aeroportuários, utilização de aeroporto, movimentação de passageiros, armazenagem de qualquer natureza, capatazia, movimentação de aeronaves, serviços de apoio aeroportuários e congêneres.'),
  e('200301','20','03','01','Serviços de terminais rodoviários, ferroviários, metroviários, movimentação de passageiros, mercadorias, inclusive suas operações, logística e congêneres.'),

  // ─── 21 — Registros públicos, cartorários, notariais ──────────────────
  e('210101','21','01','01','Serviços de registros públicos, cartorários e notariais.'),

  // ─── 22 — Exploração de rodovia ────────────────────────────────────────
  e('220101','22','01','01','Serviços de exploração de rodovia mediante cobrança de preço ou pedágio dos usuários.'),

  // ─── 23 — Programação e comunicação visual, desenho industrial ────────
  e('230101','23','01','01','Serviços de programação e comunicação visual e congêneres.'),
  e('230102','23','01','02','Serviços de desenho industrial e congêneres.'),

  // ─── 24 — Chaveiros, carimbos, placas ──────────────────────────────────
  e('240101','24','01','01','Serviços de chaveiros, confecção de carimbos e congêneres.'),
  e('240102','24','01','02','Serviços de placas, sinalização visual, banners, adesivos e congêneres.'),

  // ─── 25 — Serviços funerários ──────────────────────────────────────────
  e('250101','25','01','01','Funerais, inclusive fornecimento de caixão, urna ou esquifes; aluguel de capela; transporte do corpo cadavérico; fornecimento de flores, coroas e outros paramentos; desembaraço de certidão de óbito.'),
  e('250201','25','02','01','Translado intramunicipal de corpos e partes de corpos cadavéricos.'),
  e('250202','25','02','02','Cremação de corpos e partes de corpos cadavéricos.'),
  e('250301','25','03','01','Planos ou convênio funerários.'),
  e('250401','25','04','01','Manutenção e conservação de jazigos e cemitérios.'),
  e('250501','25','05','01','Cessão de uso de espaços em cemitérios para sepultamento.'),

  // ─── 26 — Coleta, remessa ou entrega de correspondências ──────────────
  e('260101','26','01','01','Serviços de coleta, remessa ou entrega de correspondências, documentos, objetos, bens ou valores, inclusive pelos correios e suas agências franqueadas.'),
  e('260102','26','01','02','Serviços de courrier e congêneres.'),

  // ─── 27 — Assistência social ───────────────────────────────────────────
  e('270101','27','01','01','Serviços de assistência social.'),

  // ─── 28 — Avaliação de bens e serviços ─────────────────────────────────
  e('280101','28','01','01','Serviços de avaliação de bens e serviços de qualquer natureza.'),

  // ─── 29 — Biblioteconomia ─────────────────────────────────────────────
  e('290101','29','01','01','Serviços de biblioteconomia.'),

  // ─── 30 — Biologia, biotecnologia e química ───────────────────────────
  e('300101','30','01','01','Serviços de biologia e biotecnologia.'),
  e('300102','30','01','02','Serviços de química.'),

  // ─── 31 — Serviços técnicos em edificações, eletrônica ────────────────
  e('310101','31','01','01','Serviços técnicos em edificações e congêneres.'),
  e('310102','31','01','02','Serviços técnicos em eletrônica, eletrotécnica e congêneres.'),
  e('310103','31','01','03','Serviços técnicos em mecânica e congêneres.'),
  e('310104','31','01','04','Serviços técnicos em telecomunicações e congêneres.'),

  // ─── 32 — Desenhos técnicos ────────────────────────────────────────────
  e('320101','32','01','01','Serviços de desenhos técnicos.'),

  // ─── 33 — Desembaraço aduaneiro, despachantes ─────────────────────────
  e('330101','33','01','01','Serviços de desembaraço aduaneiro, comissários, despachantes e congêneres.'),

  // ─── 34 — Investigação, detetives particulares ────────────────────────
  e('340101','34','01','01','Serviços de investigações particulares, detetives e congêneres.'),

  // ─── 35 — Reportagem, jornalismo ──────────────────────────────────────
  e('350101','35','01','01','Serviços de reportagem e jornalismo.'),
  e('350102','35','01','02','Serviços de assessoria de imprensa.'),
  e('350103','35','01','03','Serviços de relações públicas.'),

  // ─── 36 — Meteorologia ────────────────────────────────────────────────
  e('360101','36','01','01','Serviços de meteorologia.'),

  // ─── 37 — Artistas, atletas, modelos ──────────────────────────────────
  e('370101','37','01','01','Serviços de artistas, atletas, modelos e manequins.'),

  // ─── 38 — Museologia ──────────────────────────────────────────────────
  e('380101','38','01','01','Serviços de museologia.'),

  // ─── 39 — Ourivesaria e lapidação ─────────────────────────────────────
  e('390101','39','01','01','Serviços de ourivesaria e lapidação (quando o material for fornecido pelo tomador do serviço).'),

  // ─── 40 — Obras de arte sob encomenda ─────────────────────────────────
  e('400101','40','01','01','Obras de arte sob encomenda.'),

  // ─── 99 — Sem incidência de ISSQN e ICMS ──────────────────────────────
  e('990101','99','01','01','Serviços sem a incidência de ISSQN e ICMS.'),
];

/** Index por código para busca rápida */
const CTN_BY_CODE: Map<string, CTNEntry> = new Map(CTN_DATA.map(e => [e.codigo, e]));

/** Busca CTN por código de 6 dígitos */
export function getCTNByCode(codigo: string): CTNEntry | null {
  return CTN_BY_CODE.get(codigo.replace(/\D/g, '')) ?? null;
}

/** Valida se um código CTN de 6 dígitos existe na tabela oficial */
export function isValidCTN(codigo: string): boolean {
  return CTN_BY_CODE.has(codigo.replace(/\D/g, ''));
}

/** Busca CTN por texto (código ou descrição) */
export function searchCTN(query: string, limit = 20): CTNEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return CTN_DATA.slice(0, limit);
  
  const results: CTNEntry[] = [];
  for (const entry of CTN_DATA) {
    if (results.length >= limit) break;
    if (
      entry.codigo.includes(q) ||
      entry.itemFormatado.includes(q) ||
      entry.descricao.toLowerCase().includes(q)
    ) {
      results.push(entry);
    }
  }
  return results;
}

/** Retorna todos os CTN cadastrados */
export function getAllCTN(): CTNEntry[] {
  return CTN_DATA;
}

/** Busca CTN filtrando pelo item (ex: "01", "04") */
export function searchCTNByItem(item: string, query: string = '', limit = 30): CTNEntry[] {
  const normalizedItem = item.padStart(2, '0');
  const q = query.toLowerCase().trim();
  const results: CTNEntry[] = [];
  for (const entry of CTN_DATA) {
    if (results.length >= limit) break;
    if (entry.item !== normalizedItem) continue;
    if (!q || entry.codigo.includes(q) || entry.descricao.toLowerCase().includes(q) || entry.itemFormatado.includes(q)) {
      results.push(entry);
    }
  }
  return results;
}

/** Retorna todos os NBS únicos da tabela */
export function getAllNBS(): string[] {
  const set = new Set<string>();
  for (const entry of CTN_DATA) {
    if (entry.nbs) set.add(entry.nbs);
  }
  return Array.from(set).sort();
}
