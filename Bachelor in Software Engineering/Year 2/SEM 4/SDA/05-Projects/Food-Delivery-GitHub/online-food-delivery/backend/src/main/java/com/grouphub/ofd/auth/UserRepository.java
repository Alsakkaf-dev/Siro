package com.grouphub.ofd.auth;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access for USER (SDD §6.1 — UserRepository.findByEmail / save).
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /** DT-M1-1 C2 — returns null when no account exists for the email. */
    User findByEmail(String email);

    /** DT-M1-2 C3 — fast duplicate-email pre-check. */
    boolean existsByEmail(String email);
}
