package com.grouphub.ofd.payment;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access for TRANSACTION (SDD §5.4.4).
 */
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}
