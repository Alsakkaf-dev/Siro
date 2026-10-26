package com.grouphub.ofd;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Online Food Delivery System — Group Hub (Group 11).
 * Entry point for the backend that implements the Master SDD (Assignment 3):
 * M1 Auth & Restaurant Browsing, M2 Cart & Order, M3 Payment & Delivery Tracking.
 */
@SpringBootApplication
public class OfdApplication {

    public static void main(String[] args) {
        SpringApplication.run(OfdApplication.class, args);
    }
}
