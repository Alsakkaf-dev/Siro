package com.grouphub.ofd.auth;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access for SESSION (SDD §5.4.2) — persists the JWT audit trail.
 */
public interface SessionRepository extends JpaRepository<Session, Long> {
}
