module;
#include <optional>
#include <string>

export module service.AuthService;

import repository.UserRepository;
import model.User;
import model.UserRole;

export class AuthService
{
private:
    UserRepository &repo;

public:
    explicit AuthService (UserRepository &repo) : repo(repo) {}

    [[nodiscard]] std::optional<UserRole> authenticate(const std::string& username, const std::string& password) const
    {
        for (const std::array<User,2> users = repo.getUsers(); const auto& user : users)
        {
            if (user.getUsername() == username && user.getPassword() == password) return user.getRole();
        }
        return std::nullopt;
    }
};