package com.trak.content;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * Deterministic normalization shared by extraction, hashing and chunking.
 * contentHash = SHA-256(normalized main text); page identity travels
 * separately via canonicalUrl and MUST NOT be mixed into the hash.
 */
@Component
public class ContentNormalizer {

    public String normalizeMainText(String raw) {
        if (raw == null) return "";
        String collapsed = raw.replaceAll("\\s+", " ").trim();
        return collapsed;
    }

    public List<String> normalizeHeadings(List<String> rawHeadings) {
        List<String> out = new ArrayList<>();
        if (rawHeadings == null) return out;
        for (String h : rawHeadings) {
            if (h == null) continue;
            String n = h.replaceAll("\\s+", " ").trim();
            if (!n.isEmpty()) out.add(n);
        }
        return out;
    }

    public String computeContentHash(String normalizedText) {
        try {
            String input = normalizedText == null ? "" : normalizedText.toLowerCase(Locale.ROOT).trim();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    public String canonicalizeUrl(String url, String htmlCanonical) {
        if (htmlCanonical != null && !htmlCanonical.isBlank()) return htmlCanonical.trim();
        if (url == null) return null;
        String trimmed = url.trim();
        int hashIdx = trimmed.indexOf('#');
        if (hashIdx >= 0) trimmed = trimmed.substring(0, hashIdx);
        return trimmed;
    }
}
