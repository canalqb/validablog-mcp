import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';
import { CONFIG } from '../config.js';

export async function createCompliancePages(blogId = '2609663586053425832') {
  console.log(`\n========================================================`);
  console.log(` INICIANDO CRIAÇÃO DE PÁGINAS DE COMPLIANCE ADSENSE`);
  console.log(` Blog ID: ${blogId} | Protocolo Master Rules 9.4`);
  console.log(`========================================================\n`);

  const client = getAuthenticatedClient();
  const blogger = google.blogger({ version: 'v3', auth: client });

  // 1. Verificar páginas já existentes para não duplicar
  quotaManager.recordCall('blogger', 1);
  const existingRes = await blogger.pages.list({ blogId, fetchBodies: false });
  const existingPages = existingRes.data.items || [];
  console.log(`Páginas existentes atualmente no blog: ${existingPages.length}`);

  const pagesToCreate = [
    {
      title: 'Política de Privacidade e Cookies',
      slug: 'politica-de-privacidade',
      content: `
<div class="page-compliance-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333;">
  <h1>Política de Privacidade e Uso de Cookies</h1>
  <p><strong>Última atualização:</strong> 05 de novembro de 2026</p>
  <p>Bem-vindo ao <strong>Receitas do Mundo</strong> (<a href="https://mundoereceitas.blogspot.com/">https://mundoereceitas.blogspot.com/</a>). A sua privacidade e a proteção dos seus dados pessoais são fundamentais para nós. Esta Política de Privacidade descreve de forma clara, transparente e acessível como coletamos, utilizamos, armazenamos e protegemos suas informações de acordo com a legislação brasileira (<strong>LGPD — Lei nº 13.709/2018</strong>), as normas europeias (<strong>GDPR / TCF v2.3</strong>), norte-americanas (<strong>CCPA/CPRA e COPPA</strong>) e japonesas (<strong>APPI</strong>), além de cumprir integralmente as <strong>Políticas de Programa do Google AdSense</strong>.</p>

  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;"/>

  <h2>1. Controlador dos Dados e Encarregado (DPO)</h2>
  <p>O controlador responsável pelo tratamento de dados pessoais coletados neste site é o <strong>Receitas do Mundo</strong>.</p>
  <ul>
    <li><strong>E-mail de Contato e DPO:</strong> <a href="mailto:qrodrigob@gmail.com">qrodrigob@gmail.com</a></li>
    <li><strong>Canal de Atendimento ao Titular:</strong> Através da nossa <a href="https://mundoereceitas.blogspot.com/p/contato.html">Página de Contato</a>.</li>
  </ul>

  <h2>2. Informações que Coletamos</h2>
  <p>Operamos sob o princípio da minimização de dados:</p>
  <ul>
    <li><strong>Dados fornecidos diretamente pelo usuário:</strong> Nome e endereço de e-mail informados voluntariamente ao preencher formulários de comentários ou ao nos enviar uma mensagem direta.</li>
    <li><strong>Dados coletados automaticamente (Logs de Navegação):</strong> Endereço IP anonimizado, tipo de navegador, sistema operacional, páginas visitadas, tempo de permanência e registros de data/hora, utilizados para diagnóstico técnico e prevenção de fraudes.</li>
    <li><strong>Cookies e Identificadores de Dispositivos:</strong> Pequenos arquivos armazenados no seu dispositivo para melhorar sua experiência de navegação e viabilizar a veiculação de anúncios.</li>
  </ul>

  <h2>3. Google AdSense, DoubleClick e Cookies de Publicidade</h2>
  <p>Este site utiliza o <strong>Google AdSense</strong>, serviço de veiculação de publicidade online fornecido pela Google LLC.</p>
  <ul>
    <li>O Google utiliza cookies (como o cookie DoubleClick DART) para veicular anúncios aos usuários com base em visitas anteriores a este ou a outros sites na internet.</li>
    <li>Os usuários podem optar por desativar a publicidade personalizada acessando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Configurações de Anúncios do Google</a>.</li>
    <li>Alternativamente, você pode desativar o uso de cookies de terceiros para publicidade personalizada visitando a página <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">AboutAds.info</a> ou <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer">Your Online Choices</a>.</li>
  </ul>

  <h2>4. Google Analytics</h2>
  <p>Utilizamos ferramentas de análise estatística para entender como os visitantes interagem com o nosso conteúdo culinário. As informações são tratadas de forma agregada e com anonimização de IP, impossibilitando a identificação pessoal do leitor.</p>

  <h2>5. Direitos do Titular dos Dados (LGPD e Legislações Internacionais)</h2>
  <p>Você possui direitos garantidos por lei (Art. 18 da LGPD, GDPR e regulamentos correlatos):</p>
  <ul>
    <li>Confirmar a existência de tratamento de dados pessoais.</li>
    <li>Solicitar acesso, correção de dados incompletos ou atualização.</li>
    <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
    <li>Revogar o consentimento a qualquer momento.</li>
  </ul>
  <p>Para exercer qualquer um destes direitos, basta entrar em contato pelo e-mail: <a href="mailto:qrodrigob@gmail.com">qrodrigob@gmail.com</a>.</p>

  <h2>6. Proteção de Menores (COPPA e ECA Digital)</h2>
  <p>O <em>Receitas do Mundo</em> não direciona seus serviços a menores de 13 anos e não coleta intencionalmente informações pessoais de crianças. Caso identifiquemos qualquer dado coletado inadvertidamente sem o consentimento parental comprovado, realizaremos a exclusão imediata.</p>

  <h2>7. Segurança da Informação</h2>
  <p>Todo o tráfego deste site é protegido por criptografia de ponta a ponta via protocolo seguro <strong>HTTPS (SSL/TLS)</strong>, garantindo que suas requisições ocorram em ambiente protegido contra interceptações.</p>
</div>
`
    },
    {
      title: 'Termos de Uso',
      slug: 'termos-de-uso',
      content: `
<div class="page-compliance-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333;">
  <h1>Termos de Uso</h1>
  <p><strong>Última atualização:</strong> 05 de novembro de 2026</p>
  <p>Ao acessar e navegar no <strong>Receitas do Mundo</strong> (<a href="https://mundoereceitas.blogspot.com/">https://mundoereceitas.blogspot.com/</a>), você concorda expressamente com os seguintes Termos de Uso. Caso não concorde com qualquer disposição aqui presente, solicitamos que não continue a utilizar o site.</p>

  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;"/>

  <h2>1. Finalidade do Site e Conteúdo Editorial</h2>
  <p>O <strong>Receitas do Mundo</strong> é um portal dedicado à publicação de guias culinários, receitas práticas, tutoriais de gastronomia passo a passo e dicas de cozinha. Todo o conteúdo é fornecido com caráter estritamente educativo, informativo e de entretenimento.</p>

  <h2>2. Propriedade Intelectual e Direitos Autorais</h2>
  <p>Todos os textos, estruturas de passo a passo, análises e materiais editoriais publicados neste portal são de titularidade do <strong>Receitas do Mundo</strong>, protegidos pela Lei de Direitos Autorais (Lei nº 9.610/1998) e tratados internacionais:</p>
  <ul>
    <li>É permitida a citação de pequenos trechos para fins de estudo ou crítica, desde que haja atribuição expressa com link ativo para a fonte original.</li>
    <li>É expressamente proibida a reprodução integral, raspagem automatizada (scraping) não autorizada, cópia ou redistribuição de nossos artigos para fins comerciais sem autorização prévia por escrito.</li>
  </ul>

  <h2>3. Isenção de Responsabilidade e Segurança Alimentar</h2>
  <p>As receitas são desenvolvidas e revisadas buscando a maior precisão possível nas medidas e instruções. Entretanto:</p>
  <ul>
    <li>Variações de ingredientes, potência de fogões/fornos e técnicas de manipulação podem alterar o resultado final.</li>
    <li>O usuário é o único responsável por verificar a procedência dos alimentos, a validade dos ingredientes, a higienização e potenciais alergias alimentares (glúten, lactose, frutos do mar, nozes, etc.) de quem irá consumir as preparações.</li>
    <li>Não nos responsabilizamos por acidentes culinários, queimaduras, cortes ou qualquer dano decorrente da execução das receitas em ambiente doméstico ou profissional.</li>
  </ul>

  <h2>4. Conduta do Usuário e Moderação</h2>
  <p>Em áreas de interação (comentários):</p>
  <ul>
    <li>Não são tolerados comentários ofensivos, difamatórios, racistas, homofóbicos, discriminatórios ou com conteúdo de ódio.</li>
    <li>Mensagens classificadas como spam, publicidade não autorizada ou links maliciosos serão removidas sumariamente.</li>
  </ul>

  <h2>5. Modificações dos Termos</h2>
  <p>Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento, sem aviso prévio. A data de última atualização no topo desta página sempre indicará a versão vigente.</p>

  <h2>6. Lei Aplicável e Foro</h2>
  <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do administrador do site para dirimir quaisquer controvérsias decorrentes destes Termos de Uso.</p>
</div>
`
    },
    {
      title: 'Sobre Nós e Diretrizes Editoriais',
      slug: 'sobre',
      content: `
<div class="page-compliance-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333;">
  <h1>Sobre Nós e Diretrizes Editoriais</h1>
  <p><strong>Conheça a história, a missão e os padrões de qualidade do Receitas do Mundo</strong></p>

  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;"/>

  <h2>1. Nossa Missão</h2>
  <p>O <strong>Receitas do Mundo</strong> nasceu com um propósito claro: desmistificar a gastronomia nacional e internacional, transformando receitas complexas em tutoriais acessíveis, práticos e 100% reproduzíveis na cozinha de qualquer pessoa.</p>
  <p>Acreditamos que cozinhar não deve ser uma fonte de estresse, mas um momento de prazer, conexão familiar e descoberta de novas culturas através dos sabores.</p>

  <h2>2. Rigor Técnico e Medidas Culinárias Exatas</h2>
  <p>Diferente de fontes culinárias que utilizam termos vagos ("uma pitada", "um copo"), seguimos o <strong>Protocolo de Precisão Culinária</strong>:</p>
  <ul>
    <li>Ingredientes medidos em unidades universais e métricas (gramas, quilogramas, mililitros).</li>
    <li>Indicação do tempo exato de cocção, ponto visual esperado e sinais sensoriais (aroma, cor, textura).</li>
    <li>Seção preventiva de <em>"Erros Comuns e Como Evitá-los"</em> em cada receita, garantindo que o leitor saiba o que pode dar errado antes mesmo de acender o fogo.</li>
  </ul>

  <h2>3. Transparência no Uso de Tecnologia e Inteligência Artificial (Lei Felca nº 15.211/2025)</h2>
  <p>Em total respeito aos nossos leitores, ao Google Search Essentials e em conformidade estrita com a <strong>Lei Felca nº 15.211/2025</strong> e o <strong>EU AI Act (Artigo 50)</strong>, declaramos abertamente:</p>
  <ul>
    <li>Utilizamos ferramentas tecnológicas avançadas e inteligência artificial para auxiliar na estruturação de dados, formatação técnica de tabelas nutricionais e pesquisa inicial de referências culinárias mundiais.</li>
    <li><strong>Supervisão Humana Rigorosa:</strong> Nenhum conteúdo é publicado de forma 100% automatizada. Toda receita passa por curadoria, verificação de proporções de ingredientes, validação de medidas e revisão humana antes de ir ao ar.</li>
    <li>Não geramos conteúdo superficial (<em>anti-thin content</em>). Cada publicação possui densidade informativa, contexto histórico da culinária e instruções detalhadas.</li>
  </ul>

  <h2>4. Compromisso com o Leitor (E-E-A-T)</h2>
  <p>Nossos artigos são baseados em experiência prática, pesquisa técnica em fontes consolidadas de gastronomia e respeito absoluto à segurança e satisfação de quem nos lê.</p>
  <p>Dúvidas, sugestões ou correções? Fale conosco através do e-mail: <a href="mailto:qrodrigob@gmail.com">qrodrigob@gmail.com</a>.</p>
</div>
`
    },
    {
      title: 'Contato',
      slug: 'contato',
      content: `
<div class="page-compliance-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333;">
  <h1>Fale Conosco</h1>
  <p>Valorizamos a comunicação direta, transparente e ágil com nossos leitores, parceiros e anunciantes.</p>

  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;"/>

  <h2>Como Entrar em Contato</h2>
  <p>Seja para tirar dúvidas sobre o preparo de alguma receita, sugerir novos pratos, relatar eventuais inconsistências ou tratar de assuntos comerciais e de privacidade:</p>

  <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; border-radius: 6px; margin: 25px 0;">
    <p style="margin: 0 0 10px 0;"><strong>📧 E-mail Principal:</strong> <a href="mailto:qrodrigob@gmail.com" style="font-size: 1.1em; color: #28a745; font-weight: bold;">qrodrigob@gmail.com</a></p>
    <p style="margin: 0 0 10px 0;"><strong>🌐 Blog:</strong> Receitas do Mundo (<a href="https://mundoereceitas.blogspot.com/">https://mundoereceitas.blogspot.com/</a>)</p>
    <p style="margin: 0;"><strong>⏱️ Tempo de Resposta:</strong> Respondemos habitualmente em até 24 a 48 horas úteis.</p>
  </div>

  <h2>Solicitações de Privacidade e Dados (LGPD / GDPR)</h2>
  <p>Para exercer seus direitos de confirmação, acesso, correção ou eliminação de dados pessoais conforme a LGPD e o GDPR, envie sua solicitação com o assunto <em>"Privacidade de Dados - Receitas do Mundo"</em> para o mesmo e-mail.</p>

  <h2>Parcerias e Publicidade</h2>
  <p>Para propostas editoriais, colaborações culinárias e oportunidades publicitárias em conformidade com as diretrizes do Google AdSense, utilize o contato acima indicando sua marca e objetivo.</p>
</div>
`
    },
    {
      title: 'Aviso Legal e Isenção de Responsabilidade',
      slug: 'aviso-legal',
      content: `
<div class="page-compliance-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333;">
  <h1>Aviso Legal e Isenção de Responsabilidade</h1>
  <p><strong>Última atualização:</strong> 05 de novembro de 2026</p>

  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;"/>

  <h2>1. Finalidade Informativa e Gastronômica</h2>
  <p>As informações, receitas, métodos de cocção e recomendações publicadas no <strong>Receitas do Mundo</strong> têm propósito meramente informativo, recreativo e culinário. Nenhuma informação aqui veiculada substitui orientações médicas, nutricionais ou de profissionais de saúde habilitados.</p>

  <h2>2. Alergias e Intolerâncias Alimentares</h2>
  <p>Alergias alimentares podem desencadear reações graves e potencialmente fatais. É de inteira responsabilidade do leitor:</p>
  <ul>
    <li>Identificar ingredientes aos quais ele ou seus comensais sejam alérgicos ou intolerantes (incluindo, mas não se limitando a: glúten, lactose, castanhas, amendoim, ovos, soja, frutos do mar e corantes).</li>
    <li>Ler atentamente os rótulos de produtos industrializados para verificar avisos de "contém glúten", "pode conter traços de oleaginosas" ou contaminação cruzada.</li>
    <li>Fazer as devidas substituições de ingredientes sob orientação de seu médico ou nutricionista.</li>
  </ul>

  <h2>3. Segurança e Manipulação de Alimentos</h2>
  <p>O preparo de alimentos envolve riscos térmicos (fogo, óleo quente, vapor sob pressão) e microbiológicos. O leitor deve sempre:</p>
  <ul>
    <li>Respeitar as temperaturas mínimas de cozimento seguro para carnes, aves, peixes e ovos.</li>
    <li>Manter higienização rigorosa de bancadas, utensílios e mãos.</li>
    <li>Observar os prazos de resfriamento, congelamento e armazenamento seguro de sobras.</li>
  </ul>

  <h2>4. Valores Nutricionais Estimados</h2>
  <p>Quaisquer estimativas de calorias, macronutrientes ou valores nutricionais apresentadas nas receitas são aproximações calculadas com base em tabelas de alimentos médias e podem variar consideravelmente de acordo com marcas e porções utilizadas.</p>
</div>
`
    }
  ];

  const results = [];

  for (const pageData of pagesToCreate) {
    const existing = existingPages.find((p) => p.title.toLowerCase().trim() === pageData.title.toLowerCase().trim());

    if (existing) {
      console.log(`[Página] "${pageData.title}" já existe: ${existing.url}`);
      results.push({ title: pageData.title, url: existing.url, status: 'Já existia' });
      continue;
    }

    quotaManager.recordCall('blogger', 1);
    console.log(`[Página] Criando e publicando: "${pageData.title}"...`);
    const insertRes = await blogger.pages.insert({
      blogId,
      isDraft: false, // Publica imediatamente
      requestBody: {
        title: pageData.title,
        content: pageData.content
      }
    });

    console.log(`✓ Página publicada com sucesso! URL: ${insertRes.data.url}`);
    results.push({
      id: insertRes.data.id,
      title: insertRes.data.title,
      url: insertRes.data.url,
      status: 'Publicada'
    });
  }

  // Salvar registro das páginas
  const logPath = path.join(CONFIG.rootDir, 'data', `compliance-pages-${blogId}.json`);
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✓ Relatório de páginas publicado e salvo em: ${logPath}`);

  return results;
}

// Execução direta via CLI se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('create-compliance-pages.js')) {
  createCompliancePages().catch(console.error);
}

