module;
#include <optional>
#include <string>

export module controller.AuthController;

import model.UserRole;
import service.AuthService;

export class AuthController
{
private:
    AuthService &service;

public:
    explicit AuthController(AuthService &service) : service(service) {}

    int authenticate(const std::string& password, const std::string& username)
    {
        return service.authenticate(username, password).value();
    }
};
