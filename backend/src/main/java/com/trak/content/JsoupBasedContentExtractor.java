package com.trak.content;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

/**
 * Production Jsoup-based extractor for normal HTML research pages
 * (including GitHub README / documentation-style pages, which are HTML).
 * Strips scripts, styles, nav, footers, forms and redacts input values so
 * passwords / tokens / form contents never enter the content pipeline.
 */
@Component
public class JsoupBasedContentExtractor implements PageContentExtractor {

    private final ContentNormalizer normalizer;

    public JsoupBasedContentExtractor(ContentNormalizer normalizer) {
        this.normalizer = normalizer;
    }

    @Override
    public String name() {
        return "jsoup-standard";
    }

    @Override
    public String description() {
        return "Jsoup HTML extractor for normal research pages (scripts/styles/nav/forms stripped)";
    }

    @Override
    public ExtractedContent extract(String url, String html, Instant capturedAt) {
        Instant at = capturedAt != null ? capturedAt : Instant.now();
        if (url == null || url.isBlank()) {
            return new ExtractedContent(null, url, null, "", List.of(), Map.of(),
                    normalizer.computeContentHash(""), at,
                    ExtractedContent.ExtractionStatus.NOT_APPLICABLE, "missing url");
        }
        if (html == null || html.isBlank()) {
            return new ExtractedContent(url, url, null, "", List.of(), Map.of(),
                    normalizer.computeContentHash(""), at,
                    ExtractedContent.ExtractionStatus.SKIPPED, "empty html");
        }
        try {
            String bounded = html.length() > 2_000_000 ? html.substring(0, 2_000_000) : html;
            Document doc = Jsoup.parse(bounded, url);

            // Privacy + boilerplate removal BEFORE text extraction.
            doc.select("script, style, noscript, nav, footer, header nav, aside, " +
                    "iframe, canvas, svg, form, input, textarea, select, button").remove();
            // Redact any leftover value-bearing attributes.
            for (Element el : doc.getAllElements()) {
                el.removeAttr("value");
            }

            String title = doc.title();
            if (title != null) title = title.trim();

            String canonical = null;
            Elements canonicalEls = doc.select("link[rel=canonical]");
            if (!canonicalEls.isEmpty()) canonical = canonicalEls.first().attr("href");
            String canonicalUrl = normalizer.canonicalizeUrl(url, canonical);

            List<String> headings = new ArrayList<>();
            for (Element h : doc.select("h1, h2, h3")) {
                String t = h.text().replaceAll("\\s+", " ").trim();
                if (!t.isEmpty() && t.length() <= 300) headings.add(t);
                if (headings.size() >= 100) break;
            }
            headings = normalizer.normalizeHeadings(headings);

            Element body = doc.body();
            String rawText = body != null ? body.text() : doc.text();
            String mainText = normalizer.normalizeMainText(rawText);

            Map<String, String> metadata = new LinkedHashMap<>();
            metadata.put("extractor", name());
            try {
                String host = new URI(url).getHost();
                if (host != null) metadata.put("host", host);
            } catch (Exception ignored) {
            }
            Elements metas = doc.select("meta[name=description]");
            if (!metas.isEmpty()) {
                String desc = metas.first().attr("content");
                if (desc != null && !desc.isBlank()) {
                    metadata.put("description", desc.trim().substring(0, Math.min(500, desc.trim().length())));
                }
            }

            if (mainText.isEmpty()) {
                return new ExtractedContent(canonicalUrl, url, title, "", headings, metadata,
                        normalizer.computeContentHash(""), at,
                        ExtractedContent.ExtractionStatus.SKIPPED, "no extractable text");
            }
            return new ExtractedContent(canonicalUrl, url, title, mainText, headings, metadata,
                    normalizer.computeContentHash(mainText), at,
                    ExtractedContent.ExtractionStatus.SUCCESS, null);
        } catch (Exception e) {
            return new ExtractedContent(url, url, null, "", List.of(), Map.of(),
                    normalizer.computeContentHash(""), at,
                    ExtractedContent.ExtractionStatus.FAILED, e.getClass().getSimpleName());
        }
    }
}
