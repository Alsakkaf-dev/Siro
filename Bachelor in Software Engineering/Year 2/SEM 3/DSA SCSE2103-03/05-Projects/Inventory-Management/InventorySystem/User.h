#ifndef USER_H
#define USER_H

#include <string>
#include <utility>

enum UserRole { ADMIN, USER };

class User
{
    std::string username;
    std::string password;
    UserRole role;

public:
    User(std::string user, std::string pass, const UserRole role)
        : username(std::move(user)), password(std::move(pass)), role(role) {}

    [[nodiscard]] std::string getUsername() const { return username; }

    [[nodiscard]] std::string getPassword() const { return password; }

    [[nodiscard]] UserRole getUserRole() const { return role; }
};

#endif