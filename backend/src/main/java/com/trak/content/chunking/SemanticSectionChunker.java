package com.trak.content.chunking;

import com.trak.content.ContentNormalizer;
import com.trak.content.ExtractedContent;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Production semantic chunker. Uses heading structure when available, falls
 * back to paragraph splitting. Splits oversized sections by max chars with
 * controlled overlap. Deterministic and testable.
 */
@Component
public class SemanticSectionChunker implements ResearchContentChunker {

    private final ContentNormalizer normalizer;
    private final int maxChunkChars;
    private final int overlapChars;

    public SemanticSectionChunker(
            ContentNormalizer normalizer,
            @Value("${tkr.content.chunking.max-chunk-chars:2000}") int maxChunkChars,
            @Value("${tkr.content.chunking.overlap-chars:200}") int overlapChars) {
        this.normalizer = normalizer;
        this.maxChunkChars = Math.max(500, maxChunkChars);
        this.overlapChars = Math.max(0, Math.min(overlapChars, this.maxChunkChars / 2));
    }

    @Override
    public List<ChunkDraft> chunk(ExtractedContent content) {
        return chunk(content, maxChunkChars, overlapChars);
    }

    @Override
    public List<ChunkDraft> chunk(ExtractedContent content, int maxChars, int overlap) {
        List<ChunkDraft> out = new ArrayList<>();
        if (content == null || content.mainText() == null || content.mainText().isBlank()) return out;
        String text = content.mainText();
        List<String> headings = content.headings() != null ? content.headings() : List.of();

        List<Section> sections = splitIntoSections(text, headings);
        int index = 0;
        for (Section section : sections) {
            List<String> pieces = splitBounded(section.text(), maxChars, overlap);
            for (String piece : pieces) {
                String trimmed = piece.trim();
                if (trimmed.isEmpty()) continue;
                int start = text.indexOf(trimmed.substring(0, Math.min(40, trimmed.length())));
                int end = Math.min(text.length(), start < 0 ? trimmed.length() : start + trimmed.length());
                if (start < 0) start = 0;
                out.add(new ChunkDraft(index++, section.path(),
                        trimmed, normalizer.computeContentHash(trimmed), start, end));
            }
        }
        return out;
    }

    private record Section(String path, String text) {}

    private List<Section> splitIntoSections(String text, List<String> headings) {
        if (headings.isEmpty()) {
            return List.of(new Section("", text));
        }
        List<Section> sections = new ArrayList<>();
        String remaining = text;
        int headingCursor = 0;
        // Greedy: attach each heading to the text that follows it.
        for (String heading : headings) {
            int pos = remaining.indexOf(heading);
            if (pos < 0) continue;
            String before = remaining.substring(0, pos).trim();
            if (!before.isEmpty() && sections.isEmpty()) {
                sections.add(new Section("", before));
            }
            remaining = remaining.substring(pos + heading.length()).trim();
            // Take up to next heading or a bounded window as this section's body.
            String nextHeading = null;
            int nextPos = -1;
            for (int i = headingCursor + 1; i < headings.size(); i++) {
                int p = remaining.indexOf(headings.get(i));
                if (p >= 0 && (nextPos < 0 || p < nextPos)) {
                    nextPos = p;
                    nextHeading = headings.get(i);
                }
            }
            String body;
            if (nextPos >= 0) {
                body = remaining.substring(0, nextPos).trim();
                remaining = remaining.substring(nextPos).trim();
            } else {
                body = remaining;
                remaining = "";
            }
            String sectionText = (heading + "\n" + body).trim();
            if (!sectionText.isEmpty()) {
                sections.add(new Section(ChunkDraft.sectionPathOf(List.of(heading)), sectionText));
            }
            headingCursor++;
            if (remaining.isEmpty()) break;
        }
        if (!remaining.isEmpty()) {
            sections.add(new Section("", remaining));
        }
        if (sections.isEmpty()) sections.add(new Section("", text));
        return sections;
    }

    private List<String> splitBounded(String text, int maxChars, int overlap) {
        List<String> pieces = new ArrayList<>();
        if (text.length() <= maxChars) {
            pieces.add(text);
            return pieces;
        }
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(text.length(), start + maxChars);
            if (end < text.length()) {
                // Prefer paragraph/sentence boundaries.
                int para = text.lastIndexOf("\n\n", end);
                int sentence = Math.max(text.lastIndexOf(". ", end), text.lastIndexOf(".\n", end));
                int cut = Math.max(para, sentence);
                if (cut > start + maxChars / 2) end = cut + 1;
            }
            pieces.add(text.substring(start, end).trim());
            if (end >= text.length()) break;
            start = Math.max(end - overlap, start + 1);
        }
        return pieces;
    }
}
