package com.grouphub.ofd.common.dto;

import com.grouphub.ofd.auth.User;

/**
 * Outcome of an authentication/registration attempt (SDD §5.6.2b).
 * On success it carries the User and (after {@link #attachToken}) the JWT;
 * on failure it carries a machine code the controller maps to a DT-M1-1/DT-M1-2 action.
 */
public class AuthResult {

    private final boolean success;
    private final String code;      // NO_ACCOUNT, BAD_CREDENTIALS, ACCOUNT_LOCKED, EMAIL_TAKEN, ...
    private final String message;
    private final User user;
    private String token;

    private AuthResult(boolean success, String code, String message, User user) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.user = user;
    }

    public static AuthResult success(User user)              { return new AuthResult(true, "OK", "Success", user); }
    public static AuthResult fail(String code)               { return new AuthResult(false, code, code, null); }
    public static AuthResult fail(String code, String msg)   { return new AuthResult(false, code, msg, null); }

    public void attachToken(String token) { this.token = token; }

    public boolean isSuccess() { return success; }
    public String getCode()    { return code; }
    public String getMessage() { return message; }
    public User getUser()      { return user; }
    public String getToken()   { return token; }
}
