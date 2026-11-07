import fs from 'fs';
import path from 'path';
import { TemplateEngine } from './engine.js';

const THEME_PATH = path.resolve(process.cwd(), 'theme-5982274115355506187-otimizado.xml');

export function updateCanalQbMenu() {
  console.log(`\n========================================================`);
  console.log(` CORREÇÃO DO MENU MULTINÍVEL LINKLIST1 (CANALQB)`);
  console.log(` Arquivo: ${THEME_PATH}`);
  console.log(`========================================================\n`);

  let xml = fs.readFileSync(THEME_PATH, 'utf8');

  // Marcadores do bloco no XML
  const startMarker = '// 1. Navegação';
  const endMarker = '/* Estilização Hero (Theme Aware) */';

  const startIndex = xml.indexOf(startMarker);
  const endIndex = xml.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Marcadores do menu não foram encontrados no XML.');
  }

  // Novo Script Corrigido + CSS Robusto
  const newMenuCode = `// 1. Navegação Multinível Robusta CanalQb (_nivel1, __nivel2, ___nivel3)
            $("#LinkList1").each(function() {
              var $container = $(this);
              var rawItems = [];
              
              $container.find("li").each(function() {
                var fullText = $(this).text().trim();
                var href = $(this).find("a").attr("href") || "#";
                var match = fullText.match(/^(_+)(.*)/);
                var level = match ? match[1].length : 0;
                var title = match ? match[2].trim() : fullText;
                rawItems.push({ level: level, title: title, href: href });
              });

              if (rawItems.length === 0) return;

              var html = "<ul class='navbar-nav ms-auto clearfix cqb-nav'>";
              var currentLevel = 0;

              for (var i = 0; i < rawItems.length; i++) {
                var item = rawItems[i];
                var next = rawItems[i + 1];
                var nextLevel = next ? next.level : 0;

                if (item.level === 0) {
                  if (nextLevel > 0) {
                    html += "<li class='nav-item dropdown'>";
                    html += "<a class='nav-link dropdown-toggle' href='" + item.href + "' data-bs-toggle='dropdown' role='button' aria-expanded='false'>" + item.title + "</a>";
                    html += "<ul class='dropdown-menu cqb-dropdown'>";
                    currentLevel = 1;
                  } else {
                    html += "<li class='nav-item'><a class='nav-link' href='" + item.href + "'>" + item.title + "</a></li>";
                  }
                } else {
                  if (nextLevel > item.level) {
                    html += "<li class='dropdown-submenu'>";
                    html += "<a class='dropdown-item dropdown-toggle-sub' href='" + item.href + "'>" + item.title + " <span class='sub-arrow'>&#8250;</span></a>";
                    html += "<ul class='dropdown-menu cqb-dropdown submenu-flyout'>";
                    currentLevel = nextLevel;
                  } else {
                    html += "<li><a class='dropdown-item' href='" + item.href + "'>" + item.title + "</a></li>";

                    if (nextLevel < item.level) {
                      var diff = item.level - nextLevel;
                      for (var d = 0; d < diff; d++) {
                        html += "</ul></li>";
                      }
                      currentLevel = nextLevel;
                    }
                  }
                }
              }

              while (currentLevel > 0) {
                html += "</ul></li>";
                currentLevel--;
              }

              $container.html(html + "</ul>");

              // Suporte a clique mobile/touch
              $container.find(".dropdown-toggle-sub").on("click", function(e) {
                if ($(window).width() < 992) {
                  e.preventDefault();
                  e.stopPropagation();
                  $(this).next(".submenu-flyout").toggleClass("show");
                }
              });
            });

            // 2. CSS do Menu (Alta Densidade, Display Correto e Tolerância de Mouse)
            if (!$('#cqb-fix').length) {
              $('head').append('<style id="cqb-fix">\\
                /* Reset e Base da Navbar */\\
                .cqb-nav .nav-link { font-size: 13px !important; font-weight: 500 !important; padding: 7px 11px !important; letter-spacing: 0.01em !important; cursor: pointer; }\\
                .navbar-nav .nav-link::after { display: none !important; }\\
                .navbar-nav .nav-item.dropdown > .nav-link::after { display: inline-block !important; margin-left: .4em; vertical-align: .12em; content: ""; border-top: .32em solid; border-right: .28em solid transparent; border-bottom: 0; border-left: .28em solid transparent; opacity: 0.65; }\\
                @media (max-width: 991.98px) { .navbar-nav .nav-item.dropdown > .nav-link::after { float: right; margin-top: .55em; } }\\
                \\
                /* Forçar exibição de todos os LIs nos menus gerados */\\
                #LinkList1 ul.navbar-nav li, #LinkList1 ul.cqb-dropdown li, #LinkList1 .dropdown-menu li { display: block !important; visibility: visible !important; }\\
                \\
                /* Container Dropdown Nível 1 */\\
                .cqb-dropdown { border: 1px solid rgba(0,0,0,0.08) !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.04) !important; border-radius: 8px !important; padding: 6px !important; background: #ffffff !important; min-width: 220px !important; max-height: 480px; overflow-y: auto; overflow-x: visible !important; z-index: 1050 !important; margin-top: 2px !important; }\\
                /* Ponte invisível para o cursor não perder foco entre link e dropdown */\\
                .cqb-dropdown::before { content: ""; position: absolute; top: -14px; left: 0; right: 0; height: 16px; background: transparent; }\\
                \\
                /* Itens do Menu (Fonte Menor e Alta Densidade) */\\
                .cqb-dropdown .dropdown-item { color: #334155 !important; padding: 7px 12px !important; font-size: 12.5px !important; font-weight: 500 !important; border-radius: 5px !important; line-height: 1.4 !important; display: flex !important; align-items: center !important; justify-content: space-between !important; white-space: normal !important; transition: background 0.12s ease, color 0.12s ease !important; cursor: pointer; text-decoration: none !important; }\\
                .cqb-dropdown .dropdown-item:hover { background: #f1f5f9 !important; color: #1d4ed8 !important; }\\
                \\
                /* Submenus Laterais (Níveis 2, 3 e 4) */\\
                .dropdown-submenu { position: relative !important; }\\
                .submenu-flyout { top: -6px !important; left: 100% !important; margin-left: 3px !important; }\\
                .submenu-flyout::after { content: ""; position: absolute; top: 0; left: -14px; bottom: 0; width: 16px; background: transparent; }\\
                .sub-arrow { font-size: 14px; color: #94a3b8; font-weight: bold; margin-left: 8px; line-height: 1; }\\
                \\
                /* Ativação Desktop por Hover E por Clique (.show) */\\
                @media (min-width: 992px) {\\
                  .cqb-dropdown { display: none; opacity: 0; visibility: hidden; transform: translateY(5px); transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s !important; }\\
                  .nav-item.dropdown:hover > .cqb-dropdown,\\
                  .nav-item.dropdown.show > .cqb-dropdown,\\
                  .cqb-dropdown.show,\\
                  .dropdown-submenu:hover > .submenu-flyout { display: block !important; opacity: 1 !important; visibility: visible !important; transform: translateY(0) !important; }\\
                }\\
                @media (max-width: 991.98px) {\\
                  .cqb-dropdown { display: none; opacity: 1 !important; visibility: visible !important; transform: none !important; max-height: none !important; box-shadow: none !important; border: 0 !important; padding-left: 15px !important; }\\
                  .nav-item.dropdown.show > .cqb-dropdown, .cqb-dropdown.show { display: block !important; }\\
                  .submenu-flyout { display: none !important; position: static !important; }\\
                  .submenu-flyout.show { display: block !important; }\\
                }\\
                /* Barra de Rolagem Discreta */\\
                .cqb-dropdown::-webkit-scrollbar { width: 4px; }\\
                .cqb-dropdown::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }\\
                /* Compatibilidade com Tema Escuro */\\
                [data-theme="dark"] .cqb-dropdown { background: #1e293b !important; border-color: rgba(255,255,255,0.1) !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5) !important; }\\
                [data-theme="dark"] .cqb-dropdown .dropdown-item { color: #e2e8f0 !important; }\\
                [data-theme="dark"] .cqb-dropdown .dropdown-item:hover { background: #334155 !important; color: #60a5fa !important; }\\
                [data-theme="dark"] .cqb-dropdown::-webkit-scrollbar-thumb { background: #475569; }\\
                \\
                `;

  const newXml = xml.substring(0, startIndex) + newMenuCode + xml.substring(endIndex);

  fs.writeFileSync(THEME_PATH, newXml, 'utf8');
  console.log(`✓ Menu corrigido com sucesso no arquivo XML!`);

  const audit = TemplateEngine.audit(newXml);
  console.log(`Status de Validação: ${audit.isValid ? '✓ VÁLIDO' : '✗ COM PROBLEMAS'}`);
  console.log(`Problemas encontrados: ${audit.issuesCount}`);

  return audit.isValid;
}

if (process.argv[1] && process.argv[1].endsWith('update-canalqb-menu.js')) {
  try {
    updateCanalQbMenu();
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}
