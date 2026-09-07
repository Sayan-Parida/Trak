package com.trak.content.vector;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Selects the VectorStore backend. "auto" inspects the JDBC URL:
 * postgresql -> pgvector (production); anything else -> sqlite
 * (dev/test application-layer similarity, explicitly not production).
 */
@Configuration
public class VectorStoreConfig {

    @Bean
    @Primary
    public VectorStore vectorStore(
            @Value("${tkr.vector-store.type:auto}") String configured,
            DataSource dataSource,
            PgVectorStore pgVectorStore,
            SqliteVectorStore sqliteVectorStore) {
        String mode = configured == null ? "auto" : configured.trim().toLowerCase();
        if ("pgvector".equals(mode)) return pgVectorStore;
        if ("sqlite".equals(mode)) return sqliteVectorStore;
        try {
            String url = dataSource.getConnection().getMetaData().getURL();
            if (url != null && url.startsWith("jdbc:postgresql")) return pgVectorStore;
        } catch (Exception ignored) {
        }
        return sqliteVectorStore;
    }
}
