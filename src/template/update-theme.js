import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

export function updateThemeTemplate() {
  const themePath = path.join(CONFIG.rootDir, 'theme-2609663586053425832-otimizado.xml');
  let xml = fs.readFileSync(themePath, 'utf-8');

  // 1. Substituir Widget HTML3 (remover texto demo e imagem de demonstração)
  const targetWidgetOld = /<b:widget id='HTML3' locked='false' title='Masterchef' type='HTML' version='1'>[\s\S]*?<\/b:widget>/;
  const newWidget = `<b:widget id='HTML3' locked='false' title='Sobre Nós' type='HTML' version='1'>
     <b:widget-settings>
       <b:widget-setting name='content'><![CDATA[<div class="about-widget-text" style="text-align: justify; color: #666; line-height: 1.7; font-size: 14px;">
  O <strong>Receitas do Mundo</strong> é o seu portal de referência em gastronomia prática, técnicas culinárias e receitas testadas com medidas exatas. Conteúdo desenvolvido com rigor editorial e compromisso com o leitor.
  <br/><br/>
  <a href="https://mundoereceitas.blogspot.com/p/sobre-nos-e-diretrizes-editoriais.html" style="color: #28a745; text-decoration: underline; font-weight: bold;">Conheça nossa história e diretrizes →</a>
</div>

<div class="icons-social" style="margin-top: 15px;">
<ul id="social">
<li><a class="facebook" href="https://mundoereceitas.blogspot.com/" title="facebook"></a></li>
<li><a class="twitter" href="https://mundoereceitas.blogspot.com/" title="twitter"></a></li>
<li><a class="instagram" href="https://mundoereceitas.blogspot.com/" title="instagram"></a></li>
<li><a class="pinterest" href="https://mundoereceitas.blogspot.com/" title="pinterest"></a></li>
</ul></div>
<style>
.icons-social li {
display: inline;
padding: 0;
float: left;
}
.icons-social #social a {
display: block;
    margin-right: 15px;
    color: #333;
    text-align: center;
    font-size: 20px;
}
.icons-social #social a:before {
display: inline-block;
font: normal normal normal 22px/1 FontAwesome;
font-size: inherit;
font-style: normal;
font-weight: 400;
line-height: 42px;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}
.icons-social .facebook:before {
content: "\\f09a";
}
.icons-social .twitter:before {
content: "\\f099";
}
.icons-social .gplus:before {
content: "\\f0d5";
}
.icons-social .linkedin:before {
content: "\\f0e1";
}
.icons-social .instagram:before {
content: "\\f16d";
}
.icons-social .pinterest:before {
content: "\\f0d2";
}
</style>]]></b:widget-setting>
     </b:widget-settings>
     <b:includable id='main'>
  <b:if cond='data:title != ""'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>
  <div style='clear: both;'/>
</b:includable>
   </b:widget>`;

  if (targetWidgetOld.test(xml)) {
    xml = xml.replace(targetWidgetOld, newWidget);
    console.log('✓ Widget HTML3 atualizado: texto demo substituído por Sobre Nós.');
  } else {
    console.log('- Widget HTML3 já havia sido atualizado ou não encontrado com assinatura antiga.');
  }

  // 2. Inserir links de compliance no rodapé jugas_footer
  const targetFooterOld = "<div id='jugas_footer'>\n        <div class='copy-container row'>\n         \n                    <div class='jugas_footer_copyright'>";
  const newFooter = `<div id='jugas_footer'>
        <div class='copy-container row'>
          <div class='footer-compliance-nav' style='width: 100%; text-align: center; margin-bottom: 14px; padding: 10px 0;'>
            <ul style='list-style: none; padding: 0; margin: 0; display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 18px;'>
              <li><a href='https://mundoereceitas.blogspot.com/p/politica-de-privacidade-e-cookies.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Política de Privacidade</a></li>
              <li><a href='https://mundoereceitas.blogspot.com/p/termos-de-uso.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Termos de Uso</a></li>
              <li><a href='https://mundoereceitas.blogspot.com/p/sobre-nos-e-diretrizes-editoriais.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Sobre Nós</a></li>
              <li><a href='https://mundoereceitas.blogspot.com/p/contato.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Contato</a></li>
              <li><a href='https://mundoereceitas.blogspot.com/p/aviso-legal-e-isencao-de.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Aviso Legal</a></li>
            </ul>
          </div>
          <div class='jugas_footer_copyright'>`;

  if (xml.includes(targetFooterOld)) {
    xml = xml.replace(targetFooterOld, newFooter);
    console.log('✓ Links de compliance inseridos no rodapé do template.');
  } else if (!xml.includes('footer-compliance-nav')) {
    // Fallback: insere antes de jugas_footer_copyright
    xml = xml.replace(
      "<div class='jugas_footer_copyright'>",
      `<div class='footer-compliance-nav' style='width: 100%; text-align: center; margin-bottom: 14px; padding: 10px 0;'>
        <ul style='list-style: none; padding: 0; margin: 0; display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 18px;'>
          <li><a href='https://mundoereceitas.blogspot.com/p/politica-de-privacidade-e-cookies.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Política de Privacidade</a></li>
          <li><a href='https://mundoereceitas.blogspot.com/p/termos-de-uso.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Termos de Uso</a></li>
          <li><a href='https://mundoereceitas.blogspot.com/p/sobre-nos-e-diretrizes-editoriais.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Sobre Nós</a></li>
          <li><a href='https://mundoereceitas.blogspot.com/p/contato.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Contato</a></li>
          <li><a href='https://mundoereceitas.blogspot.com/p/aviso-legal-e-isencao-de.html' style='color: #888; text-decoration: none; font-size: 13px; font-weight: 500;'>Aviso Legal</a></li>
        </ul>
      </div>
      <div class='jugas_footer_copyright'>`
    );
    console.log('✓ Links de compliance inseridos via fallback no rodapé.');
  }

  // 3. Inserir regra CSS global para corrigir o li:before nas etapas de receitas
  const liCssFix = `
    <!-- [VALIDABLOG] Correção Definitiva para Numeração de Passos (evita sobreposição) -->
    <style>
      .post-body ol.post_steps, ol.post_steps, .post_steps {
        list-style: none !important;
        counter-reset: passo !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      .post-body ol.post_steps > li, ol.post_steps li, .post_steps li {
        position: relative !important;
        padding: 16px 20px 16px 68px !important;
        margin-bottom: 14px !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 10px !important;
        line-height: 1.7 !important;
        list-style: none !important;
        display: block !important;
        box-sizing: border-box !important;
      }
      .post-body ol.post_steps > li::before, ol.post_steps li::before, .post_steps li::before {
        content: counter(passo) !important;
        position: absolute !important;
        left: 18px !important;
        top: 16px !important;
        width: 34px !important;
        height: 34px !important;
        border-radius: 50% !important;
        background: #28a745 !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        font-size: 15px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        z-index: 10 !important;
      }
    </style>
`;

  if (!xml.includes('[VALIDABLOG] Correção Definitiva para Numeração de Passos')) {
    xml = xml.replace('</head>', liCssFix + '\n</head>');
    console.log('✓ Regra CSS global para li::before injetada no template.');
  }

  fs.writeFileSync(themePath, xml, 'utf-8');
  console.log('✓ Arquivo theme-2609663586053425832-otimizado.xml gravado com sucesso.');
}

if (process.argv[1] && process.argv[1].endsWith('update-theme.js')) {
  updateThemeTemplate();
}
