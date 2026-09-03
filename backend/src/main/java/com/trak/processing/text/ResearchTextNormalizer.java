package com.trak.processing.text;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public final class ResearchTextNormalizer {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern NON_WORD = Pattern.compile("[^\\p{L}\\p{Nd}_-]+");
    private static final Set<String> STOP_WORDS = Set.of("a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "what", "where", "with");

    private ResearchTextNormalizer() {}

    public static String normalize(String value) {
        if (value == null) return "";
        return WHITESPACE.matcher(value.trim().toLowerCase(Locale.ROOT)).replaceAll(" ");
    }

    public static Set<String> terms(String value) {
        String normalized = NON_WORD.matcher(normalize(value)).replaceAll(" ");
        return Arrays.stream(normalized.split(" "))
                .filter(term -> term.length() >= 2 && !STOP_WORDS.contains(term))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
