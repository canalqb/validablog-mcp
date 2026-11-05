import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';

export async function createCanalQbCompliancePages(blogId = '5982274115355506187') {
  console.log(`\n========================================================`);
  console.log(` CRIAÇÃO DE PÁGINAS DE COMPLIANCE ADSENSE - CANALQB`);
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
      title: 'Política de Privacidade',
      content: `
<div class="page-compliance-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #2d3748; max-width: 860px; margin: 0 auto; padding: 20px 0;">
  <h1 style="color: #1a202c; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;">Política de Privacidade e Proteção de Dados</h1>
  <p style="color: #718096; font-size: 0.95em;"><strong>Última atualização:</strong> 05 de novembro de 2026</p>
  
  <p>Bem-vindo ao <strong>CanalQb</strong> (<a href="https://canalqb.blogspot.com/" style="color: #2b6cb0;">https://canalqb.blogspot.com/</a>). A proteção da sua privacidade e a segurança das suas informações pessoais são prioridades absolutas para nós. Esta Política de Privacidade esclarece com total clareza e transparência como os dados são coletados, utilizados, protegidos e compartilhados quando você visita e interage com o nosso blog, respeitando rigorosamente a legislação brasileira (<strong>LGPD — Lei nº 13.709/2018</strong>), o Regulamento Geral de Proteção de Dados da União Europeia (<strong>GDPR / TCF v2.3</strong>), a legislação norte-americana (<strong>CCPA/CPRA e COPPA</strong>) e as <strong>Políticas de Programa do Google AdSense</strong>.</p>

  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>

  <h2 style="color: #2d3748; margin-top: 28px;">1. Controlador dos Dados e Encarregado (DPO)</h2>
  <p>O controlador responsável pelo tratamento dos dados pessoais coletados neste blog é o <strong>CanalQb</strong>.</p>
  <ul>
    <li><strong>Responsável / DPO:</strong> Rodrigo Moraes (Qb)</li>
    <li><strong>E-mail de Contato do DPO:</strong> <a href="mailto:qrodrigob@gmail.com" style="color: #2b6cb0;">qrodrigob@gmail.com</a></li>
    <li><strong>Canal de Atendimento ao Titular:</strong> Através da nossa página oficial de <a href="https://canalqb.blogspot.com/p/contato.html" style="color: #2b6cb0;">Contato</a>.</li>
  </ul>

  <h2 style="color: #2d3748; margin-top: 28px;">2. Informações que Coletamos</h2>
  <p>Pautamos nossas atividades pelo princípio da minimização de dados, coletando unicamente as informações estritamente necessárias:</p>
  <ul>
    <li><strong>Dados fornecidos voluntariamente:</strong> Nome e endereço de e-mail ao enviar mensagens através de formulários de contato ou comentários públicos nas postagens.</li>
    <li><strong>Dados técnicos de navegação (Logs de Acesso):</strong> Endereço IP anonimizado, tipo e versão do navegador, sistema operacional, páginas visitadas, tempo despendido e registros de data/hora, utilizados para diagnóstico técnico e prevenção a ataques cibernéticos.</li>
    <li><strong>Cookies e Identificadores Digitais:</strong> Pequenos arquivos de dados gravados no seu dispositivo para memorizar preferências, aprimorar a usabilidade e viabilizar anúncios relevantes.</li>
  </ul>

  <h2 style="color: #2d3748; margin-top: 28px;">3. Google AdSense, DoubleClick e Cookies Publicitários</h2>
  <p>Este blog utiliza o <strong>Google AdSense</strong>, serviço de publicidade online provido pela Google LLC.</p>
  <ul>
    <li>O Google e seus parceiros utilizam cookies (incluindo o cookie DoubleClick DART) para veicular anúncios com base nas visitas anteriores dos leitores a este blog ou a outros sites na web.</li>
    <li>Os leitores podem desativar a veiculação de anúncios personalizados visitando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style="color: #2b6cb0;">Configurações de Anúncios do Google</a>.</li>
    <li>Você também pode optar por não receber cookies de publicidade direcionada de fornecedores terceirizados através das plataformas <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style="color: #2b6cb0;">AboutAds.info</a> ou <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" style="color: #2b6cb0;">Your Online Choices</a>.</li>
  </ul>

  <h2 style="color: #2d3748; margin-top: 28px;">4. Ferramentas de Estatística e Métricas (Google Analytics)</h2>
  <p>Utilizamos serviços analíticos para compreender o engajamento e a preferência dos usuários quanto aos nossos tutoriais e publicações. Os relatórios são gerados de maneira consolidada e anônima, sem identificar individualmente qualquer visitante.</p>

  <h2 style="color: #2d3748; margin-top: 28px;">5. Direitos do Titular de Dados (LGPD e Legislações Internacionais)</h2>
  <p>Em conformidade com o Artigo 18 da LGPD e o Artigo 15 do GDPR, você tem direito a:</p>
  <ul>
    <li>Confirmar a existência de tratamento dos seus dados pessoais;</li>
    <li>Acessar, retificar ou atualizar dados incorretos ou desatualizados;</li>
    <li>Requerer a anonimização, o bloqueio ou a exclusão de dados desnecessários;</li>
    <li>Revogar o seu consentimento para envio de comunicações a qualquer momento.</li>
  </ul>
  <p>Para exercer quaisquer desses direitos, encaminhe sua requisição para o e-mail: <a href="mailto:qrodrigob@gmail.com" style="color: #2b6cb0;">qrodrigob@gmail.com</a> com o assunto "Direitos do Titular - LGPD".</p>

  <h2 style="color: #2d3748; margin-top: 28px;">6. Proteção a Menores (COPPA e Estatuto da Criança e do Adolescente)</h2>
  <p>O <em>CanalQb</em> não direciona seu conteúdo nem coleta conscientemente dados de crianças ou menores de 13 anos. Caso tome ciência de que dados de um menor foram informados indevidamente sem a autorização comprovada de pais ou responsáveis legais, providenciaremos a remoção imediata.</p>

  <h2 style="color: #2d3748; margin-top: 28px;">7. Segurança da Informação</h2>
  <p>Adotamos protocolos avançados de segurança técnica, incluindo navegação segura criptografada via <strong>HTTPS (TLS/SSL)</strong> em 100% das páginas, prevenindo a interceptação ou a violação de integridade dos dados trafegados.</p>

  <h2 style="color: #2d3748; margin-top: 28px;">8. Alterações nesta Política</h2>
  <p>Esta política pode ser periodicamente revisada para refletir mudanças operacionais, legais ou regulatórias. Recomendamos a consulta regular a esta página. A data da versão mais recente estará sempre discriminada no cabeçalho.</p>
</div>
`
    },
    {
      title: 'Contato e Fale Conosco',
      content: `
<div class="page-compliance-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #2d3748; max-width: 860px; margin: 0 auto; padding: 20px 0;">
  <h1 style="color: #1a202c; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;">Contato e Fale Conosco</h1>
  <p style="color: #718096; font-size: 0.95em;"><strong>Última atualização:</strong> 05 de novembro de 2026</p>

  <p>Valorizamos o diálogo aberto e transparente com a nossa comunidade de leitores, parceiros e desenvolvedores. Se você tiver dúvidas sobre nossos conteúdos, sugestões de pautas, correções técnicas, solicitações relacionadas a dados pessoais (LGPD) ou oportunidades de parceria, utilize nossos canais oficiais de comunicação abaixo.</p>

  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>

  <div style="background: #f7fafc; border-left: 4px solid #3182ce; padding: 18px 22px; margin: 24px 0; border-radius: 4px;">
    <h3 style="margin-top: 0; color: #2b6cb0;">Canal de Contato Direto</h3>
    <p style="margin-bottom: 8px;"><strong>E-mail Principal:</strong> <a href="mailto:qrodrigob@gmail.com" style="color: #2b6cb0; font-size: 1.1em; font-weight: 600;">qrodrigob@gmail.com</a></p>
    <p style="margin-bottom: 8px;"><strong>Responsável Editorial e Técnico:</strong> Rodrigo Moraes (Qb)</p>
    <p style="margin-bottom: 0;"><strong>Canal Oficial no YouTube:</strong> <a href="https://www.youtube.com/@CanalQb" target="_blank" rel="noopener noreferrer" style="color: #2b6cb0;">@CanalQb</a></p>
  </div>

  <h2 style="color: #2d3748; margin-top: 28px;">Assuntos que Atendemos</h2>
  <ul>
    <li><strong>Dúvidas Técnicas e Tutoriais:</strong> Esclarecimentos sobre os artigos, códigos e ferramentas compartilhadas no blog.</li>
    <li><strong>Privacidade e Dados (DPO):</strong> Solicitações de confirmação, correção ou exclusão de dados pessoais conforme a LGPD.</li>
    <li><strong>Correções Editoriais:</strong> Notificação de links inoperantes, erros de digitação ou conteúdos que necessitem de atualização.</li>
    <li><strong>Parcerias e Anúncios:</strong> Propostas comerciais alinhadas aos valores e diretrizes éticas do CanalQb.</li>
  </ul>

  <h2 style="color: #2d3748; margin-top: 28px;">Prazo Médio de Resposta (SLA)</h2>
  <p>Nos empenhamos em responder a todas as mensagens com brevidade:</p>
  <ul>
    <li><strong>Solicitações Gerais:</strong> Retorno em até <strong>48 horas úteis</strong>.</li>
    <li><strong>Demandas de Titulares de Dados (LGPD):</strong> Atendimento dentro dos prazos legais estipulados pela Autoridade Nacional de Proteção de Dados (ANPD).</li>
  </ul>

  <h2 style="color: #2d3748; margin-top: 28px;">Recomendações Importantes de Segurança</h2>
  <p>Para sua própria segurança e proteção digital:</p>
  <ul>
    <li><strong>Nunca envie dados confidenciais:</strong> Não compartilhe senhas, dados de cartão de crédito ou documentos bancários por e-mail ou mensagens públicas.</li>
    <li><strong>Comentários Públicos:</strong> Lembramos que mensagens publicadas na seção de comentários dos artigos tornam-se públicas. Evite expor endereços residenciais ou dados privados.</li>
  </ul>
</div>
`
    }
  ];

  const createdResults = [];

  for (const pageData of pagesToCreate) {
    // Verificar se já existe página com título exato
    const existing = existingPages.find(p => p.title.toLowerCase().trim() === pageData.title.toLowerCase().trim());
    if (existing) {
      console.log(`[Aviso] Página "${pageData.title}" já existe (ID: ${existing.id}, URL: ${existing.url}). Pulando criação.`);
      createdResults.push({
        title: pageData.title,
        id: existing.id,
        url: existing.url,
        status: 'JA_EXISTIA'
      });
      continue;
    }

    console.log(`[Blogger] Criando página estática: "${pageData.title}"...`);
    quotaManager.recordCall('blogger', 1);

    try {
      const createRes = await blogger.pages.insert({
        blogId,
        isDraft: false,
        requestBody: {
          title: pageData.title,
          content: pageData.content.trim()
        }
      });

      console.log(`  ✓ Página criada com sucesso!`);
      console.log(`    ID: ${createRes.data.id}`);
      console.log(`    URL: ${createRes.data.url}`);

      createdResults.push({
        title: pageData.title,
        id: createRes.data.id,
        url: createRes.data.url,
        status: 'CRIADA_COM_SUCESSO'
      });
    } catch (err) {
      console.error(`  ✗ Erro ao criar página "${pageData.title}":`, err.message);
      createdResults.push({
        title: pageData.title,
        error: err.message,
        status: 'ERRO'
      });
    }
  }

  // Salvar relatório local
  const outPath = path.resolve(process.cwd(), `data/compliance-pages-${blogId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(createdResults, null, 2), 'utf8');
  console.log(`\n✓ Relatório de páginas salvo em: ${outPath}`);

  return createdResults;
}

// Execução via CLI
if (process.argv[1] && process.argv[1].endsWith('create-canalqb-pages.js')) {
  createCanalQbCompliancePages().catch(console.error);
}
