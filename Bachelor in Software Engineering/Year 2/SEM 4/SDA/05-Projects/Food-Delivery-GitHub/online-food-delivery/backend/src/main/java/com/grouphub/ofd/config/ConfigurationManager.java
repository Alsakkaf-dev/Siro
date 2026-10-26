package com.grouphub.ofd.config;

import java.util.HashMap;
import java.util.Map;

/**
 * ── Creational: SINGLETON ── ConfigurationManager (SDD §5.6.2a · Fig 5.6-M1).
 * One shared config across the Auth Service; thread-safe, lazy, single instance.
 * Kept as a classic JDK singleton (double-checked locking) — NOT a Spring bean —
 * so the report↔code traceability of the Singleton pattern is exact.
 */
public final class ConfigurationManager {

    // UML: -instance : ConfigurationManager   (the single stored instance)
    private static volatile ConfigurationManager instance;

    private final Map<String, String> settings = new HashMap<>();

    // Dev fallback so the app boots when JWT_SECRET is unset. MUST be overridden
    // by the JWT_SECRET env var in any real/prod deployment (see README).
    private static final String DEV_JWT_SECRET =
            "ofd-dev-secret-change-me-please-0123456789-abcdefghijklmnopqrstuvwxyz";

    private ConfigurationManager() {                 // private ctor blocks external 'new'
        String secret = System.getenv("JWT_SECRET");
        settings.put("jwtSecret", (secret == null || secret.isBlank()) ? DEV_JWT_SECRET : secret);
        settings.put("sessionTtl", "3600");          // token time-to-live in seconds
    }

    public static ConfigurationManager getInstance() {   // UML: +getInstance()
        if (instance == null) {                          // 1st check — no lock (fast path)
            synchronized (ConfigurationManager.class) {
                if (instance == null)                    // 2nd check — double-checked locking
                    instance = new ConfigurationManager();
            }
        }
        return instance;
    }

    public String get(String key) { return settings.get(key); }   // UML: +get(key)
}
