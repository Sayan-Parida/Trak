package com.trak.content;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Configurable, privacy-aware capture policy. Decides whether a page is
 * eligible for content extraction BEFORE any HTML is processed. Conservative
 * by default; automatic capture is a first-class capability, not an afterthought.
 */
@Component
public class CapturePolicyService {

    private final boolean enabled;
    private final long autoOnDwellSeconds;
    private final List<String> prohibitedUrlPrefixes;
    private final List<String> excludeDomains;

    public CapturePolicyService(
            @Value("${tkr.content.extraction.enabled:true}") boolean enabled,
            @Value("${tkr.content.extraction.auto-on-dwell-seconds:30}") long autoOnDwellSeconds,
            @Value("${tkr.content.extraction.prohibited-url-prefixes:chrome://,chrome-extension://,about:,data:,mailto:,file://}") List<String> prohibitedUrlPrefixes,
            @Value("${tkr.content.privacy.exclude-domains:}") List<String> excludeDomains) {
        this.enabled = enabled;
        this.autoOnDwellSeconds = autoOnDwellSeconds;
        this.prohibitedUrlPrefixes = prohibitedUrlPrefixes != null ? prohibitedUrlPrefixes : List.of();
        this.excludeDomains = excludeDomains != null ? excludeDomains : List.of();
    }

    public enum Decision { ALLOW, DENY_DISABLED, DENY_PROHIBITED_URL, DENY_EXCLUDED_DOMAIN, DENY_INCOGNITO, DENY_INTERNAL }

    public Decision decide(String url, Long dwellTimeSeconds, boolean isIncognito, String captureMethod) {
        if (!enabled) return Decision.DENY_DISABLED;
        if (isIncognito) return Decision.DENY_INCOGNITO;
        if (url == null || url.isBlank()) return Decision.DENY_PROHIBITED_URL;
        String lower = url.trim().toLowerCase();
        for (String prefix : prohibitedUrlPrefixes) {
            if (prefix != null && !prefix.isBlank() && lower.startsWith(prefix.trim().toLowerCase())) {
                return Decision.DENY_PROHIBITED_URL;
            }
        }
        String domain = extractHost(url);
        if (domain != null) {
            String dl = domain.toLowerCase();
            for (String excluded : excludeDomains) {
                if (excluded != null && !excluded.isBlank()
                        && (dl.equals(excluded.trim().toLowerCase()) || dl.endsWith("." + excluded.trim().toLowerCase()))) {
                    return Decision.DENY_EXCLUDED_DOMAIN;
                }
            }
        }
        if ("AUTO_DWELL".equals(captureMethod) && dwellTimeSeconds != null && dwellTimeSeconds < autoOnDwellSeconds) {
            return Decision.DENY_INTERNAL;
        }
        return Decision.ALLOW;
    }

    public boolean isAllowed(String url, Long dwellTimeSeconds, boolean isIncognito, String captureMethod) {
        return decide(url, dwellTimeSeconds, isIncognito, captureMethod) == Decision.ALLOW;
    }

    private String extractHost(String url) {
        try {
            return new URI(url).getHost();
        } catch (Exception e) {
            return null;
        }
    }

    public List<String> effectiveProhibitedPrefixes() {
        return new ArrayList<>(prohibitedUrlPrefixes);
    }
}
