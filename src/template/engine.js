import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

export class TemplateEngine {
  /**
   * Realiza a auditoria técnica de SEO, AdSense e Performance no XML do tema do Blogger.
   */
  static audit(xmlContent) {
    const findings = {
      seo: {
        hasTitleTag: /<title>|<b:eval\b[^>]*title/i.test(xmlContent),
        hasMetaDescription: /<meta\b[^>]*name=["']description["']/i.test(xmlContent) || /data:blog.metaDescription/i.test(xmlContent),
        hasCanonical: /<link\b[^>]*rel=["']canonical["']/i.test(xmlContent) || /data:blog.canonicalUrl/i.test(xmlContent),
        hasOpenGraph: /<meta\b[^>]*property=["']og:/i.test(xmlContent),
        hasTwitterCard: /<meta\b[^>]*name=["']twitter:/i.test(xmlContent),
        hasViewport: /<meta\b[^>]*name=["']viewport["']/i.test(xmlContent),
        hasSchemaOrg: /application\/ld\+json/i.test(xmlContent) || /itemscope/i.test(xmlContent)
      },
      adsense: {
        hasAdSenseScript: /pagead2\.googlesyndication\.com/i.test(xmlContent),
        hasPublisherId: /ca-pub-\d{16}/i.test(xmlContent),
        foundPublisherId: xmlContent.match(/ca-pub-(\d{16})/)?.[0] || null
      },
      performance: {
        totalScripts: (xmlContent.match(/<script\b[^>]*>/gi) || []).length,
        renderBlockingScripts: (xmlContent.match(/<script\b(?![^>]*(?:async|defer|type=["']application\/ld\+json["']))[^>]*src=/gi) || []).length
      }
    };

    const issues = [];
    if (!findings.seo.hasOpenGraph) issues.push('Falta suporte a tags OpenGraph (Facebook/WhatsApp preview).');
    if (!findings.seo.hasTwitterCard) issues.push('Falta suporte a Twitter Cards para compartilhamento em redes.');
    if (!findings.seo.hasSchemaOrg) issues.push('Falta dados estruturados Schema.org (JSON-LD) para SEO e Rich Snippets do Google.');
    if (!findings.seo.hasCanonical) issues.push('Falta tag de URL canônica para evitar conteúdo duplicado no Google.');
    if (!findings.adsense.hasAdSenseScript) issues.push('Script do AdSense não encontrado no cabeçalho do tema.');
    if (findings.performance.renderBlockingScripts > 0) {
      issues.push(`Identificados ${findings.performance.renderBlockingScripts} scripts externos bloqueando a renderização inicial.`);
    }

    return {
      auditedAt: new Date().toISOString(),
      findings,
      issuesCount: issues.length,
      issues
    };
  }

  /**
   * Otimiza o XML do tema injetando correções de SEO, Schema.org e AdSense com preservação total de widgets.
   */
  static optimize(xmlContent, options = {}) {
    const publisherId = options.publisherId || 'ca-pub-3614622181047762';
    const changes = [];
    let optimized = xmlContent;

    // 1. Injetar Meta Tags de SEO, OpenGraph e Twitter Cards caso ausentes
    const seoMetaBlock = `
    <!-- [VALIDABLOG] Otimização Automática de SEO & Social Cards -->
    <b:if cond='data:view.isHomepage'>
      <meta expr:content='data:blog.title' property='og:title'/>
      <meta expr:content='data:blog.homepageUrl' property='og:url'/>
      <meta content='website' property='og:type'/>
    </b:if>
    <b:if cond='data:view.isPost'>
      <meta expr:content='data:blog.pageName' property='og:title'/>
      <meta expr:content='data:blog.url' property='og:url'/>
      <meta content='article' property='og:type'/>
      <b:if cond='data:blog.postImageUrl'>
        <meta expr:content='data:blog.postImageUrl' property='og:image'/>
      </b:if>
      <meta content='summary_large_image' name='twitter:card'/>
    </b:if>
    <b:if cond='!data:view.isPost and !data:view.isHomepage'>
      <meta expr:content='data:blog.pageName' property='og:title'/>
      <meta expr:content='data:blog.url' property='og:url'/>
    </b:if>
    <link expr:href='data:blog.canonicalUrl' rel='canonical'/>
    <!-- [/VALIDABLOG] -->
    `;

    if (!optimized.includes('data:blog.canonicalUrl') && optimized.includes('</head>')) {
      optimized = optimized.replace('</head>', `${seoMetaBlock}\n</head>`);
      changes.push('Injetadas tags canônicas, OpenGraph e Twitter Cards compatíveis com Blogger.');
    }

    // 2. Injetar Dados Estruturados Schema.org JSON-LD
    const jsonLdBlock = `
    <!-- [VALIDABLOG] Schema.org JSON-LD para Google Rich Snippets -->
    <script type='application/ld+json'>
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "<data:blog.title/>",
      "url": "<data:blog.homepageUrl/>"
    }
    </script>
    <b:if cond='data:view.isPost'>
      <script type='application/ld+json'>
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "<data:blog.url/>"
        },
        "headline": "<data:blog.pageName/>",
        "datePublished": "<data:post.date.iso8601/>",
        "dateModified": "<data:post.lastUpdated.iso8601/>",
        "author": {
          "@type": "Person",
          "name": "<data:post.author.name/>"
        },
        "publisher": {
          "@type": "Organization",
          "name": "<data:blog.title/>"
        }
      }
      </script>
    </b:if>
    <!-- [/VALIDABLOG] -->
    `;

    if (!optimized.includes('application/ld+json') && optimized.includes('</head>')) {
      optimized = optimized.replace('</head>', `${jsonLdBlock}\n</head>`);
      changes.push('Injetados esquemas estruturados Schema.org (WebSite e BlogPosting JSON-LD).');
    }

    // 3. Injetar Script Oficial do Google AdSense
    if (publisherId && !optimized.includes('pagead2.googlesyndication.com') && optimized.includes('</head>')) {
      const adsenseBlock = `
    <!-- [VALIDABLOG] Google AdSense Auto Ads -->
    <script async='async' crossorigin='anonymous' expr:src='"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + data:adClientId' src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}'></script>
    <!-- [/VALIDABLOG] -->
      `;
      optimized = optimized.replace('</head>', `${adsenseBlock}\n</head>`);
      changes.push(`Injetado script de carregamento assíncrono do Google AdSense (${publisherId}).`);
    }

    // 4. Adicionar defer/async a scripts externos que não possuem
    optimized = optimized.replace(
      /<script\b(?![^>]*(?:async|defer|type=["']application\/ld\+json["']))([^>]*src=["'][^"']+["'][^>]*)>/gi,
      (match, attrs) => {
        if (!attrs.includes('defer') && !attrs.includes('async')) {
          changes.push(`Otimizado script bloqueante para 'defer': ${match.substring(0, 60)}...`);
          return `<script defer='defer'${attrs}>`;
        }
        return match;
      }
    );

    return {
      optimizedContent: optimized,
      changesCount: changes.length,
      changes
    };
  }
}

