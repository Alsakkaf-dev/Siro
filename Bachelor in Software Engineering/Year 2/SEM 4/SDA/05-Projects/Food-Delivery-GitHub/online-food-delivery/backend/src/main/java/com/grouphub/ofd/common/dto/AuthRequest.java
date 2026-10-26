package com.grouphub.ofd.common.dto;

/**
 * Immutable credentials handed to an AuthenticationStrategy (SDD §5.6.2b).
 * Carries email+password for PasswordAuthStrategy, or an OAuth code for OAuthStrategy.
 */
public class AuthRequest {

    private final String email;
    private final String password;
    private final String oauthCode;

    public AuthRequest(String email, String password) {
        this(email, password, null);
    }

    public AuthRequest(String email, String password, String oauthCode) {
        this.email = email;
        this.password = password;
        this.oauthCode = oauthCode;
    }

    public String getEmail()     { return email; }
    public String getPassword()  { return password; }
    public String getOauthCode() { return oauthCode; }
}
