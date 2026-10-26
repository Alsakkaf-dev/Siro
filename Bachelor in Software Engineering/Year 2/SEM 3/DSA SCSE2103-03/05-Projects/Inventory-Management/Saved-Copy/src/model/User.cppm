module;
#include <string>
#include <utility>

export module model.User;

import model.UserRole;

export class User
{
private:
    std::string username;
    std::string password;
    UserRole role{};

public:
    User() = default;

    User(std::string username, std::string password, UserRole role)
        : username(std::move(username)), password(std::move(password)), role(role) {}

    [[nodiscard]] std::string getUsername() const { return username; }

    [[nodiscard]] std::string getPassword() const { return password; }

    [[nodiscard]] UserRole getRole() const { return role; }
};
